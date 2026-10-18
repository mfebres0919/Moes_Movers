/* ==========================================================================
   Moe's Movers — Smooth Scrolling
   Lenis (javascript/vendor/lenis.min.js) eases mouse-wheel and trackpad
   scrolling so the page glides instead of stepping. Not loaded on touch
   devices, which keep native scrolling. In-page links glide too, stopping
   below the navbar (the same scroll-padding-top the CSS uses). Off for
   reduced motion. Shared as window.lenis.
   ========================================================================== */

(function () {
    if (typeof Lenis === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Phones and tablets scroll by touch, which Lenis leaves native anyway; skipping it
    // there saves its per-frame layout work (the CSS smooth scroll handles anchor links)
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const root = document.documentElement;
    const navOffset = () => parseFloat(getComputedStyle(root).scrollPaddingTop) || 96;

    const lenis = new Lenis({
        duration: 1.2, // seconds a wheel scroll takes to settle; higher = floatier
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        anchors: true,
    });

    window.lenis = lenis;

    // Anchor links read the navbar offset at click time, since it changes on desktop
    lenis.options.anchors = { get offset() { return -navOffset(); } };

    // Hold the page still behind the open mobile menu
    new MutationObserver(() => {
        if (document.body.classList.contains("menu-open")) lenis.stop();
        else lenis.start();
    }).observe(document.body, { attributes: true, attributeFilter: ["class"] });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
})();
