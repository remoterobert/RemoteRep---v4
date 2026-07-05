-- Write policies for listings + listing_details + listing_requirements.
--
-- Background: the original 20260526010300_listings.sql migration said
-- "writes go through service role / API routes (no policy granted)".
-- In practice the app writes via the user-scoped Supabase client (anon
-- key + session cookie), so RLS was blocking every insert/update. Some
-- policy must have been applied ad-hoc in prod at some point that let
-- writes through — this migration re-establishes an intentional,
-- version-controlled write-access model.
--
-- Rule: any active member of a hiring tenant (client_company or
-- agency) can create + update + delete listings for their own tenant.
-- Platform admins have full write access as usual.

-- =====================================================================
-- listings
-- =====================================================================

drop policy if exists listings_insert_hiring_member on public.listings;
create policy listings_insert_hiring_member on public.listings
  for insert with check (
    tenant_id in (
      select tm.tenant_id
      from public.tenant_members tm
      where tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in (
          'client_admin', 'client_member',
          'agency_admin', 'agency_member'
        )
    )
  );

drop policy if exists listings_update_hiring_member on public.listings;
create policy listings_update_hiring_member on public.listings
  for update using (
    tenant_id in (
      select tm.tenant_id
      from public.tenant_members tm
      where tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in (
          'client_admin', 'client_member',
          'agency_admin', 'agency_member'
        )
    )
  ) with check (
    tenant_id in (
      select tm.tenant_id
      from public.tenant_members tm
      where tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in (
          'client_admin', 'client_member',
          'agency_admin', 'agency_member'
        )
    )
  );

drop policy if exists listings_delete_hiring_member on public.listings;
create policy listings_delete_hiring_member on public.listings
  for delete using (
    tenant_id in (
      select tm.tenant_id
      from public.tenant_members tm
      where tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in (
          'client_admin', 'client_member',
          'agency_admin', 'agency_member'
        )
    )
  );

drop policy if exists listings_write_platform_admin on public.listings;
create policy listings_write_platform_admin on public.listings
  for all using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- =====================================================================
-- listing_details — mirror the parent listing's tenant
-- =====================================================================

drop policy if exists listing_details_write_via_listing on public.listing_details;
create policy listing_details_write_via_listing on public.listing_details
  for all using (
    exists (
      select 1 from public.listings l
      where l.id = listing_details.listing_id
        and (
          l.tenant_id in (
            select tm.tenant_id
            from public.tenant_members tm
            where tm.user_id = auth.uid()
              and tm.status = 'active'
              and tm.role in (
                'client_admin', 'client_member',
                'agency_admin', 'agency_member'
              )
          )
          or public.is_platform_admin()
        )
    )
  ) with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_details.listing_id
        and (
          l.tenant_id in (
            select tm.tenant_id
            from public.tenant_members tm
            where tm.user_id = auth.uid()
              and tm.status = 'active'
              and tm.role in (
                'client_admin', 'client_member',
                'agency_admin', 'agency_member'
              )
          )
          or public.is_platform_admin()
        )
    )
  );

-- =====================================================================
-- listing_requirements — mirror the parent listing's tenant
-- =====================================================================

drop policy if exists listing_requirements_write_via_listing on public.listing_requirements;
create policy listing_requirements_write_via_listing on public.listing_requirements
  for all using (
    exists (
      select 1 from public.listings l
      where l.id = listing_requirements.listing_id
        and (
          l.tenant_id in (
            select tm.tenant_id
            from public.tenant_members tm
            where tm.user_id = auth.uid()
              and tm.status = 'active'
              and tm.role in (
                'client_admin', 'client_member',
                'agency_admin', 'agency_member'
              )
          )
          or public.is_platform_admin()
        )
    )
  ) with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_requirements.listing_id
        and (
          l.tenant_id in (
            select tm.tenant_id
            from public.tenant_members tm
            where tm.user_id = auth.uid()
              and tm.status = 'active'
              and tm.role in (
                'client_admin', 'client_member',
                'agency_admin', 'agency_member'
              )
          )
          or public.is_platform_admin()
        )
    )
  );
