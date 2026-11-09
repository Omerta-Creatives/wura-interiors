-- =============================================================================
-- Wura Interiors — Neon Postgres Schema
-- Includes:
--   1. Better Auth tables ("user", "session", "account", "verification")
--   2. Studio Portfolio & CMS tables (categories, projects, project_images, services, site_settings)
--   3. E-Commerce & Paystack Order tables (products, orders, order_items)
-- =============================================================================

begin;

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Better Auth Core Tables
-- -----------------------------------------------------------------------------
create table if not exists "user" (
  id text primary key,
  name text not null,
  email text not null unique,
  "emailVerified" boolean not null default false,
  image text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  phone text,
  is_active boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists "session" (
  id text primary key,
  "expiresAt" timestamptz not null,
  token text not null unique,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text not null references "user"(id) on delete cascade
);

create index if not exists idx_session_user_id on "session"("userId");

create table if not exists "account" (
  id text primary key,
  "accountId" text not null,
  "providerId" text not null,
  "userId" text not null references "user"(id) on delete cascade,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope text,
  password text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists idx_account_user_id on "account"("userId");

create table if not exists "verification" (
  id text primary key,
  identifier text not null,
  value text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 2. Shared updated_at Trigger Function
-- -----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 3. Portfolio & Studio Tables
-- -----------------------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text not null,
  description text,
  category_id uuid references categories(id) on delete set null,
  location text,
  completed_on date,
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_status on projects(status);
create index if not exists idx_projects_category on projects(category_id);

create table if not exists project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  storage_path text not null,
  caption text,
  alt_text text not null,
  width integer,
  height integer,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_images_project on project_images(project_id);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text not null,
  description text,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists site_settings (
  id integer primary key default 1 check (id = 1),
  business_name text not null default 'Wura Interiors',
  tagline text,
  whatsapp_number text,
  email text,
  phone text,
  address text,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  logo_path text,
  about_story text,
  design_philosophy text,
  founder_name text,
  founder_bio text,
  updated_at timestamptz not null default now()
);

insert into site_settings (id, business_name)
values (1, 'Wura Interiors')
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 4. E-Commerce Store & Paystack Orders Tables
-- -----------------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null check (
    category in ('Seating', 'Dining', 'Tables', 'Storage', 'Lighting', 'Objects & Decor')
  ),
  price bigint not null check (price > 0), -- Whole NGN
  summary text not null,
  description text not null,
  dimensions text not null,
  materials text not null,
  finish text not null,
  lead_time text not null,
  availability text not null default 'made_to_order' check (
    availability in ('in_stock', 'made_to_order')
  ),
  stock_quantity integer not null default 10 check (stock_quantity >= 0),
  featured boolean not null default false,
  status text not null default 'published' check (
    status in ('draft', 'published', 'archived')
  ),
  sort_order integer not null default 0,
  image_path text not null,
  alt_text text not null,
  gallery_paths jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_status on products(status);
create index if not exists idx_products_category on products(category);
create index if not exists idx_products_slug on products(slug);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id text references "user"(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_address text not null,
  shipping_city text not null,
  shipping_state text not null,
  notes text,
  subtotal bigint not null check (subtotal >= 0),
  delivery_fee bigint not null default 0 check (delivery_fee >= 0),
  total bigint not null check (total >= 0),
  currency text not null default 'NGN',
  payment_status text not null default 'pending' check (
    payment_status in ('pending', 'paid', 'failed', 'refunded')
  ),
  order_status text not null default 'pending' check (
    order_status in ('pending', 'confirmed', 'in_production', 'out_for_delivery', 'delivered', 'cancelled')
  ),
  paystack_reference text not null unique,
  paystack_access_code text,
  paystack_authorization_url text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_orders_email on orders(lower(customer_email));
create index if not exists idx_orders_paystack_ref on orders(paystack_reference);
create index if not exists idx_orders_created_at on orders(created_at desc);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  product_slug text not null,
  product_image text not null,
  unit_price bigint not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total bigint not null check (line_total >= 0),
  lead_time text
);

create index if not exists idx_order_items_order_id on order_items(order_id);

-- -----------------------------------------------------------------------------
-- 5. Attach updated_at Triggers
-- -----------------------------------------------------------------------------
drop trigger if exists trg_categories_updated_at on categories;
create trigger trg_categories_updated_at
  before update on categories
  for each row execute function set_updated_at();

drop trigger if exists trg_projects_updated_at on projects;
create trigger trg_projects_updated_at
  before update on projects
  for each row execute function set_updated_at();

drop trigger if exists trg_services_updated_at on services;
create trigger trg_services_updated_at
  before update on services
  for each row execute function set_updated_at();

drop trigger if exists trg_site_settings_updated_at on site_settings;
create trigger trg_site_settings_updated_at
  before update on site_settings
  for each row execute function set_updated_at();

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at
  before update on products
  for each row execute function set_updated_at();

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

commit;
