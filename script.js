/* =====================================================================
   Jack & Emma — Wedding Invitation
   script.js

   1. CONFIG ............ the things you are most likely to edit (start here!)
   2. ADVANCED SETTINGS . geometry for the book page-turn (only touch if you swap the artwork)
   3. Helpers
   4. Navigation ........ switching between pages
   5. Countdown ......... live timer on the Details page
   6. Our Story book .... 3D page turning
   7. RSVP form ......... embedding the Google Form
   8. Welcome petals + start-up
   ===================================================================== */


/* =====================================================================
   1. CONFIG — edit the values below
   ===================================================================== */
const CONFIG = {

  /* Names (used for the browser tab title and screen readers) */
  coupleNames: "Jack & Emma",

  /* Wedding date & time the countdown aims for.
     Format:  YYYY-MM-DDTHH:MM:SS±HH:MM
     The last part is the time-zone offset of the venue, so every guest counts down to the
     same moment wherever they are. Michigan in April is "-04:00" (Eastern Daylight Time). */
  weddingDateTime: "2028-04-28T08:00:00-04:00",

  /* Your Google Form.
     Replace GOOGLE_FORM_EMBED_URL with the link from:
        Google Forms → Send → "<>" (embed) tab → copy the address inside src="..."
     It looks like:  https://docs.google.com/forms/d/e/XXXXXXXX/viewform?embedded=true
     Until you change it, a friendly placeholder is shown on the RSVP page. */
  googleFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSf2nYTwwzcRbBoPpd7tTR7LAwUiXnk8wIbt7jDMBmvX6O53YA/viewform?embedded=true",

  /* Venue (the address is also used to build the Google Maps link on the Location page) */
  venue: {
    name: "Meadow Wood Acres",
    address: "10442 S Cork Rd, Morrice, MI 48857",
    mapsUrl: ""   // leave empty to auto-build a Google Maps link from the address
  },

  /* Where each PNG lives. Change a path here if you rename or move a file. */
  images: {
    home:     "images/1.png",     // PNG 1  — Welcome / Save the Date
    details:  "images/2.png",     // PNG 2  — Details + countdown
    story: [                      // PNG 3–7 — the five chapters of the book, in order
      "images/3.png",             //   Chapter One   — How we met
      "images/4.png",             //   Chapter Two   — Asking her to be my girlfriend
      "images/5.png",             //   Chapter Three — Girlfriend & boyfriend era
      "images/6.png",             //   Chapter Four  — The proposal
      "images/7.png"              //   Chapter Five  — We're getting married
    ],
    schedule: "images/8.png",     // PNG 8  — Schedule
    location: "images/9.png",     // PNG 9  — Location
    rsvp:     "images/10.png"     // PNG 10 — RSVP
  },

  /* Chapter names (read aloud by screen readers when a page is turned) */
  chapterTitles: [
    "Chapter One — How we met",
    "Chapter Two — Asking her to be my girlfriend",
    "Chapter Three — Girlfriend and boyfriend era",
    "Chapter Four — The proposal",
    "Chapter Five — We are getting married"
  ],

  /* Book animation */
  book: {
    flipDuration: 1100,                          // milliseconds for one page turn (smaller = faster)
    easing: "cubic-bezier(0.45, 0.05, 0.25, 1)"  // how the turn speeds up and slows down
  }
};


/* =====================================================================
   2. ADVANCED SETTINGS — measurements taken from your PNGs (1366 x 768)
   Only change these if you replace the artwork with a different design.
   Tip: open the site with ?debug at the end of the address to see these outlines.
   ===================================================================== */
const DESIGN = { width: 1366, height: 768 };

const BOOK_GEOMETRY = {
  spineX: 688,        // x position of the book's centre fold
  top: 148,           // top of the paper
  bottom: 645,        // bottom of the paper
  pageWidth: 542,     // width of one page (the left page is the mirror of the right page)

  /* The paper shape of each page, as [x, y] points. The points hug the paper and stay
     slightly inside it, so the roses and lilies that overlap the book never turn with the page. */
  leftPolygon: [
    [412, 152], [640, 152], [688, 185], [688, 605], [650, 625], [600, 638], [440, 638],
    [430, 620], [405, 595], [350, 570], [300, 540], [270, 515], [225, 508], [205, 520],
    [195, 475], [215, 450], [205, 435], [160, 440], [150, 420], [150, 315], [190, 295],
    [215, 270], [260, 250], [300, 220], [345, 200], [400, 162]
  ],
  rightPolygon: [
    [734, 152], [926, 152], [936, 168], [1046, 172], [1058, 200], [1096, 240], [1161, 252],
    [1166, 295], [1216, 305], [1224, 400], [1191, 430], [1166, 445], [1146, 495], [1116, 515],
    [1111, 570], [1086, 570], [1051, 578], [996, 595], [966, 615], [964, 628], [746, 638],
    [706, 615], [688, 600], [688, 185]
  ]
};


/* =====================================================================
   3. Helpers
   ===================================================================== */
const $  = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const stage = $("#stage");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/* "Stacked mode" = a phone (or any screen) held upright. Instead of tabs, all the pages are
   stacked one under the other and you scroll down. See section 4b. */
const stackedQuery = window.matchMedia("(orientation: portrait)");
const isStacked = () => stackedQuery.matches;

/* Reads a path such as "story.2" or "home" from CONFIG.images */
function imagePath(key) {
  return key.split(".").reduce((obj, k) => obj[k], CONFIG.images);
}

/* Keeps the --u variable (screen pixels per PNG pixel) up to date and flags small screens */
function updateScale() {
  const width = stage.getBoundingClientRect().width;
  document.documentElement.style.setProperty("--u", (width / DESIGN.width).toFixed(4));
  document.body.classList.toggle("is-small", width < 820 || isStacked());
}
new ResizeObserver(updateScale).observe(stage);
updateScale();

/* Debug mode: add ?debug to the address */
const DEBUG = new URLSearchParams(location.search).has("debug");
if (DEBUG) document.body.classList.add("debug");


/* =====================================================================
   4. Navigation — one page at a time, driven by the address (#details, #story…)
   ===================================================================== */
const PAGE_NAMES = ["home", "details", "story", "schedule", "location", "rsvp"];
const pages = $$(".page");
const navLinks = $$("[data-nav]");

function currentRoute() {
  const name = location.hash.replace("#", "");
  return PAGE_NAMES.includes(name) ? name : "home";
}

let currentPage = "home";

function showPage(name) {
  currentPage = name;
  stage.dataset.page = name;
  document.body.dataset.page = name;

  const stacked = isStacked();
  pages.forEach((page) => {
    const active = page.dataset.page === name;
    page.classList.toggle("is-active", active);
    if (!stacked) {                                // (when stacked, every page is on screen)
      page.inert = !active;                        // hidden pages can't be tabbed into
      page.setAttribute("aria-hidden", String(!active));
    }
  });
  if (stacked) scrollToPage(name);

  navLinks.forEach((link) => {
    if (link.dataset.nav === name) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  updateBackdrop();

  document.title = (name === "home" ? "" : capitalize(name === "story" ? "Our Story" : name) + " · ")
                   + CONFIG.coupleNames + " — Wedding Invitation";

  // If the guest gets here before the background loader does, load this page's pictures now
  $$("img[data-image]", $(`.page[data-page="${name}"]`)).forEach((img) => {
    if (!img.getAttribute("src")) img.src = imagePath(img.dataset.image);
  });

  if (name === "rsvp") loadRsvpForm();
}

/* Sets the blurred backdrop (see style.css) to the picture of the page being shown */
function updateBackdrop() {
  const path = currentPage === "story" ? CONFIG.images.story[chapter] : CONFIG.images[currentPage];
  document.documentElement.style.setProperty("--backdrop", `url("${path}")`);
}

function capitalize(text) { return text.charAt(0).toUpperCase() + text.slice(1); }

window.addEventListener("hashchange", () => showPage(currentRoute()));


/* =====================================================================
   4b. Upright screens (phones held upright): scroll instead of tabs
   ---------------------------------------------------------------------
   A wide 16:9 picture can't fill a tall, narrow screen without leaving big empty bars. So when the
   screen is upright we show every page at the full width of the screen, one under the other,
   exactly as designed. Guests simply scroll down to the next page. The navigation tabs painted on
   each picture still work: tapping one scrolls smoothly to that page.
   (Computers and phones held sideways keep the tabbed, one-page-at-a-time view.)
   ===================================================================== */
const navTemplate = $(".site-nav");

function applyLayoutMode() {
  const stacked = isStacked();
  document.body.classList.toggle("is-stacked", stacked);
  document.documentElement.classList.toggle("is-stacked", stacked);
  document.body.classList.toggle("is-small", stage.getBoundingClientRect().width < 820 || stacked);

  // Every page needs its own invisible nav links (the shared set is for the tabbed view)
  $$(".page-nav").forEach((el) => el.remove());
  pages.forEach((page) => {
    page.inert = stacked ? false : page.dataset.page !== currentPage;
    page.setAttribute("aria-hidden", String(!stacked && page.dataset.page !== currentPage));
    if (stacked && page.dataset.page !== "home") {
      const nav = navTemplate.cloneNode(true);
      nav.classList.add("page-nav");
      nav.removeAttribute("data-nav");
      page.appendChild(nav);
    }
  });
}

function scrollToPage(name) {
  const page = $(`.page[data-page="${name}"]`);
  page.scrollIntoView({ behavior: prefersReducedMotion.matches ? "auto" : "smooth", block: "start" });
}

stackedQuery.addEventListener("change", () => {
  applyLayoutMode();
  if (isStacked()) scrollToPage(currentPage);
});


/* =====================================================================
   5. Countdown (Details page)
   ===================================================================== */
const weddingTime = new Date(CONFIG.weddingDateTime).getTime();
const countdownEls = {};
$$(".cd-digit").forEach((el) => (countdownEls[el.dataset.unit] = el));
const countdownBox = $("#countdown");

function tickCountdown() {
  const secondsLeft = Math.max(0, Math.floor((weddingTime - Date.now()) / 1000));
  const values = {
    days:    Math.floor(secondsLeft / 86400),
    hours:   Math.floor((secondsLeft % 86400) / 3600),
    minutes: Math.floor((secondsLeft % 3600) / 60),
    seconds: secondsLeft % 60
  };

  Object.keys(values).forEach((unit) => {
    const text = String(values[unit]).padStart(2, "0");
    const el = countdownEls[unit];
    if (el.textContent !== text) el.textContent = text;
    el.classList.toggle("is-long", text.length > 2);
  });

  countdownBox.setAttribute(
    "aria-label",
    `${values.days} days, ${values.hours} hours, ${values.minutes} minutes and ${values.seconds} seconds until the wedding`
  );
}

if (Number.isNaN(weddingTime)) {
  console.warn("CONFIG.weddingDateTime is not a valid date. Use the format 2028-04-28T08:00:00-04:00");
} else {
  tickCountdown();
  setInterval(tickCountdown, 1000);
}


/* =====================================================================
   6. Our Story — the book
   How the page turn works
   -----------------------
   PNGs 3–7 are full pictures of an open book. To turn a page without distorting them we:
     1. Cut a copy of the image into the paper shape of the left and right page (clip-path).
     2. Turn only that paper-shaped "leaf" in 3D around the book's centre fold (CSS rotateY).
        • Front of the leaf  = right page of the chapter you are leaving.
        • Back of the leaf   = left page of the chapter you are going to.
     3. Underneath, the right page of the NEW chapter is revealed.
     4. Soft shadows fade in and out while the leaf moves.
   When the turn ends we simply show the new full picture, which looks identical.
   The flowers are never part of the leaf, so they stay perfectly still.
   ===================================================================== */
const book = $("#book");
const prevButton = $("#book-prev");
const nextButton = $("#book-next");
const bookStatus = $("#book-status");
const chapterCount = CONFIG.images.story.length;

let chapter = 0;        // which chapter is showing (0 = Chapter One)
let isFlipping = false; // true while a page is turning, so clicks can't overlap

/* The rectangles (in PNG pixels) that the left and right page occupy */
const G = BOOK_GEOMETRY;
const pageHeight = G.bottom - G.top;
const rightBox = { x: G.spineX,              y: G.top, w: G.pageWidth, h: pageHeight };
const leftBox  = { x: G.spineX - G.pageWidth, y: G.top, w: G.pageWidth, h: pageHeight };

/* Build the five full spreads (the pictures you see when nothing is moving) */
const spreads = CONFIG.images.story.map((_, index) => {
  const spread = document.createElement("div");
  spread.className = "book-spread";
  const img = document.createElement("img");
  img.className = "page-img";
  img.dataset.image = "story." + index;
  img.alt = CONFIG.chapterTitles[index] || "Chapter " + (index + 1);
  img.decoding = "async";
  img.draggable = false;
  spread.appendChild(img);
  book.appendChild(spread);
  return spread;
});

function showSpread(index) {
  spreads.forEach((spread, i) => spread.classList.toggle("is-current", i === index));
  if (typeof updateBackdrop === "function" && currentPage === "story") updateBackdrop();
}

/* ----- tiny builders for the temporary page-turn layers ----- */
const pctX = (v) => (v / DESIGN.width) * 100;
const pctY = (v) => (v / DESIGN.height) * 100;

/* An empty box exactly the size of one page */
function makeBox(box, className) {
  const el = document.createElement("div");
  el.className = "book-box " + (className || "");
  el.style.left = pctX(box.x) + "%";
  el.style.top = pctY(box.y) + "%";
  el.style.width = pctX(box.w) + "%";
  el.style.height = pctY(box.h) + "%";
  return el;
}

/* CSS clip-path text for a polygon, relative to a box */
function clipFor(polygon, box) {
  const pts = polygon.map(([x, y]) => `${((x - box.x) / box.w) * 100}% ${((y - box.y) / box.h) * 100}%`);
  return `polygon(${pts.join(", ")})`;
}

/* One side of a page: a copy of a chapter's PNG, positioned so the right part of the picture
   lines up with the box, then clipped to the paper shape. */
function makeFace(src, box, polygon) {
  const face = document.createElement("div");
  face.className = "face";
  face.style.clipPath = clipFor(polygon, box);
  face.style.webkitClipPath = face.style.clipPath;

  const img = new Image();
  img.src = src;
  img.alt = "";
  img.draggable = false;
  img.style.left = (-box.x / box.w) * 100 + "%";
  img.style.top = (-box.y / box.h) * 100 + "%";
  img.style.width = (DESIGN.width / box.w) * 100 + "%";
  img.style.height = (DESIGN.height / box.h) * 100 + "%";
  face.appendChild(img);
  return face;
}

/* A dark fade used for shadows. `towards` is the direction the shadow fades out. */
function makeShadow(className, towards, strength) {
  const el = document.createElement("div");
  el.className = className;
  el.style.background = `linear-gradient(to ${towards}, rgba(35,15,5,${strength}) 0%, rgba(35,15,5,0) 85%)`;
  return el;
}

/* ----- the page turn itself ----- */
async function flipBook(direction) {            // direction: +1 = next, -1 = previous
  const from = chapter;
  const to = chapter + direction;
  if (isFlipping || to < 0 || to >= chapterCount) return;
  isFlipping = true;

  const goingNext = direction > 0;
  const startBox = goingNext ? rightBox : leftBox;   // where the leaf starts
  const landBox  = goingNext ? leftBox  : rightBox;  // where it lands
  const startPoly = goingNext ? G.rightPolygon : G.leftPolygon;
  const landPoly  = goingNext ? G.leftPolygon  : G.rightPolygon;
  // Shadows are darkest next to the centre fold and fade out towards the outer edge.
  const fadeOnStartPage = goingNext ? "right" : "left";   // fold is on the left of the right page (and vice versa)
  const fadeOnLandPage  = goingNext ? "left"  : "right";
  const src = (i) => CONFIG.images.story[i];

  // Layer 1: the page that is being uncovered (new chapter, same side as the leaf started)
  const reveal = makeBox(startBox);
  reveal.appendChild(makeFace(src(to), startBox, startPoly));
  const revealShadow = makeShadow("cast", fadeOnStartPage, 0.55);
  revealShadow.style.clipPath = clipFor(startPoly, startBox);
  reveal.appendChild(revealShadow);

  // Layer 2: shadow the leaf throws on the page where it will land
  const landing = makeBox(landBox);
  const landShadow = makeShadow("cast", fadeOnLandPage, 0.55);
  landShadow.style.clipPath = clipFor(landPoly, landBox);
  landing.appendChild(landShadow);

  // Layer 3: the turning leaf
  const leaf = makeBox(startBox, "leaf");
  leaf.style.transformOrigin = goingNext ? "0% 50%" : "100% 50%";   // hinge = the centre fold
  const front = makeFace(src(from), startBox, startPoly);
  const back  = makeFace(src(to),   landBox,  landPoly);
  back.classList.add("face-back");
  const frontShade = makeShadow("shade", fadeOnStartPage, 0.5);
  const backShade  = makeShadow("shade", fadeOnLandPage, 0.5);
  frontShade.style.clipPath = clipFor(startPoly, startBox);
  backShade.style.clipPath = clipFor(landPoly, landBox);
  front.appendChild(frontShade);
  back.appendChild(backShade);
  leaf.append(front, back);

  book.append(reveal, landing, leaf);

  // Wait until the pictures are decoded so the turn never starts with a blank page
  const pictures = $$("img", leaf).concat($$("img", reveal));
  await Promise.all(pictures.map((img) => img.decode().catch(() => {})));

  if (!prefersReducedMotion.matches) {
    const timing = { duration: CONFIG.book.flipDuration, easing: CONFIG.book.easing, fill: "both" };
    const turn = goingNext ? -180 : 180;
    const animations = [
      leaf.animate([{ transform: "rotateY(0deg)" }, { transform: `rotateY(${turn}deg)` }], timing),
      // The leaf darkens as it stands up, then brightens as it lies down on the other side
      frontShade.animate([{ opacity: 0 }, { opacity: 0.8, offset: 0.5 }, { opacity: 0.8 }], timing),
      backShade.animate([{ opacity: 0.8 }, { opacity: 0.8, offset: 0.5 }, { opacity: 0.2, offset: 0.8 }, { opacity: 0 }], timing),
      // Shadow on the page being uncovered: grows, then fades as the leaf leaves
      revealShadow.animate([{ opacity: 0 }, { opacity: 0.9, offset: 0.25 }, { opacity: 0.4, offset: 0.6 }, { opacity: 0 }], timing),
      // Shadow on the page the leaf lands on: appears near the end
      landShadow.animate([{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 0.85, offset: 0.82 }, { opacity: 0 }], timing)
    ];
    await Promise.all(animations.map((a) => a.finished.catch(() => {})));
  }

  // Finish: show the new full picture, then remove the temporary layers
  chapter = to;
  showSpread(chapter);
  reveal.remove();
  landing.remove();
  leaf.remove();
  isFlipping = false;
  updateArrows();
  bookStatus.textContent = CONFIG.chapterTitles[chapter] || "Chapter " + (chapter + 1);
}

function updateArrows() {
  prevButton.disabled = chapter === 0;
  nextButton.disabled = chapter === chapterCount - 1;
}

prevButton.addEventListener("click", () => flipBook(-1));
nextButton.addEventListener("click", () => flipBook(+1));

/* Keyboard: ← and → turn the pages while the book is on screen */
window.addEventListener("keydown", (event) => {
  if (stage.dataset.page !== "story" || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === "ArrowRight") { event.preventDefault(); flipBook(+1); }
  if (event.key === "ArrowLeft")  { event.preventDefault(); flipBook(-1); }
});

/* Touch: swipe left to go forward, right to go back */
let touchStart = null;
book.addEventListener("pointerdown", (e) => { touchStart = { x: e.clientX, y: e.clientY }; });
book.addEventListener("pointerup", (e) => {
  if (!touchStart) return;
  const dx = e.clientX - touchStart.x;
  const dy = e.clientY - touchStart.y;
  touchStart = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) flipBook(dx < 0 ? +1 : -1);
});
book.addEventListener("pointercancel", () => { touchStart = null; });

showSpread(chapter);
updateArrows();

/* Debug: draw the page shapes so you can check them against the artwork */
if (DEBUG) {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${DESIGN.width} ${DESIGN.height}`);
  svg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5";
  [[G.leftPolygon, "#00e5ff"], [G.rightPolygon, "#7CFC00"]].forEach(([poly, colour]) => {
    const p = document.createElementNS(svgNS, "polygon");
    p.setAttribute("points", poly.map((pt) => pt.join(",")).join(" "));
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", colour);
    p.setAttribute("stroke-width", "2");
    svg.appendChild(p);
  });
  book.appendChild(svg);
}


/* =====================================================================
   7. RSVP form (Google Forms)
   ===================================================================== */
const rsvpIframe = $("#rsvp-iframe");
const rsvpPlaceholder = $("#rsvp-placeholder");
const modal = $("#rsvp-modal");
const modalIframe = $("#rsvp-modal-iframe");
const modalPlaceholder = $("#rsvp-modal-placeholder");

/* True once you have replaced the placeholder with a real link */
function formIsConfigured() {
  const url = (CONFIG.googleFormUrl || "").trim();
  return url !== "" && url !== "GOOGLE_FORM_EMBED_URL";
}

/* Google needs "embedded=true" for forms inside a page. We add it for you if it's missing. */
function embedUrl() {
  const raw = CONFIG.googleFormUrl.trim();
  try {
    const url = new URL(raw);
    if (url.hostname.includes("google.com") && !url.searchParams.has("embedded")) {
      url.searchParams.set("embedded", "true");
    }
    return url.toString();
  } catch (error) {
    return raw;
  }
}

/* Loads the form into the card (only once, and only when the RSVP page is opened) */
function loadRsvpForm() {
  if (formIsConfigured()) {
    // On small screens the card is too small, so the form is opened full-screen instead
    if (!document.body.classList.contains("is-small") && !rsvpIframe.src) {
      rsvpIframe.src = embedUrl();
    }
    rsvpIframe.hidden = false;
    rsvpPlaceholder.hidden = true;
  } else {
    rsvpIframe.hidden = true;
    rsvpPlaceholder.hidden = false;
  }
}

function openRsvpModal() {
  if (formIsConfigured()) {
    if (!modalIframe.src || modalIframe.src === location.href) modalIframe.src = embedUrl();
    modalIframe.hidden = false;
    modalPlaceholder.hidden = true;
  } else {
    modalIframe.hidden = true;
    modalPlaceholder.hidden = false;
  }
  modal.hidden = false;
  $("#rsvp-close").focus();
}

function closeRsvpModal() {
  modal.hidden = true;
  $("#rsvp-open").focus();
}

$("#rsvp-open").addEventListener("click", openRsvpModal);
$("#rsvp-close").addEventListener("click", closeRsvpModal);
window.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeRsvpModal(); });

/* If the window is resized from small to large (e.g. a tablet is rotated), load the in-card form */
new ResizeObserver(() => { if (stage.dataset.page === "rsvp") loadRsvpForm(); }).observe(stage);

/* Location page: Google Maps link */
$("#map-link").href = CONFIG.venue.mapsUrl ||
  "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(CONFIG.venue.name + ", " + CONFIG.venue.address);


/* =====================================================================
   8. Welcome petals + start-up
   ===================================================================== */

/* A handful of rose petals drifting down the welcome page (purely decorative) */
(function makePetals() {
  const holder = $("#petals");
  for (let i = 0; i < 14; i++) {
    const petal = document.createElement("span");
    petal.className = "petal";
    petal.style.left = Math.random() * 100 + "%";
    petal.style.setProperty("--s", (14 + Math.random() * 14).toFixed(1));
    petal.style.setProperty("--t", (9 + Math.random() * 8).toFixed(1) + "s");
    petal.style.setProperty("--d", (-Math.random() * 14).toFixed(1) + "s");
    petal.style.setProperty("--drift", (Math.random() * 160 - 80).toFixed(0) + "px");
    holder.appendChild(petal);
  }
})();

/* Marks each page picture as "loaded" (lets the welcome animation wait for its picture) */
document.addEventListener("load", (event) => {
  if (event.target.classList && event.target.classList.contains("page-img")) {
    event.target.classList.add("is-loaded");
  }
}, true);

/* Load the pictures one after another (current page first) so the site opens quickly
   instead of downloading all ten large PNGs at once. */
async function loadImages() {
  const all = $$("img[data-image]");
  const first = $$(".page.is-active img[data-image]");
  const queue = first.concat(all.filter((img) => !first.includes(img)));
  for (const img of queue) {
    if (!img.getAttribute("src")) img.src = imagePath(img.dataset.image);
    await img.decode().catch(() => {});
  }
}

applyLayoutMode();
showPage(currentRoute());
loadImages();
