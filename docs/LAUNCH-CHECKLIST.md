# Launch Checklist — Putting v4 live on remoterep.com

**Goal:** point `remoterep.com` at the finished v4 app (running on Railway) instead of
the old v3 site, and move DNS from AWS Route 53 to Cloudflare (which finishes our
exit from AWS).

**Who does what:** Every step below is done by Robert in a web dashboard (Railway,
Cloudflare, NameBright, Supabase). Claude can't click these for you, but can prep the
app-side commit and help debug. Take it one phase at a time — nothing breaks until
**Phase 3**.

---

## The big picture (why the order matters)

`remoterep.com` currently points to the **old v3 site** through AWS Route 53. We set up
*everything* on the new side first — Railway, Cloudflare, the app's settings — while the
old site keeps running untouched. Only the very last step (changing your nameservers)
actually flips the domain over to v4. That way there's no gap and no guessing.

> ⚠️ **This is the real cutover.** The moment the switch completes, `remoterep.com` **is**
> the new v4 app. v3 still exists at AWS but is no longer at that web address. Your data is
> fully migrated, so this is exactly the moment you've been building toward — just know it's
> the live thing, not a rehearsal. Do the final flip at a quiet time of day.

---

## Phase 1 — Tell Railway about your domain (nothing changes for visitors)

1. Go to Railway → project **`ideal-nurturing`** → your web service → **Settings** →
   **Networking** (or "Domains").
2. Under **Custom Domain**, click **+ Custom Domain** and enter: `remoterep.com`
3. Railway shows you a **target value** to point DNS at — it looks like
   `something.up.railway.app`. **Copy it and paste it to Claude** (or write it down) —
   you'll need it in Phase 2. If Railway asks which port, the answer is **8080**.
4. Click **+ Custom Domain** again and add `www.remoterep.com` too. It'll show the same
   kind of target.

*Railway can't finish verifying the domain yet (DNS still points at AWS). That's expected —
it'll go green automatically after Phase 3.*

---

## Phase 2 — Set up Cloudflare (still nothing changes for visitors)

1. Create a free account at **cloudflare.com**.
2. Click **Add a site** and enter `remoterep.com`. Choose the **Free** plan.
3. Cloudflare **scans your existing DNS at Route 53 and imports what it finds.** When it
   shows you the imported list, **check it carefully against Route 53** (AWS console →
   Route 53 → Hosted zones → remoterep.com). It is critical that these came across:
   - **MX records** — these route your `@remoterep.com` email. Miss them and email stops.
   - **TXT records** — SPF / DKIM / DMARC (these keep signup & notification emails from
     going to spam, and keep the domain "verified" in Resend).
   - Any **other subdomains** you use.
   If anything is missing, add it in Cloudflare to match Route 53 exactly.
4. Now point the website itself at Railway. Add / edit these two records:
   | Type  | Name              | Target (from Phase 1)        | Proxy status        |
   |-------|-------------------|------------------------------|---------------------|
   | CNAME | `remoterep.com`   | `something.up.railway.app`   | **DNS only (grey)** |
   | CNAME | `www`             | `something.up.railway.app`   | **DNS only (grey)** |

   > 🔑 **Set the proxy to "DNS only" (grey cloud), not proxied (orange cloud).** This lets
   > Railway handle the SSL padlock directly and avoids a common "redirect loop" error.
   > We can turn on Cloudflare's proxy later once everything's stable.
5. Cloudflare gives you **two nameservers** (like `xxx.ns.cloudflare.com`). **Copy both** —
   you need them for Phase 3.

---

## Phase 3 — Flip the switch (this is the cutover)

1. Log in to your registrar, **NameBright.com**.
2. Find `remoterep.com` → **Nameservers** (sometimes "DNS" or "Manage DNS").
3. **Replace** the four AWS nameservers (`ns-###.awsdns-…`) with the **two Cloudflare
   nameservers** from Phase 2. Save.
4. Wait. Cloudflare will email you when it's active — usually under an hour, occasionally up
   to 24–48 hours. During this window some visitors see v3, some see v4, as the change
   spreads. That's normal.

---

## Phase 4 — App settings (do these anytime before or during Phase 3)

These tell the app and the login system their new address. If you skip them, the site loads
but **logins and email links break.**

1. **Railway → Variables:** set `NEXT_PUBLIC_SITE_URL` to `https://remoterep.com`
   (it's currently the long `…up.railway.app` address).
   - ⚠️ Railway's "Redeploy" button can reuse a cached build and ignore the new value.
     The reliable way to apply it is a fresh commit — **tell Claude when you've changed it
     and Claude will push a tiny commit to force a clean rebuild.**
2. **Supabase → Authentication → URL Configuration:**
   - **Site URL:** `https://remoterep.com`
   - **Redirect URLs:** add `https://remoterep.com/**` (keep the existing Railway URL there
     too during the transition — no harm).

---

## Phase 5 — Verify it's really live

Once Cloudflare says "Active":

- [ ] `https://remoterep.com` loads the new v4 site, with a padlock (SSL). *(Railway issues
      the certificate automatically within a few minutes of the switch — if the padlock is
      missing right after cutover, give it 10–15 min.)*
- [ ] `https://www.remoterep.com` also works.
- [ ] Log in with a real account — you land on the dashboard, not an error.
- [ ] Do a test signup / password reset — the email arrives and its link goes to
      `remoterep.com` (not `localhost` or the old railway URL).
- [ ] Open a profile with a photo and a company with a logo — images load.
- [ ] Send yourself a message / test the support chat.

---

## After launch (not urgent)

- **Resend:** confirm `remoterep.com` still shows **verified** in the Resend dashboard after
  the DNS move. If it flipped to unverified, re-add the DKIM/SPF records it lists.
- **Turn on Cloudflare's proxy** (orange cloud) later for free CDN + DDoS protection — do it
  once, then re-verify the padlock and login still work. If anything breaks, switch back to
  grey.
- **Close the AWS account** only after a few days of the domain running clean on v4 and
  you're confident. Your migrated data is all in Supabase, but keep AWS until you're sure.
- **Route 53** can be deleted once nothing depends on it — that removes the last ~$0.50/mo
  AWS charge for DNS.

---

## Rollback (if something goes wrong)

Because we didn't delete anything at AWS, you can undo the cutover: at NameBright, change the
nameservers **back** to the four AWS ones, and `remoterep.com` returns to the v3 site while we
fix the problem. Keep this list of the AWS nameservers handy before you start:

```
ns-638.awsdns-15.net
ns-1467.awsdns-55.org
ns-147.awsdns-18.com
ns-1697.awsdns-20.co.uk
```
