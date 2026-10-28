/* Runs before the page draws (not deferred).
   - If the loading screen already played during this visit, mark <html> so CSS
     hides it and it doesn't flash. global.js records that it played.
   - Links straight to a section (e.g. /#areas) skip the loading screen and
     jump without smooth scrolling, so the section shows right away. */
try {
    if (sessionStorage.getItem("loaderSeen")) document.documentElement.classList.add("loader-seen");
} catch (e) { /* storage blocked: the loader just plays */ }
if (location.hash.length > 1) document.documentElement.classList.add("loader-seen", "hash-landing");
