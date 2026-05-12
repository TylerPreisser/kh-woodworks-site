(function () {
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  if (scrollTrack && scrollSection && !reduceMotion) {
    let progress = 0;
    const measureSection = () => {
      const maxTravel = Math.max(0, scrollTrack.scrollWidth - window.innerWidth + 96);
      scrollSection.style.height = `${window.innerHeight - 68}px`;
      return maxTravel;
    };
    const updateTrack = (nextProgress = progress) => {
      const maxTravel = Math.max(0, scrollTrack.scrollWidth - window.innerWidth + 96);
      progress = Math.min(1, Math.max(0, nextProgress));
      scrollTrack.style.transform = `translate3d(${-maxTravel * progress}px,0,0)`;
    };
    measureSection();
    updateTrack();
    window.addEventListener("wheel", (event) => {
      if (window.innerWidth < 981) return;
      const rect = scrollSection.getBoundingClientRect();
      const navOffset = 68;
      const isActive = rect.top <= navOffset + 2 && rect.bottom >= window.innerHeight * 0.62;
      if (!isActive) return;
      if ((event.deltaY < 0 && progress <= 0) || (event.deltaY > 0 && progress >= 1)) return;
      event.preventDefault();
      updateTrack(progress + event.deltaY / 2200);
    }, { passive: false });
    window.addEventListener("resize", () => {
      measureSection();
      updateTrack();
    });
  }
})();
