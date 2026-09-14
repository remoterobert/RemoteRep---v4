# Filtering: both sides of the marketplace

Plain-English guide to how filtering works for reps and for hiring teams.

## The two filter bars

| Page | Who uses it | What they're filtering |
| --- | --- | --- |
| `/opportunities` | Reps | Open listings |
| `/candidates` | Hiring teams | Reps |

Both use the same component — [`src/components/FacetFilterBar.tsx`](../src/components/FacetFilterBar.tsx) —
so they look and behave identically. Each page supplies its own list of
dimensions ("facets"):

- Reps: [`src/app/opportunities/FilterPanel.tsx`](../src/app/opportunities/FilterPanel.tsx)
- Hiring teams: [`src/app/candidates/CandidateFilterPanel.tsx`](../src/app/candidates/CandidateFilterPanel.tsx)

## How it behaves

- Filters live in the URL (`?tech=Salesforce&tech=Outreach`), so the back
  button works and a filtered view can be pasted to a colleague.
- Picking two values **within** one filter widens (Salesforce *or* Outreach).
  Using two **different** filters narrows (Salesforce *and* 5+ years).
- "Clear all" resets the filters but keeps the things that aren't filters —
  the list/tile toggle for reps, the listing being scored against for hiring
  teams.
- Filtering never changes the ranking logic. Best-fit reps and best-fit
  listings still sort to the top of whatever survives the filter.

## Why the hiring side changed (Sept 2026)

The Candidates page used to show a single row of sales-role buttons, and
**only** if the company had active hiring intents configured. A company
without them saw no filter at all — which is what the team reported as
"there's no filter".

It now gets the full bar: sales role, minimum experience, education,
industry, sales type, decision-maker, environment, sales cycle, deal size,
annual volume, lead type, and tools.

Two other fixes went with it:

- **"My hiring roles" now actually filters.** It previously cleared the role
  parameter, which showed *everyone* — identical to "All roles" despite the
  different label.
- **Filters run in the database, not in memory.** The page fetches reps by
  joining `candidate_specialties → users → candidate_profiles` and applies
  every facet as a `WHERE` clause, so a filter searches all reps rather than
  whatever happened to load first.

Facets reps have that hiring teams don't — commitment, compensation type,
minimum pay — describe a *role*, not a person's track record, so they're
deliberately absent from the rep filter.

## Known data issues (not fixed here)

Two things worth a separate look:

1. **Industries are stored in two different vocabularies.** The v4 profile
   form writes labels (`"SaaS"`), but reps imported from v3 carry slugs
   (`"fitness-and-wellness"`), and the v3 slugs aren't from the same list of
   industries at all. The filter matches both forms, so it works as well as
   the data allows — but the underlying mismatch also means
   `computeExperienceMatch` in [`src/lib/matching.ts`](../src/lib/matching.ts)
   compares slugs against labels, so **industry effectively never scores as a
   match**. Worth cleaning up the data and then simplifying both.
2. **Rep profile visibility isn't enforced.** `candidate_profiles.visibility`
   is loaded and carried around on the Candidates page but never actually
   checked, so a rep who marked their profile private would still be listed.
   Every profile is currently `public`, so nothing is exposed today — but
   this should be enforced before that stops being true.
