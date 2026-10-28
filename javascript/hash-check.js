/* Runs before the page draws (not deferred): a link straight to a section
   (e.g. /#areas) jumps there without smooth scrolling, so the section shows
   right away. global.js removes the class once the page is ready. */
if (location.hash.length > 1) document.documentElement.classList.add("hash-landing");
