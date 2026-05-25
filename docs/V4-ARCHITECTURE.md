# V4-ARCHITECTURE.md — How RemoteRep v4 Is Built

> **Status:** Draft for owner review. No code has been built against this yet.
> **Audience:** Non-technical owner. Plain English first, technical detail second.
> **Goal:** Replace v3's AWS-heavy architecture with a stack that costs ~$25–50/month instead of ~$600/month.

---

## 1. The Big Picture

RemoteRep v4 is made of **five connected pieces**, each one a separate service. Picking each piece individually (instead of using one giant provider like AWS) is how we cut costs by 90%+.

```
                      ┌─────────────────┐
                      │   GitHub        │  ← code lives here
                      └────────┬────────┘
                               │ (push code → auto-deploy)
                               ▼
                      ┌─────────────────┐
                      │   Railway       │  ← runs your app
                      │  (Next.js +     │
                      │   Node server)  │
                      └────────┬────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌──────────┐    ┌───────────┐   ┌────────────────┐
       │ Supabase │    │  Resend   │   │ Cloudflare R2  │
       │ (data +  │    │ (emails)  │   │ (file uploads) │
       │  login)  │    │           │   │                │
       └──────────┘    └───────────┘   └────────────────┘
```

When a user visits your site:
1. Their browser loads your app from **Railway**
2. The app reads/writes data in **Supabase**
3. If the app needs to send an email, it asks **Resend**
4. If a user uploads a resume, the file goes to **Cloudflare R2**
5. New code you write gets pushed to **GitHub**, and Railway automatically redeploys

That's it. Five pieces. Each one does one job well.

---

## 2. What Each Piece Does (Plain English)

### 🚆 Railway — Your App's Home

**What it is:** A service that takes your code and runs it on the internet. Like Netflix for software — you upload your show, they handle the projector, the screen, the popcorn machine.

**What it replaces:** AWS ECS + ALB + NAT Gateway + a bunch of related services.

**Why we picked it:**
- Deploys automatically when you push code to GitHub. No manual deploys.
- One simple dashboard, not a dozen AWS consoles.
- Pricing is predictable and usage-based ($5 base + ~$0.000463/GB-hour of memory). Small apps pay $5–20/month. Larger ones pay $50–100. Compare to AWS where load balancers alone cost $20/month just to exist.
- Easy to leave if needed — your app is just a container, runs anywhere.

**What it can't do:** Massive scale (millions of requests/sec). At that point you'd graduate to AWS or GCP. You're nowhere near that, and won't be for years.

### 🗄️ Supabase — Your Database + Login System

**What it is:** A managed Postgres database, plus a built-in user-login system, plus a file storage system, all in one product. Like having a personal database administrator and a security guard packaged together.

**What it replaces:** AWS DynamoDB (database) and parts of AWS Cognito or your own JWT system (login). It can also replace S3, though we're using Cloudflare R2 for that — see below.

**Why we picked it:**
- **Postgres is the standard SQL database** — well understood, lots of tooling, easy to hire help for. (Unlike DynamoDB, which is AWS-specific.)
- **Built-in auth** means we don't have to write password hashing, password reset emails, session management, etc. Huge time saver.
- Free tier covers up to 50,000 monthly active users and 500MB of database — likely more than enough to start.
- $25/month "Pro" tier gives 100,000 monthly active users, 8GB database, daily backups for 7 days. Most small businesses live in this tier forever.
- Built on standard Postgres, so if you ever leave Supabase, you take your database with you. No lock-in.

**What it can't do (or does worse):** Real-time features at huge scale, super-custom auth flows. Not relevant to RemoteRep.

### 📧 Resend — Email Sender

**What it is:** A service that sends emails on behalf of your app (password resets, notifications, marketing). They handle the "deliverability" headache so your emails don't land in spam.

**What it replaces:** AWS SES.

**Why we picked it:**
- Free up to 3,000 emails per month, then $20/month for 50,000.
- Modern API (much simpler code than SES).
- Has React Email templates — write emails in code that looks like a webpage, get nicely formatted output.
- Easy to swap for Postmark or SendGrid if Resend ever disappoints.

**What it can't do:** Send marketing blasts at huge scale (think millions). For that you'd want Mailgun or SendGrid. Not relevant to RemoteRep right now.

### 📂 Cloudflare R2 — File Storage

**What it is:** Cloud storage for the files users upload (resumes, profile photos, income docs). Like Dropbox for your app.

**What it replaces:** AWS S3.

**Why we picked it:**
- Uses the **same API as S3** — so any code written for S3 works on R2 with minimal changes.
- **No egress fees.** This is the big one. AWS S3 charges you ~$0.09 per GB to download files. R2 charges $0. If your app sends a lot of files to users, this saves serious money.
- $0.015 per GB of storage per month (vs S3's $0.023). For 10GB of uploads, that's $0.15/month. Cheap.
- Cloudflare is a big stable company that's not going anywhere.

**What it can't do:** Run complex data processing (S3 has integrations with AWS analytics tools). Not relevant to RemoteRep.

### 🐙 GitHub — Code Storage

**What it is:** Already set up. Your code lives in `github.com/remoterobert/RemoteRep---v4`. Every code change is saved with full history.

**Why it's relevant to architecture:** Railway watches your GitHub. When you push a change, Railway sees it and redeploys automatically. This is how you go from "Claude edited a file" to "users see the change live" without manual deploy steps.

---

## 3. How Money Adds Up (Cost Projection)

### Today's bill (v3 on AWS): ~$600/month

### v4 estimated bills at different scales:

| Scale | Railway | Supabase | Resend | R2 | **Total** |
|---|---|---|---|---|---|
| **Just launched** (under 1,000 users, low activity) | $5 | $0 (free) | $0 (free) | $0–1 | **~$5–10/mo** |
| **Growing** (5,000 users, moderate activity) | $15 | $25 | $0 (free) | $2 | **~$42/mo** |
| **Established** (50,000 users, heavy activity) | $50 | $25 | $20 | $10 | **~$105/mo** |
| **Big success** (500,000 users) | $200 | $100+ | $50 | $50 | **~$400/mo** |

**Even at "big success" scale, you're paying less than v3 costs today** — and v3 isn't anywhere near that scale.

### Hidden costs to be aware of

- **Domain name renewal** (~$10–15/year, separate from any of these services)
- **SSL certificates** — free, handled automatically by Railway and Cloudflare
- **Email-from-your-domain setup** — Resend will guide you through DNS records, free
- **Bandwidth overages** — if your traffic spikes hugely, Railway charges for excess. We'll set spending alerts.

---

## 4. How A Single User Request Travels (Technical, But Useful To Understand)

This is what happens when a user does something on your site:

```
1. User clicks "Sign in" on remoterep.com
   └─→ Browser loads JavaScript from Railway (Next.js app)

2. User enters email/password and clicks submit
   └─→ Browser sends login request to Railway (Node server)

3. Node server asks Supabase: "Is this user valid?"
   └─→ Supabase checks password, returns "yes, here's a session token"

4. Node server saves session, returns "you're logged in" to browser
   └─→ Browser now shows the logged-in view

5. User uploads their resume
   └─→ Node server gets a signed URL from Cloudflare R2
   └─→ Browser uploads file directly to R2 (skipping the server — fast)
   └─→ Node server saves the R2 file location in Supabase

6. Supabase sends a "welcome" email
   └─→ Supabase triggers Resend
   └─→ Resend sends the email to the user's inbox
```

Each step is independent. If Resend goes down, login still works. If R2 goes down, login still works. This is **a deliberate design choice** — we don't want one vendor's outage to break the whole app.

---

## 5. What Happens When Something Breaks

### If Railway goes down (rare, but happens)
- Your app is offline until they fix it. Outages are usually 5–30 min, a few times a year.
- We can have a backup deploy ready on Render or Fly.io as insurance ($0 if not in use). **Optional, not required for launch.**

### If Supabase goes down
- App can't read/write data. Same as Railway — rare, brief.
- All your data is yours (it's standard Postgres), so worst case we can dump it and restore elsewhere.

### If Resend goes down
- Emails queue up (Resend's side) or fail. Users can still use the app; some don't get their welcome emails until it's fixed.
- We code with retries and a fallback "resend later" queue.

### If Cloudflare R2 goes down
- New file uploads fail. Existing files unavailable.
- R2 is Cloudflare; their uptime is extremely good.

### If GitHub goes down
- You can't push new code. App keeps running on whatever was last deployed.
- This is fine — you'd just wait it out.

### If YOU lose access to one of these accounts
- We document login recovery in [BACKUPS.md](../BACKUPS.md) and store account info in a password manager (1Password / Bitwarden recommended). **This is the most likely real risk — losing access matters more than any service going down.**

---

## 6. How "Locked In" Are We?

A common worry with managed services is vendor lock-in. Here's an honest read:

| Service | Lock-in risk | If we ever needed to leave |
|---|---|---|
| **GitHub** | Very low | Clone to GitLab/Bitbucket in 5 minutes |
| **Railway** | Very low | App is a Docker container; runs on Render, Fly, AWS, anywhere. Move = 1 day. |
| **Supabase** | Low | Standard Postgres. Dump → restore elsewhere. Auth needs some code changes. Move = 1 week. |
| **Resend** | Very low | API is one function. Swap with Postmark/SendGrid = 1 hour. |
| **Cloudflare R2** | Very low | S3-compatible. Move to S3/Backblaze = change config, copy files. 1 day. |

Worst case (Supabase goes evil and triples prices): you can leave in a week. Compared to AWS where leaving means re-architecting half the app, this is **dramatically better**.

---

## 7. What This Document Does NOT Cover Yet

Three things deliberately left for follow-up documents:

1. **What features v4 has** → coming in [V3-FEATURE-AUDIT.md](V3-FEATURE-AUDIT.md). I'll read v3's code and produce a non-technical feature list so v4 doesn't accidentally drop something.

2. **Database schema (what tables exist, what they store)** → coming in [V4-DATA-MODEL.md](V4-DATA-MODEL.md). This is where DynamoDB → Postgres translation gets designed in detail.

3. **The actual rebuild plan (what gets built first, second, third)** → coming in [V4-MIGRATION-PLAN.md](V4-MIGRATION-PLAN.md). Includes data migration from v3 DynamoDB, cutover strategy, and how v3 keeps running until v4 is ready.

---

## 8. Decisions This Document Locks In

| Decision | Choice | Reversible? |
|---|---|---|
| Hosting platform | Railway | Yes — can move to Render/Fly/etc. with ~1 day of work |
| Database | Postgres via Supabase | Yes — Postgres is portable. Moving providers ~1 week. |
| Email | Resend | Yes — swap providers ~1 hour |
| File storage | Cloudflare R2 | Yes — S3-compatible, moves trivially |
| Code repo | GitHub (`remoterobert/RemoteRep---v4`) | Yes — already moved once |

| Decision | Choice | Reversible? |
|---|---|---|
| Migration approach | Migrate ALL v3 data to v4 | Yes, but expensive to change later (would mean redoing migration scripts) |
| Architecture style | Modular (5 services, each replaceable) | Yes — could merge to monolith later if wanted |

---

## 9. What I Need From You Before The Next Document

Nothing right now. **Read this, ask questions, push back on anything that doesn't sit right.** Once you're comfortable with this architecture, I'll write the next doc (V3-FEATURE-AUDIT.md), which doesn't depend on you doing anything — I just read your existing code.

If something here is unclear, the answer "I don't understand piece X" is a useful answer. The whole point of this doc is to make sure you're not asked to approve something you don't follow.
