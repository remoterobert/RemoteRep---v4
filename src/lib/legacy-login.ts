import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Seamless login for migrated v3 users.
 *
 * Imported users were created with their old v3 password parked in
 * `legacy_credentials` (PBKDF2-SHA512) but NO Supabase (bcrypt) password — so a
 * normal `signInWithPassword` fails for them. On their first sign-in we verify
 * the entered password against the legacy hash and, on a match, set it as their
 * real Supabase password. From then on they log in normally, with no reset
 * email ever sent.
 *
 * Returns true if the password matched and was upgraded (the caller should then
 * retry `signInWithPassword`). Returns false for any miss — unknown email, no
 * legacy credential, already migrated, or wrong password — and reveals nothing
 * about which.
 *
 * Must only run server-side (uses the service-role client).
 */
export async function tryLegacyLogin(
  email: string,
  password: string,
): Promise<boolean> {
  if (!email || !password) return false;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return false;
  }

  const { data: user } = await admin
    .from("users")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (!user) return false;

  const { data: cred } = await admin
    .from("legacy_credentials")
    .select("salt, hash, iterations, key_length, digest, migrated_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!cred || cred.migrated_at) return false;

  // Recompute exactly as v3 did: pbkdf2Sync(password, salt, 100000, 64, sha512).
  let derivedHex: string;
  try {
    derivedHex = crypto
      .pbkdf2Sync(
        password,
        cred.salt,
        cred.iterations || 100000,
        cred.key_length || 64,
        cred.digest || "sha512",
      )
      .toString("hex");
  } catch {
    return false;
  }

  const a = Buffer.from(derivedHex, "hex");
  const b = Buffer.from(cred.hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  // Correct password → set it as the real Supabase password (bcrypt), no email.
  const { error: upErr } = await admin.auth.admin.updateUserById(user.id, {
    password,
  });
  if (upErr) return false;

  // Consume the legacy credential so we don't re-check next time.
  await admin
    .from("legacy_credentials")
    .update({ migrated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  return true;
}
