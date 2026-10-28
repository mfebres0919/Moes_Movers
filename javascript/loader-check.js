/* Runs before the page draws (not deferred): if the loading screen already
   played during this visit, mark <html> so CSS hides it and it doesn't flash.
   global.js records that it played. */
try {
    if (sessionStorage.getItem("loaderSeen")) document.documentElement.classList.add("loader-seen");
} catch (e) { /* storage blocked: the loader just plays */ }
