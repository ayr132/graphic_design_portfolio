// Turns every .project-gallery with 2+ items into a manual carousel.
(function () {
  document.querySelectorAll(".project-gallery").forEach((gallery) => {
    const items = Array.from(gallery.children);
    if (items.length < 2) return;

    gallery.classList.add("carousel");
    gallery.setAttribute("role", "region");
    gallery.setAttribute("aria-roledescription", "carousel");
    gallery.setAttribute("aria-label", "Project gallery");

    const viewport = document.createElement("div");
    viewport.className = "carousel-viewport";
    const track = document.createElement("div");
    track.className = "carousel-track";

    const slides = items.map((item, i) => {
      const slide = document.createElement("div");
      slide.className = "carousel-slide";
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-roledescription", "slide");
      slide.setAttribute("aria-label", `${i + 1} of ${items.length}`);
      slide.appendChild(item);
      track.appendChild(slide);
      return slide;
    });

    viewport.appendChild(track);
    gallery.appendChild(viewport);

    const makeButton = (cls, label, symbol) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `carousel-btn ${cls}`;
      b.setAttribute("aria-label", label);
      b.textContent = symbol;
      viewport.appendChild(b);
      return b;
    };
    const prevBtn = makeButton("carousel-prev", "Previous slide", "‹");
    const nextBtn = makeButton("carousel-next", "Next slide", "›");

    const footer = document.createElement("div");
    footer.className = "carousel-footer";
    const dots = document.createElement("div");
    dots.className = "carousel-dots";
    const counter = document.createElement("span");
    counter.className = "carousel-counter";
    const dotButtons = slides.map((_, i) => {
      const d = document.createElement("button");
      d.type = "button";
      d.className = "carousel-dot";
      d.setAttribute("aria-label", `Go to slide ${i + 1}`);
      d.addEventListener("click", () => go(i));
      dots.appendChild(d);
      return d;
    });
    const fsBtn = document.createElement("button");
    fsBtn.type = "button";
    fsBtn.className = "carousel-fullscreen";
    const ICON_EXPAND =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
    const ICON_COLLAPSE =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';

    const meta = document.createElement("div");
    meta.className = "carousel-meta";
    meta.append(counter, fsBtn);
    footer.append(dots, meta);
    gallery.appendChild(footer);

    // Fullscreen: use the Fullscreen API where supported, otherwise a fixed overlay (e.g. iPhone Safari).
    const canNativeFs = !!(gallery.requestFullscreen || gallery.webkitRequestFullscreen);
    const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;
    const isFull = () => fsElement() === gallery || gallery.classList.contains("is-maximized");

    function updateFsButton() {
      const full = isFull();
      gallery.classList.toggle("is-fullscreen", full);
      fsBtn.innerHTML = full ? ICON_COLLAPSE : ICON_EXPAND;
      fsBtn.setAttribute("aria-label", full ? "Exit fullscreen" : "View fullscreen");
      fsBtn.title = full ? "Exit fullscreen (Esc)" : "View fullscreen";
      document.body.style.overflow = gallery.classList.contains("is-maximized") ? "hidden" : "";
    }

    fsBtn.addEventListener("click", () => {
      if (isFull()) {
        if (fsElement()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        gallery.classList.remove("is-maximized");
      } else if (canNativeFs) {
        (gallery.requestFullscreen || gallery.webkitRequestFullscreen).call(gallery);
      } else {
        gallery.classList.add("is-maximized");
      }
      updateFsButton();
    });
    document.addEventListener("fullscreenchange", updateFsButton);
    document.addEventListener("webkitfullscreenchange", updateFsButton);
    updateFsButton();

    let index = 0;

    // Load lazy images in the current and next slide ahead of time.
    const warm = (i) => {
      [i, (i + 1) % slides.length].forEach((n) => {
        const img = slides[n].querySelector("img[loading='lazy']");
        if (img) img.loading = "eager";
      });
    };

    function go(i) {
      const prevVideo = slides[index].querySelector("video");
      if (prevVideo) prevVideo.pause();

      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      slides.forEach((s, n) => {
        s.classList.toggle("is-active", n === index);
        s.setAttribute("aria-hidden", n === index ? "false" : "true");
        s.inert = n !== index;
      });
      dotButtons.forEach((d, n) => d.setAttribute("aria-current", n === index ? "true" : "false"));
      counter.textContent = `${index + 1} / ${slides.length}`;
      warm(index);
    }

    prevBtn.addEventListener("click", () => go(index - 1));
    nextBtn.addEventListener("click", () => go(index + 1));

    gallery.tabIndex = 0;
    gallery.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") go(index - 1);
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "Escape" && gallery.classList.contains("is-maximized")) {
        gallery.classList.remove("is-maximized");
        updateFsButton();
      }
    });

    // Swipe on touch screens.
    let startX = null;
    viewport.addEventListener("touchstart", (e) => (startX = e.touches[0].clientX), { passive: true });
    viewport.addEventListener("touchend", (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      startX = null;
    });

    go(0);
  });
})();
