-- =============================================================================
-- Wura Interiors — Neon Postgres Seed Data
-- Run after db/schema.sql in your Neon SQL Editor or via psql.
-- Seeds categories, portfolio projects, project images, services, site settings,
-- and the initial 8 Store products.
-- =============================================================================

begin;

-- 1. Categories
insert into categories (id, name, slug, sort_order)
values
  ('11111111-1111-4111-8111-111111111101', 'Residential', 'residential', 1),
  ('11111111-1111-4111-8111-111111111102', 'Commercial', 'commercial', 2),
  ('11111111-1111-4111-8111-111111111103', 'Bespoke Furniture', 'bespoke-furniture', 3),
  ('11111111-1111-4111-8111-111111111104', 'Hospitality', 'hospitality', 4)
on conflict (slug) do nothing;

-- 2. Projects
insert into projects (
  id, title, slug, summary, description, category_id, location, completed_on, featured, status, published_at
)
values
  (
    '22222222-2222-4222-8222-222222222201',
    'Ikoyi Penthouse Residence',
    'ikoyi-penthouse-residence',
    'A full-floor lagoon-view residence anchored by warm walnut herringbone floors, travertine stonework, and custom linen upholstery.',
    E'Overlooking the Lagos lagoon, this full-floor penthouse was reimagined from shell and core to create a serene sanctuary for entertaining and family life. We introduced warm walnut herringbone flooring throughout the living areas, paired with hand-trowelled ivory limewash walls that soften the equatorial sunlight.\n\nIn the main salon, a custom curved bouclé and linen sectional frames the water view while blackened steel and brushed brass shelving anchors the architectural volume. The formal dining room features a ten-seater solid iroko table beneath a sculptural linear brass chandelier, flowing seamlessly into a calm primary suite wrapped in sand-toned drapery.',
    '11111111-1111-4111-8111-111111111101',
    'Ikoyi, Lagos',
    '2025-11-15',
    true,
    'published',
    now()
  ),
  (
    '22222222-2222-4222-8222-222222222202',
    'Victoria Island Executive Lounge',
    'victoria-island-executive-lounge',
    'A private executive floor and client reception crafted with dark stained oak, monolithic travertine, and saddle leather.',
    E'Designed for a private investment firm in Victoria Island, this executive suite replaces conventional corporate austerity with hospitality-grade warmth and acoustic privacy.\n\nGuests arrive at a monolithic honed travertine reception desk detailed with brushed brass inlay, set against dark stained oak wall panelling and warm architectural cove lighting. The adjoining boardroom centres on a custom 14-foot stone and walnut conference table surrounded by cognac saddle-leather seating and slatted timber acoustic walls.',
    '11111111-1111-4111-8111-111111111102',
    'Victoria Island, Lagos',
    '2025-09-28',
    true,
    'published',
    now()
  ),
  (
    '22222222-2222-4222-8222-222222222203',
    'The Oyo Walnut & Brass Collection',
    'oyo-walnut-and-brass-collection',
    'A limited series of sculptural dining tables and fluted sideboards celebrating West African hardwood and precision brass joinery.',
    E'Developed in our furniture workshop, the Oyo Collection explores the dialogue between heavy architectural timber and refined metalwork. Each piece is built to order from sustainably sourced African walnut, kiln-dried and finished with natural plant oils to preserve the open grain.\n\nExposed mortise-and-tenon joints are reinforced with hand-machined brushed brass collars and pulls, paired with honed cream marble and travertine surfaces that gain character with daily use.',
    '11111111-1111-4111-8111-111111111103',
    'Lagos Atelier',
    '2025-08-12',
    true,
    'published',
    now()
  ),
  (
    '22222222-2222-4222-8222-222222222204',
    'Lekki Coastal Villa',
    'lekki-coastal-villa',
    'An airy double-height family villa balancing cool travertine stone, woven cane, and monolithic kitchen millwork.',
    E'Conceived for effortless indoor-outdoor living near the Atlantic coast, this family villa embraces natural ventilation, abundant daylight, and cool underfoot textures. Honed travertine slabs run continuously from the double-height living room out to the terrace.\n\nCustom teak and woven cane lounge seating pairs with deep ivory linen sofas, while the open-plan kitchen is anchored by a monolithic fluted travertine island and floor-to-ceiling warm oak cabinetry.',
    '11111111-1111-4111-8111-111111111101',
    'Lekki Phase 1, Lagos',
    '2025-06-20',
    true,
    'published',
    now()
  ),
  (
    '22222222-2222-4222-8222-222222222205',
    'Maitama Boutique Hotel Suite',
    'maitama-boutique-hotel-suite',
    'A tranquil presidential suite and spa bath in Abuja crafted with dark walnut canopy millwork and carved stone.',
    E'For an intimate boutique hotel in Maitama, we designed the flagship suites to feel like a private collector''s residence rather than a transient hotel room. A custom four-poster canopy bed in dark walnut defines the sleeping zone, dressed in breathable earth-toned Belgian linens.\n\nThe adjoining en-suite bath is wrapped in book-matched travertine slabs, featuring a freestanding carved stone soaking tub, brushed brass floor-mounted brassware, and warm indirect lighting.',
    '11111111-1111-4111-8111-111111111104',
    'Maitama, Abuja',
    '2025-04-10',
    true,
    'published',
    now()
  ),
  (
    '22222222-2222-4222-8222-222222222206',
    'Abuja Private Gallery & Study',
    'abuja-private-gallery-and-study',
    'A quiet-luxury home library and collector''s study with floor-to-ceiling walnut joinery and integrated gallery lighting.',
    E'Created for an art patron and avid reader, this private study combines museum-grade display lighting with the intimacy of a traditional timber-lined library. Floor-to-ceiling walnut shelving is custom-fitted with concealed warm LED channels to illuminate sculptures, rare books, and works on paper.\n\nA sculptural solid walnut writing desk commands the centre of the room, balanced by an intimate reading nook with a custom cream bouclé armchair and brushed brass floor lamp.',
    '11111111-1111-4111-8111-111111111101',
    'Asokoro, Abuja',
    '2025-02-18',
    true,
    'published',
    now()
  )
on conflict (slug) do nothing;

-- 3. Project Images
insert into project_images (
  id, project_id, storage_path, caption, alt_text, width, height, sort_order, is_cover
)
values
  ('33333333-3333-4333-8333-333333333301', '22222222-2222-4222-8222-222222222201', '/images/portfolio/ikoyi-penthouse-cover.jpg', 'Main living salon with custom curved linen sectional, brass shelving, and walnut herringbone floors.', 'Luxury penthouse living room overlooking the lagoon with cream sectional sofa and walnut herringbone floor', 1600, 1200, 0, true),
  ('33333333-3333-4333-8333-333333333302', '22222222-2222-4222-8222-222222222201', '/images/portfolio/ikoyi-penthouse-dining.jpg', 'Ten-seater solid iroko dining table paired with upholstered linen chairs and a sculptural brass pendant.', 'Formal dining room with solid wood table, linen chairs, and brushed brass linear chandelier', 1600, 1200, 1, false),
  ('33333333-3333-4333-8333-333333333303', '22222222-2222-4222-8222-222222222201', '/images/portfolio/ikoyi-penthouse-suite.jpg', 'Primary bedroom suite featuring a full-width upholstered sand linen headboard and floating walnut nightstands.', 'Serene primary bedroom with sand linen headboard, brass sconces, and sheer floor-to-ceiling curtains', 1600, 1200, 2, false),
  ('33333333-3333-4333-8333-333333333304', '22222222-2222-4222-8222-222222222202', '/images/portfolio/vi-lounge-cover.jpg', 'Client reception and private lounge with travertine desk, brass inlay, and cognac leather armchairs.', 'Executive reception lounge with dark oak panelling, travertine desk, and cognac leather armchairs', 1600, 1200, 0, true),
  ('33333333-3333-4333-8333-333333333305', '22222222-2222-4222-8222-222222222202', '/images/portfolio/vi-lounge-boardroom.jpg', 'Acoustic slatted timber boardroom with a bespoke travertine and walnut conference table.', 'Executive boardroom with stone and walnut conference table and saddle-leather chairs', 1600, 1200, 1, false),
  ('33333333-3333-4333-8333-333333333306', '22222222-2222-4222-8222-222222222203', '/images/portfolio/oyo-collection-cover.jpg', 'Oyo sculptural dining table in solid African walnut with brushed brass architectural leg joinery.', 'Sculptural solid walnut dining table with brushed brass joinery on travertine stone floor', 1600, 1200, 0, true),
  ('33333333-3333-4333-8333-333333333307', '22222222-2222-4222-8222-222222222203', '/images/portfolio/oyo-collection-credenza.jpg', 'Low-profile fluted walnut sideboard credenza topped with honed cream marble and aged brass hardware.', 'Fluted walnut sideboard credenza with cream marble top and brass pulls against limewash wall', 1600, 1200, 1, false),
  ('33333333-3333-4333-8333-333333333308', '22222222-2222-4222-8222-222222222204', '/images/portfolio/lekki-villa-cover.jpg', 'Double-height coastal living room with honed travertine floors, teak and cane seating, and sheer linen drapery.', 'Sunlit double-height villa living room with travertine floors, cane lounge chairs, and linen sofas', 1600, 1200, 0, true),
  ('33333333-3333-4333-8333-333333333309', '22222222-2222-4222-8222-222222222204', '/images/portfolio/lekki-villa-kitchen.jpg', 'Architectural kitchen centred on a monolithic fluted travertine island with brushed brass fixtures.', 'Minimalist luxury kitchen with fluted travertine island, oak cabinetry, and wooden bar stools', 1600, 1200, 1, false),
  ('33333333-3333-4333-8333-333333333310', '22222222-2222-4222-8222-222222222205', '/images/portfolio/maitama-hotel-cover.jpg', 'Presidential suite with custom dark walnut four-poster canopy bed and warm brass pendant lighting.', 'Luxury boutique hotel suite with dark walnut four-poster canopy bed and earth-toned linen bedding', 1600, 1200, 0, true),
  ('33333333-3333-4333-8333-333333333311', '22222222-2222-4222-8222-222222222205', '/images/portfolio/maitama-hotel-bath.jpg', 'Spa-inspired en-suite bathroom with honed travertine walls and a freestanding stone soaking tub.', 'Spa bathroom with travertine walls, freestanding stone soaking tub, and brushed brass faucet', 1600, 1200, 1, false),
  ('33333333-3333-4333-8333-333333333312', '22222222-2222-4222-8222-222222222206', '/images/portfolio/abuja-study-cover.jpg', 'Custom floor-to-ceiling walnut bookshelves with integrated warm display lighting and sculptural writing desk.', 'Private library and study with floor-to-ceiling walnut bookshelves, writing desk, and velvet lounge chair', 1600, 1200, 0, true),
  ('33333333-3333-4333-8333-333333333313', '22222222-2222-4222-8222-222222222206', '/images/portfolio/abuja-study-nook.jpg', 'Reading corner with bespoke cream bouclé armchair, brushed brass floor lamp, and framed textile artwork.', 'Intimate reading nook with cream bouclé armchair, brass floor lamp, and framed textile art', 1600, 1200, 1, false)
on conflict (id) do nothing;

-- 4. Services
insert into services (id, title, slug, summary, description, sort_order, status)
values
  (
    '44444444-4444-4444-8444-444444444401',
    'Residential Interior Design',
    'residential-interior-design',
    'End-to-end spatial planning, material specification, custom millwork, and turnkey furnishing for private homes and penthouses.',
    E'We guide residential projects from initial architectural review through to final styling and handover. Our team develops comprehensive spatial layouts, lighting plans, wall and floor finishes, kitchen and bath cabinetry, and room-by-room furniture selections.\n\nBy coordinating directly with contractors, artisans, and our in-house furniture workshop, we ensure every detail—from concealed drapery tracks to custom stone thresholds—is executed with quiet precision.',
    1,
    'published'
  ),
  (
    '44444444-4444-4444-8444-444444444402',
    'Bespoke Furniture & Millwork',
    'bespoke-furniture-and-millwork',
    'Made-to-measure dining tables, credenzas, upholstered seating, and architectural joinery crafted from kiln-dried hardwoods, brass, and stone.',
    E'Our furniture atelier designs and builds heirloom-grade pieces tailored to the exact proportions of your space. Working with sustainably sourced African walnut, iroko, oak, honed travertine, and brushed brass, we craft freestanding furniture as well as integrated wardrobes, libraries, and reception desks.\n\nEach commission includes technical shop drawings, timber and textile sampling, and white-glove delivery and installation.',
    2,
    'published'
  ),
  (
    '44444444-4444-4444-8444-444444444403',
    'Commercial & Hospitality Spaces',
    'commercial-and-hospitality-spaces',
    'Executive offices, private lounges, boutique hotels, and gallery spaces designed for durability, acoustic comfort, and brand presence.',
    E'We partner with founders, developers, and hospitality operators to create spaces that leave a lasting impression on guests and teams. Our commercial scope covers concept development, FF&E procurement, acoustic panelling, custom reception and boardroom furniture, and ambient lighting design.\n\nEvery material is selected to withstand high-traffic use while maintaining the warmth and refinement of a private residence.',
    3,
    'published'
  )
on conflict (slug) do nothing;

-- 5. Site Settings
update site_settings
set tagline = coalesce(tagline, 'Bespoke residential, commercial, and hospitality interiors alongside custom-crafted furniture tailored to how you live and work.'),
    about_story = coalesce(about_story, E'Wura Interiors was founded on a quiet conviction: the spaces we inhabit every day shape our calm, our focus, and the way we gather. Working across residential homes, executive workplaces, and boutique hospitality spaces, our studio pairs spatial architecture with custom furniture making.\n\nEvery commission begins with listening—understanding how natural light moves through a room, how a family or team uses each corner, and which tactile materials will age with grace over decades rather than seasons.'),
    design_philosophy = coalesce(design_philosophy, E'We believe in warm minimalism grounded in honest materials: hand-rubbed African walnut and iroko timber, honed travertine stone, unlacquered brushed brass, and breathable natural linens.\n\nRather than filling rooms with ornament, we focus on proportion, joinery, and atmosphere—designing custom millwork and collectible pieces that belong unmistakably to their architecture.')
where id = 1;

-- 6. Store Products
insert into products (
  id, name, slug, category, price, summary, description, dimensions, materials, finish,
  lead_time, availability, stock_quantity, featured, status, sort_order, image_path, alt_text, gallery_paths
)
values
  (
    '55555555-5555-4555-8555-555555555501',
    'Oyo Sculptural Walnut Dining Table',
    'oyo-sculptural-walnut-dining-table',
    'Dining',
    3850000,
    'Eight-to-ten seater architectural dining table crafted from solid kiln-dried African walnut with hand-machined brushed brass leg collars.',
    E'Built to anchor formal dining rooms and executive hospitality spaces, the Oyo Dining Table pairs thick book-matched planks of sustainably harvested African walnut with exposed mortise-and-tenon joinery.\n\nEach monolithic trestle leg is fitted with hand-brushed unlacquered brass collars that develop a warm patina over time. Finished with three coats of natural hardwax oil for water and heat resistance while preserving the tactile open grain.',
    '280 cm L × 110 cm W × 76 cm H (Custom lengths 220–360 cm available)',
    'Solid African Walnut, Unlacquered Brushed Brass',
    'Hand-rubbed matte natural hardwax oil',
    'Made to order · 6–8 weeks',
    'made_to_order',
    5,
    true,
    'published',
    1,
    '/images/portfolio/oyo-collection-cover.jpg',
    'Oyo Sculptural Walnut Dining Table with brushed brass joinery on a travertine floor',
    '[{"path":"/images/portfolio/ikoyi-penthouse-dining.jpg","alt":"Dining room installation of the solid hardwood table with upholstered linen chairs","caption":"Installed in the Ikoyi Penthouse dining room."},{"path":"/images/site/craftsmanship.jpg","alt":"Macro detail of precision walnut and brushed brass joinery in our studio","caption":"Hand-fitted brass and timber joinery detail from the Wura Atelier."}]'::jsonb
  ),
  (
    '55555555-5555-4555-8555-555555555502',
    'Adire Bouclé & Walnut Lounge Chair',
    'adire-boucle-and-walnut-lounge-chair',
    'Seating',
    1450000,
    'Low-slung architectural lounge chair featuring a sculpted solid walnut frame, precision brass arm joints, and Belgian cream bouclé upholstery.',
    E'Designed for quiet reading corners and formal living salons, the Adire Lounge Chair balances generous seating proportions with a sculptural timber silhouette that looks refined from every angle.\n\nThe solid African walnut frame is shaped by hand and joined with brushed brass dowels at the armrest knuckles. Deep high-resilience cushions are upholstered in heavyweight ivory Belgian bouclé.',
    '82 cm W × 86 cm D × 74 cm H (Seat height: 41 cm)',
    'Solid African Walnut, Brushed Brass, Heavyweight Cream Bouclé (72% Wool, 18% Linen, 10% Cotton)',
    'Satin walnut oil & brushed brass',
    'In stock · Delivers in 5–7 business days',
    'in_stock',
    8,
    true,
    'published',
    2,
    '/images/store/boucle-chair.jpg',
    'Adire Bouclé and Walnut Lounge Chair with brushed brass joints on a travertine floor',
    '[{"path":"/images/site/craftsmanship.jpg","alt":"Close-up of the sculpted walnut frame and brushed brass joinery","caption":"Precision brass knuckle joinery on the solid walnut frame."},{"path":"/images/portfolio/abuja-study-nook.jpg","alt":"Adire bouclé armchair styled in an intimate reading nook with a brass floor lamp","caption":"Styled in the Abuja Private Gallery & Study."}]'::jsonb
  ),
  (
    '55555555-5555-4555-8555-555555555503',
    'Eko Monolithic Travertine Coffee Table',
    'eko-monolithic-travertine-coffee-table',
    'Tables',
    1850000,
    'Low-profile architectural coffee table carved from honed cream travertine with a subtly fluted plinth base and bevelled edge.',
    E'Celebrating the quiet permanence of natural stone, the Eko Coffee Table is fabricated from select-grade honed cream travertine with unfilled pores that showcase the stone''s organic veining.\n\nA recessed fluted plinth base gives the tabletop a floating silhouette while distributing weight evenly across hardwood or stone floors. Sealed with a breathable matte stone penetrator to guard against everyday spills.',
    '140 cm L × 90 cm W × 36 cm H',
    'Honed Natural Cream Travertine Stone',
    'Unfilled matte honed finish with breathable protective sealer',
    'In stock · Delivers in 5–7 business days',
    'in_stock',
    6,
    true,
    'published',
    3,
    '/images/store/travertine-table.jpg',
    'Eko Monolithic Travertine Coffee Table with fluted plinth base on an ivory wool rug',
    '[{"path":"/images/site/hero-interior.jpg","alt":"Travertine coffee table styled in a sunlit living room with walnut and bouclé seating","caption":"Paired with the Ife Modular Sofa and Adire Lounge Chairs."}]'::jsonb
  ),
  (
    '55555555-5555-4555-8555-555555555504',
    'Oyo Fluted Walnut & Marble Credenza',
    'oyo-fluted-walnut-and-marble-credenza',
    'Storage',
    2950000,
    'Four-door low sideboard with hand-fluted walnut fascia, honed cream marble top, soft-close cabinetry, and aged brass pulls.',
    E'Equally suited to dining rooms, media lounges, and executive offices, the Oyo Credenza conceals generous storage behind seamless rhythmically fluted walnut doors.\n\nA inset slab of honed cream marble rests atop the carcass with a shadow-gap reveal, complemented by solid turned brass pulls and adjustable interior walnut shelving with discreet cable management.',
    '220 cm L × 50 cm D × 78 cm H',
    'Solid & Veneered African Walnut, Honed Cream Marble, Aged Brushed Brass',
    'Natural matte timber oil & honed stone',
    'Made to order · 5–6 weeks',
    'made_to_order',
    4,
    true,
    'published',
    4,
    '/images/portfolio/oyo-collection-credenza.jpg',
    'Oyo Fluted Walnut and Marble Credenza against a warm limewash wall',
    '[{"path":"/images/site/about-studio.jpg","alt":"Material palette of honed stone, brass hardware, and walnut timber","caption":"Timber, stone, and solid brass hardware selections."}]'::jsonb
  ),
  (
    '55555555-5555-4555-8555-555555555505',
    'Zaria Brushed Brass Linear Chandelier',
    'zaria-brushed-brass-linear-chandelier',
    'Lighting',
    1150000,
    'Architectural linear pendant crafted from hand-brushed unlacquered brass and warm opal alabaster glass diffusers.',
    E'The Zaria Linear Chandelier casts a warm, glare-free ambient glow across dining tables, kitchen islands, and boardrooms. Hand-brazed in small batches from solid brass tubing, its balanced geometry pairs crisp horizontal lines with softly illuminated diffusers.\n\nSupplied with adjustable drop rods and warm-dimmable 2700K LED lamps.',
    '160 cm L × 24 cm W × 35 cm H (Custom drop height 60–180 cm)',
    'Solid Unlacquered Brushed Brass, Honed Opal Glass Diffusers',
    'Hand-brushed satin brass',
    'Made to order · 3–4 weeks',
    'made_to_order',
    5,
    false,
    'published',
    5,
    '/images/store/brass-chandelier.jpg',
    'Zaria Brushed Brass Linear Chandelier with warm glowing opal cylinders',
    '[{"path":"/images/portfolio/ikoyi-penthouse-dining.jpg","alt":"Linear brass chandelier suspended above a ten-seater dining table","caption":"Suspended above a 10-seater dining table in Ikoyi."}]'::jsonb
  ),
  (
    '55555555-5555-4555-8555-555555555506',
    'Ife Curved Linen Modular Sofa',
    'ife-curved-linen-modular-sofa',
    'Seating',
    4200000,
    'Three-seater architectural curved sofa upholstered in heavyweight sand Belgian linen over a kiln-dried iroko plinth.',
    E'Designed to encourage conversation and soften rectilinear rooms, the Ife Curved Sofa combines a sweeping organic backrest with tailored bolster cushions and a recessed dark walnut/iroko timber plinth.\n\nConstructed with a kiln-dried hardwood frame, webbed suspension, and multi-density feather-wrapped foam cores for enduring structure and sink-in comfort.',
    '310 cm W × 115 cm D × 76 cm H (Seat height: 42 cm)',
    '100% Heavyweight Belgian Linen, Kiln-Dried Iroko & Walnut Base, Feather-Wrapped High-Resilience Foam',
    'Warm Sand Linen & Dark Stained Timber Plinth',
    'Made to order · 4–6 weeks',
    'made_to_order',
    3,
    false,
    'published',
    6,
    '/images/store/linen-sofa.jpg',
    'Ife Curved Linen Modular Sofa in warm sand Belgian linen with dark wood base',
    '[{"path":"/images/portfolio/ikoyi-penthouse-cover.jpg","alt":"Curved linen sofa installed in the Ikoyi Penthouse living room","caption":"Custom configuration in the Ikoyi Penthouse Residence."}]'::jsonb
  ),
  (
    '55555555-5555-4555-8555-555555555507',
    'Kano Woven Cane & Teak Daybed',
    'kano-woven-cane-and-teak-daybed',
    'Seating',
    1950000,
    'Minimalist architectural daybed in solid plantation teak with a handwoven rattan cane backrest and ivory linen cushion.',
    E'Inspired by tropical modernist verandahs, the Kano Daybed brings airy texture to sunlit living rooms, galleries, and primary bedroom suites.\n\nThe solid teak frame is mortised by hand and accented with brushed brass foot caps, supporting a breathable handwoven natural cane backrest panel and a piped ivory linen mattress with bolster.',
    '205 cm L × 85 cm W × 68 cm H (Seat height: 40 cm)',
    'Solid Plantation Teak, Natural Rattan Cane, Ivory Linen, Brushed Brass',
    'Natural matte teak oil',
    'Made to order · 4–5 weeks',
    'made_to_order',
    4,
    false,
    'published',
    7,
    '/images/store/cane-daybed.jpg',
    'Kano Woven Cane and Teak Daybed with tailored ivory linen cushion and brass leg caps',
    '[{"path":"/images/portfolio/lekki-villa-cover.jpg","alt":"Teak and woven cane seating in the Lekki Coastal Villa","caption":"Coastal living room styling with travertine flooring."}]'::jsonb
  ),
  (
    '55555555-5555-4555-8555-555555555508',
    'Benin Stoneware & Brass Vessels (Set of 3)',
    'benin-stoneware-and-brass-vessels',
    'Objects & Decor',
    380000,
    'Trio of wheel-thrown architectural stoneware vessels in matte ivory and warm terracotta with hand-fitted brushed brass neck rings.',
    E'Created in collaboration with master ceramicists, this graduated trio of architectural vessels is wheel-thrown from coarse stoneware clay and fired to a tactile unglazed matte finish.\n\nEach vessel is crowned with a removable hand-spun brushed brass collar, designed to style consoles, dining tables, and open shelving as standalone sculptures or with dried botanicals.',
    'Tall: 42 cm H · Medium: 31 cm H · Low: 22 cm H',
    'Wheel-Thrown Stoneware Clay, Hand-Spun Brushed Brass',
    'Raw matte ivory & warm terracotta with satin brass',
    'In stock · Delivers in 3–5 business days',
    'in_stock',
    12,
    false,
    'published',
    8,
    '/images/store/ceramic-vessels.jpg',
    'Set of three matte ivory and terracotta stoneware vases with brushed brass neck rings on travertine',
    '[{"path":"/images/portfolio/oyo-collection-cover.jpg","alt":"Ceramic vessels styled on the Oyo walnut dining table","caption":"Styled atop the Oyo Sculptural Walnut Dining Table."}]'::jsonb
  )
on conflict (slug) do nothing;

commit;
