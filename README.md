# Blackberry Martin — website

Static site. No build step, no dependencies, no framework. Open `index.html`
in a browser and it works.

## Structure

Four pages, deliberately. The structure copies what the reference bands
actually do rather than what a generic band template does:

| | Arcy Drive | Backseat Lovers | Wallows | **Us** |
|---|---|---|---|---|
| About page | ✗ | ✗ | ✗ | **✗** |
| Music page | ✓ | ✗ | ✓ | **✓** (coming soon) |
| Mailing list | ✓ nav item | ✓ in hero | ✓ "Connect" page | **✓ page + popup** |
| Contact form | ✓ | ✗ | ✗ | **✓** |

**None of them have an About page or a bio.** That's the single most consistent
thing across all three, so we don't have one either.

```
blackberry-martin/
├── index.html          Video + name, then a scroll to a thin footer strip
├── music.html          Big studio video, with the sleeve + title beside it
├── signup.html         Mailing list, modelled on Wallows' Connect page
├── contact.html        Booking & press
├── assets/
│   ├── css/style.css   All styling. Colours are tokens at the top.
│   ├── js/config.js    ★ THE ONLY FILE YOU NEED TO EDIT ★
│   ├── js/main.js      Behaviour. You shouldn't need to touch this.
│   ├── img/            Cover art placeholders + hero poster frame
│   └── video/          Hero background video
└── .nojekyll           Stops GitHub Pages running Jekyll
```

---

## 1. `assets/js/config.js`

Everything configurable lives here: hero video, GHL, social links.
**Anything left as `''` hides itself** — no dead links ever ship. That's also
why the site looks sparse before you fill it in: the icon rows only appear
once they have somewhere to point.

---

## 2. The hero video

Two of them, one per page, configured under `video` in `config.js`. The key
comes from `data-hero-video="..."` on the `<video>` tag.

| Key | File | Page | Source |
|---|---|---|---|
| `hero` | `assets/video/hero.mp4` | `index.html` | landscape, 9.0s, **12 MB** |
| `music` | `assets/video/music.mp4` | `music.html` | **portrait**, 8.8s, **12 MB** |

Both are muted, looped and inline, so they play forever with no controls.

**⚠️ 24 MB of video between them is too heavy to launch with.** Aim for 3–5 MB
each — see "Compressing the video" below.

> The music clip is portrait (1080×1920). It is **not** cropped — the Music
> page shows it whole in a portrait-shaped column, which is what the split
> layout is for. Height is capped by `max-height: 58svh` on
> `.split__media > video`.

### Swapping in a new edit

```bash
SRC="/Users/antoinettegentempo/Desktop/BBM/WEBSITE/HERO VIDEO.mp4"   # or the music clip

avconvert --source "$SRC" --output assets/video/hero.mp4 \
  --preset Preset1280x720 --multiPass --replace

# poster frame — the still shown before the video loads, and the fallback
# for reduced-motion visitors
rm -f assets/img/hero-poster.jpg
qlmanage -t -s 1920 -o assets/img assets/video/hero.mp4
sips -s format jpeg -s formatOptions 72 assets/img/hero.mp4.png \
  --out assets/img/hero-poster.jpg
rm assets/img/hero.mp4.png
```

> If you're previewing with `serve.py` this is handled for you. With any other
> server, hard-refresh after swapping an asset (`Cmd+Shift+R`) — a normal
> reload will keep serving the cached file and make it look like nothing
> changed.

To trim instead of using the whole clip, add `--start 7.66 --duration 2`
(seconds). **`--multiPass` is incompatible with trimming** — drop it when you
use `--start`/`--duration`, or the encode fails and deletes the output.

### The grade is CSS, not baked in

The warm Backseat Lovers look is applied live in `style.css`:

```css
.hero__media img,
.hero__media video {
  filter: sepia(0.32) saturate(0.82) contrast(1.12) brightness(0.58);
}
```

Tweak those four numbers and the look changes instantly — no re-encoding, no
regenerating files. `brightness` is the one to reach for if the wordmark ever
gets hard to read against a brighter clip.

Film grain is also live, from the `.grain` overlay, and it *moves*. **Don't
bake grain into the video** — you'd get it twice, and baked grain is frozen to
each frame, which reads as digital noise rather than film.

### Swapping the video

1. Drop the new file in `assets/video/`
2. Point `video.mp4` at it in `config.js`
3. Regenerate the poster frame (the still shown before the video loads):
   ```bash
   qlmanage -t -s 1920 -o assets/img assets/video/hero.mp4
   sips -s format jpeg -s formatOptions 72 assets/img/hero.mp4.png --out assets/img/hero-poster.jpg
   rm assets/img/hero.mp4.png
   ```

The video is skipped entirely for visitors who have reduced-motion turned on —
they get the poster image instead. Autoplay refusals (low power mode, data
saver) fall back to the poster too.

### Compressing the video

`avconvert` ships with macOS but gives no bitrate control, so it bottoms out
around 8 MB. For a properly small file you need ffmpeg:

```bash
brew install ffmpeg     # if you don't have Homebrew, install that first
```

Then, from the project folder:

```bash
ffmpeg -i "SOURCE.mp4" \
  -vf "scale=1280:-2" \
  -c:v libx264 -crf 30 -preset slow -profile:v high -pix_fmt yuv420p \
  -an -movflags +faststart \
  assets/video/hero.mp4

ffmpeg -i "SOURCE.mp4" \
  -vf "scale=1280:-2" \
  -c:v libvpx-vp9 -crf 40 -b:v 0 \
  -an \
  assets/video/hero.webm
```

- `-an` strips the audio — it's muted anyway, so it's pure wasted bytes
- `-crf` is quality: higher = smaller. 28–34 is the useful range for a hero
- `+faststart` puts the index at the front so playback starts before the whole
  file downloads. Without it the hero sits blank on first visit
- Add the webm path to `config.js` and browsers that support it take the
  smaller file automatically

---

## 3. Go High Level

Two forms: `newsletter` (the popup) and `contact` (Contact page).
Two ways to wire each. **Pick one per form.**

### The mailing list

**`signup.html`** is modelled on the Wallows "Connect" page: one centred
column, an oversized headline carrying the pitch, underline-only fields, and a
small dark arrow button inline with the email.

Two deliberate differences from Wallows:

- **They ask for email only. We ask for name, email and city.** Every extra
  field costs signups, so if the list matters more than the segmentation, cut
  it back to email — delete the `.signup-page__pair` block in `signup.html`.
- **The consent checkbox is required.** Wallows' is a checkbox too, but ours
  blocks submission until it's ticked, which is the safer posture for
  marketing email. Drop the `required` attribute to make it optional.

> Arcy Drive has a sign-up page too, but **it's currently broken** — the form
> doesn't load, leaving a blank white page above their footer. Nothing to copy
> there, which is why this follows Wallows.

**The popup** still fires once on a first visit, for people who never click
through to the page. Dismissal is remembered in `localStorage`, guarded in
try/catch because private windows can throw on it:

```js
signup: { popupDelay: 6000 }   // ms. Set to 0 to switch the popup off.
```

Escape and backdrop-click close it, focus moves into the panel and back out on
close, and Tab is trapped inside while it's open.

### The home page scroll

The hero is `114svh` — taller than the window on purpose — as three grid rows:
`100svh` (so the name sits dead centre of the first screen), a stretch of pure
video, then the thin footer strip. Change `min-height` on `.hero` to make that
scroll longer or shorter.

### Setting up the webhook (the one we're using)

Every form on the site is ours — our markup, our styling. GHL just receives
the data and makes the contact. Two workflows, one per form type.

**1. Newsletter workflow**

1. GHL → **Automation → Workflows → Create Workflow → Start from Scratch**
2. Add trigger: **Inbound Webhook**
3. Copy the webhook URL it gives you
4. Paste it into `ghl.newsletter.webhookUrl` in `assets/js/config.js`
5. Back in GHL, add an action: **Create/Update Contact**, and map:

| Incoming field | GHL contact field |
|---|---|
| `email` | Email |
| `first_name` | First Name |
| `city` | City |
| `consent` | *(custom field, or ignore)* |
| `source` | *(custom field — always `blackberrymartin.com`)* |
| `page` | *(custom field — which page they signed up on)* |

6. Add a tag like `website-newsletter` so you can segment later
7. **Publish the workflow** — a saved-but-unpublished workflow silently does nothing

**2. Contact workflow**

Same again, into `ghl.contact.webhookUrl`. Fields are different:

| Incoming field | GHL contact field |
|---|---|
| `name` | Full name *(this one is a full name, not a first name)* |
| `email` | Email |
| `enquiry_type` | *(custom field — Booking / Press / Sync / Other)* |
| `message` | *(custom field, or an internal notification)* |
| `source`, `page` | *(custom fields)* |

Add an **Send Internal Notification** action so booking enquiries actually
reach your inbox rather than just sitting in GHL.

**Which form sends what**

| Form | Sends |
|---|---|
| Sign Up page | `first_name`, `email`, `city`, `consent` |
| Popup | `first_name`, `email`, `city` |
| Music page panel | `email` only — it's a quick capture |
| Contact page | `name`, `email`, `enquiry_type`, `message` |

All of them also send `source` and `page`.

> **CORS: verified fine.** LeadConnector returns `access-control-allow-origin: *`,
> so the browser can read the response and the page genuinely knows whether a
> submission landed — "You're on the list" means it actually arrived. The
> `no-cors` retry in `main.js` is a fallback that shouldn't ever fire on this
> endpoint; it stays in for safety if the endpoint ever changes.

### Using an embed instead

If you'd rather hand a form to GHL entirely: **Sites → Forms**, open it,
**Integrate**, and copy the ID out of the embed URL
(`…/widget/form/`**`aB3xYz9QwErTyUi`**) into `formId`. It wins over
`webhookUrl` if both are set.

Set `height` to match GHL's preview or the embed gets clipped. Note the
newsletter form appears in three places, so the same ID mounts more than once
— GHL's own snippet hardcodes `id="inline-<formId>"`, which would give
duplicate element IDs; ours appends a counter and sets explicit heights so
nothing depends on their resizer script.

The trade-off is that the embed brings GHL's styling, not the site's.

## 4. The album photo

`assets/img/band-photo.jpg` came from `IMG_3328.heic`. **Browsers can't display
HEIC** (Safari can, Chrome and Firefox can't), so it was converted:

```bash
sips -s format jpeg -s formatOptions 88 -Z 2000 IMG_3328.heic --out band-photo.jpg
```

Do the same for any other photo off an iPhone.

It's a photo *of* an instax print on a table, deliberately not cropped to just
the print — the found-object framing is the nice part.

**The print is the `Volume 2` album cover**, so the Music page treats it as a
sleeve: the artwork with the title captioned underneath it, the way a record
is credited. That column sits beside a large looping studio video.

```
┌──────────────┐  ┌────────┐
│              │  │ cover  │
│  studio      │  └────────┘
│  video       │   DEBUT ALBUM
│  (76svh)     │   Volume 2
│              │   is in the works
└──────────────┘   [ signup ]
```

Both media use `width: fit-content` on their frames so each hugs its own
aspect ratio — the video is 9:16 and the sleeve is roughly 4:5, and a shared
fixed-width box would have letterboxed one of them.

**The video is mounted as a print.** A 9:16 clip reads as phone footage no
matter how it's graded — the shape is the tell, not the colour. So it's
cropped to **4:5**, the same proportion as the instax sleeve beside it, and
mounted in a border with a deep base like a real print (`.print` /
`.print__window`). It stops being a screen and becomes an object on the same
table as the cover.

To change the crop, adjust `aspect-ratio` on `.print__window`, and
`object-position: center 42%` to pan the framing up or down.

**Edges are lightly feathered into the page** so nothing ends on a hard
rectangle. That's a CSS mask — two linear gradients composited with
`mask-composite: intersect`:

```css
mask-image:
  linear-gradient(to right,  transparent 0%, #000 10%, #000 90%, transparent 100%),
  linear-gradient(to bottom, transparent 0%, #000 8%,  #000 92%, transparent 100%);
mask-composite: intersect;
```

Widen those percentages for a softer fade, tighten them for a harder edge —
they're deliberately shallow (3–4%), since a heavy fade reads as blurred
rather than natural. The mask goes on the *frame*, not the media — masking the
media alone would leave the grain layer as a crisp rectangle behind it.

The nav is a stacked block about 145px tall, so `.split`'s top padding has to
clear it generously (`clamp(12rem, 27vh, 16rem)`) or the media reads as
squashed up against it.

Columns are **top-aligned, not centred**: the sleeve column is taller than a
viewport once the caption and form are under it, and centring overflowing
content pushes it up underneath the nav.

It stacks on narrow screens: video, sleeve, title, signup.

Black and white and the extra grain are both CSS:

```css
.split__media > img,
.split__media > video { filter: grayscale(1) contrast(1.08) brightness(0.92); }
```

Delete `grayscale(1)` to bring the colour back. The `::after` on `.split__media`
carries a heavier grain than the page-wide `.grain` overlay, which is tuned for
type and is too subtle to read as film on an image.

## 5. Content to replace

| Find | Where |
|---|---|
| `Volume 2` / `is in the works` | `music.html`, the `.album` block |
| `assets/img/band-photo.jpg` | the instax photo — the right-hand column of the Music page |
| `og.svg` | 1200×630 link preview for socials and messages |
| `cover-1.svg` | currently the favicon — swap for real art when there is some |

### When the first release lands

The release styles are already in `style.css`. Drop this into `music.html`
in place of the `.soon` block, newest first:

```html
<div class="release-list">
  <article class="release reveal">
    <div class="release__art">
      <img src="assets/img/cover-1.jpg" alt="TITLE cover art" loading="lazy">
    </div>
    <h2 class="release__title">TITLE</h2>
    <p class="release__date">Single &middot; 2026</p>
    <p class="release__cta"><a href="SMART-LINK">Listen now</a></p>
  </article>
</div>
```

`SMART-LINK` is a Linkfire / Feature.fm / lnk.to URL — one link that sends each
visitor to their own streaming service. That's what all three reference sites
do instead of listing per-service buttons.

---

## 6. Publishing to GitHub Pages

```bash
cd ~/Desktop/blackberry-martin
git init -b main
git add .
git commit -m "Blackberry Martin site"
git remote add origin https://github.com/YOUR-USERNAME/blackberry-martin.git
git push -u origin main
```

Then **Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)`**.

> **Compress the video first.** GitHub warns over 50 MB and hard-blocks at 100
> MB, and git stores every version of a binary forever — committing a big video
> then replacing it leaves both in history permanently.

### Custom domain

1. Create a file `CNAME` containing just `blackberrymartin.com`
2. At your registrar: `A` records for `@` → `185.199.108.153`,
   `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; `CNAME` for `www` →
   `YOUR-USERNAME.github.io`
3. **Settings → Pages → Custom domain**, then tick **Enforce HTTPS**

> GHL also offers hosting. You don't need it — GitHub Pages serves the site,
> GHL just receives the form data.

---

## 7. Local preview

```bash
cd ~/Desktop/blackberry-martin
python3 serve.py
```

<http://localhost:8765>

**Use `serve.py`, not `python3 -m http.server`.** The built-in one sends no
cache headers, so Chrome will keep serving you a stale `index.html`,
`style.css` or `config.js` on a normal refresh — you edit a file, reload, and
it looks like nothing changed. `serve.py` is the same server with caching
turned off, so an ordinary refresh always shows the real file and you never
need `Cmd+Shift+R`.

---

## Type

Two faces, deliberately:

| | Face | Used for |
|---|---|---|
| `--display` | **Fraunces** | every heading, the wordmark, the "Email us" button |
| `--body` | **IBM Plex Mono** | body copy, nav, labels, buttons, form fields |

A typewriter-ish mono is the Backseat Lovers move — it reads as a decision,
where a default sans reads as unstyled. Mono also sets wider and heavier than
a sans at the same size, which is why the base size is ~15px rather than ~17px.

Previously there were three faces (Fraunces + Caveat handwriting + DM Sans).
The handwriting is gone — it was the main thing making pages look busy.

**Colour follows the same rule: one per surface.** On the Music page every
line is cream, with hierarchy coming from size and opacity rather than giving
each line its own hue. Ochre is kept for small accents only — focus rings and
field underlines — not for button fills.

## The welcome email

`email/welcome-email.html` is the mailing-list welcome, matching the site.
**It is not part of the website** — it lives here so it's version-controlled
alongside everything else.

To use it: **Marketing → Emails → Templates → New → Code Your Own**, paste the
file, save, then pick that template in the workflow's **Send Email** action.

It's built as nested tables with inline styles rather than the site's CSS,
because email clients strip embedded style blocks, ignore flexbox and grid,
and Outlook renders through Word. The fonts fall back to Georgia and Courier
where Fraunces and IBM Plex Mono can't load, which is most of the time —
Gmail in particular won't load webfonts.

**Before sending it, authenticate a sending domain** (Settings → Email
Services → Domains). Sending from a `gmail.com` address via GHL fails DMARC
and lands in spam.

## Colours

| Token | Hex | Use |
|---|---|---|
| `--cream` | `#f7f2e6` | page background, text on dark |
| `--bone` | `#ece3d0` | panels |
| `--sand` | `#ded2b8` | image placeholders |
| `--ochre` | `#c9952b` | accent, buttons, hover |
| `--moss` / `--moss-deep` | `#6d7a4a` / `#47512f` | marquee, secondary |
| `--clay` | `#a86f45` | handwritten text |
| `--bark` / `--bark-deep` | `#3a2e23` / `#241c15` | body text, footer, hero |
