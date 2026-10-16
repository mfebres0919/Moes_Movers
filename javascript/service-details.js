/* ==========================================================================
   Moe's Movers — Service detail pages
   ========================================================================== */

/* ---------- Sidebar pin ----------
   Pins below the menu bar. If the sidebar is taller than the space left on
   screen, it pins by its bottom edge instead, so all of it can be seen. */
(function () {
    const inner = document.querySelector(".sd-sidebar-inner");
    if (!inner) return;
    const NAV = 120;
    const GAP = 24;
    function update() {
        const top = Math.min(NAV, window.innerHeight - inner.offsetHeight - GAP);
        inner.style.setProperty("--sd-top", `${top}px`);
    }
    update();
    window.addEventListener("resize", update);
    new ResizeObserver(update).observe(inner);
})();

/* ---------- FAQ accordion ----------
   Smooth height animation open and closed; one item open at a time.
   Without JavaScript the <details> still work, just without the motion. */
(function () {
    const items = [...document.querySelectorAll(".sd-faq-item")];
    if (!items.length) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const summaryHeight = (item) => item.querySelector("summary").offsetHeight;

    function animate(item, from, to, done) {
        item.animation?.cancel();
        if (reducedMotion.matches) return done?.();
        item.style.overflow = "hidden";
        item.animation = item.animate({ height: [`${from}px`, `${to}px`] }, { duration: 360, easing: "cubic-bezier(0.4, 0, 0.2, 1)" });
        item.animation.onfinish = () => { item.animation = null; item.style.overflow = ""; done?.(); };
        item.animation.oncancel = () => { item.animation = null; item.style.overflow = ""; };
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

/* ---------- Sidebar "Get a free consultation" form ----------
   TODO: connect to Moe's form handler; for now it validates and thanks the visitor. */
(function () {
    const form = document.getElementById("sd-quick-form");
    const success = document.getElementById("sd-quick-success");
    if (!form || !success) return;
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const invalid = [...form.elements].find((field) => field.willValidate && !field.checkValidity());
        if (invalid) {
            invalid.reportValidity();
            return;
        }
        form.hidden = true;
        success.hidden = false;
        success.focus();
    });
})();
