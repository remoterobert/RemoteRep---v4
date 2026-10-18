# Password Reset

**What it does:** lets reps and companies reset a forgotten password themselves, and lets admins send a reset email from `/admin/users`.

## How it works

1. **Request:** on the login page, **Forgot password?** opens `/forgot-password`. The person enters their email.
2. **Email:** the site asks Supabase for a one-time recovery token and emails a **"Choose a new password"** link through **Resend** (`src/lib/password-reset.ts`). The page always answers *"If an account exists for that email, we've sent a link"*, so the form can't be used to discover who has an account.
3. **Link:** the link opens `/auth/confirm`, which checks the token on the server and signs the person in. The token travels inside the link, so it works even if the email is opened on another device.
4. **New password:** on `/reset-password` they choose a new password (8+ characters) and land on their dashboard.

Links work once and expire after a short time. An expired or reused link sends the person back to `/forgot-password` with a message to request a new one.

The admin **Send password reset** button in `/admin/users` sends the same email. Every send is recorded in the audit log, with any error.

## Settings it depends on (Railway → Variables)

| Variable | Needed for |
|---|---|
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Sending the email at all |
| `NEXT_PUBLIC_SITE_URL` | The link in the email (e.g. `https://app.remoterep.com`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Creating the recovery token |
| `RESEND_ALLOWLIST_EMAILS` | **Must be absent in production.** It's a test mode that only delivers to listed addresses. |

Check them all on `/admin/env-check`. If an email fails to send, Railway's logs show a line starting `[password-reset]`.
