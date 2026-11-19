"use strict";

const cfg = window.SITE_CONFIG;
const products = window.PRODUCTS;
const $ = (query, root = document) => root.querySelector(query);
const $$ = (query, root = document) => [...root.querySelectorAll(query)];
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const params = new URLSearchParams(location.search);
const categories = products.map((p) => p.category);
const rooms = ["Living Room", "Dining Room"];
const swatches = ["#b58849", "#32495b", "#e2d5ba", "#9e5d42"];
const shopUrl = (value) => "?shop=" + encodeURIComponent(value);
const itemUrl = (p) => "?product=" + p.id;
const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
const pos = (p) => products.indexOf(p);
const img = (src, alt, cls = "") =>
  `<img loading="lazy" decoding="async" class="${cls}" src="img/${src}.webp" alt="${esc(alt)}">`;
const editorialControls = {
 arrow:"M2.5 12L18 11.4 21 12l-3 .6-15.5-.6Zm12-6 6.5 6-6.5 6",
 next:"m8 4 9 8-9 8m2-12 4 4-4 4",
 prev:"m16 4-9 8 9 8m-2-12-4 4 4 4",
 plus:"M3 12h18M12 3v18m-8-9 2-1m6-7 1 2",
 minus:"M3 12h18m-17 0 2-1",
 close:"m5 4 14 16m-14 0L19 4m-3 2 2-1",
 search:"M16.2 15.7 21 20.5l-1.2 1-4.7-5M17 10A7 7 0 1 1 3 10a7 7 0 0 1 14 0Zm-11-1a4.8 4.8 0 0 1 4-3.5",
 menu:"M3 6h18M6 12h15M3 18h18m-16-13 3 2m0 4 3 2m-6 4 3 2",
 bag:"M5 8h14l1 13H4L5 8Zm3 1V6a4 4 0 0 1 8 0v3m-9 3 2 2 2-2 2 2 2-2 2 2m-10 2 2 2 2-2 2 2 2-2 2 2",
};

const icon = (name) =>
  `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"><path d="${editorialControls[name] || { bag: "M5 7h14l1 14H4L5 7Zm3 1V6a4 4 0 0 1 8 0v2", menu: "M3 7h18M7 12h14M3 17h18", search: "M16.5 16.5 21 21M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0", close: "m5 5 14 14m0-14L5 19", next: "m9 5 7 7-7 7", prev: "m15 5-7 7 7 7", arrow: "M4 12h15m-6-6 6 6-6 6", plus: "M5 12h14M12 5v14", minus: "M5 12h14", leaf: "M20 3C9 2 1 7 6 16s16-2 14-13ZM4 21 16 8", weave: "m3 8 9-5 9 5-9 5-9-5Zm0 4 9 5 9-5M3 16l9 5 9-5", mail: "M2 5h20v14H2zM3 6l9 7 9-7", ruler: "m3 15 12-12 6 6L9 21Zm9-9 3 3m-6 0 2 2m-5 1 3 3" }[name]}"/></svg>`;
const brand = () =>
  `<a class="brand" href="index.html"><img src="${esc(cfg.logo)}" alt=""><span>${esc(cfg.name)}</span></a>`;
const nav = Object.entries(cfg.links)
  .map(([label, url]) => `<a href="${esc(url)}">${esc(label)}</a>`)
  .join("");
const textLink = (url, label) =>
  `<a class="textlink" href="${url}">${label} ${icon("arrow")}</a>`;
const button = (url, label) =>
  `<a class="button" href="${url}">${label} ${icon("arrow")}</a>`;
const categoryLinks = [...categories, ...rooms]
  .map((x) => `<a href="${shopUrl(x)}">${x}</a>`)
  .join("");
const pages = {
  care: "Materials & Care",
  shipping: "Shipping & Returns",
  privacy: "Privacy Policy",
  terms: "Terms & Conditions",
};
const pageLinks = Object.entries(pages)
  .map(([key, label]) => `<a href="?page=${key}">${label}</a>`)
  .join("");
const key = "twill-cart-v1";
function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
function readCart() {
  const stored = read(key, {});
  return Object.fromEntries(
    products
      .map((p) => [p.id, stored?.[p.id]])
      .filter(([, n]) => Number.isInteger(n) && n > 0 && n <= 99),
  );
}
let cart = readCart();
function updateBag() {
  $(".cartcount").textContent = Object.values(cart).reduce((a, b) => a + b, 0);
}
function changeQty(id, delta) {
  cart = readCart();
  const qty = Math.max(0, Math.min(99, (cart[id] || 0) + delta));
  if (qty) cart[id] = qty;
  else delete cart[id];
  save(key, cart);
  updateBag();
}
const headerNav = Object.entries(cfg.links).map(([label, url])=>{
    const links = label==="Collections"?categoryLinks:label==="Guides"?pageLinks:"";
    if(!links) return `<a href="${esc(url)}">${esc(label)}</a>`;
    return `<details class="navgroup"><summary>${esc(label)}</summary><div><a href="${esc(url)}">${label==="Collections"?"Shop all":"Materials & care guide"}</a>${links}</div></details>`;
}).join("");
$("#header").innerHTML =
  `<div class="wrap head">${brand()}<nav aria-label="Main navigation">${headerNav}</nav><div class="actions"><button data-action="search" aria-label="Search site">${icon("search")}</button><i></i><button data-action="bag" class="baglink" aria-label="Open shopping bag">${icon("bag")} <span class="baglabel">Your bag</span> <span class="cartcount">0</span></button><button class="burger" data-action="menu" aria-label="Open menu">${icon("menu")}</button></div></div>`;
updateBag();
$('link[rel="icon"]').href = cfg.favicon;
$("#footer").innerHTML =
  `<div class="wrap"><div class="footgrid"><div>${brand()}<p>${esc(cfg.footer)}</p><a href="mailto:${esc(cfg.email)}">${esc(cfg.email)}</a>${cfg.address ? `<p>${esc(cfg.address)}</p>` : ""}</div><div><h3>Collections</h3>${categoryLinks}</div><div><h3>Studio</h3>${nav}<a href="index.html#reviews">Reviews</a></div><div><h3>Information</h3>${pageLinks}</div></div><div class="footgallery">${products.map((p,i)=>`<a href="${itemUrl(p)}">${img("p"+i,p.name)}</a>`).join("")}</div><div class="fine"><span>© ${new Date().getFullYear()} ${esc(cfg.company)}</span><span>${esc(cfg.disclaimer)}</span></div></div>`;
const notice = $("#notice");
if (!read("twill-privacy", false)) {
  notice.hidden = false;
  notice.innerHTML = `<span>Bag saved on this device. <a href="?page=privacy">Privacy</a></span><button data-action="accept">Got it</button>`;
}
const slides = [
  {
    photo: "atelier-wide",
    title: "A softer",
    italic: "Modern Homes",
    caption: "The living room",
    note: "Wool, linen and a little warmth.",
    link: "Living Room",
    tag: "The textile collection",
  },
  {
    photo: "dining",
    title: "Gather",
    italic: "Shared Tables",
    caption: "The dining room",
    note: "A table set in linen and clay.",
    link: "Dining Room",
    tag: "The dining collection",
  },
  {
    photo: "wool",
    title: "Wrapped",
    italic: "Quiet Corners",
    caption: "The wool edit",
    note: "Rich texture for a quiet corner.",
    link: "Throws & Blankets",
    tag: "The wool collection",
  },
];
const descriptions = [
  "Pattern, piping and a change of mood.",
  "Soft layers for slow evenings.",
  "An easy drape for the everyday table.",
  "A line of colour from end to end.",
];
const productCard = (p, pairing = false) =>
  `<a class="productcard" href="${itemUrl(p)}"><div class="pack">${img("p" + pos(p), p.name)}<span class="view">View piece</span></div><div class="productmeta"><small>${pairing === true ? "Pairs with · " : ""}${p.category}</small><span>${money(p.price)}</span></div><h3>${p.name}</h3><p><i class="dot" style="--dot:${swatches[pos(p)]}"></i>${p.color} · ${p.size}</p></a>`;
const bread = (title) =>
  `<div class="crumb"><a href="index.html">Home</a><span>/</span>${title}</div>`;
const controls = (type) =>
  `<div class="controls"><button data-step="-1" data-slider="${type}" aria-label="Previous slide">${icon("prev")}</button><button data-step="1" data-slider="${type}" aria-label="Next slide">${icon("next")}</button></div>`;
const formMarkup = () =>
  `<section id="contact" class="block contact"><div class="wrap"><div class="contactintro"><h2>${esc(cfg.collaboration.title)}</h2><p>${esc(cfg.collaboration.text)}</p></div><div class="contact-workbench"><form id="enquiry" action="${esc(cfg.form.endpoint)}" method="post"><div id="orderSummary"></div><div class="formrow"><label>Your name<input name="name" required maxlength="100" autocomplete="name"></label><label>Email address<input type="email" name="email" required maxlength="254" autocomplete="email"></label><label>Enquiry type<select name="subject">${cfg.form.subjects.map((s) => `<option>${esc(s)}</option>`).join("")}</select></label></div><label>Message<textarea name="message" rows="3" maxlength="4000" required></textarea></label><label class="trap" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><div class="sendrow"><label class="consent"><input name="consent" type="checkbox" required> I have read the <a href="?page=privacy" target="_blank" rel="noopener">Privacy Policy</a>.</label><button class="button">Send request ${icon("mail")}</button></div><p role="status" id="formStatus"></p></form><div class="cube-stage" aria-label="Textiles in the studio"><div class="cloth-cube">${["story0","story1","story2","editorial6"].map((n,i)=>`<figure style="--face:${i}">${img(n,["Thread wall","Weaver at work","Wooden shuttles","Layered bedding"][i])}</figure>`).join("")}</div></div></div></div></section>`;
const notes = [
  ["The woven edge", "Look closely at a hem", "A narrow folded hem gives table linen a little weight. Let it hang freely to see the shape of the cloth.", "care"],
  ["The right drop", "Set a table that fits", "Measure the length and width of the tabletop. Subtract each from the cloth measurement, then halve the difference for the drop on each side.", "shipping"],
  ["Keep wool soft", "Fold between seasons", "Air a wool throw before storing it. Fold loosely and keep the fringe flat so the ends are ready for the next cool evening.", "care"]
];
const markIcon = n => img("obj"+[5,1,3,7][n],"","stitchicon");
function heading(label,title,aside=""){
  return `<div class="spreadhead"><div><p class="label">${label}</p><h2>${title}</h2></div>${aside}</div>`;
}
function medallion(){
  return `<a class="medallion" href="#room-edits" aria-label="Explore styled rooms"><svg viewBox="0 0 120 120" aria-hidden="true"><defs><path id="rim" d="M60 60m-45 0a45 45 0 1 1 90 0a45 45 0 1 1-90 0"/></defs><circle cx="60" cy="60" r="58"/><circle cx="60" cy="60" r="29"/><text><textPath href="#rim" textLength="279">STYLED ROOMS · STYLED ROOMS · </textPath></text></svg><span>${icon("arrow")}</span></a>`;
}
function heroIntro(){
  return `<section class="cover wrap hero-v2" aria-label="Home textile collections">
  <div class="coverlines"><div class="coverline"><h1>Textiles for Everyday Living</h1><p>Linen for the table, wool for the sofa and woven cushions in colours that feel at home together.</p></div>
  <div class="coverline second"><a class="samples" href="?page=care"><span class="samplepics">${[0,1,2].map(i=>img("c"+i,"")).join("")}</span><span>Explore our<br>fabric library</span></a><div class="coverword">For <strong id="coverWord">Modern Homes</strong></div>${button("#catalog","Shop the edit")}</div></div>
  <div class="coverstage"><div class="coverphoto"><img id="coverImage" src="img/atelier-wide.webp" fetchpriority="high" alt="Light-filled loft with an ivory linen sofa and an indigo wool throw"></div>${medallion()}
  <div class="coverswitch">${controls("hero")}<span id="slideNum"></span></div>
  <div class="insetrail"><div class="railtrack">${[0,1].map(copy=>products.map((p,i)=>`<a href="${shopUrl(p.category)}" ${copy?'tabindex="-1" aria-hidden="true"':''}>${markIcon(i)}${p.category}</a>`).join("")).join("")}</div></div></div></section>`;
}
function studioStory(){
  return `<section id="about" class="wrap chapter about-layout"><div class="collage"><div class="collage-main">${img("weaver","An artisan working with cloth in the studio")}</div><span class="spine">The atelier</span><div class="collage-count"><strong data-count="4">4</strong><span>Textile collections</span></div><div class="collage-inset">${img("poster","Spools of thread on the workbench")}</div></div><div class="aboutcopy"><span class="round-skein">${img("obj2","")}</span>${heading("About us","A Room Begins<br>With Its Textiles")}<p>Our collection brings colour, texture and comfort to everyday spaces. Start with a favourite shade, then layer a different weave alongside it.</p><div class="storytiles"><div class="tilelist"><div>${icon("weave")}<div><h3>Our palette</h3><p>Indigo, clay, ivory and ochre, in tones you can mix.</p></div></div><div>${icon("leaf")}<div><h3>Our materials</h3><p>Wool, cotton and flax, with the fibre and finish listed for each piece.</p></div></div></div><a href="?page=care" class="piclink">${img("studio","Linen warp and shuttle on a loom")}<span>Materials & care ${icon("arrow")}</span></a></div></div></section>`;
}
function collectionsSection(){
 return `<section id="catalog" class="band"><div class="wrap chapter">${heading("What we offer","Soft Layers for<br>Every Room",`<div class="headnote"><p>Choose a textile by the way you live. Check its weave, shade and measurements before adding it to your bag.</p>${button("?shop=all","View all textiles")}</div>`)}<div id="featured" class="offergrid"></div><div class="endcontrols">${controls("featured")}</div></div></section>`;
}
const facts=[["4","Textile collections"],["2","Rooms to style"],["4","Signature shades"],["50","cm cushion width"],["170","cm throw length"],["180","cm runner length"]];
function factBand(){
 return `<section class="photoband facts wrap" aria-label="Collection at a glance"><div class="factgrid">${facts.map(([n,t])=>`<div><strong data-count="${n}">${n}</strong><h3>${t}</h3></div>`).join("")}</div></section>`;
}
const edits=[["Sunlit Sitting Room","Living Room","Living Room"],["The Window Seat","Living Room","Throws & Blankets"],["The Limestone Table","Dining Room","Tablecloths"],["The Walnut Alcove","Dining Room","Table Runners"],["The Garden Room","Living Room","Cushion Covers"]];
function roomGallery(){
 return `<section class="chapter wrap" id="room-edits">${heading("Explore our room edits","Five Ways to<br>Dress a Room",`<div class="headnote"><p>See how a single woven layer changes the balance of a room.</p>${button("?shop=all","Browse pieces")}</div>`)}<div class="gallerygrid">${edits.map(([t,m,c],i)=>`<a class="gallerycard" href="${shopUrl(c)}"><div class="gallerypic"><div class="flip-frame"><div class="flip-front">${img("edit"+i,t)}</div><div class="flip-back">${img("story"+(i+3),"Textile detail for "+t)}</div></div><i>${icon("arrow")}</i></div><div class="gallerycap"><small>${m} <b>${icon("arrow")}</b> Textile styling</small><h3>${t}</h3></div></a>`).join("")}</div></section>`;
}
function processSection(){
 const steps=[["ruler","Measure your space","Check your insert, seat or tabletop against the listed dimensions."],["weave","Select your cloth","Build a palette with contrasting weaves and a shade in common."],["bag","Request your pieces","Send your bag to the studio for availability and delivery details."]];
 return `<section class="chapter photoband process wrap"><p class="label">How to order</p><h2>From Swatch to Home</h2><div class="three">${steps.map(([k,t,d],i)=>`<div class="step"><span class="ghostnum">0${i+1}</span><i>${icon(k)}</i><h3>${t}</h3><p>${d}</p></div>`).join("")}</div></section>`;
}
function photoCube(names, label){
 const faces = names.map((name,i) => `<figure style="--face:${i}">${img(name,label)}</figure>`).join("");
 return `<div class="cube-stage"><div class="cloth-cube">${faces}</div></div>`;
}
function reasons(){
 const reasons=[["ruler","Clear measurements","Exact sizes for cushions, throws and table linen."],["leaf","Fabric composition","Know the fibres in each piece before ordering."],["weave","Coordinated colour","Four shades to layer across the collection."],["mail","Studio support","Ask about fit, care or delivery in one place."]];
 return `<section class="chapter wrap why"><div class="whyphoto">${photoCube(["edit5","look0","edit5","look0"],"Soft furnishings in a finished room")}<div class="quotein"><span>“</span><p>Start with a cloth you love. Let its colour guide the rest of the room.</p><strong>From the studio</strong></div></div><div>${heading("Why choose our textiles","Consider Every Detail")}<div class="reasonlist">${reasons.map(([k,t,d],i)=>`<div tabindex="0" style="--fabric:url('img/cloth${3*i+1}.webp')"><i>${img("obj"+[6,1,5,8][i],"")}</i><h3>${t}</h3><p>${d}</p></div>`).join("")}</div></div></section>`;
}
function materialTeam(){
 return `<section class="band"><div class="wrap chapter">${heading("Meet the materials","The Fabric Library",textLink("?page=care","Read the care guide"))}<div class="categorygrid fabric-team">${products.map((p,i)=>`<a class="category" data-index="${i}" href="${itemUrl(p)}">${img("cloth"+(3*i),p.composition+" weave")}<div><h3>${p.material}</h3><p>${p.name}</p></div></a>`).join("")}</div></div></section>`;
}
function invitation(){
 return `<section class="chapter wrap invitation"><div class="invbg"></div><div class="tiltcard left">${img("c1","Fringed indigo wool")}</div><div class="tiltcard right">${img("c3","Rust-striped table linen")}</div><div class="invmain"><p class="label">Styling studio</p><h2>Find Your Fabric Pairing</h2><p>Try the same chair in three fabrics, then explore a finished textile in its room.</p>${button("#fabric-study","Try the swatches")} ${textLink("#contact","Talk to the studio")}</div><div class="invitefeet"><a href="?shop=Living%20Room">${img("b0","Living room sofa")}<span>Dress the living room</span>${icon("arrow")}</a><a href="?shop=Dining%20Room">${img("b3","Dining room table")}<span>Set the dining table</span>${icon("arrow")}</a></div></section>`;
}
function reviewSection(){
 return `<section id="reviews" class="chapter wrap reviews"><p class="label">Customer reviews</p><h2>Notes From Home</h2><div class="reviewplate"><span class="review-object left">${img("obj5","")}</span><span class="review-object right">${img("obj8","")}</span>${cfg.reviews.length?cfg.reviews.map(r=>`<blockquote>${esc(r.text)}<cite>${esc(r.name)}</cite></blockquote>`).join(""):'<p>How does your textile feel in your room? We welcome notes on the weave, the colour in daylight and the way it wears.</p>'}${textLink("#contact","Share a review")}</div>${notesPair()}</section>`;
}
function faqSection(){
 return `<section class="chapter wrap faq"><div class="faqpic">${img("hero","A textile-lined living room")}<a href="#contact">Ask the studio ${icon("mail")}</a></div><div>${heading("Our FAQs","Questions About<br>Your Textiles")}${accordion("Does the cushion cover include a pad?","The Saffron Jacquard listing is for a 50 × 50 cm cover. The insert is sold separately.")}${accordion("How do I compare fabrics?","Visit Materials & Care to read the fibre composition and washing method, or try the fabric study below.")}${accordion("How is delivery arranged?","Send your destination with the order request. The studio confirms availability, delivery cost and timing before purchase. "+textLink("?page=shipping","Shipping & Returns"))}${accordion("How do I request a return?","Contact the studio with the order reference and item name for the return address and instructions. "+textLink("?page=shipping","Read the return process"))}</div></section>`;
}
function journalSection(){
 return `<section id="journal" class="chapter wrap">${heading("Journal & guides","Notes on Cloth",textLink("?page=care","Materials & care"))}<div class="three">${notes.map(([t,sub,body],i)=>`<article class="journalcard">${img("journal"+i,sub)}<div><h3>${t}</h3><p>${sub}.</p><details><summary>Read the note</summary><p>${body}</p></details></div></article>`).join("")}</div></section>`;
}
function studySection(){
 return `<section id="fabric-study" class="band"><div class="wrap chapter chairstage"><div><p class="label">Fabric study</p><h2>Cloth for Seat<br>and Table</h2><p>Select a swatch to dress the same walnut frame in a different cloth. Compare the soft loops of bouclé, the sheen of velvet and the open weave of linen beside the draped table.</p><div class="swatchrow">${["Ochre bouclé","Petrol velvet","Ivory linen"].map((v,i)=>`<button data-chair="${i}" aria-label="${v}" aria-pressed="${i===0}" style="--dot:${["#b48b45","#294d5c","#ded2bb"][i]}"></button>`).join("")}</div></div><div class="chairframe">${img("chair0","Walnut lounge chair in ochre bouclé")}<div class="table-study">${img("obj3","Oak table dressed in woven linen")}</div></div></div></section>
 ${galleryTrio()}<section class="chapter wrap fabricfold">${heading("Styling room","See the Finish")}
<div class="stylelab"><div class="labnav">${products.map((p,i)=>`<button data-look="${i}"><i class="dot" style="--dot:${swatches[i]}"></i>${p.name}</button>`).join("")}</div><div id="labScene"></div></div></section>`;
}
function contactStrip(){
  return `<section class="wrap strip"><h2>Write to<br>Our Studio</h2><div><label for="emailStart">Your email</label><input id="emailStart" type="email" autocomplete="email" placeholder="Email address"></div><button class="button" data-action="enquire">Start an enquiry ${icon("arrow")}</button></section>`;
}
function home(){
 return [heroIntro(),studioStory(),objectRibbon(),collectionsSection(),factBand(),roomGallery(),sofaStudy(),processSection(),reasons(),materialTeam(),methodCards(),invitation(),reviewSection(),faqSection(),journalSection(),studySection(),formMarkup(),contactStrip()].join("");
}
function sidebar() {
  return `<aside class="sidebar"><strong>Browse the studio</strong><a href="?shop=all">All textiles</a>${categoryLinks}<div class="sideposter">${[3,4,5].map((n,i)=>img("still"+n,["Cloth on the worktable","Woven detail","Textile palette"][i],i?"":"show")).join("")}<a href="?page=care">Material notes</a></div></aside>`;
}
const listing = params.get("shop");
function catalog() {
  const title = [...categories, ...rooms].includes(listing)
    ? listing
    : "All textiles";
  return `<div class="wrap inner">${bread("Collections")}<h1>${title}</h1><div class="sidegrid">${sidebar()}<div><div class="filters">${["material", "color", "room", "size"].map((k) => `<label>${k}<select data-filter="${k}"><option value="">All</option>${[...new Set(products.map((p) => p[k]))].map((v) => `<option>${v}</option>`).join("")}</select></label>`).join("")}</div><p id="count" role="status"></p><div id="items" class="shopgrid"></div></div></div></div>`;
}
function filterProducts() {
  const filtered = products.filter(
    (p) =>
      (!categories.concat(rooms).includes(listing) ||
        [p.category, p.room].includes(listing)) &&
      $$("[data-filter]").every(
        (s) => !s.value || p[s.dataset.filter] === s.value,
      ),
  );
  const hasFilters = $$("[data-filter]").some(select => select.value);
  const pairing = filtered.length === 1 && categories.includes(listing) && !hasFilters
    ? products.find(piece => piece.room === filtered[0].room && piece.id !== filtered[0].id)
    : null;
  $("#count").textContent = filtered.length + (filtered.length === 1 ? " piece" : " pieces") +
    (pairing ? " in this collection · 1 studio pairing" : "");
  const cards = filtered.map(piece => productCard(piece));
  if (pairing) cards.push(productCard(pairing, true));
  $("#items").innerHTML = cards.join("") ||
    '<div><p>No pieces match these selections.</p><button class="outline" data-action="reset">Clear filters</button></div>';
}
function compare(p) {
  return `<div class="compare" style="--cut:50%">${img("b" + pos(p), "Before styling")}${img("a" + pos(p), "Styled with " + p.name, "after")}<div class="split"></div><span>Styled</span><span>Before</span><input type="range" min="0" max="100" value="50" aria-label="Compare room before and after styling"></div>`;
}
function product(p) {
  return `<div class="wrap inner">${bread(`<a href="${shopUrl(p.category)}">${p.category}</a><span>/</span>${p.name}`)}<div class="productpage"><div class="productstage">${img("p" + pos(p), p.name)}</div><div><div class="tag"><b></b>${p.category}</div><h1>${p.name}</h1><strong class="price">${money(p.price)}</strong><p>${p.description}</p><p><i class="dot" style="--dot:${swatches[pos(p)]}"></i> ${p.color} · ${p.size}</p><button class="button" data-add="${p.id}">Add to bag ${icon("bag")}</button>${accordion("Composition & finish", p.composition + ". " + p.detail)}${accordion("Size & care", p.size + ". " + p.care)}</div></div><section class="block"><div class="sectionhead"><h2>Before <em>& after.</em></h2><p>${p.styling}</p></div>${compare(p)}</section><section class="block"><h2>Pair it <em>with.</em></h2><div class="related">${products
    .filter((x) => x !== p)
    .map(productCard)
    .join("")}</div></section></div>`;
}
function accordion(title, body) {
  return `<details><summary>${title}</summary><p>${body}</p></details>`;
}
const policies = {
  privacy: [
    [
      "What you share",
      "When you contact the studio, we receive your name, email address, chosen topic and message. Order enquiries also include the pieces and quantities in your bag. Please leave payment card details out of the form.",
    ],
    [
      "How we use your information",
      "We use this information to answer your request, prepare an order proposal and manage follow-up correspondence. Sending an enquiry does not subscribe you to marketing. Reviews are shared publicly only with the author's permission.",
    ],
    [
      "On your device",
      "The bag and the acknowledgement of this notice are saved in local storage in your browser. Clearing this site's browser data removes both. Your name, email and message are sent only when you submit the form.",
    ],
    [
      "Handling your request",
      "The studio and its hosting and email providers process the information needed to handle correspondence. Technical logs may include connection information used to operate the site. Correspondence is kept for as long as needed to resolve the enquiry and meet applicable recordkeeping obligations.",
    ],
    [
      "Your choices",
      "Contact the studio to ask about the personal information held about you or request correction or deletion. Identify the email address used for your enquiry so we can locate it and confirm your identity.",
    ],
  ],
  terms: [
    [
      "Using the catalogue",
      "Each listing describes one textile, including the fabric composition, shade, dimensions and care method. Interior photographs show styling ideas. Furniture, cushion inserts and accessories are included only where the listing expressly says so.",
    ],
    [
      "Order requests",
      "Adding a piece to your bag saves a selection on your device. Submitting the selection asks the studio for an offer. We confirm stock, quantities, delivery charges, applicable taxes and the final price in writing before you decide to purchase.",
    ],
    [
      "Prices and payment",
      "Catalogue prices are expressed in euros. No money is collected through the enquiry form. Any payment method and due date will be specified in the studio's written offer.",
    ],
    [
      "Measurements and colour",
      "Check the stated measurements against your furniture. Light, display settings and production batches can affect colour perception. Ask about a particular shade or fit before accepting an offer.",
    ],
    [
      "Help with your order",
      "Keep the studio's confirmation and include its reference in any delivery, cancellation or return enquiry. Applicable statutory consumer rights remain available.",
    ],
  ],
  shipping: [
    [
      "Destination and delivery quote",
      "Include your destination country and postal code with your order request. The studio confirms whether delivery is available, along with shipping charges, any known taxes and the estimated delivery window before you commit.",
    ],
    [
      "Dispatch and tracking",
      "Availability is checked for each piece. The dispatch estimate and available tracking arrangements are set out in the written offer. If your destination or requested quantity changes, ask for an updated quote.",
    ],
    [
      "Requesting a return",
      "Contact us with your order reference, item name and the reason for your request. The studio will provide the appropriate return address, applicable return window and instructions. Please wait for these details before sending a parcel.",
    ],
    [
      "Condition and return costs",
      "Keep the textile and its packaging in the condition needed for assessment. The return arrangements and any costs for a change of mind are disclosed before purchase. Different arrangements can apply to incorrect or faulty items.",
    ],
    [
      "Damaged or incorrect items",
      "Keep the packaging and contact the studio with the order reference and a description. Photos can be sent in response to the studio's email. We will discuss the applicable replacement, repair or refund and confirm the next step in writing.",
    ],
    [
      "Refunds and cancellations",
      "To ask about cancelling an order, contact us as soon as possible. When a refund is due, the studio will confirm the amount, method and timing. Mandatory consumer protections in your location continue to apply.",
    ],
  ],
};
function info(id) {
  const care = id === "care";
  const entries = care
    ? products.map((p) => [p.material, p.composition + ". " + p.care])
    : policies[id];
  return `<div class="wrap inner legalpage">${bread("Studio guide")}<h1>${pages[id]}</h1><div class="sidegrid">${sidebar()}<article class="article"><p class="lead">${care ? "A fabric keeps its character when you care for its fibres. Find the instructions for your piece below." : { terms: "How the studio catalogue and order enquiry process work.", shipping: "From the first delivery quote to help with a return.", privacy: "How we handle your enquiry and the bag saved on your device." }[id]}</p>${entries.map(([t, b], i) => (care ? accordion(t, b) : `<section><h2>${t}</h2><p>${b}</p></section>`)).join("")}<div class="articleend"><h3>Contact the studio</h3><a href="mailto:${esc(cfg.email)}">${esc(cfg.email)}</a></div></article></div></div>`;
}
function objectRibbon(){
 const objects=[1,5,6,7,2,8,4,0];
 return `<div class="object-ribbon" aria-hidden="true"><div>${[...objects,...objects].map(n=>img("obj"+n,"")).join("")}</div></div>`;
}
function sofaStudy(){
 const features=[["The base","Let the upholstery show between layers."],["The throw","Drape the fringe across one arm."],["The cushions","Mix a fine weave with a raised motif."],["The palette","Carry a warm shade across the seat."]];
 return `<section class="sofa-study chapter wrap"><p class="label">The styling room</p><h2>Dress the Sofa</h2><div class="sofa-layout">${features.map(([t,d],i)=>`<div class="sofa-tip tip-${i}"><small>0${i+1}</small><div><h3>${t}</h3><p>${d}</p></div></div>`).join("")}<button class="sofa-scene" aria-pressed="false" aria-label="Show or hide throw and cushions">${img("sofa-bare","Oatmeal sofa before styling")}${img("sofa-dressed","The same sofa with a throw and cushions","dressed")}</button></div><p class="scene-hint">Hover or tap the sofa to layer the textiles.</p></section>`;
}
function methodCards(){
 return `<section class="wrap chapter weave-method"><p class="label">From the worktable</p><h2>Four Ways to Layer Cloth</h2><div class="method-grid">${["Start with a pattern","Soften an edge","Dress the table","Draw a line"].map((t,i)=>`<a href="${itemUrl(products[i])}" style="--art:url('../img/editorial${[0,1,2,8][i]}.webp')"><small>0${i+1}</small><h3>${t}</h3><p>${descriptions[i]}</p><span>${products[i].name} ${icon("arrow")}</span></a>`).join("")}</div></section>`;
}
function notesPair(){
 return `<div class="notes-pair"><div class="note-copy"><small class="label">Studio notes</small><h3 id="noteTitle">A quiet palette</h3><p id="noteBody">Pair muted olive cloth with warm timber. Lay the folds across the window light and leave one edge loose so the weave casts a fine shadow.</p></div><div class="note-photo">${[3,4,5].map((n,i)=>img("editorial"+n,["Olive parlour textiles","Linen on a loom","Bouclé texture"][i],i?"":"show")).join("")}</div></div>`;
}
function galleryTrio(){
 return `<section class="wrap chapter"><p class="label">The textile edit</p><h2>Cloth in Context</h2><div class="still-trio">${["A quieter corner","A table for two","Texture in daylight"].map((t,i)=>`<a href="${shopUrl(["Living Room","Dining Room","Cushion Covers"][i])}"><figure>${img("still"+i,t)}<span>Explore edit ${icon("arrow")}</span></figure><h3>${t}</h3></a>`).join("")}</div></section>`;
}
function innerStudies(piece){
 const index=piece?pos(piece):Math.max(0,categories.indexOf(listing));
 const p=products[index], alternate=products[(index+1)%products.length];
 const shots=[0,1,2].map(n=>"cloth"+(3*index+n));
 const set=[p,alternate,products[(index+2)%products.length]];
 const spreads=[
 `<section class="inner-spread chapter">${photoCube(["look"+index,"detail"+(index+8),"detail"+(index+4),"detail"+index],p.name+" material notebook")}<div><p class="label">Material notebook</p><h2>${p.material} in Detail</h2><p>${p.description}</p><p>${p.composition} · ${p.size}. ${p.detail}</p><p>${p.styling}</p>${textLink(itemUrl(alternate),"Pair with "+alternate.name)}</div></section>`,
 `<section class="inner-sampler chapter"><h2>From Fibre to Finish</h2><div class="sampler-grid"><div class="sample-choices">${["Fibre","Dimensions","Care"].map((t,i)=>`<button data-sample="${i}" aria-pressed="${i===0}">${t} ${icon("arrow")}</button>`).join("")}<p id="sampleNote">${esc(p.composition)}</p></div><div class="sample-visual">${shots.map((n,i)=>img(n,p.name+" studio study",i?"":"show")).join("")}</div></div></section>`,
 `<section class="chapter inner-edit"><p class="label">Studio selection</p><h2>Build a Textile Pairing</h2><div class="still-trio">${set.map((item,i)=>`<a href="${itemUrl(item)}"><figure>${img("p"+pos(item),item.name)}<span>View piece ${icon("arrow")}</span></figure><h3>${item.name}</h3><p>${item.material} · ${money(item.price)}</p></a>`).join("")}</div></section>`
 ];
 if(index%2)spreads.reverse();
 return spreads.join("")+(!piece?`<section class="block"><h2>Before &amp; After</h2><p>${p.styling}</p>${compare(p)}</section>`:"");
}

const productId = params.get("product"),
  page = params.get("page");
const selected = products.find((p) => p.id === productId);
const main = $("#main");
if (productId)
  main.innerHTML = selected
    ? product(selected)
    : '<div class="wrap inner"><h1>Piece not found</h1><a href="?shop=all">View all textiles</a></div>';
else if (listing !== null) main.innerHTML = catalog();
else if (page && Object.hasOwn(pages, page)) main.innerHTML = info(page);
else main.innerHTML = home();
if(selected || page==="care" || (listing!==null && !selected)) $(".inner").insertAdjacentHTML("beforeend",innerStudies(selected));
document.title = [
  selected?.name ||
    (listing === "all" ? "All textiles" : listing) ||
    (Object.hasOwn(pages, page) ? pages[page] : cfg.tabTitle),
  cfg.name,
].join(" | ");
if ($("#items")) filterProducts();

const dialog = $("#panel");
function openPanel(title, content) {
  dialog.dataset.view=title==="Your bag"?"bag":title==="Menu"?"menu":"search";
  dialog.setAttribute("aria-label", title);
  dialog.innerHTML = `<div class="panelhead"><h2>${title}</h2><button data-action="close" aria-label="Close dialog">${icon("close")}</button></div><div class="panelbody">${content}</div>`;
  if (!dialog.open) dialog.showModal();
}
function bag() {
  cart = readCart();
  const lines = products.filter((p) => cart[p.id]);
  openPanel(
    "Your bag",
    lines.length
      ? lines
          .map(
            (p) =>
              `<div class="bagline">${img("p" + pos(p), p.name)}<div><a href="${itemUrl(p)}">${p.name}</a><p>${p.size} · ${money(p.price)}</p><div class="qty"><button data-qty="-1" data-id="${p.id}" aria-label="Decrease ${p.name} quantity">${icon("minus")}</button><span>${cart[p.id]}</span><button data-qty="1" data-id="${p.id}" aria-label="Increase ${p.name} quantity" ${cart[p.id] >= 99 ? "disabled" : ""}>${icon("plus")}</button></div></div><button data-remove="${p.id}" aria-label="Remove ${p.name}">${icon("close")}</button></div>`,
          )
          .join("") +
          `<p class="total">Subtotal <strong>${money(lines.reduce((sum, p) => sum + p.price * cart[p.id], 0))}</strong></p><p>Send your selection to the studio for availability and a delivery quote. Payment follows your approval.</p><a class="button" href="index.html?order=1#contact">Request this order ${icon("arrow")}</a>`
      : `<p>Your bag is empty.</p>${button("?shop=all", "Discover the textiles")}`,
  );
}
const searchIndex = [
  ...products.map((p) => [
    p.name,
    itemUrl(p),
    [p.category, p.color, p.material, p.size].join(" · "),
  ]),
  ...[...categories, ...rooms].map((k) => [k, shopUrl(k), "Collection"]),
  ...Object.entries(pages).map(([k, v]) => [v, "?page=" + k, "Studio guide"]),
  ...["About", "Reviews", "Contact", "Catalog"].map((s) => [
    s,
    "index.html#" + s.toLowerCase(),
    "Main page",
  ]),
];
let searchOffset=0;
function searchResults(value) {
  const hits = searchIndex.filter((row) =>
    (row[0] + " " + row[2]).toLowerCase().includes(value.trim().toLowerCase()),
  );
  $("#searchPaging").innerHTML = hits.length>4 ? `<button data-search-turn="-1" aria-label="Previous results" ${searchOffset===0?"disabled":""}>${icon("prev")}</button><small>${Math.floor(searchOffset/4)+1} / ${Math.ceil(hits.length/4)}</small><button data-search-turn="1" aria-label="Next results" ${searchOffset+4>=hits.length?"disabled":""}>${icon("next")}</button>` : "";
  $("#matches").innerHTML =
    hits.slice(searchOffset,searchOffset+4)
      .map(
        ([name, url, type]) =>
          `<a href="${url}"><strong>${name}</strong><small>${type}</small></a>`,
      )
      .join("") || "<p>No matches. Try a material, piece or room.</p>";
}
let heroIndex = 0,
  featuredIndex = 0;
function setHero(step = 0) {
  heroIndex = (heroIndex + step + slides.length) % slides.length;
  const s = slides[heroIndex];
  const el = $(".hero-v2");
  $("#coverImage").src = "img/"+s.photo+".webp";
  $("#coverImage").alt = s.caption+" styled with home textiles";
  $("#coverWord").textContent = s.italic;
  $("#slideNum").textContent = String(heroIndex + 1).padStart(2, "0") + " / 03";
  el.classList.remove("changing");
  void el.offsetWidth;
  el.classList.add("changing");
}
function setFeatured(step = 0) {
  featuredIndex = (featuredIndex + step + products.length) % products.length;
  $("#featured").innerHTML = Array.from(
    { length: Math.min(3, products.length) },
    (_, i) => {
      const p=products[(featuredIndex+i)%products.length], n=pos(p);
      return `<a class="offercard" href="${itemUrl(p)}"><div class="offerpic">${img("c"+n,p.category)}</div><div class="offerbody"><i>${markIcon(n)}</i><h3>${p.category}</h3><p>${descriptions[n]}</p><span>View ${p.name} ${icon("arrow")}</span></div></a>`;
    },
  ).join("");
}
function setLook(i) {
  const p = products[i];
  $("#labScene").innerHTML =
    `<a href="${itemUrl(p)}">${img("a" + i, "Room styled with " + p.name)}<span>${p.styling}</span></a>`;
  $$("[data-look]").forEach((b) =>
    b.setAttribute("aria-pressed", Number(b.dataset.look) === i),
  );
}
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
if ($(".hero-v2")) {
  setHero();
  setFeatured();
  setLook(0);
  const hero = $(".hero-v2");
  let nextAt = Date.now() + 5000;
  hero.addEventListener("pointerdown", () => (nextAt = Date.now() + 11000));
  setInterval(() => {
    if (
      document.hidden ||
      dialog.open ||
      reduced.matches ||
      hero.matches(":hover, :focus-within") ||
      hero.getBoundingClientRect().bottom < 0 ||
      Date.now() < nextAt
    )
      return;
    setHero(1);
    nextAt = Date.now() + 5000;
  }, 1000);
  if (!reduced.matches && matchMedia("(pointer:fine)").matches) {
    hero.addEventListener("pointermove", (e) =>
      hero.style.setProperty(
        "--tilt",
        ((e.clientX - hero.getBoundingClientRect().left) / hero.clientWidth -
          0.5) *
          9 +
          "px",
      ),
    );
  }
}
function swipe(el, fn) {
  let x, y;
  el?.addEventListener(
    "touchstart",
    (e) => {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    },
    { passive: true },
  );
  el?.addEventListener(
    "touchend",
    (e) => {
      const dx = e.changedTouches[0].clientX - x,
        dy = e.changedTouches[0].clientY - y;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5)
        fn(dx < 0 ? 1 : -1);
    },
    { passive: true },
  );
}
swipe($(".hero-v2"), setHero);
swipe($("#featured"), setFeatured);
function orderSummary() {
  const form = $("#enquiry");
  if (!form) return;
  const selectedOrder = form.elements.subject.value === "Order request";
  const items = products.filter((p) => cart[p.id]);
  $("#orderSummary").innerHTML =
    selectedOrder && items.length
      ? `<div class="orders"><strong>Selected pieces</strong><p>${items.map((p) => esc(p.name) + " × " + cart[p.id]).join(" · ")}</p><button type="button" data-action="bag">Edit bag</button></div>`
      : "";
  form.elements.message.required = !selectedOrder || !items.length;
}
if ($("#enquiry")) {
  if (params.has("order"))
    $("#enquiry").elements.subject.value = "Order request";
  orderSummary();
  $("#enquiry").elements.subject.addEventListener("change", orderSummary);
  $("#enquiry").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget,
      submit = $('button:not([type="button"])', form),
      status = $("#formStatus");
    if (submit.disabled) return;
    submit.disabled = true;
    status.textContent = "Sending your request…";
    const data = new FormData(form);
    const order = data.get("subject") === "Order request" ? { ...cart } : {};
    data.set("items", JSON.stringify(order));
    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      const result = await res.json();
      if (!res.ok || result.ok !== true) throw new Error();
      if (Object.keys(order).length) {
        cart = readCart();
        Object.entries(order).forEach(([id, n]) => {
          cart[id] = Math.max(0, (cart[id] || 0) - n);
          if (!cart[id]) delete cart[id];
        });
        save(key, cart);
        updateBag();
      }
      form.reset();
      orderSummary();
      status.textContent = cfg.form.success;
    } catch {
      status.textContent =
        "Your request could not be confirmed. Your details are still here. Please try again or email the studio.";
    } finally {
      submit.disabled = false;
    }
  });
}
document.addEventListener("input", (e) => {
  if (e.target.matches(".compare input"))
    e.target.parentElement.style.setProperty("--cut", e.target.value + "%");
  if (e.target.id === "query") {searchOffset=0;searchResults(e.target.value);}
});
document.addEventListener("change", (e) => {
  if (e.target.matches("[data-filter]")) filterProducts();
});
document.addEventListener("click", (e) => {
  const b = e.target.closest("button, a");
  if (!b) return;
  if(b.dataset.searchTurn){searchOffset+=4*Number(b.dataset.searchTurn);searchResults($("#query").value);}
  if (b.hasAttribute("data-chair")) {
    const i = Number(b.dataset.chair);
    const chair = $(".chairframe img");
    chair.src = "img/chair" + i + ".webp";
    chair.alt = "Walnut chair in " + b.getAttribute("aria-label");
    $$("[data-chair]").forEach((el) =>
      el.setAttribute("aria-pressed", el === b),
    );
  }
  if (b.dataset.add) {
    changeQty(b.dataset.add, 1);
    bag();
  }
  if (b.dataset.remove) {
    changeQty(b.dataset.remove, -99);
    bag();
    orderSummary();
  }
  if (b.dataset.qty) {
    changeQty(b.dataset.id, Number(b.dataset.qty));
    bag();
    orderSummary();
  }
  if (b.dataset.step)
    (b.dataset.slider === "hero" ? setHero : setFeatured)(
      Number(b.dataset.step),
    );
  if (b.hasAttribute("data-look")) setLook(Number(b.dataset.look));
  if (b.textContent.trim().startsWith("Share a review")) {
    $("#enquiry").elements.subject.value = "Customer review";
    orderSummary();
  }
  switch (b.dataset.action) {
    case "enquire": {
      const email=$("#emailStart");
      if(!email.reportValidity())break;
      if(email.value)$("#enquiry").elements.email.value=email.value;
      $("#enquiry").scrollIntoView({block:"center"});
      $("#enquiry").elements.name.focus({preventScroll:true});
      break;
    }
    case "reset":
      $$("[data-filter]").forEach((s) => (s.value = ""));
      filterProducts();
      break;
    case "bag":
      bag();
      break;
    case "close":
      dialog.close();
      break;
    case "menu":
      openPanel(
        "Menu",
        `<div class="menulinks">${nav}<a href="index.html#reviews">Reviews</a><a href="?page=shipping">Shipping &amp; Returns</a></div>`,
      );
      $$(".menulinks a").forEach((link, i) =>
        link.insertAdjacentHTML(
          "afterbegin",
          img("obj"+[0,8,3,6,1,5,7][i%7],"","menu-object"),
        ),
      );
      break;
    case "accept":
      save("twill-privacy", true);
      notice.hidden = true;
      break;
    case "search":
      openPanel(
        "Search the studio",
        '<label>Product, material or page<input id="query" type="search" placeholder="Try linen"></label><div id="matches"></div><div id="searchPaging"></div>',
      );
      searchOffset=0; searchResults("");
      $("#query").focus();
      break;
  }
  if (b.tagName === "A" && dialog.open) dialog.close();
});
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      dialog.close();
  }
});
window.addEventListener("storage", () => {
  cart = readCart();
  updateBag();
  orderSummary();
  if (dialog.open && $(".total")) bag();
});
if (location.hash)
  requestAnimationFrame(() =>
    document
      .getElementById(decodeURIComponent(location.hash.slice(1)))
      ?.scrollIntoView(),
  );
const observer = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("arrived");
        if(!reduced.matches) $$("[data-count]",e.target).forEach(counter=>{
          const start=performance.now(), value=Number(counter.dataset.count);
          const tick=now=>{
            const t=Math.min(1,(now-start)/900);
            counter.textContent=Math.round(value*(1-(1-t)**3));
            if(t<1)requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
        observer.unobserve(e.target);
      }
    }),
  { threshold: 0.04 },
);
$$(".chapter,.block,.facts").forEach((el) => observer.observe(el));

document.addEventListener("click", event => {
  for(const group of $$(".navgroup[open]")) if(!group.contains(event.target)) group.open=false;
});
document.addEventListener("keydown", event => {
  if(event.key==="Escape") for(const group of $$(".navgroup[open]")){
    group.open=false;
    group.querySelector("summary").focus();
  }
});

function loopWhileVisible(el, advance, delay, pauseOnHover=true){
 if(!el)return;
 let timer;
 const stop=()=>{clearInterval(timer);timer=undefined;};
 const start=()=>{stop();timer=setInterval(()=>{
  if(!document.hidden && !dialog.open && !reduced.matches && (!pauseOnHover || !el.matches(":focus-within,:hover")))advance(1);
 },delay);};
 new IntersectionObserver(entries=>entries[0].isIntersecting?start():stop()).observe(el);
}
loopWhileVisible($("#featured"),setFeatured,4700);
const noteSlides=[
 ["A quiet palette","Pair muted olive cloth with warm timber. Lay the folds across the window light and leave one edge loose so the weave casts a fine shadow."],
 ["On the loom","Look along the warp to see how the threads sit side by side. Follow one across the cloth and notice how each crossing changes the way the light falls."],
 ["A quieter contrast","Set a smooth weave against a nubby one. Repeat a colour in both pieces, then fold back one corner to let the two textures meet along a single edge."]
];
let activeNote=0;
function changeNote(direction){
 activeNote=(activeNote+direction+noteSlides.length)%noteSlides.length;
 $("#noteTitle").textContent=noteSlides[activeNote][0];
 $("#noteBody").textContent=noteSlides[activeNote][1];
 $$(".note-photo img").forEach((el,i)=>el.classList.toggle("show",i===activeNote));
 if(!reduced.matches)$(".note-copy").animate?.([{opacity:.45},{opacity:1}],{duration:450});
}

swipe($(".notes-pair"),changeNote);
loopWhileVisible($(".notes-pair"),changeNote,6800,false);
for(const stack of $$(".sideposter")){
 let idx=0;const pictures=$$("img",stack);
 loopWhileVisible(stack,()=>{idx=(idx+1)%pictures.length;pictures.forEach((el,i)=>el.classList.toggle("show",i===idx));},4100);
}
for(const cube of $$(".cloth-cube")){
 let turn=0;
 const rotate=(step)=>{turn+=step;cube.style.setProperty("--turn",turn);};
 loopWhileVisible(cube.parentElement,rotate,5100,false);swipe(cube.parentElement,rotate);
 const fit=()=>cube.style.setProperty("--depth",cube.clientWidth/2+"px");
 if(typeof ResizeObserver==="function")new ResizeObserver(fit).observe(cube);
 fit();
}
$(".sofa-scene")?.addEventListener("click",e=>{
 const el=e.currentTarget;el.setAttribute("aria-pressed",el.getAttribute("aria-pressed")!=="true");
});
const selectedSample=selected||products[Math.max(0,categories.indexOf(listing))];
$$("[data-sample]").forEach((b,i)=>b.addEventListener("click",()=>{
 $$("[data-sample]").forEach(el=>el.setAttribute("aria-pressed",el===b));
 $$(".sample-visual img").forEach((el,j)=>el.classList.toggle("show",j===i));
 $("#sampleNote").textContent=[selectedSample.composition,selectedSample.size,selectedSample.care][i];
}));
if(!reduced.matches){
 const typeObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(!entry.isIntersecting)return;
  typeObserver.unobserve(entry.target);
  const h=entry.target;
  const walker=document.createTreeWalker(h,NodeFilter.SHOW_TEXT);
  const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  const total=nodes.reduce((sum,n)=>sum+n.textContent.length,0);
  let n=0;h.setAttribute("aria-label",(h.innerText||h.textContent).replace(/\s+/g," ").trim());
  for(const node of nodes){
   const fragment=document.createDocumentFragment();
   for(const word of node.textContent.split(/(\s+)/)){
    if(!word.trim()){fragment.append(word);continue;}
    const group=document.createElement("span");group.className="type-word";group.setAttribute("aria-hidden","true");
    for(const letter of word){const glyph=document.createElement("span");glyph.textContent=letter;glyph.style.animationDelay=Math.round((n++/total)*620)+"ms";group.append(glyph);}
    fragment.append(group);
   }
   node.replaceWith(fragment);
  }
 }),{threshold:.14});
 $$("main h1,main h2").forEach(h=>typeObserver.observe(h));
}
for(const d of $$("main details")){
 const summary=$("summary",d);
 let animation;
 summary.addEventListener("click",event=>{
  if(reduced.matches||!d.animate)return;
  event.preventDefault();
  const start=d.getBoundingClientRect().height;
  const opening=d.dataset.goal?d.dataset.goal==="closed":!d.open;
  if(animation){animation.onfinish=null;animation.cancel();}
  d.dataset.goal=opening?"open":"closed";
  d.open=true;
  const target=opening?d.getBoundingClientRect().height:summary.getBoundingClientRect().height+2;
  animation=d.animate([{height:start+"px"},{height:target+"px"}],{duration:330,easing:"cubic-bezier(.22,.66,.32,1)"});
  animation.onfinish=()=>{d.open=opening;delete d.dataset.goal;animation=null;};
 });
}

