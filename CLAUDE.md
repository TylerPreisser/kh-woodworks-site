# KH Woodworks Website - Complete Project Reference

## Project Identity

**What this is:** A production-ready static HTML/CSS/JS website for KH Woodworks, a custom cabinetry and woodworking shop serving Hays, KS and surrounding areas. Deployed to GitHub Pages at `tylerpreisser.github.io/kh-woodworks-site`. Built from scratch to replace an older Wix site with a modern, fast, beautifully designed custom-built platform.

**Repository:** `TylerPreisser/kh-woodworks-site` (GitHub)  
**Deployment:** GitHub Pages (automatic on push to main)  
**Live URL:** `https://tylerpreisser.github.io/kh-woodworks-site/`  
**Local path:** `/Users/tylerpreisser/Downloads/KH Woodworking/`

**Tech Stack:** Vanilla HTML5 + CSS3 (no build tools, no frameworks, no npm)  
**Last commit:** 2026-05-13 - "Lock mobile chrome and simplify footer" (Tyler Preisser)  
**Status:** Mature, stable, production-ready

---

## Directory Structure & File Map

```
/Users/tylerpreisser/Downloads/KH Woodworking/
├── index.html              # Homepage (hero with video, services scroll, gallery grid, about, footer)
├── services.html           # Services page (8 service cards in 2-column grid)
├── gallery.html            # Gallery page (responsive masonry with category filters)
├── about.html              # About page (company story, commitment grid)
├── contact.html            # Contact/Quote page (form + contact info sidebar)
├── 404.html                # 404 redirect handler for GitHub Pages (maps URLs to known pages)
├── robots.txt              # SEO robots config + sitemap.xml link
├── sitemap.xml             # XML sitemap for search engines
├── site.webmanifest        # PWA manifest (app name, icons, display mode)
├── favicon.ico             # Traditional favicon (favicon-32.png is also referenced)
│
├── assets/
│   ├── styles.css          # SINGLE monolithic CSS file (1000+ lines, all responsive)
│   ├── site.js             # SINGLE JS file (347 lines, vanilla/no dependencies)
│   │
│   ├── Logos & Icons
│   │   ├── kh-logo-tight.webp        # Main logo (responsive, drop-shadow)
│   │   ├── kh-logo-tight-small.webp  # Logo small variant
│   │   ├── favicon.svg               # SVG favicon
│   │   ├── favicon-32.png            # 32x32 favicon
│   │   ├── apple-touch-icon.png      # iOS home screen icon
│   │   ├── icon-192.png              # PWA 192x192 icon
│   │   ├── icon-512.png              # PWA 512x512 icon
│   │   └── social-preview.png        # OG image for social shares (1200x630)
│   │
│   ├── Hero & General Assets
│   │   ├── hero-poster.webp          # Hero video poster (fallback image)
│   │   ├── hero-poster-mobile.webp   # Hero mobile poster
│   │   ├── hero-loop-720.mp4         # Hero video (looping background)
│   │   └── hero-loop-mobile-480.mp4  # Mobile hero video (lower bitrate)
│   │
│   └── work/webp/                    # Portfolio images (30 webp + thumbnails)
│       ├── green-island-small.webp   # Thumbnails (-small variant)
│       ├── green-island.webp         # Full-size images
│       ├── [23 more portfolio images in webp format]
│       └── [All images have both full and -small variants for responsive loading]
│
├── tmp/                              # Temporary/development assets (gitignored)
│   ├── *.png, *.jpg                  # Temporary images
│   └── qa/                           # QA screenshots (mobile testing)
│
├── .git/                             # Full git history (25 commits, clean history)
├── .gitignore                        # Ignores: .DS_Store, tmp/
└── CLAUDE.md                         # This file

```

---

## Architecture & Design System

### Pages & Routing
5 main pages + 1 404 handler:
1. **index.html** - Homepage (hero video, scrollable services, featured gallery, story section)
2. **services.html** - All 8 services in 2-column card grid with images
3. **gallery.html** - Responsive masonry gallery with JavaScript category filtering
4. **about.html** - Company story, commitment statement, proof grid
5. **contact.html** - Quote form + contact info sidebar
6. **404.html** - GitHub Pages 404 handler that redirects friendly URLs to known pages

All pages share:
- Common `<header class="nav">` with sticky positioning, responsive mobile menu
- Common `<footer class="footer">` with full navigation, CTAs, social links
- Consistent typography, spacing, color palette
- Responsive design (works from 320px mobile to 2560px+ desktop)

### Design System

**Color Palette** (CSS custom properties in `:root`):
```css
--paper:         #f7f1e8  /* Light cream background */
--cream:         #fffaf2  /* Off-white accents */
--linen:         #e9dfd0  /* Light neutral */
--ink:           #191613  /* Deep dark brown/black */
--soft-ink:      #504940  /* Medium brown text */
--muted:         #7d7467  /* Muted gray-brown labels */
--walnut:        #5f3d25  /* Warm brown */
--clay:          #9b7658  /* Rust/clay tone */
--forest:        #203f3d  /* Dark teal accent */
--line:          rgba(25, 22, 19, .14)   /* Subtle borders */
--line-strong:   rgba(25, 22, 19, .26)   /* Stronger borders */
--shadow:        0 26px 70px rgba(25, 22, 19, .13)
```

**Typography:**
- **Serif:** Cormorant Garamond (400, 500, 600, 700 weights) - headings, display
- **Sans:** Inter (400, 500, 600, 700, 800 weights) - body, nav, labels
- **Font loading:** Google Fonts with preconnect/preload optimization

**Spacing & Layout:**
- `--max: 1260px` - Max content width
- `--gutter: clamp(20px, 4vw, 56px)` - Responsive padding (4% of viewport, clamped)
- Fluid typography using `clamp()` throughout (scales smoothly from mobile to desktop)
- Grid-based layouts: 12-column for gallery, 2-column for services, flexible for other sections

**Button Styles:**
- `.btn` - Base button (transparent, border, hover lift effect)
- `.btn--dark` - Dark background (inverse on hover)
- `.btn--light` - Light background
- `.btn--ghost` - Transparent with light border

### Component Patterns

**Hero Section** (index.html only):
- Full-viewport background video with poster fallback
- Gradient overlay shader
- Centered logo + heading + scroll cue (all with entrance animations)
- Respects `prefers-reduced-motion` setting
- Video source selection based on viewport size + network conditions
- Fallback to poster image if video disabled/load fails

**Service Scroll** (index.html):
- Horizontal scroll container with vertical scroll trigger
- Sticky viewport that scrolls items left as page scrolls down
- Service panels with image + overlay text
- Responsive: becomes vertical scroll on tablets, standard scroll on mobile
- JavaScript dynamically calculates scroll height based on content width

**Gallery Grid** (gallery.html):
- 12-column responsive grid
- Masonry layout with different aspect ratios (pano 16:9, wide 4:3, normal 4:5, square 1:1)
- JavaScript-based category filtering (no page reload, just show/hide)
- Image lazy-loading with `loading="lazy"`
- figcaption with title + category label

**Contact Form** (contact.html):
- 5 fields: name, email, phone, location, project type (select), message (textarea)
- Submit converts form data to `mailto:` URL (no backend)
- Creates pre-filled email to `khwoodworksco@gmail.com`
- Includes all form data in email body

**Mobile Menu** (JavaScript-generated):
- Hidden hamburger button (300px-980px viewport)
- Full-screen overlay menu with nav links + contact info
- Close on link click, escape key, or close button
- Body scroll lock when open

### Naming Conventions

**CSS Classes:**
- BEM-style: `.block__element--modifier` (e.g., `.service-panel__body`)
- Semantic: `.nav`, `.hero`, `.footer`, `.section`, `.gallery-grid`
- State classes: `.is-active`, `.is-in`, `.is-on`, `.is-scrolled`, `.is-open`
- Utility-like: `.reveal`, `.motion-reveal` (for animations)

**Data Attributes:**
- `data-site-nav` - Header nav element
- `data-nav-logo` - Logo link
- `data-scroll-track` - Horizontal scroll container
- `data-parallax` - Parallax element (with `data-speed` for offset amount)
- `data-quote-form` - Contact form
- `data-cat` - Gallery item category (for filtering)
- `data-poster-mobile`, `data-poster-desktop` - Hero video poster variants

**IDs:**
- `#services` - Services section (anchor for nav)
- `#process` - Gallery section
- `#story` - About section
- `#contact` - Footer/contact (anchor for CTA buttons)
- `#quote` - Contact form container
- `#kitchens`, `#trim`, `#built-ins`, etc. - Service cards (for footer service links)

### Image Optimization

**Strategy:**
- All images in modern `.webp` format (faster, smaller than JPG/PNG)
- Dual sizing: full-size + `-small` variant for responsive `srcset`
- Sizes attribute for intelligent selection: `(max-width: 640px) 84vw, (max-width: 980px) 72vw, 520px`
- Video MP4s at 720p (main) with mobile 480p variant
- Lazy loading: `loading="lazy"` for below-fold images
- Fetch priority: `fetchpriority="high"` for hero assets, `"low"` for gallery

**Portfolio Images (30 total):**
Kitchen cabinets, bathroom vanities, built-ins, laundry/mudroom, fireplace mantels, trim/millwork, tables, commercial spaces — each with full and thumbnail variants.

---

## Code Conventions & Patterns

### HTML
- Semantic HTML5: `<header>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<figure>`, `<figcaption>`
- Accessibility: `aria-label`, `aria-current="page"`, `aria-hidden="true"`, `role` attributes where needed
- Meta tags: comprehensive OG tags, Twitter card, schema.org JSON-LD (HomeAndConstructionBusiness)
- Mobile-first viewport: `viewport-fit=cover` for notch devices
- Image alt text: descriptive and specific (e.g., "Custom kitchen cabinets with a green island")

### CSS
- **Single file:** All CSS in `assets/styles.css` (1000+ lines, no splitting)
- **Custom properties:** `:root` defines all color/spacing vars for easy theming
- **Responsive approach:** Mobile-first with breakpoints at 980px and 640px
- **Fluid values:** Uses `clamp()` for responsive sizing (scales between min/max across viewport)
- **Grid layout:** CSS Grid for multi-column layouts, Flexbox for linear flows
- **No animations on small devices:** Checks `prefers-reduced-motion`, disables parallax/scroll effects
- **Opacity for overlays:** Text overlays use gradient + opacity, never pure color blocks
- **Hardware acceleration:** `transform: translate3d()`, `will-change` for scroll performance

**Performance notes:**
- No shadows on mobile (removed in @media rules)
- Sticky positioning only where necessary
- Backdrop filters (blur) used sparingly on nav (backdrop-filter: blur(18px))
- Scroll events use `requestAnimationFrame` debouncing

### JavaScript
- **Single file:** All interactivity in `assets/site.js` (347 lines, vanilla, zero dependencies)
- **No build process:** Direct browser execution, no transpilation
- **IIFE wrapper:** Everything in an IIFE to avoid global scope pollution
- **Query helpers:** `const $$ = (selector, root) => Array.from(root.querySelectorAll(selector))`
- **Naming:** Functions are camelCase, DOM selectors use data attributes

**Key features:**
1. **Navigation Menu (lines 5-116):** Generates mobile hamburger menu on-the-fly, handles open/close/escape
2. **Hero Video (lines 119-174):** Intelligent video loading (checks `prefers-reduced-motion`, network speed, viewport size), plays with fallback to poster
3. **Intersection Observer (lines 182-194):** Observes `.reveal` elements, adds `.is-in` when scrolled into view (no lib, vanilla observer)
4. **Gallery Filtering (lines 196-212):** Click handler on category buttons, shows/hides figures by `data-cat` attribute
5. **Contact Form (lines 214-232):** Prevents default, builds mailto: URL with form data, opens email client
6. **Horizontal Scroll (lines 234-312):** Measures service scroll container, calculates travel distance, applies CSS transform based on scroll progress
7. **Parallax (lines 314-346):** Applies `translate3d` offset to `[data-parallax]` elements based on viewport position and `data-speed`

**Performance patterns:**
- Throttled scroll events with RAF
- Queued DOM measurements
- Responsive feature detection (only applies parallax on desktop)
- Early exits (checks for element existence, layout breakpoints)

---

## Development Workflow

### Local Development
No build tools required. Simply open `index.html` in a browser or run a local HTTP server:

```bash
cd "/Users/tylerpreisser/Downloads/KH Woodworking"
python3 -m http.server 8000
# Visit http://localhost:8000
```

### Making Changes

**HTML:** Edit page files directly (index.html, about.html, etc.)  
**CSS:** Update `assets/styles.css` — changes apply globally  
**JS:** Update `assets/site.js` — reload page to see changes  
**Images:** Add images to `assets/work/webp/`, update srcset in HTML

### Deploying

GitHub Pages deploys automatically when you push to the repository:

```bash
cd "/Users/tylerpreisser/Downloads/KH Woodworking"
git add .
git commit -m "Your change description"
git push origin main
```

Changes live within ~30 seconds at `tylerpreisser.github.io/kh-woodworks-site/`

### Testing Checklist

1. **Mobile (320-480px):** Test in Chrome DevTools (iPhone SE viewport)
2. **Tablet (768px):** Test nav collapse, layout shifts
3. **Desktop (1260px+):** Test full-width, hero video, parallax
4. **Video:** Check hero video plays/pauses correctly across devices
5. **Forms:** Test contact form (opens email client with prefilled data)
6. **Gallery:** Test category filters, lazy loading
7. **Keyboard:** Tab through nav, form fields; test escape key in menu
8. **Lighthouse:** Run Chrome DevTools audit (target: 90+ all categories)
9. **SEO:** Check page titles, meta descriptions, schema.org JSON-LD

---

## Critical Knowledge & Gotchas

### GitHub Pages Specifics

**404 Handler:** The `404.html` file is a custom redirect script that maps friendly URLs (e.g., `/about` without `.html`) to actual files (e.g., `/about.html`). This allows clean URLs on GitHub Pages. The script checks `location.pathname` against a map of aliases:
- Empty string → `index.html`
- `about`, `story` → `about.html`
- `contact`, `quote` → `contact.html`
- etc.

If adding new pages, update the `knownPages` map in 404.html.

**Deployment:** Automatic on push. GitHub Actions checks out the repo and serves it as-is from the root. All URLs are relative to `/kh-woodworks-site/`.

### Video Performance

**Hero Video:**
- Loads only if `prefers-reduced-motion` is NOT set
- Selects source based on viewport: mobile (720p) or desktop (720p, same file)
- Falls back to poster image if play() fails
- Includes `webkit-playsinline` attribute for iOS (critical for autoplay)
- Poster updates dynamically when viewport changes

**Issue:** Video might not autoplay on some mobile browsers (iOS Safari) due to user gesture requirement. Fallback poster ensures visual continuity.

### Mobile Navigation

**Important:** The mobile menu is **generated entirely by JavaScript** — not in HTML. This is intentional (reduces HTML, dynamically composes from existing DOM). If JavaScript fails, the menu won't appear, but all content remains accessible via default navigation.

**Breakpoints:**
- `@media (max-width: 980px)`: Hamburger menu appears, nav links collapse, layouts shift to 1 column
- `@media (max-width: 640px)`: Further optimizations (hide phone number, collapse grids, mobile CTA bar at bottom)

### Scroll Interactions

**Service Scroll (index.html):**
- On desktop: Sticky viewport, horizontal scroll triggered by vertical scroll
- On tablet/mobile: Falls back to natural vertical scroll (JavaScript disables enhancement)
- Measurement happens on load and resize; if window is resized, measurements update

**Parallax:**
- Only on desktop (980px+)
- Disabled if `prefers-reduced-motion` is set
- Calculates offset based on element center position in viewport

### Form Handling

**No Backend:** The contact form uses `mailto:` links, which:
- Works offline (generates email client action, no network call)
- Prefills subject + body with form data
- User must have email client configured
- Form data is NOT encrypted/sent to server

This is intentional for a simple static site, but it means:
- No confirmation email
- No form validation on server
- No spam filtering
- If user has no email client, form won't work

**Alternative:** To add a real backend, replace the form submission handler to POST to a serverless function (e.g., Netlify Forms, AWS Lambda, or Google Sheets).

### Image Lazy Loading

All portfolio images use `loading="lazy"`, which tells the browser to defer loading until they're near the viewport. **Note:** Intersection Observer-based lazy loading (used for reveal animations) is separate from native lazy loading. Images will load before reveal animation fires.

### CSS Customization

To change colors, edit the `:root` variables in `assets/styles.css`:
```css
:root {
  --paper: #f7f1e8;      /* Main background */
  --cream: #fffaf2;      /* Light accents */
  --ink: #191613;        /* Text */
  --forest: #203f3d;     /* Accent (CTA buttons, focus) */
  /* ... etc ... */
}
```

All colors reference these variables, so updating here cascades globally.

### Accessibility

- Navigation uses semantic `<nav>` with `aria-label`
- Current page marked with `aria-current="page"`
- Menu overlay uses `aria-hidden="true"` when closed
- SVG icons have `aria-hidden="true"` (decorative)
- Form labels properly associated with inputs (`<label for="id">`)
- Sufficient color contrast (WCAG AA compliant)
- Focus indicators on buttons (2px solid forest green with 4px offset)

---

## Current State Assessment

### What's Complete & Stable
- All 5 pages fully designed and functional
- Responsive design tested across viewports (mobile, tablet, desktop, wide)
- Hero video optimized with fallbacks
- Gallery with working category filters
- Contact form fully functional (mailto: integration)
- Mobile menu generation + interactions working
- Scroll enhancements (parallax, horizontal scroll) stable
- SEO: canonical URLs, meta tags, structured data (schema.org)
- Performance: Lighthouse scores 90+ (estimated)
- Git history clean with 25 meaningful commits

### Git History (Latest Commits)
```
1b63da4 (2026-05-13) Lock mobile chrome and simplify footer
4cdf8a3 Unify mobile background shell
ef69765 Optimize mobile site and media
5e09640 Stabilize mobile scrolling
337e7ca Refine mobile experience
...
```
All commits are focused, no junk commits.

### Potential Areas for Enhancement (Not Urgent)

1. **Backend Integration:** Contact form currently uses `mailto:`. Could add:
   - Real form submission (Netlify Forms, Formspree, AWS Lambda)
   - Confirmation emails
   - Server-side validation
   - CRM integration (HubSpot, Pipedrive)

2. **Analytics:** No tracking currently. Could add:
   - Google Analytics 4
   - Form submission tracking
   - Button click tracking
   - Video engagement metrics

3. **Blog/CMS:** Currently static. If blog needed:
   - Migrate to static site generator (11ty, Hugo, Jekyll)
   - Add Markdown content folder
   - Auto-generate pages

4. **Admin Interface:** Currently no admin tools. If edits needed:
   - Add GitHub repo access only (edit directly)
   - Or migrate to Netlify CMS / Decap CMS for non-technical edits

5. **Performance Optimization:**
   - Critical rendering path analysis
   - Service worker for offline support
   - Resource hints (dns-prefetch, preconnect) refinement

6. **Third-party Integration:**
   - Instagram feed (currently just links)
   - Google Maps embed (for location)
   - Photo album galleries (Flickr, SmugMug, etc.)

### No Known Issues
- All functionality working as designed
- No console errors or warnings
- Responsive design solid
- SEO structure complete
- Accessibility baseline met

---

## Key File Paths for Reference

**Must-know files:**
- `/Users/tylerpreisser/Downloads/KH Woodworking/index.html` - Homepage
- `/Users/tylerpreisser/Downloads/KH Woodworking/assets/styles.css` - All styling
- `/Users/tylerpreisser/Downloads/KH Woodworking/assets/site.js` - All interactivity
- `/Users/tylerpreisser/Downloads/KH Woodworking/404.html` - URL routing (GitHub Pages specific)

**Configuration:**
- `/Users/tylerpreisser/Downloads/KH Woodworking/site.webmanifest` - PWA config
- `/Users/tylerpreisser/Downloads/KH Woodworking/robots.txt` - SEO robots + sitemap
- `/Users/tylerpreisser/Downloads/KH Woodworking/.gitignore` - Excludes tmp/, .DS_Store

**Images:**
- `/Users/tylerpreisser/Downloads/KH Woodworking/assets/work/webp/` - 30 portfolio images (+ thumbnails)
- `/Users/tylerpreisser/Downloads/KH Woodworking/assets/hero-loop-720.mp4` - Hero video

**Old Wix Site (Reference Only):**
- `/Users/tylerpreisser/Downloads/www.khwoodworksco.com/` - Full scrape of old Wix site (for reference, not in production)

---

## Navigation Structure

**Primary Nav Links (all pages):**
- Home → `index.html`
- Services → `services.html`
- Gallery → `gallery.html` (labeled "Gallery" on subpages, "#process" anchor on homepage)
- About → `about.html` (labeled "About" on subpages, "#story" anchor on homepage)
- Contact → `contact.html`

**Homepage Anchor Links:**
- #services → Service scroll section
- #process → Gallery grid section
- #story → About/story section
- #contact → Footer

**Service Page Links (footer):**
- #kitchens, #trim, #built-ins, #bathrooms, #laundry, #mantels, #commercial, #tables - Jump to specific service card

---

## Contact Information (In Site)
- **Phone:** 785-829-0504
- **Email:** khwoodworksco@gmail.com
- **Location:** Catharine, KS
- **Service Area:** Hays, Ellis County, Salina, Great Bend, WaKeeney, and surrounding Kansas communities
- **Social:** Instagram @kh_woodworks_co, Facebook KH Woodworks Co.

---

## Relationships to Other Projects

**Old Wix Site:** Located at `/Users/tylerpreisser/Downloads/www.khwoodworksco.com/` (complete scrape). This site is a modern replacement — cleaner design, faster, custom-built, same content strategy.

**Real Domain:** Currently served from GitHub Pages URL (`tylerpreisser.github.io/kh-woodworks-site/`). If a custom domain (e.g., khwoodworks.com) is registered, update:
1. GitHub Pages settings (add custom domain)
2. Canonical URLs in page `<head>` tags
3. robots.txt sitemap URL
4. 404.html repo base path

---

## Summary: Next Editor's Checklist

Before making changes:
- [ ] Understand: No build tools, pure HTML/CSS/JS
- [ ] Know: GitHub Pages serves from `/kh-woodworks-site/` repo base
- [ ] Edit: HTML pages, `assets/styles.css`, `assets/site.js` directly
- [ ] Images: Add to `assets/work/webp/`, always provide full + `-small` variants
- [ ] Test: Responsive (320px, 768px, 1260px+), mobile menu, form, video
- [ ] Deploy: `git push origin main`, live within 30 seconds
- [ ] 404 Handler: Update `404.html` knownPages map if adding new pages

---

**Created:** 2026-05-13  
**Project Status:** Production-ready, actively maintained
