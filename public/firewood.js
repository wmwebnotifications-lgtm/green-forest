// Linki do pełnych zdjęć działają również bez JavaScriptu.
(function () {
  var dialog = document.getElementById("firewood-lightbox");
  if (!dialog || typeof dialog.showModal !== "function") return;
  var image = dialog.querySelector(".firewood-lightbox__image");
  var caption = dialog.querySelector(".firewood-lightbox__caption");
  var links = document.querySelectorAll(".firewood__photo");
  var openedFrom = null;

  links.forEach(function (link, index) {
    link.setAttribute("aria-haspopup", "dialog");
    link.setAttribute("aria-controls", dialog.id);
    link.addEventListener("click", function (event) {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openedFrom = link;
      var thumbnail = link.querySelector("img");
      image.src = link.href;
      image.alt = thumbnail.alt;
      caption.textContent = (index + 1) + " / " + links.length + " · " + thumbnail.alt;
      dialog.showModal();
      document.documentElement.classList.add("firewood-lightbox-open");
    });
  });
  dialog.querySelector(".firewood__close").addEventListener("click", function () { dialog.close(); });
  dialog.addEventListener("click", function (event) {
    if (event.target !== dialog) return;
    var bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener("close", function () {
    document.documentElement.classList.remove("firewood-lightbox-open");
    image.removeAttribute("src");
    if (openedFrom) openedFrom.focus({ preventScroll: true });
  });
})();
