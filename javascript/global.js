/* ==========================================================================
   Moe's Movers — Global Scripts
   Shared behavior: top bar links, mobile menu, dropdowns, sticky navbar.
   ========================================================================== */

/* ---------- Loading screen: counts to 100% while the truck drives across ---------- */
(function () {
    const loader = document.getElementById("loader");
    // Plays once per visit: skipped if it already ran this session
    if (loader && document.documentElement.classList.contains("loader-seen")) loader.remove();
    if (!loader || !loader.isConnected) {
        document.dispatchEvent(new Event("loader:done"));
        return;
    }

    const percentText = document.getElementById("loader-percent");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const MIN_TIME = reduceMotion ? 0 : 500; // long enough to see the truck, short enough not to hold up the page
    const start = performance.now();

    // Track only the loader's own images (logo, truck) plus the web fonts. The hero
    // photo keeps loading behind it, so the loader never waits on a big download.
    const images = [...loader.querySelectorAll("img")];
    let total = images.length + 1; // + fonts
    let done = 0;

    function tick() {
        done = Math.min(done + 1, total);
    }

    images.forEach((img) => {
        if (img.complete) {
            tick();
        } else {
            img.addEventListener("load", tick, { once: true });
            img.addEventListener("error", tick, { once: true });
        }
    });

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(tick);
    } else {
        tick();
    }

    let shown = 0;

    function finish() {
        try { sessionStorage.setItem("loaderSeen", "1"); } catch (e) { /* storage blocked */ }
        loader.classList.add("is-done");
        setTimeout(() => {
            loader.classList.add("is-hidden");
            document.dispatchEvent(new Event("loader:done"));
            setTimeout(() => loader.remove(), 700);
        }, reduceMotion ? 0 : 200);
    }

    function step() {
        const elapsed = performance.now() - start;
        const timeShare = MIN_TIME ? Math.min(elapsed / MIN_TIME, 1) : 1;
        const assetShare = done / total;
        // Never run ahead of real loading or the minimum time; ease the number toward the target
        const target = Math.min(timeShare, assetShare) * 100;
        shown += (target - shown) * 0.18;
        if (target - shown < 0.5) shown = target;

        const value = Math.floor(shown);
        percentText.textContent = value;
        loader.style.setProperty("--progress", (shown / 100).toFixed(3));

        if (value >= 100) {
            finish();
        } else {
            requestAnimationFrame(step);
        }
    }

    // Stop the CSS failsafe now that JavaScript is running the show
    loader.style.animation = "none";
    requestAnimationFrame(step);
})();

(function () {
    const header = document.getElementById("site-header");
    if (!header) return;

    const topbar = header.querySelector(".topbar");
    const topbarToggle = header.querySelector(".topbar-toggle");
    const menuToggle = document.getElementById("menu-toggle");
    const siteMenu = document.getElementById("site-menu");
    const dropdownItems = header.querySelectorAll(".has-dropdown");
    const desktopQuery = window.matchMedia("(min-width: 80rem)");

    /* ---------- Top bar "Useful links" (mobile) ---------- */
    topbarToggle.addEventListener("click", () => {
        const isOpen = topbar.classList.toggle("is-open");
        topbarToggle.setAttribute("aria-expanded", String(isOpen));
    });

    /* ---------- Dropdowns ---------- */
    function setDropdown(item, open) {
        item.classList.toggle("is-open", open);
        item.querySelector(".dropdown-toggle").setAttribute("aria-expanded", String(open));
    }

    function closeAllDropdowns(except) {
        dropdownItems.forEach((item) => {
            if (item !== except) setDropdown(item, false);
        });
    }

    dropdownItems.forEach((item) => {
        item.querySelector(".dropdown-toggle").addEventListener("click", () => {
            const willOpen = !item.classList.contains("is-open");
            closeAllDropdowns(item);
            setDropdown(item, willOpen);
        });
    });

    /* ---------- Mobile menu ---------- */
    function setMenu(open) {
        // The panel starts lower while the top bar is showing; fit it to the space left
        if (open) siteMenu.style.setProperty("--menu-top", `${Math.max(0, siteMenu.offsetParent?.getBoundingClientRect().bottom ?? 72)}px`);
        siteMenu.classList.toggle("is-open", open);
        menuToggle.setAttribute("aria-expanded", String(open));
        document.body.classList.toggle("menu-open", open && !desktopQuery.matches);
        if (!open) closeAllDropdowns();
    }

    menuToggle.addEventListener("click", () => {
        setMenu(!siteMenu.classList.contains("is-open"));
    });

    // Close everything after following a link
    siteMenu.addEventListener("click", (event) => {
        if (event.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        const openDropdown = header.querySelector(".has-dropdown.is-open");
        if (openDropdown) {
            setDropdown(openDropdown, false);
            openDropdown.querySelector(".dropdown-toggle").focus();
        } else if (siteMenu.classList.contains("is-open")) {
            setMenu(false);
            menuToggle.focus();
        }
    });

    // Clicking outside the header closes any open menu or dropdown
    document.addEventListener("click", (event) => {
        if (!header.contains(event.target)) setMenu(false);
    });

    // Reset mobile state when resizing up to desktop
    desktopQuery.addEventListener("change", () => setMenu(false));

    /* ---------- Sticky navbar once the top bar scrolls away ---------- */
    const observer = new IntersectionObserver(([entry]) => {
        header.classList.toggle("is-scrolled", !entry.isIntersecting);
    });
    observer.observe(topbar);
})();

/* ---------- Back to top button: shows after the first screen ---------- */
(function () {
    const button = document.getElementById("back-to-top");
    if (!button) return;

    function update() {
        button.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.8);
    }

    window.addEventListener("scroll", update, { passive: true });
    update();
})();

/* ---------- Footer year stays current ---------- */
(function () {
    const year = document.getElementById("footer-year");
    if (year) year.textContent = new Date().getFullYear();
})();

/* ---------- Header logo: click to go home ----------
   The logo isn't a link, so checkers don't count it as a duplicate of the
   "Home" link beside it (it's hidden from keyboards and screen readers). */
(function () {
    const brand = document.querySelector(".brand[data-href]");
    if (!brand) return;
    brand.addEventListener("click", () => {
        const target = brand.dataset.href;
        if (target === "#top") {
            if (window.lenis) window.lenis.scrollTo(0);
            else window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            window.location.href = target;
        }
    });
})();

/* ---------- Highlight the nav link for the section on screen ----------
   Off for now: the menu links will go to separate pages (About, Services,
   Our Work, Contact), so Home stays highlighted on the homepage. */

/* ---------- Scroll reveal: fade content in as it enters the screen ----------
   Plays every time: once something has scrolled fully off screen it resets,
   so it fades in again when the visitor scrolls back to it. */
(function () {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    // [selector, direction, stagger in seconds between matches, restart the stagger every N matches]
    const groups = [
        // (Hero content isn't listed: it's on screen at load, so it shows at once)
        [".about-story-content > *", "left", 0.08],
        [".about-story-photo", "right", 0],
        [".about-accordion-item", "up", 0.1],
        [".about-features", "up", 0],
        [".services-list-header > *", "up", 0.1],
        [".services-grid", "up", 0],
        [".sd-main > *", "up", 0.05, 4],
        [".sd-card", "left", 0.08],
        [".sd-benefit", "up", 0.1],
        [".services-controls", "up", 0],
        [".about-process-header > *", "up", 0.1],
        [".process-step", "up", 0.15],
        [".about-crew-intro > *", "left", 0.08],
        [".crew-marquee", "up", 0],
        // Animate the wrapper, not the card: moving the card itself would lift its red glow (::before) on top of it
        [".quote > .container", "up", 0],
        [".about-media", "left", 0],
        [".about-content > *", "right", 0.08],
        [".projects-header > *", "up", 0.1],
        [".project-filters", "up", 0],
        [".project-card", "up", 0.1, 3],
        [".areas-intro > *", "left", 0.08],
        [".map-card", "right", 0],
        [".map-ticker", "up", 0],
        [".process-header > *", "up", 0.1],
        [".process-details, .process-cta", "left", 0.15],
        [".process-showcase", "zoom", 0],
        [".storage-spotlight-media", "left", 0],
        [".storage-spotlight-content", "right", 0.1],
        [".process-stats", "up", 0],
        [".reviews-header > *", "up", 0.1],
        [".reviews-carousel", "up", 0.15],
        [".reviews-footer", "up", 0],
        [".final-cta-visual", "left", 0],
        [".final-cta-content > *", "right", 0.1],
        [".contact-info", "left", 0],
        [".contact-form-wrap", "right", 0.1],
        [".footer-grid > *", "up", 0.08],
    ];

    const targets = [];
    groups.forEach(([selector, direction, stagger, every]) => {
        document.querySelectorAll(selector).forEach((element, i) => {
            if (element.dataset.revealDir) return; // already in an earlier group
            element.dataset.revealDir = direction;
            element.dataset.reveal = direction;
            element.style.setProperty("--reveal-delay", `${(every ? i % every : i) * stagger}s`);
            targets.push(element);
        });
    });

    document.documentElement.classList.add("reveal-ready");

    // Fade in once a little of it is on screen
    const showObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const element = entry.target;
            if (element.classList.contains("is-revealed") || !element.dataset.reveal) return;
            element.classList.add("is-revealed");

            // Once finished, drop the reveal styles so the element's own transitions work normally
            element.addEventListener("transitionend", function cleanup(event) {
                if (event.target !== element || event.propertyName !== "filter") return;
                element.removeEventListener("transitionend", cleanup);
                if (!element.classList.contains("is-revealed")) return; // reset again before it finished
                element.removeAttribute("data-reveal");
                element.classList.remove("is-revealed");
            });
        });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });

    // Reset only when completely off screen, so nothing visibly fades out
    const hideObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) return;
            const element = entry.target;
            element.classList.remove("is-revealed");
            element.dataset.reveal = element.dataset.revealDir;
        });
    }, { threshold: 0 });

    // Start once the loading screen is gone, so the hero animates in right as the site appears
    const loader = document.getElementById("loader");
    function start() {
        targets.forEach((element) => {
            showObserver.observe(element);
            hideObserver.observe(element);
        });
    }
    if (loader) {
        document.addEventListener("loader:done", start, { once: true });
    } else {
        start();
    }
})();

/* ---------- Send a form to Netlify Forms ----------
   Netlify finds forms marked data-netlify="true" when the site deploys and
   emails each submission to the addresses set under Site configuration >
   Notifications. Checkbox groups are joined into one line ("Packing,
   Furniture assembly") so they read cleanly in the email. Disabled fields
   (questions that don't apply) are left out. Resolves true on success. */
window.sendToNetlify = function (form) {
    const values = new Map();
    new FormData(form).forEach((value, key) => {
        values.set(key, values.has(key) ? `${values.get(key)}, ${value}` : value);
    });
    return fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams([...values]).toString()
    }).then((response) => response.ok).catch(() => false);
};

/* ---------- Form -> "sent" message transition (quote and contact forms) ----------
   setSending() swaps the button label to "Sending…" while the request is out;
   showFormSuccess() fades the form out, then reveals the confirmation with
   its entrance animation (css/global.css). Reduced motion: an instant swap. */
window.setSending = function (button, on) {
    const label = button.querySelector(".btn-label, .quote-next-label");
    if (label) {
        if (on) {
            label.dataset.text = label.textContent;
            label.textContent = "Sending\u2026";
        } else if (label.dataset.text) {
            label.textContent = label.dataset.text;
        }
    }
    button.disabled = on;
    button.classList.toggle("is-sending", on);
    button.toggleAttribute("aria-busy", on);
};

window.showFormSuccess = function (form, success) {
    const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    form.classList.add("form-leaving");
    setTimeout(() => {
        form.hidden = true;
        form.classList.remove("form-leaving");
        success.hidden = false;
        success.classList.add("form-success-in");
        success.focus({ preventScroll: true });
    }, instant ? 0 : 300);
};

/* ---------- Contact form (general questions; homepage and contact page) ---------- */
(function () {
    const form = document.getElementById("contact-form");
    if (!form) return;

    const success = document.getElementById("contact-success");
    const successName = document.getElementById("contact-success-name");

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        // Show the browser's message on the first field that needs attention
        const invalid = [...form.elements].find((field) => field.willValidate && !field.checkValidity());
        if (invalid) {
            invalid.reportValidity();
            return;
        }

        const button = form.querySelector('[type="submit"]');
        window.setSending(button, true);
        window.sendToNetlify(form).then((sent) => {
            window.setSending(button, false);
            if (!sent) {
                alert("Sorry, your message didn't go through. Please try again, or call us at (979) 888-8887.");
                return;
            }
            successName.textContent = document.getElementById("contact-first").value.trim() || "neighbor";
            window.showFormSuccess(form, success);
        });
    });
})();

/* ---------- Reviews: two rows, continuous scroll ----------
   Each row ([data-reviews]) runs on its own; the second slides the other
   way (CSS). Each track holds two identical halves and CSS slides it left by exactly
   one half (-50%), so it loops seamlessly. Each half repeats the review
   cards as many times as needed to be wider than the screen, so the end of
   the track never comes into view, even on very wide monitors. The loop
   time is set from the half's width so the speed stays the same (40px a
   second) at any size. Rebuilt when the window is resized. Copies are
   hidden from screen readers. Pauses on hover and while a card is pressed.
   Reduced motion: no animation; the row scrolls by hand. */
document.querySelectorAll("[data-reviews]").forEach((root) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const track = root.querySelector(".reviews-track");
    const originals = [...track.children];
    const SPEED = 40; // px per second

    const addCopy = (card) => {
        const copy = card.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        copy.dataset.copy = "";
        track.appendChild(copy);
    };

    function build() {
        track.querySelectorAll("[data-copy]").forEach((copy) => copy.remove());
        root.classList.add("is-looping");
        // Width of one set, measured from the cards themselves (Safari reports
        // the wrong scrollWidth for this track)
        const setWidth = originals.reduce((sum, card) => {
            const style = getComputedStyle(card);
            return sum + card.getBoundingClientRect().width + parseFloat(style.marginRight);
        }, 0);
        // Sets per half: enough to cover the screen plus one more card
        const perHalf = Math.max(1, Math.ceil((window.innerWidth + 480) / setWidth));
        for (let i = 1; i < perHalf * 2; i++) originals.forEach(addCopy);
        track.style.animationDuration = `${(setWidth * perHalf) / SPEED}s`;
    }

    build();
    let lastWidth = window.innerWidth;
    let resizeTimer;
    window.addEventListener("resize", () => {
        if (window.innerWidth === lastWidth) return; // ignore phone toolbar show/hide
        lastWidth = window.innerWidth;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(build, 200);
    });
});

/* ---------- Current page in the menu ----------
   Highlights the menu link for the page being viewed, so every page (and any
   new one) marks itself automatically. On a service detail page, "Services"
   is highlighted and the matching service is marked in the dropdown. */
(function () {
    const menu = document.getElementById("site-menu");
    if (!menu) return;

    // Page name without ".html": Netlify's pretty URLs serve and link pages
    // with or without the extension, so both forms must match
    const file = (url) => new URL(url, location.href).pathname.split("/").pop().replace(/\.html$/, "") || "index";
    const here = file(location.href);
    if (here === "index") return; // the homepage marks Home in its HTML

    const navLinks = [...menu.querySelectorAll(".nav-link")];
    const isServicePage = here.startsWith("service-");
    const target = navLinks.find((link) => file(link.href) === (isServicePage ? "services" : here) && !link.hash);
    if (!target) return;

    navLinks.forEach((link) => {
        link.classList.toggle("is-active", link === target);
        if (link !== target) link.removeAttribute("aria-current");
    });
    if (!isServicePage) target.setAttribute("aria-current", "page");
    else target.removeAttribute("aria-current");

    menu.querySelectorAll(".dropdown a").forEach((link) => {
        if (file(link.href) === here && !link.hash) {
            link.classList.add("is-current");
            link.setAttribute("aria-current", "page");
        }
    });
})();

/* ---------- Projects: filter by service (homepage and Gallery page) ---------- */
(function () {
    const filters = document.querySelectorAll(".project-filter");
    const cards = document.querySelectorAll(".project-card");
    filters.forEach((button) => {
        button.addEventListener("click", () => {
            const type = button.dataset.filter;
            filters.forEach((b) => {
                b.classList.toggle("is-active", b === button);
                b.setAttribute("aria-pressed", String(b === button));
            });
            cards.forEach((card) => {
                card.hidden = type !== "all" && card.dataset.category !== type;
            });
        });
    });
})();

/* ---------- Photo viewer for project photos ----------
   Each project card gets a "view larger" button. The photo opens full
   screen with its title; arrows (or the arrow keys) step through the
   photos that are currently showing, and the X, Esc, or a click on the
   dark backdrop closes it. Focus returns to the photo that was opened. */
(function () {
    const cards = [...document.querySelectorAll(".project-card, .crew-slide")];
    if (!cards.length || typeof HTMLDialogElement === "undefined") return;

    const svg = (path) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
    const dialog = document.createElement("dialog");
    dialog.className = "lightbox";
    dialog.setAttribute("aria-label", "Project photo");
    dialog.innerHTML = `
        <button class="lightbox-close" type="button" aria-label="Close photo">${svg('<path d="M6 6l12 12M18 6 6 18"/>')}</button>
        <button class="lightbox-nav lightbox-prev" type="button" aria-label="Previous photo">${svg('<path d="m15 6-6 6 6 6"/>')}</button>
        <button class="lightbox-nav lightbox-next" type="button" aria-label="Next photo">${svg('<path d="m9 6 6 6-6 6"/>')}</button>
        <figure class="lightbox-figure">
            <img class="lightbox-img" alt="">
            <figcaption class="lightbox-caption">
                <p class="lightbox-title"></p>
                <p class="lightbox-place"></p>
                <p class="lightbox-count"></p>
            </figcaption>
        </figure>`;
    document.body.appendChild(dialog);

    const img = dialog.querySelector(".lightbox-img");
    const title = dialog.querySelector(".lightbox-title");
    const place = dialog.querySelector(".lightbox-place");
    const count = dialog.querySelector(".lightbox-count");
    let list = [];
    let index = 0;
    let opener = null;

    function show(i) {
        index = (i + list.length) % list.length;
        const card = list[index];
        const source = card.querySelector("img");
        // Always show the full-size photo, not the smaller phone copy (-480 / -640) the page loaded
        img.src = (source.currentSrc || source.src).replace(/-(?:480|640)(\.\w+)$/, "$1");
        img.alt = source.alt;
        title.textContent = (card.querySelector(".project-title, figcaption")?.textContent || "").trim();
        place.textContent = card.querySelector(".project-place")?.textContent || "";
        count.textContent = `${index + 1} / ${list.length}`;
        img.style.animation = "none";
        void img.offsetWidth; // restart the zoom-in for each photo
        img.style.animation = "";
    }

    function open(card) {
        // Only photos in the current filter, and never the hidden marquee copies
        list = cards.filter((c) => !c.hidden && !c.closest('[aria-hidden="true"]') && c.matches(card.matches(".crew-slide") ? ".crew-slide" : ".project-card"));
        // A click on a marquee copy opens its original
        if (!list.includes(card)) card = list.find((c) => c.querySelector("img").src === card.querySelector("img").src) || list[0];
        opener = card.querySelector(".project-zoom");
        show(list.indexOf(card));
        dialog.showModal();
        document.documentElement.classList.add("lightbox-open");
        window.lenis?.stop();
    }

    dialog.addEventListener("close", () => {
        document.documentElement.classList.remove("lightbox-open");
        window.lenis?.start();
        opener?.focus({ preventScroll: true });
    });

    cards.forEach((card) => {
        const name = (card.querySelector(".project-title, figcaption")?.textContent || "project").trim();
        const button = document.createElement("button");
        button.type = "button";
        button.className = "project-zoom";
        button.setAttribute("aria-label", `View larger photo: ${name}`);
        button.innerHTML = `<span class="project-zoom-icon">${svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M11 8v6M8 11h6"/>')}</span>`;
        if (card.closest('[aria-hidden="true"]')) button.tabIndex = -1; // marquee copies stay out of the tab order
        button.addEventListener("click", () => open(card));
        card.appendChild(button);
    });

    dialog.querySelector(".lightbox-close").addEventListener("click", () => dialog.close());
    dialog.querySelector(".lightbox-prev").addEventListener("click", () => show(index - 1));
    dialog.querySelector(".lightbox-next").addEventListener("click", () => show(index + 1));
    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") show(index - 1);
        if (event.key === "ArrowRight") show(index + 1);
    });
})();

/* ---------- Brush underlines (.ink-mark) draw in when the heading is on screen ---------- */
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
