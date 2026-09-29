// ==== Green Forest — interakcje frontu ====

// Rok w stopce (może być kilka wystąpień)
document.querySelectorAll("#year").forEach(function (el) {
  el.textContent = new Date().getFullYear();
});

// Sticky nav — cień po przewinięciu
var nav = document.querySelector(".nav");
if (nav) {
  var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 8); };
  // Pierwszy odczyt pozycji po renderze, bez wymuszania układu całej strony.
  requestAnimationFrame(function () { requestAnimationFrame(onScroll); });
  window.addEventListener("scroll", onScroll, { passive: true });
}

// Dropdown „Usługi" — klik/klawiatura (hover ogarnia CSS)
var drop = document.querySelector(".nav__droptoggle");
if (drop) {
  var menu = drop.parentElement.querySelector(".nav__menu");
  drop.addEventListener("click", function (e) {
    e.stopPropagation();
    var open = menu.classList.toggle("open");
    drop.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.addEventListener("click", function () {
    menu.classList.remove("open");
    drop.setAttribute("aria-expanded", "false");
  });
}

// Menu mobilne (hamburger)
var burger = document.querySelector(".nav__burger");
var mm = document.getElementById("mobile-menu");
if (burger && mm) {
  var closeBtn = mm.querySelector(".mobile-menu__close");
  var openMenu = function () { mm.classList.add("open"); mm.setAttribute("aria-hidden", "false"); burger.setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden"; };
  var closeMenu = function () { mm.classList.remove("open"); mm.setAttribute("aria-hidden", "true"); burger.setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; };
  burger.addEventListener("click", openMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);
  mm.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeMenu); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
}

// Formularz kontaktowy — wysyłka AJAX (Web3Forms) z komunikatem bez przeładowania
document.querySelectorAll("form.contact-form").forEach(function (form) {
  var sending = false;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (sending) return;
    sending = true;
    var status = form.querySelector(".form-status");
    var btn = form.querySelector('button[type="submit"]');
    var setStatus = function (msg, ok) {
      if (!status) return;
      status.textContent = msg;
      status.style.color = ok ? "#2c7a45" : "#b3261e";
    };
    if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = "Wysyłam…"; }
    setStatus("", true);

    fetch(form.getAttribute("action"), {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" }
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (res.ok && res.d.success) {
          document.dispatchEvent(new Event('greenforest:lead-sent'));
          form.reset();
          setStatus("Dziękujemy! Wiadomość wysłana — odezwiemy się wkrótce.", true);
        } else {
          setStatus("Nie udało się wysłać. Zadzwoń: 694 757 680 lub napisz: green.forest33@op.pl", false);
        }
      })
      .catch(function () {
        setStatus("Brak połączenia. Zadzwoń: 694 757 680 lub napisz: green.forest33@op.pl", false);
      })
      .finally(function () {
        sending = false;
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || "Wyślij zapytanie"; }
      });
  });
});

// Karuzela opinii - strzałki
(function () {
  var track = document.querySelector(".reviews__track");
  if (!track) return;
  var prev = document.querySelector(".reviews__nav--prev");
  var next = document.querySelector(".reviews__nav--next");
  function step() { var card = track.querySelector(".quote"); return card ? card.getBoundingClientRect().width + 18 : 320; }
  if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
  if (next) next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: "smooth" }); });
})();

// Suwak Przed / Po
(function () {
  var range = document.getElementById("ba-range");
  var before = document.getElementById("ba-before");
  var handle = document.getElementById("ba-handle");
  if (!range || !before) return;
  function update() {
    var v = range.value;
    before.style.clipPath = "inset(0 " + (100 - v) + "% 0 0)";
    if (handle) handle.style.left = v + "%";
  }
  range.addEventListener("input", update);
  update();
})();

// Reveal na scroll (IntersectionObserver) — działa we wszystkich przeglądarkach
var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var reveals = document.querySelectorAll(".reveal");
if (!reduceMotion && "IntersectionObserver" in window) {
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  reveals.forEach(function (el) { el.classList.add('will-reveal'); io.observe(el); });
} else {
  reveals.forEach(function (el) { el.classList.add("is-visible"); });
}

// Podgląd zdjęć realizacji
(function () {
  var lightbox = document.getElementById("realizacje-lightbox");
  if (!lightbox) return;
  var image = lightbox.querySelector(".lightbox__image");
  var close = lightbox.querySelector(".lightbox__close");
  function closeLightbox() { lightbox.classList.remove("is-open"); lightbox.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; }
  document.querySelectorAll(".realizacje-image").forEach(function (button) {
    button.addEventListener("click", function () {
      image.src = button.dataset.lightboxSrc;
      image.alt = button.dataset.lightboxAlt || "";
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    });
  });
  close.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLightbox(); });
})();
