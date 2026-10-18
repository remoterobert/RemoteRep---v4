# Rep & Fractional CRO Landing Pages

Two marketing pages aimed at sales professionals (the homepage speaks to hiring companies).

| Page | URL | Who it's for | Goal |
|---|---|---|---|
| Rep landing page | `/reps` | Employed reps already earning well who want a remote role | Create a free account |
| Fractional CRO page | `/fractional-cro` | Sales managers / directors / VPs who have led teams | Apply, then book a sales call |
| Booking step | `/fractional-cro/book` | People who just applied | Pick a call time |

The homepage "Sales Rep? Get hired" buttons link to `/reps`. The rep page links to `/fractional-cro` in its "For sales leaders" section. Both pages share the homepage look via `src/app/(marketing)/MarketingFrame.tsx`.

## Redacted open roles (`/reps`)

Shows up to 6 live, published, public listings, best-paying first. Visitors see the role type, minimum pay, comp structure, commitment, industry and when it was posted. **Company name, title and description are removed on the server** before the page is sent, so they can't be found in the page source. Each card links to signup. Signed-in users get a direct link to the real listing.

If there are no listings, or the database can't be reached, the section shows locked placeholder cards instead of breaking.

Note: individual listing pages (`/listings/<id>`) are still public by design so they can be shared. The redaction covers this landing page only.

## Fractional CRO intake (`/fractional-cro`)

The form asks for name, email, phone, LinkedIn (optional), current title, years leading sales teams, largest team, income range, timeline and "why now" (optional). UTM tags in the page URL (`?utm_source=…`) are saved with the application. A hidden "honeypot" field quietly drops spam bots.

On submit, the application is sent to every channel that's set up:

| Setting (environment variable) | What it does |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Saves the application to the `cro_leads` database table (already set in production). |
| `CRO_LEADS_WEBHOOK_URL` | Optional. Posts the application as JSON to a webhook, e.g. a GoHighLevel inbound webhook for your CRM. |
| `CRO_LEADS_NOTIFY_EMAIL` | Optional. Emails each new application to this address (uses the existing Resend setup). |
| `CRO_BOOKING_URL` | Your booking calendar link (Calendly, GoHighLevel, etc.). Shown embedded on the booking step. If not set, applicants are told the team will contact them within one business day. |

If every configured channel fails, the applicant sees an error and is asked to try again, so no lead is lost silently.

### Database

Migration `supabase/migrations/20261018000000_cro_leads.sql` adds the `cro_leads` table. It's a new table only, with no changes to existing ones. Only platform admins can read it. Each lead has a `status` (`new`, `contacted`, `booked`, `enrolled`, `not_a_fit`) for tracking.

## Still to fill in

- Booking link → set `CRO_BOOKING_URL`.
- Program name, real results and testimonials. The copy currently makes no specific earnings claims, and the hero portfolio is clearly labelled as a hypothetical illustration.
- The five program modules on `/fractional-cro` are a draft outline. Edit them to match the real curriculum.
