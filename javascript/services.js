/* ==========================================================================
   Moe's Movers — Services page
   ========================================================================== */

/* ---------- Services carousel ----------
   Moves one card every 4 seconds and loops back to the start at the end.
   Pauses while hovered or focused, for a few seconds after the visitor
   swipes or clicks, when off screen, and when the pause button is on.
   Reduced motion: no autoplay, the arrows and swipe still work. */
(function () {
    const section = document.querySelector(".services-list");
    const track = document.getElementById("services-track");
    if (!section || !track) return;

    const cards = [...track.children];
    const dotsWrap = section.querySelector(".services-dots");
    const pauseButton = section.querySelector(".services-pause");
    const INTERVAL = 4000;
    const RESUME_AFTER = 6000;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let timer = null;
    let resumeTimer = null;
    let hovering = false;
    let onScreen = false;
    let paused = reducedMotion;

    // How many cards fit, so the last "page" doesn't overshoot
    const perView = () => Math.max(1, Math.round(track.clientWidth / cards[0].offsetWidth));
    const maxIndex = () => cards.length - perView();
    const offsetOf = (i) => cards[i].offsetLeft - cards[0].offsetLeft;

    const current = () => {
        let best = 0;
        cards.forEach((card, i) => {
            if (Math.abs(offsetOf(i) - track.scrollLeft) < Math.abs(offsetOf(best) - track.scrollLeft)) best = i;
        });
        return best;
    };

    function goTo(i) {
        const target = i > maxIndex() ? 0 : i < 0 ? maxIndex() : i;
        track.scrollTo({ left: offsetOf(target), behavior: reducedMotion ? "auto" : "smooth" });
    }

    /* Dots: one per resting position */
    let dots = [];
    function buildDots() {
        dotsWrap.innerHTML = "";
        dots = Array.from({ length: maxIndex() + 1 }, (_, i) => {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.className = "services-dot";
            dot.setAttribute("aria-label", `Show service ${i + 1}`);
            dot.addEventListener("click", () => {
                goTo(i);
                holdAutoplay();
            });
            dotsWrap.appendChild(dot);
            return dot;
        });
        updateDots();
    }

    const currentLabel = section.querySelector("#services-current");
    const totalLabel = section.querySelector("#services-total");
    const nameLabel = section.querySelector("#services-name");
    const pad = (n) => String(n).padStart(2, "0");
    let lastActive = -1;

    function updateDots() {
        const active = Math.min(current(), maxIndex());
        dots.forEach((dot, i) => {
            dot.classList.toggle("is-active", i === active);
            dot.setAttribute("aria-current", String(i === active));
        });
        // Counter shows the first service in view, out of all five
        const first = current();
        if (totalLabel) totalLabel.textContent = pad(cards.length);
        if (currentLabel) currentLabel.textContent = pad(first + 1);
        if (nameLabel) nameLabel.textContent = cards[first].querySelector(".service-card-title")?.textContent.trim() || "";
        if (active !== lastActive) {
            lastActive = active;
            restartProgress();
        }
    }

    // Restart the active segment's fill so it lines up with the next 4-second step
    function restartProgress() {
        if (!section.classList.contains("is-running")) return;
        section.classList.remove("is-running");
        void section.offsetWidth;
        section.classList.add("is-running");
    }

    /* Autoplay */
    const stop = () => {
        clearInterval(timer);
        section.classList.remove("is-running");
    };
    function start() {
        stop();
        if (paused || hovering || !onScreen || document.hidden) return;
        section.classList.add("is-running");
        restartProgress();
        timer = setInterval(() => goTo(current() + 1), INTERVAL);
    }

    function holdAutoplay() {
        stop();
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(start, RESUME_AFTER);
    }

    section.querySelectorAll("[data-services]").forEach((button) => {
        button.addEventListener("click", () => {
            goTo(current() + (button.dataset.services === "next" ? 1 : -1));
            holdAutoplay();
        });
    });

    pauseButton.addEventListener("click", () => {
        paused = !paused;
        section.classList.toggle("is-paused", paused);
        pauseButton.setAttribute("aria-pressed", String(paused));
        pauseButton.setAttribute("aria-label", `${paused ? "Play" : "Pause"} the services carousel`);
        paused ? stop() : start();
    });
    if (paused) {
        section.classList.add("is-paused");
        pauseButton.setAttribute("aria-pressed", "true");
        pauseButton.setAttribute("aria-label", "Play the services carousel");
    }

    track.addEventListener("mouseenter", () => { hovering = true; stop(); });
    track.addEventListener("mouseleave", () => { hovering = false; start(); });
    track.addEventListener("focusin", stop);
    track.addEventListener("focusout", start);
    ["pointerdown", "wheel", "touchstart"].forEach((type) => track.addEventListener(type, holdAutoplay, { passive: true }));

    let scrollTimer;
    track.addEventListener("scroll", () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(updateDots, 80);
    }, { passive: true });

    new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        onScreen ? start() : stop();
    }, { threshold: 0.3 }).observe(track);

    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

    let resizeTimer;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(buildDots, 150);
    });

    buildDots();
})();
