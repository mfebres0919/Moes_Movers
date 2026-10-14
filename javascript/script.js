/* ==========================================================================
   Moe's Movers — Homepage Scripts
   Homepage-only behavior (hero, quote form, map, gallery) lives here.
   ========================================================================== */

/* ---------- Hero background slideshow ---------- */
(function () {
    const hero = document.querySelector(".hero");
    if (!hero) return;

    const slides = hero.querySelectorAll(".hero-slide");
    const bars = hero.querySelectorAll(".hero-indicators span");
    const pauseButton = document.getElementById("hero-pause");
    const duration = parseFloat(getComputedStyle(hero).getPropertyValue("--slide-duration")) * 1000 || 6000;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let current = 0;
    let timer = null;

    function restartBar(bar) {
        bar.classList.remove("is-active");
        void bar.offsetWidth; // force reflow so the progress animation restarts
        bar.classList.add("is-active");
    }

    function showSlide(index) {
        slides[current].classList.remove("is-active");
        bars[current].classList.remove("is-active");
        current = (index + slides.length) % slides.length;
        slides[current].classList.add("is-active");
        restartBar(bars[current]);
    }

    function play() {
        clearInterval(timer);
        hero.classList.remove("is-paused");
        pauseButton.setAttribute("aria-label", "Pause background slideshow");
        restartBar(bars[current]);
        timer = setInterval(() => showSlide(current + 1), duration);
    }

    function pause() {
        clearInterval(timer);
        timer = null;
        hero.classList.add("is-paused");
        pauseButton.setAttribute("aria-label", "Play background slideshow");
    }

    pauseButton.addEventListener("click", () => {
        if (timer) {
            pause();
        } else {
            play();
        }
    });

    // Respect visitors who prefer less motion: start paused
    if (reduceMotion || slides.length < 2) {
        pause();
    } else {
        play();
    }
})();

/* ---------- Quote form (multi-step) ---------- */
(function () {
    const form = document.getElementById("quote-form");
    if (!form) return;

    const card = form.closest(".quote-card");
    const steps = form.querySelectorAll(".quote-step");
    const markers = card.querySelectorAll(".quote-steps li");
    const progressText = document.getElementById("quote-progress-text");
    const progressFill = card.querySelector(".quote-progress-fill");
    const backButton = form.querySelector(".quote-back");
    const nextLabel = form.querySelector(".quote-next-label");
    const success = document.getElementById("quote-success");
    const successName = document.getElementById("quote-success-name");
    const dateInput = document.getElementById("quote-date");
    const lastStep = steps.length - 1;

    let current = 0;

    // Move date can't be in the past
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    dateInput.min = today.toISOString().split("T")[0];

    // ZIP fields accept digits only
    form.querySelectorAll("[pattern='[0-9]{5}']").forEach((input) => {
        input.addEventListener("input", () => {
            input.value = input.value.replace(/\D/g, "").slice(0, 5);
        });
    });

    function setProgress(completed) {
        progressFill.style.width = `${(completed / steps.length) * 100}%`;
    }

    // Steps marked data-skip (Details, for types with no extra questions) are
    // passed over, and their marker is hidden so the count stays honest
    const inUse = () => [...steps].filter((step) => step.dataset.skip !== "true");

    function showStep(index) {
        steps[current].hidden = true;
        current = index;
        const step = steps[current];
        step.hidden = false;

        const active = inUse();
        const position = active.indexOf(step);
        markers.forEach((marker, i) => {
            marker.hidden = steps[i].dataset.skip === "true";
            marker.classList.toggle("is-complete", i < current);
            marker.classList.toggle("is-active", i === current);
        });

        progressFill.style.width = `${((position + 1) / active.length) * 100}%`;
        progressText.textContent = `Step ${position + 1} of ${active.length}: ${step.dataset.title}`;
        backButton.hidden = current === 0;
        // Past step 1 the intro text has done its job; phones hide it (CSS)
        card.classList.toggle("is-started", current > 0);
        nextLabel.textContent = current === lastStep ? "Submit" : "Next";

        // Bring the card's top back into view below the menu bar. Checked
        // again shortly after, since scrolling can switch the navbar to fixed.
        // Once fixed, the bar slides in, so use its full height rather than
        // where it happens to be mid-slide.
        const header = document.getElementById("site-header");
        const navbar = document.getElementById("navbar");
        const keepClear = () => {
            if (!navbar) return;
            const barBottom = header.classList.contains("is-scrolled")
                ? navbar.offsetHeight
                : Math.max(0, navbar.getBoundingClientRect().bottom);
            const top = card.getBoundingClientRect().top;
            if (top < barBottom + 8) window.scrollBy(0, top - barBottom - 16);
        };
        keepClear();
        setTimeout(keepClear, 400);
        step.querySelector(".quote-step-title").focus({ preventScroll: true });
    }

    function nextIndex(from, dir) {
        let i = from + dir;
        while (steps[i] && steps[i].dataset.skip === "true") i += dir;
        return i;
    }

    // Validate only the fields in the visible step
    function stepIsValid(step) {
        const fields = step.querySelectorAll("input, select, textarea");
        for (const field of fields) {
            if (!field.checkValidity()) {
                field.reportValidity();
                return false;
            }
        }
        return true;
    }

    backButton.addEventListener("click", () => showStep(nextIndex(current, -1)));

    // Enter key and the main button both go through submit
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!stepIsValid(steps[current])) return;

        if (current < lastStep) {
            showStep(nextIndex(current, 1));
            return;
        }

        const firstName = document.getElementById("quote-name").value.trim().split(" ")[0];
        successName.textContent = firstName || "neighbor";

        markers.forEach((marker) => {
            marker.classList.remove("is-active");
            marker.classList.add("is-complete");
        });
        setProgress(steps.length);
        progressText.textContent = "All done!";
        form.hidden = true;
        success.hidden = false;
        success.focus();
    });
})();

/* ---------- Quote form: questions that match the property type ----------
   Each .quote-detail lists the types it belongs to in data-for. The rest
   are hidden and their fields disabled, so they're skipped when the step
   is checked and left out of the request. */
(function () {
    const form = document.getElementById("quote-form");
    if (!form) return;

    const details = [...form.querySelectorAll(".quote-detail")];
    const detailsStep = form.querySelector(".quote-step-details");
    const specialNotes = form.querySelector(".quote-special-notes");

    function update() {
        const picked = form.querySelector('input[name="property_type"]:checked');
        const type = picked ? picked.value : "";
        let any = false;
        details.forEach((detail) => {
            const show = detail.dataset.for.split(" ").includes(type);
            if (show) any = true;
            detail.hidden = !show;
            detail.querySelectorAll("input, select, textarea").forEach((field) => {
                field.disabled = !show;
            });
        });
        // No questions for this type: the Details step is skipped
        detailsStep.dataset.skip = String(!any);
    }

    // The notes box only appears once a special item is ticked
    function updateNotes() {
        const ticked = form.querySelector('input[name="special_items"]:checked');
        specialNotes.hidden = !ticked;
        specialNotes.querySelector("textarea").disabled = !ticked;
    }

    form.addEventListener("change", (event) => {
        if (event.target.name === "property_type") update();
        if (event.target.name === "special_items") updateNotes();
    });
    update();
    updateNotes();
})();

/* ---------- Services carousel ---------- */
(function () {
    const track = document.getElementById("services-track");
    if (!track) return;

    const section = track.closest(".services");
    const slides = track.querySelectorAll(".services-slide");
    const toggleButton = section.querySelector("[data-carousel='toggle']");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const DWELL = 3000;    // time each card rests before moving on
    const DURATION = 1200; // length of the spring animation

    let frame = null;
    let timer = null;
    let userPaused = reduceMotion;
    let hovering = false;
    let focused = false;
    let touching = false;
    let inView = false;
    let touchTimer = null;

    /* Damped spring: starts gently, overshoots a little, then settles */
    function spring(t) {
        const zeta = 0.65;
        const omega = 10;
        const omegaD = omega * Math.sqrt(1 - zeta * zeta);
        const decay = Math.exp(-zeta * omega * t);
        return 1 - decay * (Math.cos(omegaD * t) + (zeta * omega / omegaD) * Math.sin(omegaD * t));
    }

    function maxScroll() {
        return track.scrollWidth - track.clientWidth;
    }

    function offsetOf(index) {
        return Math.min(slides[index].offsetLeft - slides[0].offsetLeft, maxScroll());
    }

    function currentIndex() {
        let closest = 0;
        slides.forEach((slide, i) => {
            if (Math.abs(offsetOf(i) - track.scrollLeft) < Math.abs(offsetOf(closest) - track.scrollLeft)) {
                closest = i;
            }
        });
        return closest;
    }

    function stopAnimation() {
        if (frame) cancelAnimationFrame(frame);
        frame = null;
        track.classList.remove("is-animating");
    }

    function animateTo(target, onDone) {
        stopAnimation();
        const start = track.scrollLeft;
        const distance = target - start;
        if (Math.abs(distance) < 1) {
            if (onDone) onDone();
            return;
        }

        if (reduceMotion) {
            track.scrollLeft = target;
            if (onDone) onDone();
            return;
        }

        const startTime = performance.now();
        track.classList.add("is-animating");

        function step(now) {
            const t = Math.min((now - startTime) / DURATION, 1);
            track.scrollLeft = start + distance * spring(t);
            if (t < 1) {
                frame = requestAnimationFrame(step);
            } else {
                track.scrollLeft = target;
                stopAnimation();
                if (onDone) onDone();
            }
        }
        frame = requestAnimationFrame(step);
    }

    function goTo(index, onDone) {
        const count = slides.length;
        animateTo(offsetOf((index + count) % count), onDone);
    }

    function next(onDone) {
        // Wrap to the start once the last card is fully in view
        if (track.scrollLeft >= maxScroll() - 2) {
            goTo(0, onDone);
        } else {
            goTo(currentIndex() + 1, onDone);
        }
    }

    function prev() {
        if (track.scrollLeft <= 2) {
            animateTo(maxScroll());
        } else {
            goTo(currentIndex() - 1);
        }
    }

    /* ---------- Autoplay ---------- */
    function canPlay() {
        return !userPaused && !hovering && !focused && !touching && inView;
    }

    function schedule() {
        clearTimeout(timer);
        if (!canPlay()) return;
        timer = setTimeout(() => {
            if (canPlay()) next(schedule);
        }, DWELL);
    }

    function updateAutoplay() {
        if (canPlay()) {
            schedule();
        } else {
            clearTimeout(timer);
        }
    }

    /* ---------- Controls ---------- */
    section.querySelector("[data-carousel='next']").addEventListener("click", () => next());
    section.querySelector("[data-carousel='prev']").addEventListener("click", prev);

    function setToggleState() {
        toggleButton.classList.toggle("is-paused", userPaused);
        toggleButton.setAttribute("aria-label", userPaused ? "Play services carousel" : "Pause services carousel");
    }

    toggleButton.addEventListener("click", () => {
        userPaused = !userPaused;
        setToggleState();
        updateAutoplay();
    });

    // Pause while someone is reading or interacting with the cards
    track.addEventListener("mouseenter", () => { hovering = true; updateAutoplay(); });
    track.addEventListener("mouseleave", () => { hovering = false; updateAutoplay(); });
    track.addEventListener("focusin", () => { focused = true; updateAutoplay(); });
    track.addEventListener("focusout", () => { focused = false; updateAutoplay(); });

    // A swipe or wheel scroll takes over from the animation; resume after a short rest
    function userScroll() {
        stopAnimation();
        touching = true;
        updateAutoplay();
        clearTimeout(touchTimer);
        touchTimer = setTimeout(() => {
            touching = false;
            updateAutoplay();
        }, DWELL * 2);
    }
    track.addEventListener("pointerdown", userScroll);
    track.addEventListener("wheel", userScroll, { passive: true });
    track.addEventListener("touchstart", userScroll, { passive: true });

    // Only autoplay while the section is on screen
    new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        updateAutoplay();
    }, { threshold: 0.35 }).observe(track);

    setToggleState();
})();

/* ---------- Service card hover float ---------- */
(function () {
    const canHover = window.matchMedia("(hover: hover)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || reduceMotion) return;

    document.querySelectorAll(".service-card").forEach((card) => {
        card.addEventListener("mouseenter", () => {
            card.classList.remove("is-settling");
            card.style.transform = "";
            card.classList.add("is-floating");
        });

        // Freeze the card where the float left it, then ease it back down
        card.addEventListener("mouseleave", () => {
            card.style.transform = getComputedStyle(card).transform;
            card.classList.remove("is-floating");
            card.classList.add("is-settling");
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    card.style.transform = "";
                });
            });
        });

        card.addEventListener("transitionend", (event) => {
            if (event.propertyName === "transform") card.classList.remove("is-settling");
        });
    });
})();

/* ---------- Service areas: map, regions, communities, ZIP check ---------- */
(function () {
    const section = document.getElementById("areas");
    if (!section) return;

    const mapEl = document.getElementById("areas-map");
    const regionButtons = section.querySelectorAll(".region-btn");
    const slides = section.querySelectorAll(".community-slide");
    const track = document.getElementById("communities-track");
    const regionLabel = document.getElementById("communities-region");
    const feeLabel = document.getElementById("communities-fee");

    // Houston: an approximate outline of the city (roughly Beltway 8).
    // Nearby and Texas cities are marked as circles on each city.
    const REGIONS = {
        houston: {
            name: "Houston",
            fee: "Our home base",
            label: "Houston",
            shape: [[29.96, -95.55], [29.98, -95.4], [29.95, -95.25], [29.86, -95.16], [29.72, -95.15], [29.6, -95.22], [29.58, -95.38], [29.6, -95.52], [29.7, -95.6], [29.86, -95.6]],
        },
        nearby: {
            name: "Sugar Land, Spring & Katy",
            fee: "Local service",
            radius: 7000,
            spots: [
                ["Sugar Land", 29.6197, -95.6349],
                ["Katy", 29.7858, -95.8245],
                ["Spring", 30.0799, -95.4172],
            ],
        },
        texas: {
            name: "Texas cities",
            fee: "Quoted per move",
            radius: 22000,
            spots: [
                ["Austin", 30.2672, -97.7431],
                ["San Antonio", 29.4241, -98.4936],
                ["Dallas", 32.7767, -96.797],
            ],
        },
    };

    const OFFICE = [29.7604, -95.3698]; // Houston, TX (no street address published)

    let activeRegion = "houston";
    let map = null;
    const layers = {};

    /* ---------- Region selection (buttons, map, nav links) ---------- */
    function selectRegion(id, { fromMap = false } = {}) {
        if (!REGIONS[id]) return;
        activeRegion = id;

        regionButtons.forEach((button) => {
            const isActive = button.dataset.region === id;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });

        slides.forEach((slide) => {
            slide.hidden = slide.dataset.region !== id;
        });
        track.scrollLeft = 0;
        regionLabel.textContent = REGIONS[id].name;
        feeLabel.textContent = REGIONS[id].fee;

        if (map) {
            styleLayers();
            if (!fromMap || REGIONS[id].spots) {
                map.flyToBounds(layers[id].getBounds(), { padding: [30, 30], duration: 0.8 });
            }
        }
    }

    regionButtons.forEach((button) => {
        button.addEventListener("click", () => selectRegion(button.dataset.region));
    });

    // "Service Areas" dropdown links in the nav
    document.querySelectorAll("a[data-region]").forEach((link) => {
        link.addEventListener("click", () => selectRegion(link.dataset.region));
    });

    /* ---------- Community buttons prefill the quote form ---------- */
    section.addEventListener("click", (event) => {
        const button = event.target.closest(".community-btn");
        if (!button) return;
        const zipField = document.getElementById("quote-from");
        if (zipField) zipField.value = button.dataset.zip;
    });

    /* ---------- ZIP checker ---------- */
    const METRO_PREFIXES = ["770", "772", "773", "774", "775"]; // Houston, Sugar Land, Katy, Spring
    const zipForm = document.getElementById("zip-check");
    const zipInput = document.getElementById("zip-input");
    const zipResult = document.getElementById("zip-result");

    zipInput.addEventListener("input", () => {
        zipInput.value = zipInput.value.replace(/\D/g, "").slice(0, 5);
    });

    zipForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const zip = zipInput.value;
        zipResult.className = "zip-check-result";

        if (!/^\d{5}$/.test(zip)) {
            zipResult.textContent = "Please enter a 5 digit ZIP code.";
            zipResult.classList.add("is-no");
            return;
        }

        const prefix = zip.slice(0, 3);
        if (METRO_PREFIXES.includes(prefix)) {
            zipResult.textContent = `Yes! We serve ${zip}. Get your free quote above.`;
            zipResult.classList.add("is-yes");
        } else if (/^(7[5-9]|885)/.test(zip)) {
            // Elsewhere in Texas: a move between cities, quoted separately
            zipResult.textContent = `${zip} is outside the Houston area, but we move between Texas cities. Get a free quote above or call (979) 888-8887.`;
            zipResult.classList.add("is-maybe");
            selectRegion("texas");
        } else {
            zipResult.textContent = `${zip} is outside Texas. We only move within Texas, so we can't take this one.`;
            zipResult.classList.add("is-no");
        }
    });

    /* ---------- Map (Leaflet is loaded only when the map gets close) ---------- */
    function styleLayers() {
        Object.entries(layers).forEach(([id, layer]) => {
            const active = id === activeRegion;
            layer.setStyle({
                color: active ? "#0A4651" : "#0E6070",
                weight: active ? 3 : 1.5,
                fillColor: active ? "#E2E41D" : "#0E6070",
                fillOpacity: active ? 0.42 : 0.16,
                dashArray: REGIONS[id].spots ? "6 6" : null,
            });
            if (active) layer.bringToFront();
        });
    }

    /* Chaikin corner cutting: rounds a polygon's sharp corners into smooth curves */
    // A small cut keeps the curves hugging the original outline so neighbors stay close
    function smoothShape(points, passes = 4, cut = 0.15) {
        let shape = points;
        for (let pass = 0; pass < passes; pass++) {
            const next = [];
            shape.forEach((point, i) => {
                const following = shape[(i + 1) % shape.length];
                next.push(
                    [point[0] * (1 - cut) + following[0] * cut, point[1] * (1 - cut) + following[1] * cut],
                    [point[0] * cut + following[0] * (1 - cut), point[1] * cut + following[1] * (1 - cut)]
                );
            });
            shape = next;
        }
        return shape;
    }

    function buildMap() {
        const L = window.L;
        const isTouch = window.matchMedia("(hover: none)").matches;

        mapEl.innerHTML = "";
        map = L.map(mapEl, {
            scrollWheelZoom: false,
            dragging: !isTouch,
            tap: false,
            zoomSnap: 0.25,
        }).setView(OFFICE, 9); // a view first, so the city circles can be placed

        // Esri street map: roads, highways, and city names (no API key needed)
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
            attribution: "Tiles &copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors",
            maxZoom: 18,
        }).addTo(map);

        Object.entries(REGIONS).forEach(([id, region]) => {
            let layer;
            if (region.shape) {
                layer = L.polygon(smoothShape(region.shape), { className: "region-shape" });
            } else {
                layer = L.featureGroup(region.spots.map(([name, lat, lng]) =>
                    L.circle([lat, lng], { radius: region.radius, className: "region-shape" }).bindTooltip(name, {
                        permanent: true,
                        direction: "center",
                        className: "region-label",
                    })
                ));
            }

            if (region.shape) {
                layer.bindTooltip(region.label, { permanent: true, direction: "center", className: "region-label" });
            }

            layer.on("click", () => selectRegion(id, { fromMap: true }));
            layer.on("mouseover", () => {
                if (id !== activeRegion) layer.setStyle({ fillOpacity: 0.3 });
            });
            layer.on("mouseout", styleLayers);
            layer.addTo(map);
            layers[id] = layer;
        });

        const officeIcon = L.divIcon({
            className: "office-pin",
            html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 5h13v11H1zM14 9h4.5L22 12.5V16h-8z"/><circle cx="5.5" cy="17.5" r="2"/><circle cx="17.5" cy="17.5" r="2"/></svg>',
            iconSize: [38, 38],
            iconAnchor: [19, 19],
        });
        L.marker(OFFICE, { icon: officeIcon, title: "Moe's Movers", zIndexOffset: 1000 })
            .bindPopup("<strong>Moe's Movers</strong><br>Local Houston moves, plus moves across Texas")
            .addTo(map);

        // Start framed on Houston and the nearby cities
        const local = L.featureGroup(["houston", "nearby"].map((id) => layers[id]));
        map.fitBounds(local.getBounds(), { padding: [10, 10] });
        styleLayers();
    }

    function loadLeaflet() {
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "css/vendor/leaflet.css";
        document.head.appendChild(css);

        const script = document.createElement("script");
        script.src = "javascript/vendor/leaflet.js";
        script.onload = buildMap;
        script.onerror = () => {
            mapEl.querySelector(".areas-map-loading").textContent = "The map could not load. Use the region buttons instead.";
        };
        document.body.appendChild(script);
    }

    const observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        loadLeaflet();
    }, { rootMargin: "600px 0px" });
    observer.observe(mapEl);
})();

/* ---------- Process: 3D revolving cards ---------- */
(function () {
    const section = document.getElementById("services");
    if (!section) return;

    const stage = document.getElementById("process-stage");
    const cards = [...section.querySelectorAll(".process-card")];
    const dots = [...section.querySelectorAll(".process-dot")];
    const details = [...section.querySelectorAll(".process-detail-item")];
    const toggleButton = section.querySelector("[data-process='toggle']");
    const count = cards.length;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const INTERVAL = 3500; // time each card stays in front

    let current = 0;  // position drawn on screen (eases toward target)
    let target = 0;   // where the ring is turning to; keeps counting up so it can loop forever
    let frame = null;

    function wrap(index) {
        return ((index % count) + count) % count;
    }

    /* ---------- Drawing ---------- */
    function layout(position) {
        const width = cards[0].offsetWidth;
        const spreadX = width * 0.78;
        const depth = width * 0.65;

        cards.forEach((card, i) => {
            // Distance from the front, wrapped so the ring reads as a loop
            let offset = wrap(i - position);
            if (offset > count / 2) offset -= count;

            const angle = offset * (Math.PI * 2 / count);
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            card.style.setProperty("--x", `${sin * spreadX}px`);
            card.style.setProperty("--z", `${(cos - 1) * depth}px`);
            card.style.setProperty("--ry", `${-sin * 30}deg`);
            card.style.setProperty("--shade", ((1 - cos) / 2 * 0.55).toFixed(3));
            card.style.zIndex = String(Math.round((cos + 1) * 100));
            card.style.opacity = String(Math.min(1, 1.35 + cos));
        });
    }

    function animate() {
        current += (target - current) * (reduceMotion ? 1 : 0.1);
        if (Math.abs(target - current) < 0.001) current = target;
        layout(current);
        frame = current === target ? null : requestAnimationFrame(animate);
    }

    /* Update dots and the detail panel for the card now in front */
    function showActive() {
        const active = wrap(Math.round(target));
        dots.forEach((dot, i) => {
            dot.classList.toggle("is-active", i === active);
            if (i === active) {
                dot.setAttribute("aria-current", "step");
            } else {
                dot.removeAttribute("aria-current");
            }
        });
        details.forEach((detail, i) => {
            detail.classList.toggle("is-active", i === active);
            detail.setAttribute("aria-hidden", String(i !== active));
        });
    }

    function turnTo(value) {
        target = value;
        showActive();
        if (!frame) frame = requestAnimationFrame(animate);
    }

    // Go to a card index by the shortest way around the ring
    function goTo(index) {
        let diff = wrap(index - Math.round(target));
        if (diff > count / 2) diff -= count;
        turnTo(Math.round(target) + diff);
    }

    /* ---------- Autoplay ---------- */
    let timer = null;
    let userPaused = reduceMotion;
    let hovering = false;
    let inView = false;

    function canPlay() {
        return !userPaused && !hovering && inView;
    }

    function restartTimer() {
        clearInterval(timer);
        if (canPlay()) timer = setInterval(() => turnTo(Math.round(target) + 1), INTERVAL);
    }

    function setToggleState() {
        toggleButton.classList.toggle("is-paused", userPaused);
        toggleButton.setAttribute("aria-label", userPaused ? "Play services" : "Pause services");
    }

    toggleButton.addEventListener("click", () => {
        userPaused = !userPaused;
        setToggleState();
        restartTimer();
    });

    stage.addEventListener("mouseenter", () => { hovering = true; restartTimer(); });
    stage.addEventListener("mouseleave", () => { hovering = false; restartTimer(); });

    new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        restartTimer();
    }, { threshold: 0.3 }).observe(stage);

    /* ---------- Manual controls (any screen size); each one resets the timer ---------- */
    function manual(action) {
        action();
        restartTimer();
    }

    section.querySelector("[data-process='next']").addEventListener("click", () => manual(() => turnTo(Math.round(target) + 1)));
    section.querySelector("[data-process='prev']").addEventListener("click", () => manual(() => turnTo(Math.round(target) - 1)));
    dots.forEach((dot, i) => dot.addEventListener("click", () => manual(() => goTo(i))));

    // Swipe on touch screens or drag with a mouse; a plain click on a side card brings it forward
    let dragStartX = null;
    let dragStartY = null;
    let dragged = false;

    stage.addEventListener("pointerdown", (event) => {
        dragStartX = event.clientX;
        dragStartY = event.clientY;
        dragged = false;
    });

    stage.addEventListener("pointerup", (event) => {
        if (dragStartX === null) return;
        const dx = event.clientX - dragStartX;
        const dy = event.clientY - dragStartY;
        dragStartX = null;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
            dragged = true;
            manual(() => turnTo(Math.round(target) + (dx < 0 ? 1 : -1)));
        }
    });

    stage.addEventListener("pointercancel", () => { dragStartX = null; });

    cards.forEach((card, i) => card.addEventListener("click", () => {
        if (!dragged) manual(() => goTo(i));
    }));

    window.addEventListener("resize", () => layout(current));
    setToggleState();
    showActive();
    layout(0);
})();

/* ---------- Contact form (general questions) ---------- */
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

        successName.textContent = document.getElementById("contact-first").value.trim() || "neighbor";
        form.hidden = true;
        success.hidden = false;
        success.focus();
    });
})();


/* ---------- "Book a Free Walkthrough" buttons ----------
   They jump to the quote form with the free in-person estimate already
   picked, so the visitor lands on the right path. */
document.querySelectorAll("[data-consultation]").forEach((link) => {
    link.addEventListener("click", () => {
        const option = document.querySelector(`input[name="consultation"][value="${link.dataset.consultation}"]`);
        if (option) option.checked = true;
    });
});

/* ---------- About: Mission / Vision / Core Values tabs ----------
   Click or arrow keys switch panels (standard tablist behaviour). */
document.querySelectorAll("[data-tabs]").forEach((tabsRoot) => {
    const tabs = [...tabsRoot.querySelectorAll("[role='tab']")];
    const select = (tab) => {
        tabs.forEach((t) => {
            const on = t === tab;
            t.classList.toggle("is-active", on);
            t.setAttribute("aria-selected", String(on));
            t.tabIndex = on ? 0 : -1;
            document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
        });
    };
    tabs.forEach((tab, i) => {
        tab.addEventListener("click", () => select(tab));
        tab.addEventListener("keydown", (event) => {
            const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
            if (!step) return;
            const next = tabs[(i + step + tabs.length) % tabs.length];
            select(next);
            next.focus();
        });
    });
});

/* ---------- Service links (menu + footer) ----------
   The services rotate in a card stack, so a link to one service scrolls
   to the section and turns the stack to that card. */
(function () {
    const section = document.getElementById("services");
    if (!section) return;
    const cards = [...section.querySelectorAll(".process-card[id]")];
    cards.forEach((card) => {
        document.querySelectorAll(`a[href="#${card.id}"]`).forEach((link) => {
            link.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation(); // smooth scrolling would otherwise aim for the card itself
                if (window.lenis) window.lenis.scrollTo(section, { offset: -parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0 });
                else section.scrollIntoView({ behavior: "smooth" });
                section.querySelector(`.process-dot[data-step="${card.dataset.index}"]`)?.click();
            });
        });
    });
})();

/* ---------- Projects: filter by service ---------- */
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

/* ---------- Count-up numbers ([data-count-to]) ----------
   The final value is in the HTML; this counts up from 0 over ~1.2s the
   first time the number scrolls into view. Reduced motion: left as is. */
(function () {
    const counters = document.querySelectorAll("[data-count-to]");
    if (!counters.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const DURATION = 1200;
    const show = (el, value) => { el.textContent = value + (el.dataset.countSuffix || ""); };
    counters.forEach((el) => show(el, 0));
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            observer.unobserve(entry.target);
            const el = entry.target;
            const target = Number(el.dataset.countTo);
            const start = performance.now();
            const tick = (now) => {
                const t = Math.min((now - start) / DURATION, 1);
                show(el, Math.round(target * (1 - Math.pow(1 - t, 3))));
                if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
    }, { threshold: 0.6 });
    counters.forEach((el) => observer.observe(el));
})();


/* ---------- "Plan a Storage Move" opens the quote form with Storage unit picked ---------- */
document.querySelectorAll("[data-property]").forEach((link) => {
    link.addEventListener("click", () => {
        const option = document.querySelector(`input[name="property_type"][value="${link.dataset.property}"]`);
        if (option) {
            option.checked = true;
            option.dispatchEvent(new Event("change", { bubbles: true }));
        }
    });
});
