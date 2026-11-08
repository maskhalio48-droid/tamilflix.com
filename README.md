# Tamilflix — New Full Website

## Included
- Responsive dark streaming-style website
- Movies section using the existing `public.movies` table
- Marvel, Anime, Series and Bigg Boss catalogue sections
- Seasons and episodes for shows
- Login, Register and Logout through Supabase Auth
- My List saved in the visitor's browser
- Admin forms for adding movies, shows, seasons and episodes
- Search, featured movie hero, and View all / Show less
- No download button or download feature

## Important: preserve your old content
Deleting GitHub repository files does not delete your Supabase database or Supabase Storage.
Keep using your existing Supabase project. Do not delete the old `movies` table, Storage buckets,
or uploaded objects. This project adds three new tables for shows, seasons and episodes.

## Setup
1. Download and extract the ZIP.
2. Open `supabase-config.js`.
3. Keep the project URL already filled in and replace `PASTE_YOUR_SUPABASE_ANON_PUBLIC_KEY_HERE`
   with the project's **anon/public** key from Supabase Project Settings → API.
   Never use the `service_role` secret in browser code.
4. In Supabase SQL Editor, review and run `schema.sql`. It is additive; it does not drop old tables.
5. Add your signed-in admin email in SQL Editor:
   `insert into public.tamilflix_admins(email) values ('YOUR_ADMIN_EMAIL');`
6. Upload all files in this folder to the root of your GitHub Pages repository.
7. Open the published site and sign in. Admin button appears for emails in `tamilflix_admins`.

## Existing movies table compatibility
The Movies section expects the existing `public.movies` table to contain at least:
`id`, `title`, `poster_url`, `backdrop_url`, `video_url`, `year`, `genre`, `language`,
`rating`, `description`, `is_active`, `created_at`.
The code reads all columns, so optional fields can be absent, but the admin movie form writes
the listed fields. If your current table uses a different schema, do not run uploads yet;
share its column list and the form can be matched safely.

## Video URLs
Use direct video URLs that you own or are authorised to distribute. A normal Google Drive
folder-sharing URL is not necessarily a playable video URL. The browser video player needs a
video host that permits playback from your website.

## Notes
- The Supabase anon/public key is designed for browser use only when Row Level Security is enabled.
- The existing `movies` table's RLS policies are not modified by `schema.sql`. Confirm that public
  visitors can read active movie rows and that only admins can insert/update/delete.
- My List is stored locally in each visitor's browser. It is not synced between devices.
- This starter package does not delete content, accounts, or storage objects.
