(function () {
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  // ── Theme toggle: dark/light mode ──
  const THEME_KEY = "kh-theme";
  const html = document.documentElement;

  const applyTheme = (theme) => {
    html.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
    // Sync the meta theme-color for iOS chrome.
    // On mobile (≤640px) the html background is --mobile-shell (#161210 dark, #f7f1e8 light).
    // Using the mobile-shell dark value ensures the Safari toolbar matches the page canvas
    // and prevents a mismatched bar above the floating pill nav.
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", theme === "dark" ? "#161210" : "#f7f1e8");
    }
  };

  const getInitialTheme = () => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") return stored;
    // Fall back to OS preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  // Apply on initial load (before paint)
  applyTheme(getInitialTheme());

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const siteNav = document.querySelector("[data-site-nav]");
  if (siteNav) {
    const heroLogo = document.querySelector(".hero__logo");
    let navTicking = false;
    const setNavState = () => {
      navTicking = false;
      const scrolled = window.scrollY > 12;
      const showLogo = heroLogo ? heroLogo.getBoundingClientRect().bottom <= siteNav.offsetHeight + 10 : true;
      siteNav.classList.toggle("is-scrolled", scrolled);
      siteNav.classList.toggle("is-logo-visible", showLogo);
    };
    const requestNavState = () => {
      if (!navTicking) {
        navTicking = true;
        requestAnimationFrame(setNavState);
      }
    };
    setNavState();
    window.addEventListener("scroll", requestNavState, { passive: true });
    window.addEventListener("resize", requestNavState);

    const navBar = siteNav.querySelector(".nav__bar");
    const primaryNav = siteNav.querySelector(".nav__links");
    const brand = siteNav.querySelector(".brand");
    const quote = siteNav.querySelector(".nav__quote");
    if (navBar && primaryNav && !siteNav.querySelector(".nav__menu")) {
      const menuButton = document.createElement("button");
      menuButton.className = "nav__menu";
      menuButton.type = "button";
      menuButton.setAttribute("aria-label", "Open menu");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.innerHTML = "<span></span><span></span><span></span>";
      navBar.appendChild(menuButton);

      // Dropdown panel (replaces full-screen overlay)
      // Positioned below the nav pill via CSS fixed positioning.
      const overlay = document.createElement("div");
      overlay.className = "menu-overlay";
      overlay.setAttribute("aria-hidden", "true");
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-label", "Navigation menu");

      // Body: nav links + contact — no duplicate header
      const body = document.createElement("div");
      body.className = "menu-overlay__body";
      const overlayNav = document.createElement("nav");
      overlayNav.setAttribute("aria-label", "Mobile navigation");
      $$("a", primaryNav).forEach((link) => {
        const clone = link.cloneNode(true);
        clone.removeAttribute("class");
        clone.removeAttribute("aria-current");
        overlayNav.appendChild(clone);
      });

      const contact = document.createElement("div");
      contact.className = "menu-overlay__contact";
      const label = document.createElement("span");
      label.textContent = "Contact";
      const callLink = document.createElement("a");
      callLink.href = "tel:7858290504";
      callLink.textContent = "785-829-0504";
      const quoteLink = document.createElement("a");
      quoteLink.href = quote ? quote.getAttribute("href") || "contact.html" : "contact.html";
      quoteLink.textContent = "Request a Quote";
      const instagramLink = document.createElement("a");
      instagramLink.href = "https://www.instagram.com/kh_woodworks_co/";
      instagramLink.target = "_blank";
      instagramLink.rel = "noopener";
      instagramLink.textContent = "Instagram";
      const facebookLink = document.createElement("a");
      facebookLink.href = "https://www.facebook.com/KHWoodworksCo/";
      facebookLink.target = "_blank";
      facebookLink.rel = "noopener";
      facebookLink.textContent = "Facebook";
      contact.append(label, callLink, quoteLink, instagramLink, facebookLink);

      body.append(overlayNav, contact);
      overlay.append(body);
      siteNav.insertAdjacentElement("afterend", overlay);

      const closeMenu = () => {
        document.body.classList.remove("nav-open");
        overlay.classList.remove("is-open");
        overlay.setAttribute("aria-hidden", "true");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open menu");
      };
      const openMenu = () => {
        document.body.classList.add("nav-open");
        overlay.classList.add("is-open");
        overlay.setAttribute("aria-hidden", "false");
        menuButton.setAttribute("aria-expanded", "true");
        menuButton.setAttribute("aria-label", "Close menu");
      };
      menuButton.addEventListener("click", () => {
        if (overlay.classList.contains("is-open")) closeMenu();
        else openMenu();
      });
      // Close when tapping a nav link
      overlay.addEventListener("click", (event) => {
        if (event.target.closest("a")) closeMenu();
      });
      // Close when tapping the scrim (body::after) — scrim is below z-index 45 but
      // body.nav-open scroll-lock means the only scroll/tap target visible is the scrim.
      // We catch clicks on the document that DON'T land inside the overlay or nav.
      document.addEventListener("click", (event) => {
        if (
          overlay.classList.contains("is-open") &&
          !overlay.contains(event.target) &&
          !siteNav.contains(event.target)
        ) {
          closeMenu();
        }
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMenu();
      });
    }
  }

  // Wire up ALL theme toggle buttons (one per page, inside .nav__actions)
  $$(".nav__theme-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const isDark = html.hasAttribute("data-theme") && html.getAttribute("data-theme") === "dark";
      const next = isDark ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    });
  });

  const heroVideo = document.querySelector(".hero__video");
  if (heroVideo) {
    heroVideo.muted = true;
    heroVideo.defaultMuted = true;
    heroVideo.autoplay = true;
    heroVideo.playsInline = true;
    const heroViewport = window.matchMedia("(max-width: 640px)");
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const shouldLoadVideo = !reduceMotion;
    const updateHeroPoster = () => {
      const poster = heroViewport.matches ? heroVideo.dataset.posterMobile : heroVideo.dataset.posterDesktop;
      if (poster && heroVideo.getAttribute("poster") !== poster) heroVideo.setAttribute("poster", poster);
    };
    const sourceForViewport = () => {
      const sources = $$("source", heroVideo).filter((source) => {
        const media = source.getAttribute("media");
        const type = source.getAttribute("type");
        return (!media || window.matchMedia(media).matches) && (!type || heroVideo.canPlayType(type));
      });
      return sources[0]?.getAttribute("src");
    };
    const playHeroVideo = () => {
      heroVideo.muted = true;
      heroVideo.defaultMuted = true;
      heroVideo.setAttribute("autoplay", "");
      heroVideo.setAttribute("playsinline", "");
      heroVideo.setAttribute("webkit-playsinline", "");
      const playAttempt = heroVideo.play();
      if (playAttempt && typeof playAttempt.catch === "function") playAttempt.catch(() => {});
    };
    const syncHeroVideoSource = () => {
      updateHeroPoster();
      if (!shouldLoadVideo) {
        heroVideo.removeAttribute("src");
        heroVideo.classList.add("is-poster-only");
        return;
      }
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
    window.addEventListener("load", () => {
      if (shouldLoadVideo) playHeroVideo();
    }, { once: true });
    heroViewport.addEventListener("change", syncHeroVideoSource);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && shouldLoadVideo) playHeroVideo();
    });
  }

  const motionTargets = $$(".atelier-shot, .story-panel");
  motionTargets.forEach((element, index) => {
    if (!element.classList.contains("reveal")) element.classList.add("motion-reveal");
    element.style.setProperty("--reveal-delay", `${Math.min(index, 8) * 55}ms`);
  });

  if (!reduceMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });
    $$(".reveal, .motion-reveal").forEach((element) => observer.observe(element));
  } else {
    $$(".reveal, .motion-reveal").forEach((element) => element.classList.add("is-in"));
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
    const sticky = scrollSection.querySelector(".service-scroll__sticky");
    let maxTravel = 0;
    let maxScroll = 1;
    let sectionStart = 0;
    let ticking = false;
    let measureQueued = false;
    let lastViewportWidth = Math.round(document.documentElement.clientWidth || window.innerWidth || 1);
    const navHeight = () => nav ? nav.offsetHeight : 68;
    const viewportWidth = () => Math.round(document.documentElement.clientWidth || window.innerWidth || 1);
    const viewportHeight = () => Math.round(window.innerHeight || document.documentElement.clientHeight || 1);
    const setTrackPosition = (travel) => {
      const rounded = Math.round(travel * 1000) / 1000;
      scrollTrack.style.setProperty("transform", `translate3d(${-rounded}px,0,0)`, "important");
    };
    const updateTrack = () => {
      ticking = false;
      if (reduceMotion) return;
      const progress = Math.min(1, Math.max(0, ((window.scrollY || window.pageYOffset || 0) - sectionStart) / maxScroll));
      setTrackPosition(maxTravel * progress);
    };
    const requestTrackUpdate = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateTrack);
      }
    };
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
      const stickyHeight = Math.max(1, Math.round(sticky?.offsetHeight || viewportHeight()));
      maxTravel = Math.max(0, Math.ceil(scrollTrack.scrollWidth - viewportWidth()));
      scrollSection.style.setProperty("--nav-h", `${navHeight()}px`);
      scrollSection.style.setProperty("--service-scroll-height", `${Math.ceil(stickyHeight + maxTravel)}px`);
      scrollSection.style.height = `${Math.ceil(stickyHeight + maxTravel)}px`;
      sectionStart = scrollSection.offsetTop;
      maxScroll = Math.max(1, scrollSection.offsetHeight - stickyHeight);
      updateTrack();
      return true;
    };
    const requestMeasure = () => {
      if (!measureQueued) {
        measureQueued = true;
        requestAnimationFrame(() => {
          measureQueued = false;
          measureSection();
        });
      }
    };
    const handleResize = () => {
      const width = viewportWidth();
      const widthChanged = Math.abs(width - lastViewportWidth) > 2;
      const compactLayout = window.matchMedia("(max-width: 980px)").matches;
      lastViewportWidth = width;
      if (!compactLayout || widthChanged) {
        requestMeasure();
      } else {
        requestTrackUpdate();
      }
    };
    measureSection();
    requestTrackUpdate();
    window.addEventListener("scroll", requestTrackUpdate, { passive: true });
    window.addEventListener("resize", handleResize);
    window.addEventListener("load", requestMeasure);
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
