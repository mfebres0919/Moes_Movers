/* ==========================================================================
   Moe's Movers — About page
   ========================================================================== */

/* ---------- Mission / Vision / Values accordion ----------
   Native <details> snap shut, so the open and close are animated here:
   the item's height glides between its summary row and its full height.
   Only one item is open at a time; opening one smoothly closes the other.
   Without JavaScript the <details> still work, just without the motion. */
(function () {
    const items = [...document.querySelectorAll(".about-accordion-item")];
    if (!items.length) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const DURATION = 380;
    const EASING = "cubic-bezier(0.4, 0, 0.2, 1)";

    // The script handles "one open at a time" itself, so the browser's
    // instant version (the shared name attribute) isn't needed
    items.forEach((item) => item.removeAttribute("name"));

    const summaryHeight = (item) => item.querySelector("summary").offsetHeight;

    function animate(item, from, to, onDone) {
        item.animation?.cancel();
        if (reducedMotion.matches) {
            onDone?.();
            return;
        }
        item.style.overflow = "hidden";
        item.animation = item.animate({ height: [`${from}px`, `${to}px`] }, { duration: DURATION, easing: EASING });
        item.animation.onfinish = () => {
            item.animation = null;
            item.style.overflow = "";
            onDone?.();
        };
        item.animation.oncancel = () => {
            item.animation = null;
            item.style.overflow = "";
        };
    }

    function close(item) {
        if (!item.open) return;
        item.classList.add("is-closing");
        animate(item, item.offsetHeight, summaryHeight(item), () => {
            item.open = false;
            item.classList.remove("is-closing");
        });
    }

    function open(item) {
        const from = item.offsetHeight;
        item.open = true;
        animate(item, from, item.scrollHeight);
    }

    items.forEach((item) => {
        item.querySelector("summary").addEventListener("click", (event) => {
            event.preventDefault();
            if (item.open && !item.classList.contains("is-closing")) {
                close(item);
            } else {
                item.classList.remove("is-closing");
                items.forEach((other) => other !== item && close(other));
                open(item);
            }
        });
    });
})();

/* ---------- Underline under "like our own" draws in when the heading is on screen ---------- */
(function () {
    const marks = document.querySelectorAll(".ink-mark");
    if (!marks.length) return;
    if (!("IntersectionObserver" in window)) {
        marks.forEach((mark) => mark.classList.add("is-drawn"));
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-drawn");
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.8 });
    marks.forEach((mark) => observer.observe(mark));
})();

/* ---------- Process route: the truck drives the full width of the road ---------- */
(function () {
    const route = document.querySelector(".process-route");
    if (!route) return;
    const setWidth = () => route.style.setProperty("--route-width", `${route.offsetWidth}px`);
    setWidth();
    window.addEventListener("resize", setWidth);
})();
