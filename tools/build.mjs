/* ==========================================================================
   Netlify build (runs on every deploy; the repo itself is never changed)

   1. Minify the site's CSS and JavaScript with esbuild.
   2. For each page, inline the CSS that page actually uses into <head> and
      load the full stylesheets without blocking the first paint (Beasties).
      A <noscript> fallback keeps the page styled without JavaScript.
   3. Inline the tiny loading-screen check (javascript/loader-check.js) on the
      homepage so it no longer costs its own network request.

   MigsFlow handbook exception (approved for page speed): the published HTML
   contains inline CSS and one inline script. Source files stay separate.
   ========================================================================== */
import { build } from "esbuild";
import Beasties from "beasties";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const list = (dir, ext) => readdirSync(join(root, dir)).filter((f) => f.endsWith(ext)).map((f) => join(dir, f));

// 1. Minify in place
await build({
    entryPoints: [...list("css", ".css"), ...list("javascript", ".js")],
    outdir: ".",
    outbase: ".",
    minify: true,
    allowOverwrite: true,
    logLevel: "warning"
});

// 2 + 3. Inline first-screen CSS and the loader check
const pages = ["index.html", ...list("html", ".html")];
for (const page of pages) {
    const beasties = new Beasties({
        path: root,
        publicPath: page.startsWith("html/") ? "../" : "/",
        preload: "media",      // full stylesheet loads as media="print" (non-blocking), then switches to all
        noscriptFallback: true,
        pruneSource: false,    // keep the full CSS files intact for other pages
        inlineFonts: true,     // @font-face rules (and the size-matched fallback) inline, so text never jumps
        reduceInlineStyles: false,
        logLevel: "warn"
    });
    let html = await beasties.process(readFileSync(join(root, page), "utf8"));

    if (page === "index.html") {
        const check = readFileSync(join(root, "javascript/loader-check.js"), "utf8");
        html = html.replace('<script src="javascript/loader-check.js"></script>', `<script>${check}</script>`);
    }
    writeFileSync(join(root, page), html);
}
console.log(`Built ${pages.length} pages`);
