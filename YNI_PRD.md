# Product Requirements Document (PRD)
## YourNextItinerary (YNI) — Static Blog Migration & Launch

**Repository:** https://github.com/ishujaswal30/yournextitinerary  
**Live domain:** yournextitinerary.com  
**Deadline driver:** HostGator account shutting down imminently

---

## 1. Context & Goal

YourNextItinerary is a personal travel blog currently hosted on HostGator (WordPress). The hosting costs money, generates no revenue, and requires ongoing infrastructure maintenance. The goal is to migrate it to a zero-cost, low-maintenance static architecture using tools already set up.

**Primary goal:** Kill the HostGator bill. Keep the website alive at yournextitinerary.com at zero cost.

**Secondary goal:** Make publishing new content easy without any coding.

**Future goal (out of scope for this migration):** SEO optimization to drive organic Google traffic — the precondition for any monetization later.

---

## 2. What "Done" Looks Like

Milestone 1 is complete when:
- `yournextitinerary.com` loads in a browser and displays the blog
- SSL padlock is green (HTTPS works)
- At least the homepage and one post render correctly
- HostGator can be safely cancelled

Content does not need to be complete. Design does not need to be perfect. The goal is a working, live site that costs nothing to run.

---

## 3. Current State of the Codebase

The GitHub repo (`ishujaswal30/yournextitinerary`) is a fork of `bdevgon12/travel`. It is already a fully configured Hugo static site with Netlify and Decap CMS wired up.

**Confirmed tech stack — no guessing needed:**

| Component | Technology | Status |
|-----------|-----------|--------|
| Static site generator | Hugo | ✅ Confirmed (`.hugo_build.lock`, `hugo.toml` present) |
| Hosting & CI/CD | Netlify | ✅ Confirmed (`netlify.toml` present) |
| Content management | Decap CMS | ✅ Confirmed (`/static/admin` folder present) |
| Source control | GitHub | ✅ Active |
| Domain | yournextitinerary.com | ⚠️ Currently pointing to HostGator |

**Known issue to fix immediately:**  
`hugo.toml` has `baseURL = "http://example.org/"` — this must be updated to `https://yournextitinerary.com/` before deployment.

**Repo structure:**
```
archetypes/       Hugo content templates
content/          All blog posts and pages as Markdown files
layouts/          Hugo HTML templates (controls site appearance)
public/           Hugo build output (auto-generated, do not edit)
static/
  admin/          Decap CMS interface (served at /admin)
  css/            Stylesheets
  images/         Site images and post photos
  js/             JavaScript
hugo.toml         Site configuration
netlify.toml      Netlify build configuration
```

**Where data lives:** There is no database. Everything is files. Blog posts are Markdown (`.md`) files inside `/content/posts/`. Images live in `/static/images/`. Hugo reads these files and builds a static HTML website. Git is the version control and backup system.

---

## 4. Content Migration Plan (Do This Before HostGator Shuts Down)

### Step A — Export from WordPress RIGHT NOW

Do these two things in your WordPress admin before the account closes:

**Export posts and pages:**
1. Log into HostGator WordPress admin
2. Go to: `Tools → Export → All Content`
3. Download the `.xml` file — this contains all your posts, pages, categories, and tags

**Export images:**
1. Go to: `Media → Library`
2. Install the plugin "Export Media Library" (free)
3. Download your entire media folder as a ZIP

Save both files locally and also upload them to Google Drive as backup.

### Step B — What Claude Code will do with the export

When you start the Claude Code session, provide it with the WordPress XML export file. Claude Code will:
1. Use a conversion tool (`wordpress-to-hugo-exporter` or Python script) to turn WordPress posts into Hugo Markdown files
2. Place converted posts into `/content/posts/`
3. Copy your images into `/static/images/`
4. Fix internal image links in the Markdown files to point to the new paths

**Post format Claude Code should produce (Hugo front matter):**
```markdown
---
title: "Your Post Title"
date: 2024-01-15
country: "Italy"
city: "Rome"
tags: ["europe", "food", "weekend"]
cover: "/images/rome-colosseum.jpg"
draft: false
---

Post content here...
```

---

## 5. Milestones

### Milestone 1 — Get the Site Live (Priority: Urgent)
**Goal:** `yournextitinerary.com` works via Netlify. HostGator can be cancelled.

**Tasks for Claude Code:**

1. **Fix `baseURL` in `hugo.toml`**  
   Change `http://example.org/` to `https://yournextitinerary.com/`

2. **Verify `netlify.toml` build config**  
   Confirm it contains the correct Hugo build command. Expected:
   ```toml
   [build]
     command = "hugo"
     publish = "public"
   ```

3. **Connect repo to Netlify**  
   - Netlify dashboard → Add new site → Import from GitHub  
   - Select `ishujaswal30/yournextitinerary`  
   - Build settings should auto-detect from `netlify.toml`  
   - Netlify will generate a preview URL like `yni-travel.netlify.app`

4. **Verify preview deployment**  
   Confirm: homepage loads, styles render, no broken images, no build errors in Netlify logs.

5. **Configure Decap CMS authentication**  
   - Enable Netlify Identity in Netlify dashboard  
   - Invite yourself as a user  
   - Confirm `/admin` panel is accessible and can create/edit posts

6. **Domain migration**  
   - Add custom domain `yournextitinerary.com` in Netlify → Domain settings  
   - Update DNS in HostGator domain manager (or wherever domain is registered):  
     ```
     CNAME  www   →  [your-site].netlify.app
     A      @     →  75.2.60.5  (Netlify's load balancer IP)
     ```
   - Netlify auto-provisions SSL via Let's Encrypt (takes up to 24 hours)  
   - Verify: `https://yournextitinerary.com` loads with green SSL

7. **Cancel HostGator** once DNS has fully propagated and site is confirmed live

---

### Milestone 2 — Content Migration
**Goal:** Existing WordPress content is visible on the new site

**Tasks for Claude Code:**

1. Convert WordPress XML export to Hugo Markdown using a Python conversion script
2. Validate front matter structure matches hugo.toml taxonomy config (`tags`, `categories`)
3. Place images in `/static/images/`, update all image paths in Markdown files
4. Test that posts appear on the site and images load correctly
5. Do a dry run: publish one new test post via Decap CMS `/admin`, confirm it appears after Netlify auto-deploys

---

### Milestone 3 — Content Structure & Theme Review
**Goal:** Evaluate the current theme; decide if it's the right look before creating new content

This milestone is about learning the publishing workflow and deciding on visual direction — not shipping features.

**Questions to answer during this milestone:**
- Does the current Hugo theme (forked from `bdevgon12/travel`) represent the brand well?
- Is navigation intuitive? (Home, Journal, Map, About)
- Does the post layout work for travel itinerary content?
- Is the mobile experience acceptable?

**If the theme needs changes:** Claude Code can modify layouts in `/layouts/` and styles in `/static/css/`.  
**If a different theme is preferred:** Hugo has a large theme library at themes.gohugo.io — a new theme can be dropped in without touching content.

---

### Milestone 4 — SEO Foundation (Future)
**Goal:** Make the site discoverable by Google to enable future organic traffic and monetization

This is explicitly out of scope for the initial migration. Do this only after Milestones 1–3 are stable.

**What this will involve:**
- Verify `enableRobotsTXT = true` is working (already set in `hugo.toml`)
- Add `sitemap.xml` generation (Hugo does this automatically)
- Submit sitemap to Google Search Console
- Add meta descriptions to posts
- Optimize image alt text
- Ensure page titles follow SEO best practices
- Consider adding Google Analytics (already possible via Hugo's built-in config)

Monetization options (AdSense, affiliate links) become viable only after the site has consistent traffic — SEO is the prerequisite.

---

## 6. Instructions for Claude Code

When starting a Claude Code session with this PRD, begin with:

> "Please analyze the GitHub repository at https://github.com/ishujaswal30/yournextitinerary — look at hugo.toml, netlify.toml, the /content directory, and the /layouts directory before doing anything. Then follow Milestone 1 from the PRD."

Claude Code should:
- **Read the repo first** before making any changes
- Make the `baseURL` fix as the very first code change
- Not modify `/public/` — this is auto-generated by Hugo during build
- Not add any backend, database, or server-side logic — this is and must remain a static site
- Keep all content as Markdown files in `/content/`
- Keep all images in `/static/images/`

---

## 7. Non-Goals (Permanent)

- No user accounts or login system
- No database or server-side backend
- No WordPress or plugin ecosystem
- No e-commerce

---

## 8. Backup Strategy

All content lives in GitHub. This is the backup. As long as the repo is not deleted, the entire site and all content can be restored or moved to any other static host (Cloudflare Pages, GitHub Pages, Vercel, etc.) in under 30 minutes.

Optional additional backup: periodically export the `/content/` folder to Google Drive.
