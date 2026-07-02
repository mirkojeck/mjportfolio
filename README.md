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
- `src/content/posts/*.md` for Gallery / Case Studies.
- `src/content/publications/*.md` for editorial/publication pages.

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
confirm `repo: mirkojeck/mjportfolio` in `src/mj-admin/config.yml`, then add
the editor as a GitHub collaborator with write access.
Password reset and account recovery are handled by GitHub, not by Decap.
For production on Vercel, this project includes native Vercel OAuth functions:

- `/api/auth`
- `/api/callback`

Create a GitHub OAuth App, then add these environment variables in Vercel only:

```text
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
OAUTH_REDIRECT_URI=https://your-domain.com/api/callback
```

Do not place OAuth secrets in this repository, `public/`, or `dist/`.

The CMS currently uses Decap's default local media handling:

- Uploaded files are committed to `public/img/uploads`.
- Saved image values use `/img/uploads/...`.
- The served `/mj-admin/config.yml` is generated at build time from `src/mj-admin/config.yml` and `src/data/site.yml`.
- `site_url` and `display_url` come from Site Settings, not from a hardcoded admin config value.
- Do not add `media_library` unless you configure a real provider such as
  Uploadcare or Cloudinary with the required `name` and provider keys.

### Editor Notes

- Use `Gallery / Case Studies` for visual work, case studies, and image galleries.
- Add all case-study images under `Gallery Images`.
- Turn on `Use as Cover` for the image that should appear in Gallery listings and the home latest creations section. If no image is marked, the first image is used automatically.
- Gallery images appear in the detail page slider and lightbox gallery.
- Recommended gallery images: JPG, PNG, or WebP, 1600px wide or larger, under 5MB.
- Turn on `Show on Home Gallery` to make an item appear in the home gallery section.
- Use lower `Display Order` numbers for priority items.
- For logos, upload a light logo for dark hero/menu/footer and a dark logo for light sections.
- Projects, Services, Team, and Gallery collections include descriptions, preview paths, sorting, and filters for easier editing.
- Site Settings controls the active Home variant and Portfolio layout.
- Each Project controls its own detail-page layout using the `Detail Page Layout` select.
- Services can use `Accordion Process` rows to match the original service detail interaction.

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
7. Keep the Astro build as static output. The GitHub OAuth proxy is handled by native Vercel functions in `/api`, so `@astrojs/vercel` is not required.
8. Add `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `OAUTH_REDIRECT_URI` in Vercel Environment Variables before enabling production Decap login.

## QA Checklist

- Homepage loads on desktop and mobile.
- Menu opens and closes.
- Portfolio listing loads.
- Portfolio variants load: `/portfolio/grid/`, `/portfolio/wide/`, and `/portfolio/slider/`.
- Every project detail page loads.
- Project detail layout variants render sliders, grids, lightbox links, and project navigation.
- Services page loads from editable content.
- Service detail accordions open through the original JS hooks.
- Gallery listing and gallery details load.
- Publications listing and detail routes load.
- Legacy `/blog/` routes redirect to the official `/gallery/` routes.
- Contact form is either connected or clearly disabled.
- `/mj-admin/` loads.
- `/admin/` returns 404.
- No missing images or console errors on primary pages.
- Site title, SEO description, favicon, Open Graph image, project order, layout variants, and featured projects are editable through Decap-managed files.
