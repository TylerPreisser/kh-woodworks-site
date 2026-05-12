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

  $$(".marquee__track").forEach((track) => {
    track.innerHTML += track.innerHTML;
  });

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
})();
