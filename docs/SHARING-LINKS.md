# Sharing links (listings, profiles, companies)

Plain-English guide to which RemoteRep URLs can be shared with the outside
world, and which ones can't.

## The short version

Every listing has **two** URLs:

| URL | Who can open it | Use it for |
| --- | --- | --- |
| `/listings/<id>` | **Anyone**, signed in or not | Sharing. This is the link to send. |
| `/company/listings/<id>` | Only the hiring team that owns it | Managing the listing (metrics, applicants, edit) |

The same split exists elsewhere: `/profiles/<id>` and `/companies/<id>` are
public; `/profile/edit`, `/dashboard`, `/settings` and everything under
`/company` are not.

## Why this doc exists

Hiring managers work inside `/company/listings/<id>`. When they wanted to
share a role, they copied the address out of the browser bar — which is the
private URL. Whoever they sent it to got bounced to the dashboard (or to a
login form), so shared listings looked broken.

Two fixes, both in place now:

1. **Share buttons hand out the public link.** The listing manager page and
   each row on `/company/listings` copy `/listings/<id>`, never the page the
   manager is standing on.
2. **The private link is forgiving.** If someone opens
   `/company/listings/<id>` and isn't on that hiring team — signed out, a rep,
   or someone from another company — they're redirected to the public
   `/listings/<id>` instead of the dashboard. Deeper pages (`/edit`,
   `/company/listings/new`) still ask them to sign in.

Old `/opportunities/<id>` links also forward to the public listing now,
instead of demanding a login first.

## Drafts can't be shared

The public page only shows listings that are **published** *and* have
**public** visibility. Anything else 404s.

So the Share button is greyed out on a draft, with the tooltip *"Publish this
listing to share it."* — better than handing someone a link that dead-ends.
Draft listings also get no link preview, so an unpublished role can't leak
through a preview card.

## Link previews

A published listing pasted into Slack, LinkedIn or a text message shows the
job title, the company name, and the opening of the description, plus the
company logo when there is one. That comes from `generateMetadata` in
[`src/app/listings/[id]/page.tsx`](../src/app/listings/%5Bid%5D/page.tsx).

Previews use `NEXT_PUBLIC_SITE_URL` to build absolute links. If that env var
is wrong in an environment, previews there will point at the wrong host — the
page itself still works.

## Where this lives in the code

- `src/components/ShareButton.tsx` — the button. Pass `path` to share a URL
  other than the current page; pass `disabledReason` to grey it out.
- `src/app/company/listings/ListingRowActions.tsx` — "Copy share link" in the
  row menu.
- `src/lib/supabase/middleware.ts` — which paths require a login, and the
  redirect from a shared private listing link to the public page.
