"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { tryLegacyLogin } from "@/lib/legacy-login";
import { getSiteOrigin } from "@/lib/site-origin";
import { sendPasswordResetEmail } from "@/lib/password-reset";

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!email || !password) {
    redirect(
      `/signup?error=${encodeURIComponent("Email and password are required.")}`,
    );
  }
  if (password.length < 8) {
    redirect(
      `/signup?error=${encodeURIComponent("Password must be at least 8 characters.")}`,
    );
  }
  if (password !== confirmPassword) {
    redirect(
      `/signup?error=${encodeURIComponent("Passwords don't match — check for a typo.")}`,
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

    // Seamless login for migrated v3 users: they have their old password parked
    // in legacy_credentials but no Supabase password yet. Verify + upgrade it,
    // then retry the sign-in — no reset email needed.
    const upgraded = await tryLegacyLogin(email, password);
    if (upgraded) {
      const { error: retryError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!retryError) {
        redirect("/dashboard");
      }
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

/**
 * "Forgot password?" — email a reset link. Always lands on the same
 * confirmation, whether or not the account exists, so the form can't be used
 * to discover who has an account.
 */
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(
      `/forgot-password?error=${encodeURIComponent("Please enter a valid email address.")}`,
    );
  }

  const result = await sendPasswordResetEmail(email, await getSiteOrigin());
  if (result.status === "failed") {
    // Logged for us; the visitor still sees the neutral confirmation.
    console.error("[password-reset] could not send:", result.error);
  }

  redirect(`/forgot-password?sent=1&email=${encodeURIComponent(email)}`);
}

/** Set a new password for the user signed in via a reset link. */
export async function setNewPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) {
    redirect(
      `/reset-password?error=${encodeURIComponent("Password must be at least 8 characters.")}`,
    );
  }
  if (password !== confirmPassword) {
    redirect(
      `/reset-password?error=${encodeURIComponent("Passwords don't match — check for a typo.")}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(
      `/forgot-password?error=${encodeURIComponent("Your reset link has expired. Enter your email to get a new one.")}`,
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}
