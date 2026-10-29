/* ==========================================================================
   GOOGLE ANALYTICS (GA4)
   Sets up gtag for Moe's existing GA4 property. The Google script itself
   loads from googletagmanager.com in each page's <head>.
   ========================================================================== */
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag("js", new Date());
gtag("config", "G-41SZRL36MG");

/* ---------- Form events ----------
   The quote and contact forms call this once a submission has gone
   through, so each shows up as its own event in GA4 ("quote_request" and
   "contact_message"). Nothing the visitor typed is sent to Google. */
window.trackFormSent = function (eventName) {
    gtag("event", eventName, { form_page: window.location.pathname });
};
