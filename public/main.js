// ==== Green Forest — interakcje frontu ====

// Rok w stopce (może być kilka wystąpień)
document.querySelectorAll("#year").forEach(function (el) {
  el.textContent = new Date().getFullYear();
});

// Sticky nav — cień po przewinięciu
var nav = document.querySelector(".nav");
if (nav) {
  var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 8); };
  onScroll();
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

// Przyciski „Zadzwoń" — na telefonie dzwonią (tel:), na komputerze prowadzą do formularza
(function () {
  var isDesktop = window.matchMedia("(pointer: fine) and (hover: hover)").matches;
  if (!isDesktop) return; // urządzenia dotykowe: zostawiamy normalne dzwonienie
  document.querySelectorAll('a.btn[href^="tel:"], a.fab[href^="tel:"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      // Jeśli już jesteśmy na stronie kontaktu - przewiń do formularza; inaczej przejdź na /kontakt/
      var form = document.querySelector(".contact-form");
      if (form && !document.getElementById("kontakt")) {
        form.scrollIntoView({ behavior: "smooth", block: "start" });
        var field = form.querySelector("input, textarea, select");
        if (field) { setTimeout(function () { try { field.focus({ preventScroll: true }); } catch (_) { field.focus(); } }, 500); }
      } else {
        window.location.href = "/kontakt/";
      }
    });
  });
})();

// Formularz kontaktowy — wysyłka AJAX (Web3Forms) z komunikatem bez przeładowania
document.querySelectorAll("form.contact-form").forEach(function (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();
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
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || "Wyślij zapytanie"; }
      });
  });
});

// Kalkulator wyceny (orientacyjny)
(function () {
  var svc = document.getElementById("calc-service");
  if (!svc) return;
  var priceEl = document.getElementById("calc-price");
  var noteEl = document.getElementById("calc-note");
  var defaultNote = noteEl ? noteEl.textContent : "";

  function fmt(n) { return Math.round(n / 10) * 10; }
  function zl(n) { return n.toLocaleString("pl-PL") + " zł"; }

  function toggleFields() {
    var s = svc.value;
    document.querySelectorAll(".calc__form [data-for]").forEach(function (el) {
      el.style.display = el.getAttribute("data-for").split(" ").indexOf(s) !== -1 ? "" : "none";
    });
  }
  function num(id, def) { var el = document.getElementById(id); return el ? (parseFloat(el.value) || def) : def; }

  function calc() {
    var s = svc.value;
    var urgent = (document.getElementById("calc-urgent") || {}).checked;
    var price = 0, indyw = false, note = defaultNote;
    if (s === "wycinka") {
      var acc = num("calc-access", 1);
      price = num("calc-height", 200) * acc * num("calc-qty", 1);
      if (acc >= 2.4) { indyw = true; note = "Trudna wycinka (metoda linowa) - podana kwota to punkt wyjścia, dokładną wycenę robimy po oględzinach."; }
    } else if (s === "przycinka") {
      price = 150 * num("calc-access", 1) * num("calc-qty", 1);
    } else if (s === "zywoplot") {
      price = Math.max(150, 12 * num("calc-mb", 20));
    } else if (s === "karczowanie") {
      price = Math.max(300, 0.6 * num("calc-m2", 300));
    } else if (s === "drewno") {
      price = 330 * num("calc-mp", 3);
      note = "Cena drewna zależy od gatunku i wysuszenia - patrz cennik. Dowóz wyceniamy osobno.";
    }
    if (urgent && s !== "drewno") price *= 1.3;
    if (!price) { priceEl.textContent = "—"; return; }
    var low = fmt(price * 0.85), high = fmt(price * 1.25);
    priceEl.innerHTML = (indyw ? "od " : "") + zl(low) + " – " + zl(high);
    if (noteEl) noteEl.textContent = note;
  }

  svc.addEventListener("change", function () { toggleFields(); calc(); });
  document.querySelectorAll("#wycena select, #wycena input").forEach(function (el) {
    el.addEventListener("input", calc);
    el.addEventListener("change", calc);
  });
  toggleFields();
  calc();
})();

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
  reveals.forEach(function (el) { io.observe(el); });
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
