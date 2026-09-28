-- Research data and retired app data have been copied to Journal Research Archive
-- and verified by row count plus deterministic content hash before this runs.

drop event trigger if exists ensure_rls;
drop function if exists public.rls_auto_enable();

drop function if exists public.add_custom_tag(uuid, text);
drop function if exists public.delete_custom_tag(text);
drop function if exists public.get_user_settings(uuid);
drop function if exists public.log_notification(uuid, text, text, text, text);
drop function if exists public.upsert_user_settings(uuid, jsonb);

drop table if exists public.notification_logs;
drop table if exists public.custom_tags;
drop table if exists public.user_settings;

drop table if exists public.ddwgwx_article_metadata;
drop table if exists public.ddwgwx_catalog_export;
drop table if exists public.ddwgwx_issue_entries;
drop table if exists public.ddwgwx_papers_only;

drop schema if exists research_tmp cascade;

-- Remove a drifted predecessor of the canonical profile policy.
drop policy if exists "profiles_select_own_or_manager" on public.profiles;
