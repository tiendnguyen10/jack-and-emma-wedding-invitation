# Jack & Emma — Interactive Wedding Invitation

Your ten PNG designs, turned into a working website. Plain HTML, CSS and JavaScript — no libraries,
no build step.

```
jack-and-emma-wedding-invitation/
├── index.html      ← structure: one <section> per page + the invisible clickable areas
├── style.css       ← layout, scaling, animations, the 3D book
├── script.js       ← CONFIG at the top, then navigation, countdown, book, RSVP form
└── images/
    ├── 1.png       Welcome / Save the Date
    ├── 2.png       Details + countdown
    ├── 3.png       Chapter One   — How we met        ┐
    ├── 4.png       Chapter Two   — Asking her…       │ the interactive
    ├── 5.png       Chapter Three — Girlfriend era    │ book (Our Story)
    ├── 6.png       Chapter Four  — The proposal      │
    ├── 7.png       Chapter Five  — We're getting married ┘
    ├── 8.png       Schedule
    ├── 9.png       Location
    └── 10.png      RSVP
```

## Run it on your computer

**Easiest:** double-click `index.html`. (The RSVP form needs an internet connection.)

**Recommended** (behaves exactly like the real website):

```bash
cd jack-and-emma-wedding-invitation
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Put it online (free)

Upload this whole folder — `index.html` must be at the top level of what you upload.

* **Netlify Drop** — go to <https://app.netlify.com/drop> and drag the folder onto the page. You get a link in seconds.
* **GitHub Pages** (used for this repo) — *Settings → Pages → Deploy from a branch → `main` → `/ (root)`*.
* **Vercel / Cloudflare Pages** — import the folder or repository; no settings needed.

**Sharper pictures:** the PNGs are 1366 × 768, so on large or high-density screens they are enlarged and look
soft. Re-export your designs at **2732 × 1536 or 3840 × 2160** (same 16:9 shape — in Canva/Figma export at
2× or 3×), keep the same file names, and drop them into `images/`. No code changes are needed because all
positions are percentages. At that size use WebP or JPEG (see below) to keep the files small.

**Faster loading:** each PNG is 1–2 MB. For a snappier site, convert them to WebP at <https://squoosh.app>
(quality ~85), save them in `images/`, and change the file names in `CONFIG.images` in `script.js`.

## Customise it yourself

Everything you are likely to change is in the `CONFIG` block at the very top of `script.js`.

| I want to change… | Edit this in `CONFIG` |
|---|---|
| Wedding date / time | `weddingDateTime` — format `2028-04-28T08:00:00-04:00` (the last part is the venue's time zone; Michigan in April is `-04:00`) |
| Names (tab title) | `coupleNames` |
| **Google Form** | `googleFormUrl` (see below) |
| Venue name / address | `venue.name`, `venue.address` (the Location page's Google Maps link is built from these; use `venue.mapsUrl` for a custom link) |
| Image file names | `images.home`, `images.details`, `images.story` (a list of 5), … |
| Page-turn speed | `book.flipDuration` in milliseconds (1100 = about one second; try 700 for quicker, 1600 for slower) |

> **Note:** your PNGs contain the date, venue and schedule as *pictures*. Changing `CONFIG` updates the
> countdown, the map link and the form — but to change the words painted in the artwork, edit the PNGs.

### Add your Google Form

1. In Google Forms open your form → **Send** → the **`< >`** (embed HTML) tab.
2. Copy only the address inside `src="…"`, e.g. `https://docs.google.com/forms/d/e/1FAIpQLS…/viewform?embedded=true`.
3. In `script.js` replace `GOOGLE_FORM_EMBED_URL` with that address.
4. Make sure the form accepts responses and is not restricted to your organisation
   (*Settings → Responses → turn off "Restrict to users in…"*, and do not require sign-in, or guests will be asked to log in).

Until then the RSVP card shows a friendly "form will appear here" message.
You can also paste the normal share link — `embedded=true` is added automatically.

On **phones and small windows** the card is too small to fill in a form comfortably, so the card shows an
**Open RSVP form** button that opens the same form full-screen without leaving the website.

## How the clickable areas ("hotspots") work

Your designs are flat pictures, so the buttons you see (nav bar, RSVP button, book arrows) are only
paintings. We lay **invisible links and buttons** exactly on top of them.

Each hotspot in `index.html` has four numbers, measured on your original **1366 × 768** PNG:

```html
<a class="hotspot" href="#story" style="--x:680; --y:16; --w:122; --h:64"></a>
```

* `--x` / `--y` — distance from the left / top edge of the picture
* `--w` / `--h` — width / height

CSS turns them into percentages (`--x ÷ 1366 × 100%`), so the hotspot grows and shrinks together with the
picture and stays aligned on phones, tablets and big monitors. The picture is always shown at its true
proportions (never stretched or cropped); if the window has a different shape you simply see burgundy bars.

**To check or adjust alignment, add `?debug` to the address** (e.g. `http://localhost:8000/?debug#story`).
Every hotspot is outlined in red, and the book's page shapes are outlined in blue and green.
If you ever make a new design, measure the button on the picture and type its numbers in.

The navigation is painted into PNGs 2–10 (with the active tab already highlighted in soft blue), so there
is one shared set of invisible nav links that sits on top of every page. The **J + E** logo goes to the
welcome page. (The PNGs spell the tab "Scedule" — that is in the artwork, so it is unchanged.)

## How the pieces work

**Computers and sideways phones: clickable tabs** — one page is shown at a time. Click a tab in the
navigation bar and the next page fades in.

**Upright phones (and any screen taller than it is wide): scroll down** — a wide picture can't fill a tall
screen without big empty bars, so on those screens all the pages are placed one under the other at full
width, exactly as you designed them (`script.js` section 4b). Swipe up to reach the next page. The tabs painted
on each page still work: tapping one scrolls smoothly to that page. Nothing is zoomed, cropped or restyled.
The pictures are small on a phone, so guests can pinch to zoom, and the RSVP card offers an
**Open RSVP form** button that opens your Google Form full-screen.

**Countdown** — `script.js` section 5. Every second it measures the time left until `weddingDateTime`
and writes the numbers over the painted "00" boxes. A small patch the same colour as the box hides the
painted zeros. (Days show three digits while the wedding is more than 99 days away.)

**Page transitions** — only one page is visible at a time; the others fade out and are made unreachable
for keyboards and screen readers. The address (`#details`, `#story`…) always matches the page, so the
browser's back button and shared links work.

**The book** — section 6 of `script.js`. PNGs 3–7 are full pictures of an open book, so we never slide or
fade them. Instead, to turn a page:

1. We cut a copy of the picture into the **paper shape** of the left or right page (CSS `clip-path`).
   The shapes avoid the roses and lilies, so the flowers never move.
2. That paper-shaped "leaf" is rotated in 3D around the book's centre fold (`rotateY`, with perspective).
   Its **front** is the page you are leaving; its **back** is the left page of the next chapter.
3. Underneath, the next chapter's right page is uncovered.
4. Soft shadows fade in and out on the leaf and on the pages beneath it.
5. When the turn ends the full new picture is shown, which looks identical — no jump.

Going back is the same movement in the opposite direction. Clicks are ignored while a page is turning,
the back arrow is disabled (and dimmed) on Chapter One, and the next arrow on Chapter Five.
You can also use the **← / → keys** or **swipe** left/right on a touchscreen.
If a visitor's device is set to "reduce motion", pages change without the animation.

## Troubleshooting

* **A hotspot is slightly off** → open with `?debug` and nudge its `--x/--y/--w/--h` numbers.
* **Flowers flip with the page / paper edge looks cut** → adjust the `leftPolygon` / `rightPolygon` points in
  `BOOK_GEOMETRY` (`script.js`, section 2). Use `?debug` to see them drawn over the book.
* **The RSVP card is empty** → the placeholder text means `googleFormUrl` is still `GOOGLE_FORM_EMBED_URL`.
* **The form asks guests to sign in** → in Google Forms turn off the sign-in / "restrict to" settings.
* **Countdown shows zeros** → the date in `weddingDateTime` is in the past or not in the exact format above.
