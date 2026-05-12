(function () {
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const siteNav = document.querySelector("[data-site-nav]");
  if (siteNav) {
    const setNavState = () => siteNav.classList.toggle("is-scrolled", window.scrollY > 12);
    setNavState();
    window.addEventListener("scroll", setNavState, { passive: true });
  }

  const menuOverlay = document.querySelector("[data-menu-overlay]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  if (menuOverlay && menuToggle) {
    const closeButtons = $$("[data-menu-close]", menuOverlay);
    const focusableSelector = "a, button, [tabindex]:not([tabindex='-1'])";
    const setMenu = (open) => {
      menuOverlay.classList.toggle("is-open", open);
      menuOverlay.setAttribute("aria-hidden", open ? "false" : "true");
      menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("nav-open", open);
      if (open) {
        const firstFocusable = menuOverlay.querySelector(focusableSelector);
        if (firstFocusable) firstFocusable.focus({ preventScroll: true });
      } else {
        menuToggle.focus({ preventScroll: true });
      }
    };
    menuToggle.addEventListener("click", () => setMenu(menuToggle.getAttribute("aria-expanded") !== "true"));
    closeButtons.forEach((button) => button.addEventListener("click", () => setMenu(false)));
    $$(".menu-overlay a", menuOverlay).forEach((link) => link.addEventListener("click", () => setMenu(false)));
    menuOverlay.addEventListener("click", (event) => {
      if (event.target === menuOverlay) setMenu(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") setMenu(false);
    });
  }

  if (!reduceMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach((element) => observer.observe(element));
  } else {
    $$(".reveal").forEach((element) => element.classList.add("is-in"));
  }

  const filter = document.querySelector(".gallery-filter");
  if (filter) {
    filter.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      const category = button.dataset.cat;
      $$(".gallery-filter button").forEach((item) => item.classList.toggle("is-on", item === button));
      $$(".gallery-grid figure").forEach((figure) => {
        const tags = (figure.dataset.cat || "").split(" ");
        figure.classList.toggle("hide", category !== "all" && !tags.includes(category));
      });
    });

    const initialCategory = new URLSearchParams(window.location.search).get("cat");
    const initialButton = initialCategory ? filter.querySelector(`[data-cat="${initialCategory}"]`) : null;
    if (initialButton) initialButton.click();
  }

  const quoteForm = document.querySelector("[data-quote-form]");
  if (quoteForm) {
    quoteForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(quoteForm);
      const subject = encodeURIComponent("Quote request from khwoodworksco.com");
      const body = encodeURIComponent([
        `Name: ${data.get("name") || ""}`,
        `Email: ${data.get("email") || ""}`,
        `Phone: ${data.get("phone") || ""}`,
        `Location: ${data.get("location") || ""}`,
        `Project type: ${data.get("project") || ""}`,
        "",
        "Project notes:",
        data.get("message") || ""
      ].join("\n"));
      window.location.href = `mailto:khwoodworksco@gmail.com?subject=${subject}&body=${body}`;
    });
  }

  const scrollTrack = document.querySelector("[data-scroll-track]");
  const scrollSection = scrollTrack ? scrollTrack.closest(".service-scroll") : null;
  if (scrollTrack && scrollSection) {
    const nav = document.querySelector(".nav");
    const desktop = window.matchMedia("(min-width: 981px)");
    let maxTravel = 0;
    let maxScroll = 1;
    const navHeight = () => nav ? nav.offsetHeight : 68;
    const resetSection = () => {
      scrollSection.style.height = "";
      scrollSection.style.removeProperty("--nav-h");
      scrollTrack.style.transform = "";
    };
    const measureSection = () => {
      if (!desktop.matches || reduceMotion) {
        resetSection();
        return false;
      }
      const stickyHeight = window.innerHeight;
      maxTravel = Math.max(0, scrollTrack.scrollWidth - window.innerWidth);
      scrollSection.style.setProperty("--nav-h", `${navHeight()}px`);
      scrollSection.style.height = `${Math.ceil(stickyHeight + maxTravel)}px`;
      maxScroll = Math.max(1, scrollSection.offsetHeight - stickyHeight);
      return true;
    };
    const updateTrack = () => {
      if (!desktop.matches || reduceMotion) return;
      const rect = scrollSection.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / maxScroll));
      scrollTrack.style.transform = `translate3d(${-maxTravel * progress}px,0,0)`;
    };
    measureSection();
    updateTrack();
    window.addEventListener("scroll", updateTrack, { passive: true });
    window.addEventListener("resize", () => {
      measureSection();
      updateTrack();
    });
    window.addEventListener("load", () => {
      measureSection();
      updateTrack();
    });
    desktop.addEventListener("change", () => {
      measureSection();
      updateTrack();
    });
  }

  const parallaxItems = $$("[data-parallax]");
  if (parallaxItems.length && !reduceMotion) {
    let ticking = false;
    const updateParallax = () => {
      ticking = false;
      const viewportHeight = window.innerHeight || 1;
      parallaxItems.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const speed = Number(item.dataset.speed || 32);
        const centerProgress = ((rect.top + rect.height / 2) - viewportHeight / 2) / viewportHeight;
        const offset = Math.max(-1, Math.min(1, centerProgress)) * speed;
        item.style.transform = `translate3d(0, ${offset}px, 0)`;
      });
    };
    const requestParallax = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateParallax);
      }
    };
    updateParallax();
    window.addEventListener("scroll", requestParallax, { passive: true });
    window.addEventListener("resize", requestParallax);
    window.addEventListener("load", updateParallax);
  }
})();
