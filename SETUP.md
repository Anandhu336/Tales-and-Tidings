# Setting up Tales & Tidings (about 10 minutes, one time)

Tales & Tidings stores published pages, photos and songs in **Supabase**, a free online database. You do this once.

Until you do, everything works except the **Publish** button. You can still design and preview pages.

## 1. Make a free Supabase project

1. Go to **supabase.com** and sign up (the "Continue with GitHub" button is quickest).
2. Click **New project**. Give it any name, for example `tales-and-tidings`.
3. Choose a database password (save it somewhere, you will not need it again here), pick the region closest to you, and click **Create new project**.
4. Wait about a minute while it starts.

## 2. Run the setup file

1. In your Supabase project, click **SQL Editor** in the left menu, then **New query**.
2. Open the file `supabase/setup.sql` from this folder, copy **everything** in it, and paste it into the query box.
3. Click **Run**. You should see "Success. No rows returned".

This creates the place where pages are saved and a storage area called `media` for photos and songs (12 MB per file limit).

If you see a red error, copy the message and send it to me.

## 3. Copy your two keys

1. In Supabase, click the **gear icon (Project Settings)**, then **API**.
2. Copy the **Project URL** (looks like `https://abcdxyz.supabase.co`).
3. Copy the **anon public** key. On newer projects it is called the **publishable** key and starts with `sb_publishable_`.

> Never copy the `service_role` or `secret` key. Those must stay private.

## 4. Paste them into `config.js`

Open `config.js` in this folder and fill in the two lines:

```js
window.KS_CONFIG = {
  SUPABASE_URL: 'https://abcdxyz.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_...'
};
```

The publishable key is designed to be public, so it is fine that it sits in a public GitHub repository.

## 5. Put the site on GitHub

Upload **everything** in this folder to your GitHub repository: `index.html`, `config.js`, and the folders `css`, `js`, `templates`, `music`, `supabase`. On github.com use **Add file, then Upload files** and drag the whole set in. Then wait a minute, and open your site's address (Settings, then Pages, shows it).

Try it: pick a template, add a photo, click **Publish**, and open the link it gives you.

## 6. Switch on accounts (sign in and dashboard)

People can create a free account. While they work, their unfinished pages (with photos and songs) save to the account as **drafts**, and every page they publish is saved too. Both are listed on their **dashboard** (the **Sign in** / **My dashboard** link at the top of the home page). From there they can carry on with a draft, or edit, view, copy the link or delete a published page, on any device. Deleting a page or draft also deletes the photos and songs it uploaded.

If you set up Supabase **before** accounts and drafts were added, run `supabase/setup.sql` again (SQL Editor, paste everything, Run). It is safe to run more than once and keeps all existing pages.

Then, in Supabase:

1. Click **Authentication**, then **URL Configuration**.
2. Set **Site URL** to your site's address, for example `https://yourname.github.io/tales-and-tidings/`.
3. Under **Redirect URLs**, add that same address. If you also test on your computer, add the local address too, for example `http://localhost:5500/`.

This is where the "confirm your email" and "reset your password" links send people back to.

**Email confirmation.** By default Supabase emails a confirmation link before a new account can sign in. Supabase's built-in email sender only sends a few emails per hour. For a small site you can turn confirmation off: **Authentication, then Sign In / Providers, then Email**, switch off **Confirm email**. For a busier site, connect your own email sender under **Authentication, then Emails, then SMTP Settings**.

Pages made **without** an account still work as before (editable only from the browser that made them). When that person later signs in on the same browser, those pages move into their account automatically.

## 7. The admin page (manage both sides of the site)

The admin page is at **/admin/** on your site, for example `https://yourname.github.io/tales-and-tidings/admin/`. It uses the same sign-in as the rest of the site. From there you can:

- **Bouquets (Blooms by Bincy):** change bouquets and prices, add or replace bouquet photos, hide a bouquet, block wedding dates, change the banner photos, the WhatsApp number and other shop details, and the colour stories. Changes show on the shop when you press **Save changes**.
- **Invitations (Tales & Tidings):** see every published invitation page, search by name, email or page id, open one, copy its link, or delete it (with its photos and songs).
- **Overview:** how many pages, drafts and accounts there are.

Set it up once:

1. Create an account on the site (the **Sign in** link at the top), if you have not already.
2. In Supabase, click **SQL Editor**, then **New query**. Open `supabase/admin.sql`, copy **everything**, paste it in and click **Run**.
3. Make your account an admin: in a new query, run this line with your own email:

   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';
   ```

4. Open `/admin/` and sign in. (If you open it before step 3, the page shows this line with your email filled in, ready to copy.)

To add another admin later, run step 3 again with their email. To remove one: `delete from public.admins where user_id = (select id from auth.users where email = 'them@example.com');`

Until something is saved on the admin page, the shop uses the built-in list in `blooms/shop-data.js`. After the first save, the admin page is where bouquets are changed (editing the file then only matters if you press **Go back to the built-in list** on the admin page). Bouquet photos uploaded on the admin page are made smaller first and stored in Supabase Storage, in `media/blooms/`.

## Good to know

- **Free projects pause after a week with no activity.** Pages stop opening until you click **Restore** in Supabase. Visiting the dashboard now and then, or upgrading, avoids this.
- **Free limits.** Roughly 1 GB of photo and song storage and a few GB of downloads per month. Photos are shrunk automatically before upload, so this goes a long way.
- **Anyone can create pages.** That is what makes the site open to everyone. Files are limited to 12 MB each and to pictures and audio only. If someone misuses it, you can delete files and pages from the Supabase dashboard (Table Editor and Storage).
- **Songs people upload.** Uploading music you do not own can cause copyright problems for the site owner. The upload box tells people to use only music they may share. The built-in songs in `music/` are public domain.
- **Editing later.** Signed-in people edit their pages from **My dashboard** on any device. Without an account, a page can only be edited from the browser that published it (its secret edit key is stored there), so clearing browser data loses the ability to edit it (it stays online). Signing in on that browser before clearing it saves the page into the account.
- **Deleting a page or draft** from the dashboard also deletes the photos and songs uploaded for it. Files uploaded **without** an account have no owner, so they stay in Storage; you can clean those out from the Supabase dashboard (Storage, then `media`, folder named after the page id).
- **Drafts** saved to accounts live in the `drafts` table (up to 50 per person). Their photos go in `media/drafts/<draft id>/` and are kept when the draft is published, because the page uses them.
- **Adding your own built-in songs.** See `music/README.txt`.
- **`legacy/garden-letter.html`** is the old single-page garden letter, kept for reference . you can delete it later 
