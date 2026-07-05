"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function getSiteOrigin(): Promise<string> {
  // Prefer explicit env var — most reliable, especially on Railway where
  // x-forwarded-host isn't consistently set.
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  // Fallback: try headers.
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(
      `/signup?error=${encodeURIComponent("Email and password are required.")}`,
    );
  }

  const supabase = await createClient();
  const origin = await getSiteOrigin();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
        "/onboarding/choose-role",
      )}`,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // If email confirmation is disabled (or session was returned), the user
  // is already signed in — skip the "check your email" page and go
  // straight into onboarding.
  if (data.session || data.user?.email_confirmed_at) {
    redirect("/onboarding/choose-role");
  }

  redirect(`/signup/check-email?email=${encodeURIComponent(email)}`);
}

export async function resendVerification(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    redirect(
      `/signup/check-email?error=${encodeURIComponent("Missing email.")}`,
    );
  }

  const supabase = await createClient();
  const origin = await getSiteOrigin();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
        "/onboarding/choose-role",
      )}`,
    },
  });

  if (error) {
    redirect(
      `/signup/check-email?email=${encodeURIComponent(email)}&error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect(
    `/signup/check-email?email=${encodeURIComponent(email)}&resent=1`,
  );
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(
      `/login?error=${encodeURIComponent("Email and password are required.")}`,
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Supabase surfaces "Email not confirmed" as the error when the account
    // exists but hasn't verified. Route the user to a page where they can
    // resend the link instead of dead-ending on a raw error.
    if (/email not confirmed/i.test(error.message)) {
      redirect(
        `/signup/check-email?email=${encodeURIComponent(email)}&unverified=1`,
      );
    }
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
