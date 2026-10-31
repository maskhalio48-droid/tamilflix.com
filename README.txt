Tamilflix multilingual movie update

Included files:
- index.html
- style.css
- script.js
- admin.js
- download.js

New feature:
Each title can have separate Tamil, Sinhala, English, Hindi and Telugu video URLs. When a viewer opens a title, the language buttons appear. Languages without a video URL are disabled and marked unavailable. The Watch and Download buttons use the selected language's URL.

To configure a title:
1. Open the site's Admin Panel (in this current demo build, press Ctrl+Shift+A on a keyboard).
2. Add/edit a title and fill in the direct video URL field for each language that you are authorised to distribute.
3. Save the title.
4. Open the title and select the available language before using Watch or Download.

Important:
- A language option does not create a dubbed/subtitled version automatically. You must supply a separate valid URL for each version.
- Download works only when the video host allows direct downloads; it cannot bypass streaming-service restrictions or imitate VidMate's proprietary technology.
- This frontend stores titles in this browser's localStorage. It is not yet a shared, secure Supabase admin/database integration.
- Keep your existing supabase-config.js file. This ZIP does not include or replace it.
- Back up the current GitHub files before replacing them. These files are based on the previously generated Tamilflix package, not a fresh checkout of your original repository, so verify the appearance and features on a test branch before replacing the live site.


NEW FEATURE — USER MOVIE REQUESTS
- Users can tap “Request a Movie”, enter a title, preferred language, category and optional details, then submit.
- Admin Panel includes “User Movie Requests” with refresh, Approve, Marked Added, Decline and Delete actions.
- For requests to be shared between different users/devices, run movie_requests_setup.sql in the Supabase SQL Editor. Before running it, replace admin@example.com in the SQL with the exact email used for the admin's Tamilflix login. Do not use a service_role key in website files.
- The existing supabase-config.js must expose the initialized client as window.supabaseClient and include the Supabase JS library. If not configured, request submission will show a setup warning rather than pretending it succeeded.
- The Admin Panel in this package is still browser-triggered by Ctrl+Shift+A, so do not treat that shortcut as secure access control. Database read/update/delete is restricted by the SQL RLS policy to the configured authenticated admin email.
