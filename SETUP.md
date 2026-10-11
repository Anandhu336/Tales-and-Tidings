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

## Good to know

- **Free projects pause after a week with no activity.** Pages stop opening until you click **Restore** in Supabase. Visiting the dashboard now and then, or upgrading, avoids this.
- **Free limits.** Roughly 1 GB of photo and song storage and a few GB of downloads per month. Photos are shrunk automatically before upload, so this goes a long way.
- **Anyone can create pages.** That is what makes the site open to everyone. Files are limited to 12 MB each and to pictures and audio only. If someone misuses it, you can delete files and pages from the Supabase dashboard (Table Editor and Storage).
- **Songs people upload.** Uploading music you do not own can cause copyright problems for the site owner. The upload box tells people to use only music they may share. The built-in songs in `music/` are public domain.
- **Editing later.** Pages can be edited from the device and browser that published them, from **Your pages** on the home screen. The secret edit key is stored in that browser. If you clear browser data you lose the ability to edit that page (it stays online).
- **Adding your own built-in songs.** See `music/README.txt`.
- **`legacy/garden-letter.html`** is the old single-page garden letter, kept for reference. You can delete it.
