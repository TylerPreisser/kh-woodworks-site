(function () {
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const siteNav = document.querySelector("[data-site-nav]");
  if (siteNav) {
    const heroLogo = document.querySelector(".hero__logo");
    const setNavState = () => {
      const scrolled = window.scrollY > 12;
      const showLogo = heroLogo ? heroLogo.getBoundingClientRect().bottom <= siteNav.offsetHeight + 10 : true;
      siteNav.classList.toggle("is-scrolled", scrolled);
      siteNav.classList.toggle("is-logo-visible", showLogo);
    };
    setNavState();
    window.addEventListener("scroll", setNavState, { passive: true });
    window.addEventListener("resize", setNavState);
  }

  const heroVideo = document.querySelector(".hero__video");
  if (heroVideo) {
    heroVideo.muted = true;
    heroVideo.playsInline = true;
    const heroViewport = window.matchMedia("(max-width: 640px)");
    const mobileSource = heroVideo.querySelector("source[media]");
    const desktopSource = heroVideo.querySelector("source:not([media])");
    const sourceForViewport = () => heroViewport.matches ? mobileSource?.getAttribute("src") : desktopSource?.getAttribute("src");
    const playHeroVideo = () => {
      const playAttempt = heroVideo.play();
      if (playAttempt && typeof playAttempt.catch === "function") playAttempt.catch(() => {});
    };
    const syncHeroVideoSource = () => {
      const desiredSource = sourceForViewport();
      if (!desiredSource) return;
      const desiredUrl = new URL(desiredSource, window.location.href).href;
      const currentUrl = heroVideo.currentSrc || heroVideo.src;
      if (currentUrl !== desiredUrl) {
        heroVideo.src = desiredSource;
        heroVideo.load();
      }
      playHeroVideo();
    };
    syncHeroVideoSource();
    playHeroVideo();
    window.addEventListener("load", playHeroVideo, { once: true });
    heroViewport.addEventListener("change", syncHeroVideoSource);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) playHeroVideo();
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
    let maxTravel = 0;
    let maxScroll = 1;
    let panelTargets = [];
    const navHeight = () => nav ? nav.offsetHeight : 68;
    const viewportHeight = () => Math.round(window.visualViewport?.height || window.innerHeight || 1);
    const resetSection = () => {
      scrollSection.classList.remove("is-scroll-enhanced");
      scrollSection.style.height = "";
      scrollSection.style.removeProperty("--service-scroll-height");
      scrollSection.style.removeProperty("--nav-h");
      scrollTrack.style.removeProperty("transform");
    };
    const measureSection = () => {
      if (reduceMotion) {
        resetSection();
        return false;
      }
      scrollSection.classList.add("is-scroll-enhanced");
      const stickyHeight = viewportHeight();
      maxTravel = Math.max(0, scrollTrack.scrollWidth - window.innerWidth);
      panelTargets = $$(".service-panel", scrollTrack).map((panel) => {
        const target = panel.offsetLeft - ((window.innerWidth - panel.offsetWidth) / 2);
        return Math.min(maxTravel, Math.max(0, target));
      });
      scrollSection.style.setProperty("--nav-h", `${navHeight()}px`);
      scrollSection.style.setProperty("--service-scroll-height", `${Math.ceil(stickyHeight + maxTravel)}px`);
      scrollSection.style.height = `${Math.ceil(stickyHeight + maxTravel)}px`;
      maxScroll = Math.max(1, scrollSection.offsetHeight - stickyHeight);
      return true;
    };
    const updateTrack = () => {
      if (reduceMotion) return;
      const rect = scrollSection.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / maxScroll));
      const snapCards = window.matchMedia("(max-width: 640px)").matches && panelTargets.length > 1;
      const snappedIndex = snapCards ? Math.round(progress * (panelTargets.length - 1)) : -1;
      const travel = snapCards ? panelTargets[snappedIndex] : maxTravel * progress;
      scrollTrack.style.setProperty("transform", `translate3d(${-travel}px,0,0)`, "important");
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
    window.visualViewport?.addEventListener("resize", () => {
      measureSection();
      updateTrack();
    });
  }

  const parallaxItems = $$("[data-parallax]");
  if (parallaxItems.length && !reduceMotion) {
    const parallaxDesktop = window.matchMedia("(min-width: 981px)");
    let ticking = false;
    const updateParallax = () => {
      ticking = false;
      if (!parallaxDesktop.matches) {
        parallaxItems.forEach((item) => {
          item.style.transform = "";
        });
        return;
      }
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
    parallaxDesktop.addEventListener("change", updateParallax);
  }
})();
