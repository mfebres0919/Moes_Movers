"""
Builds the five service detail pages (html/service-*.html) from one template.

Run from the Moes_Movers folder:  python3 source-images/build_service_pages.py

Edit the SERVICES content below and re-run to update every page. The shared
header, final CTA, and footer are copied from html/services.html, so they
always match the rest of the site.

DRAFT COPY: descriptions, FAQs, and benefits are written from what is already
on the site. Moe should review and replace with his own wording.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

STAR = '<svg class="icon icon-fill" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>'
PHONE = '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'
ICONS = {
    "shield": '<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    "tag": '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "box": '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    "truck": '<path d="M1 5h13v11H1zM14 9h4.5L22 12.5V16h-8z"/><circle cx="5.5" cy="17.5" r="2"/><circle cx="17.5" cy="17.5" r="2"/>',
    "users": '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 5.5 5"/>',
    "building": '<path d="M4 21V4h10v17M14 9h6v12M8 8h2M8 12h2M8 16h2M17 13h1M17 17h1"/>',
    "home": '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
    "layers": '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    "key": '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l3 3"/>',
    "calendar": '<rect x="3" y="5" width="18" height="16"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    "star": '<path d="m12 2 2.9 6.9 7.1.6-5.4 4.7 1.6 7L12 17.5 5.8 21.2l1.6-7L2 9.5l7.1-.6z"/>',
    "question": '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4.9.7c0 1.7-2.4 2.1-2.4 3.8M12 17h.01"/>',
    "chat": '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11h7M8.5 14h4"/>',
    "list": '<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2"/>',
    "map": '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    "sparkle": '<path d="M12 3c.4 4 2.3 6.6 6.5 7.5v.8c-4.2.9-6.1 3.5-6.5 7.5h-.8c-.4-4-2.3-6.6-6.5-7.5v-.8C8.9 9.6 10.8 7 11.2 3z"/>',
}

# Icon shown beside each of the two features, per service
FEATURE_ICONS = {
    "home-moves": ("map", "shield"),
    "apartment-condo-moves": ("building", "layers"),
    "packing-unpacking": ("box", "sparkle"),
    "commercial-office-moves": ("calendar", "list"),
    "storage-moves": ("truck", "layers"),
}

SERVICES = [
    {
        "slug": "home-moves",
        "desc": "Houston home moves planned around your schedule, with furniture and floor protection and clear, upfront pricing.",  # meta + link-preview description, 125 characters max
        "name": "Home Moves",
        "hero": "hero-truck-house",
        "title": "Local home moves, handled from the first box to the last.",
        "intro": "Moving a house means moving a life. Our crew plans every home move around your schedule, protects your furniture and floors, and gives you clear, upfront pricing before moving day, whether you are moving across Houston or to another Texas city.",
        "image": ("crew/truck-home-driveway", "The Move with Moe truck parked outside a large brick home"),
        "features": [
            ("Planned around your home", "We note stairs, tight hallways, and parking before moving day, so the right crew and truck show up ready."),
            ("Protected every step", "Furniture is padded and wrapped, and doorways and floors are protected while we carry everything out."),
        ],
        "spotlight": ("crew/crew-wrapped-sofa", "A mover with a fully wrapped sofa outside a home", "Treated like our own home", "Every piece is wrapped before it leaves the room and placed where you want it in your new home."),
        "faq_intro": "Here is what customers usually ask before booking a home move with us.",
        "faqs": [
            ("What is included in a home move?", "Your crew, the truck, moving blankets, dollies, and furniture wrapping. We load, transport, unload, and place furniture in the rooms you choose."),
            ("How far ahead should I book?", "Two to three weeks is ideal, especially at the end of the month. If your date is closer, call us and we will do our best to fit you in."),
            ("Do you move between Texas cities?", "Yes. Houston is home base, and we move families to and from cities across Texas. Those moves are quoted per move."),
            ("How is the price decided?", "Your price is based on the details of your move: home size, distance, stairs, and any packing. You get it upfront, with no hidden fees."),
        ],
        "benefits": [
            ("shield", "Fully insured crew", "Licensed with TXDMV and USDOT, and insured on every move."),
            ("tag", "Clear, upfront pricing", "Your price is set before moving day, with no hidden fees."),
            ("clock", "On time, every time", "Your crew shows up when we say, ready to work."),
            ("home", "Placed where you want it", "Furniture goes into the right rooms, not left in the garage."),
        ],
    },
    {
        "slug": "apartment-condo-moves",
        "desc": "Houston apartment and condo moves coordinated with your building: loading docks, elevators and move-in windows.",  # meta + link-preview description, 125 characters max
        "name": "Apartment and Condo Moves",
        "hero": "hero-moe-truck",
        "title": "Apartment and condo moves that follow the building's rules.",
        "intro": "High-rises and apartment complexes come with loading docks, elevator reservations, and move-in windows. We coordinate with your building ahead of time so your move stays on schedule and your neighbors stay happy.",
        "image": ("crew/truck-highrise", "The Move with Moe truck outside a downtown high-rise"),
        "features": [
            ("Building rules, handled", "We plan around loading docks, elevator bookings, and certificate of insurance requests."),
            ("Tight spaces, no problem", "Narrow halls, stairwells, and small elevators are part of the plan, not a surprise."),
        ],
        "spotlight": ("crew/crew-apartment-stairs", "Movers carrying furniture down a narrow apartment stairwell", "Up, in, and settled", "Boxes and furniture move quickly through elevators and hallways without scuffs or delays."),
        "faq_intro": "Common questions about apartment, condo, and high-rise moves.",
        "faqs": [
            ("Can you provide a certificate of insurance?", "Yes. Send us your building's requirements and we will provide the certificate before moving day."),
            ("Do I need to reserve the elevator?", "Most buildings require it. We will tell you what to ask for and plan the move around your reserved time."),
            ("Can you move me up or down stairs?", "Absolutely. Let us know about stairs when you get your quote so we bring the right crew."),
            ("Do you move studios and one-bedrooms?", "Yes, no move is too small. Studios and one-bedrooms are some of our most common moves."),
        ],
        "benefits": [
            ("building", "High-rise experience", "Downtown, Midtown, and Galleria buildings are routine for us."),
            ("calendar", "On your building's schedule", "We work within your move-in or move-out window."),
            ("shield", "Fully insured", "Insurance certificates ready for your building."),
            ("tag", "Upfront pricing", "Clear pricing based on the details of your move."),
        ],
    },
    {
        "slug": "packing-unpacking",
        "desc": "Room-by-room packing and unpacking in Houston with our own supplies, labeled boxes and a faster settle-in.",  # meta + link-preview description, 125 characters max
        "name": "Packing and Unpacking",
        "hero": "hero-truck-home",
        "title": "Packing and unpacking, so you can skip the boxes.",
        "intro": "Packing is the most time-consuming part of any move. Our crew packs room by room with our own supplies, labels everything, and unpacks at your new place, so you can settle in faster.",
        "image": ("crew/crew-wrapped-furniture", "A mover beside fully wrapped furniture ready to load"),
        "features": [
            ("Full or partial packing", "Let us pack the whole home, or just the kitchen and fragile items you would rather not handle."),
            ("Our supplies, our care", "Boxes, paper, tape, and padding are included, with extra care for glass, art, and electronics."),
        ],
        "spotlight": ("crew/crew-wrapping-table", "Movers wrapping a table in plastic before loading", "Labeled for easy unpacking", "Every box is labeled by room, so the unpacking goes fast and nothing gets lost."),
        "faq_intro": "What to know before you book packing or unpacking.",
        "faqs": [
            ("Do you bring the packing supplies?", "Yes. Boxes, tape, paper, and padding are included in packing services."),
            ("Can you pack just part of my home?", "Yes. Many customers book us for the kitchen, fragile items, or a single room."),
            ("Will you unpack everything too?", "If you book unpacking, we unpack, place items in the right rooms, and take the empty boxes with us."),
            ("How long does packing take?", "Most homes are packed in a day before the move. Larger homes may take a little longer, and we will plan it with you."),
        ],
        "benefits": [
            ("box", "Supplies included", "Quality boxes and padding, brought to your door."),
            ("layers", "Fragile-item care", "Extra wrapping for glass, art, and electronics."),
            ("clock", "Saves you days", "Skip the packing and focus on the rest of your move."),
            ("home", "Unpacked and settled", "Items placed room by room in your new home."),
        ],
    },
    {
        "slug": "commercial-office-moves",
        "desc": "Houston office and commercial moves planned around your hours, including evenings and weekends, to cut downtime.",  # meta + link-preview description, 125 characters max
        "name": "Commercial and Office Moves",
        "hero": "hero-moe-truck-side",
        "title": "Office moves planned around your business hours.",
        "intro": "Every hour your office is closed costs you. We plan commercial and office moves around your schedule, including evenings and weekends, so your team is back to work quickly in the new space.",
        "image": ("crew/crew-team-truck", "The Move with Moe crew standing in front of the truck"),
        "features": [
            ("Minimal downtime", "Evening and weekend moves keep your business running while we work."),
            ("Organized by workspace", "Desks, files, and equipment are labeled so every station is set up in the right place."),
        ],
        "spotlight": ("crew/crew-equipment-assembly", "Movers taking apart a piece of gym equipment", "A crew that works as a team", "Coordinated crews move furniture, files, and equipment safely and on schedule."),
        "faq_intro": "Questions businesses ask before planning an office move.",
        "faqs": [
            ("Can you move us after hours?", "Yes. Evening and weekend moves are available so your business does not lose a working day."),
            ("Do you move office furniture and equipment?", "We move desks, chairs, filing cabinets, and equipment, wrapped and protected."),
            ("Can you work with our building management?", "Yes. We coordinate loading docks, elevators, and insurance certificates with your building."),
            ("Do you move small businesses?", "Absolutely. Small offices and shops are some of our favorite moves."),
        ],
        "benefits": [
            ("calendar", "After-hours moves", "Evenings and weekends to keep you open."),
            ("users", "Organized crews", "Every workspace labeled and set up right."),
            ("shield", "Fully insured", "Certificates ready for your building."),
            ("tag", "Upfront pricing", "Clear pricing based on the details of your move."),
        ],
    },
    {
        "slug": "storage-moves",
        "desc": "Houston storage moves: every piece wrapped, stacked to fit more, and the things you need kept easy to reach.",  # meta + link-preview description, 125 characters max
        "name": "Storage Moves",
        "hero": "hero-moe-truck",
        "title": "Storage moves, stacked to save space.",
        "intro": "Moving into, out of, or between storage units takes planning. We wrap every piece, stack it to fit more, and keep the things you need easy to reach.",
        "image": ("crew/truck-storage-facility", "The Move with Moe truck outside an Extra Space Storage facility"),
        "features": [
            ("Home to storage, and back", "Storage unit to home, home to storage, or unit to unit, all in one move."),
            ("Stacked to fit more", "Smart stacking helps you fit more in a smaller unit and save on monthly costs."),
        ],
        "spotlight": ("crew/crew-truck-stacking", "Movers stacking items tightly inside the truck", "Wrapped before it goes in", "Furniture is padded and wrapped so it stays protected for as long as it is in storage."),
        "faq_intro": "Everything you need to know before a storage move.",
        "faqs": [
            ("Do you provide the storage unit?", "No, you choose the unit. We can recommend a size based on what you are storing."),
            ("Can you move items between two units?", "Yes. Unit-to-unit moves are common, including upsizing or downsizing a unit."),
            ("How do you protect items in storage?", "Furniture is padded and wrapped, and boxes are stacked so heavy items stay on the bottom."),
            ("Can you combine a storage move with a home move?", "Yes. We can drop some items at storage and the rest at your new home in the same move."),
        ],
        "benefits": [
            ("layers", "Space-saving stacking", "Fit more in your unit and pay for less."),
            ("box", "Wrapped and protected", "Padding on every piece of furniture."),
            ("key", "Easy to reach", "The things you need stay at the front."),
            ("tag", "Upfront pricing", "Clear pricing based on the details of your move."),
        ],
    },
]


def icon(name, cls="icon"):
    return f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true">{ICONS[name]}</svg>'


# Displayed width of each side-by-side photo: about 42vw on phones/tablets, 32vw on desktop
PHOTO_SIZES = "(min-width: 64rem) 32vw, 42vw"


def picture(name, alt, w=840, h=740, cls="", sizes=None):
    """With sizes, phones get the 480px-wide copy (name-480) instead of the full photo."""
    c = f' class="{cls}"' if cls else ""
    if sizes:
        webp = f'srcset="../images/{name}-480.webp 480w, ../images/{name}.webp {w}w" sizes="{sizes}"'
        jpg = f' srcset="../images/{name}-480.jpg 480w, ../images/{name}.jpg {w}w" sizes="{sizes}"'
    else:
        webp, jpg = f'srcset="../images/{name}.webp"', ""
    return (f'<picture{c}>\n'
            f'                            <source type="image/webp" {webp}>\n'
            f'                            <img src="../images/{name}.jpg"{jpg} alt="{alt}" width="{w}" height="{h}" loading="lazy" decoding="async">\n'
            f'                        </picture>')


def sidebar(active):
    links = ""
    for s in SERVICES:
        on = s["slug"] == active
        cls = "sd-service-link is-active" if on else "sd-service-link"
        cur = ' aria-current="page"' if on else ""
        links += (f'\n                            <li><a class="{cls}" href="service-{s["slug"]}.html"{cur}>{s["name"]}'
                  '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg></a></li>')
    return f'''                <aside class="sd-sidebar" aria-label="More about our services">
                    <div class="sd-sidebar-inner">
                        <nav class="sd-card sd-services" aria-labelledby="sd-services-title">
                            <h2 class="sd-card-title" id="sd-services-title"><span class="sd-card-icon">{icon("truck")}</span>Our Services</h2>
                            <ul class="sd-service-list">{links}
                            </ul>
                        </nav>

                        <a class="sd-card sd-help" href="tel:+19798888887">
                            <span class="sd-help-icon" aria-hidden="true"><svg class="icon" viewBox="0 0 24 24">{PHONE}</svg></span>
                            <span>
                                <span class="sd-help-label">Need help?</span>
                                <span class="sd-help-number">(979) 888-8887</span>
                            </span>
                        </a>

                        <div class="sd-card sd-quick">
                            <h2 class="sd-card-title"><span class="sd-card-icon">{icon("chat")}</span>Get a free quote</h2>
                            <p class="sd-quick-text">Tell us about your move in about a minute, and Moe&rsquo;s team will reach out with clear, upfront pricing.</p>
                            <a class="btn btn-primary sd-quick-btn" href="../index.html#quote">
                                Start My Free Quote
                                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>
                            </a>
                        </div>

                        <div class="sd-card sd-brand">
                            <img class="sd-brand-logo" src="../images/brand/logo-teal.webp" alt="Move with Moe" width="400" height="46" loading="lazy" decoding="async">
                            <picture class="sd-brand-photo">
                                <source type="image/webp" srcset="../images/about/about-truck.webp">
                                <img src="../images/about/about-truck.jpg" alt="The Move with Moe box truck" width="640" height="360" loading="lazy" decoding="async">
                            </picture>
                            <p class="sd-brand-title">{icon("shield")}Fully insured, licensed &amp; accredited</p>
                            <p class="sd-brand-text">TXDMV # 010005908C &middot; USDOT # 4288855</p>
                        </div>
                    </div>
                </aside>'''


def main_column(s):
    feats = "".join(f'''
                        <div class="sd-feature">
                            <span class="sd-feature-icon">{icon(ic)}</span>
                            <div>
                                <h3 class="sd-feature-title">{t}</h3>
                                <p>{x}</p>
                            </div>
                        </div>''' for (t, x), ic in zip(s["features"], FEATURE_ICONS[s["slug"]]))
    chev = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'
    faqs = ""
    for i, (q, a) in enumerate(s["faqs"]):
        btn = ('\n                                <a class="btn btn-primary btn-sm" href="../index.html#quote">Get a Free Quote '
               '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg></a>') if i == 0 else ""
        faqs += f'''
                        <details class="sd-faq-item"{" open" if i == 0 else ""}>
                            <summary>
                                <span class="sd-faq-q"><span class="sd-faq-icon" aria-hidden="true">{icon("truck")}</span>{q}</span>
                                <span class="sd-faq-chevron" aria-hidden="true">{chev}</span>
                            </summary>
                            <div class="sd-faq-a">
                                <p>{a}</p>{btn}
                            </div>
                        </details>'''
    bens = "".join(f'''
                        <li class="sd-benefit">
                            <div class="sd-benefit-head">
                                <span class="sd-benefit-icon">{icon(ic)}</span>
                                <h3 class="sd-benefit-title">{t}</h3>
                            </div>
                            <p>{x}</p>
                        </li>''' for ic, t, x in s["benefits"])
    img, alt = s["image"]
    simg, salt, stitle, stext = s["spotlight"]
    return f'''                <article class="sd-main">
                    <p class="section-eyebrow">{s["name"]}</p>
                    <h2 class="sd-title">{s["title"]}</h2>
                    <p class="sd-lead">{s["intro"]}</p>

                    <!-- Two full photos side by side (both are tall crew photos, so nothing is cropped) -->
                    <div class="sd-photos">
                        <figure class="sd-photo">
                            {picture(img, alt, 900, 1200, sizes=PHOTO_SIZES)}
                        </figure>
                        <figure class="sd-photo">
                            {picture(simg, salt, 900, 1200, sizes=PHOTO_SIZES)}
                        </figure>
                    </div>

                    <div class="sd-features">{feats}
                    </div>

                    <div class="sd-spotlight">
                        <span class="sd-spotlight-icon">{icon("shield")}</span>
                        <div class="sd-spotlight-copy">
                            <h3 class="sd-spotlight-title">{stitle}</h3>
                            <p>{stext}</p>
                        </div>
                        <a class="sd-spotlight-link" href="tel:+19798888887"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true">{PHONE}</svg>Talk with our team</a>
                    </div>

                    <h2 class="sd-heading"><span class="sd-heading-icon">{icon("question")}</span>Questions about {s["name"].lower()}</h2>
                    <p class="sd-text">{s["faq_intro"]}</p>
                    <div class="sd-faq">{faqs}
                    </div>

                    <h2 class="sd-heading"><span class="sd-heading-icon">{icon("star")}</span>Why choose Moe&rsquo;s Movers</h2>
                    <ul class="sd-benefits">{bens}
                    </ul>
                </article>'''


def build():
    base = (ROOT / "html/services.html").read_text()
    for s in SERVICES:
        page = base
        page = re.sub(r"<title>.*?</title>", f"<title>{s['name']} in Houston | Moe's Movers | Move with Moe</title>", page, count=1)
        # Search + link-preview tags: this page's own title, description and URL
        url = f"https://mfebres0919.github.io/Moes_Movers/html/service-{s['slug']}.html"
        og_title = f"{s['name']} in Houston | Moe's Movers"
        page = re.sub(r'(<meta (?:name|property)="(?:description|og:description|twitter:description)" content=")[^"]*', lambda m: m.group(1) + s["desc"], page)
        page = re.sub(r'(<meta (?:property|name)="(?:og:title|twitter:title)" content=")[^"]*', lambda m: m.group(1) + og_title, page)
        page = re.sub(r'(<link rel="canonical" href=")[^"]*|(<meta property="og:url" content=")[^"]*', lambda m: (m.group(1) or m.group(2)) + url, page)
        page = page.replace('href="../css/services.css"', 'href="../css/service-details.css"')
        page = page.replace('src="../javascript/services.js"', 'src="../javascript/service-details.js"')
        page = page.replace("hero-truck-home", s["hero"])
        # breadcrumb: Home / Services / This service
        page = page.replace('<li aria-current="page">Services</li>', f'<li><a href="services.html">Services</a></li>\n                        <li aria-current="page">{s["name"]}</li>')
        page = re.sub(r'<h1 class="page-hero-title".*?</h1>', f'<h1 class="page-hero-title" id="page-title">{s["name"]}</h1>', page, count=1, flags=re.S)
        page = re.sub(r'<p class="page-hero-text">.*?</p>', f'<p class="page-hero-text">{s["title"]}</p>', page, count=1, flags=re.S)
        a = page.index("        <!-- ===== All services")
        b = page.index("        <!-- ===== Final call to action")
        body = f'''        <!-- ===== Service details: content (left on desktop: sidebar) ===== -->
        <section class="sd" aria-label="{s["name"]} details">
            <div class="container sd-layout">
{main_column(s)}

{sidebar(s["slug"])}
            </div>
        </section>

'''
        page = page[:a] + body + page[b:]
        (ROOT / f"html/service-{s['slug']}.html").write_text(page)
        print("built", f"html/service-{s['slug']}.html")


if __name__ == "__main__":
    build()
