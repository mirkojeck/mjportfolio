# Mirko Portfolio

Editable Astro rebuild of the original static portfolio template.

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

Open `http://localhost:4321`.

## Edit Content

Primary editable files:

- `src/data/site.yml` for brand, SEO defaults, contact details, socials, and legal links.
- `src/data/navigation.yml` for main and footer navigation.
- `src/content/projects/*.md` for portfolio projects.
- `src/content/services/*.md` for services.
- `src/content/team/*.md` for team members.
- `src/content/posts/*.md` for blog posts.

## Visual CMS

The Decap CMS admin is available at:

```text
/mj-admin/
```

For local CMS editing, run Decap's local backend in a second terminal:

```bash
npm run cms:local
```

Then run the Astro dev server and open `http://localhost:4321/mj-admin/`.

Production CMS login uses GitHub OAuth. After this project is pushed to GitHub,
replace `REPLACE_WITH_OWNER/REPLACE_WITH_REPO` in `public/mj-admin/config.yml`
with the real repository name, then add the editor as a GitHub collaborator.
Password reset and account recovery are handled by GitHub, not by Decap.
For production, configure a Decap-compatible GitHub OAuth app/proxy and keep
OAuth client secrets outside this repository and outside `public/`.

## Forms

Set a form endpoint before production launch:

```bash
PUBLIC_CONTACT_FORM_ENDPOINT=https://your-form-endpoint.example
```

Without this value, the contact form stays visible but disabled.

## Validation

```bash
npm run check
npm run build
npm run test:e2e
```

## Vercel Deployment

1. Push the project to GitHub.
2. Import it into Vercel.
3. Use the default Astro build command: `npm run build`.
4. Use `dist` as the output directory.
5. Add `PUBLIC_CONTACT_FORM_ENDPOINT` in Vercel project environment variables if forms should submit.
6. Connect Vercel to the GitHub repository so Decap commits trigger automatic deployments.
7. Keep the project as static output; `@astrojs/vercel` is not required unless server endpoints or middleware are added later.

## QA Checklist

- Homepage loads on desktop and mobile.
- Menu opens and closes.
- Portfolio listing loads.
- Every project detail page loads.
- Services page loads from editable content.
- Blog listing and blog details load.
- Contact form is either connected or clearly disabled.
- `/mj-admin/` loads.
- `/admin/` returns 404.
- No missing images or console errors on primary pages.
- Site title, SEO description, favicon, Open Graph image, project order, and featured projects are editable through Decap-managed files.
# mjportfolio
# mjportfolio
# mjportfolio
