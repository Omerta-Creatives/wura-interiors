# Wura Interiors

Premium interior design, bespoke furniture studio, and full e-commerce store with a secure admin dashboard.

- **Public site:** Home, About, Services, Portfolio (category filter + project pages), Store (`/store` with category & availability filters, product detail pages, slide-over Selection Bag), Checkout (`/checkout` with Paystack payment & WhatsApp alternative), Order Verification & Tracking (`/checkout/verify`, `/orders/[reference]`), Customer Account Portal (`/sign-in`, `/sign-up`, `/account`), Contact.
- **Admin dashboard (`/admin`):** Store products (`/admin/products`), Paystack orders (`/admin/orders`), portfolio projects & image galleries (`/admin/projects`), categories (`/admin/categories`), services (`/admin/services`), site settings (`/admin/settings`), draft/publish workflow, project preview, and launch-readiness checklist.
- **Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · **Neon Postgres** (`@neondatabase/serverless` + `pg`) · **Better Auth** (`better-auth`) · **Paystack** (Transaction Initialize, Verify, and HMAC SHA-512 Webhook) · Vercel.

## 1. Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Without `DATABASE_URL` configured, the public portfolio and store pages render seamlessly using curated studio sample data, and `/admin/login` displays a configuration banner.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string (`postgresql://...`) |
| `BETTER_AUTH_SECRET` | 32-byte secret for signing Better Auth sessions (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Base URL for Better Auth (e.g. `http://localhost:3000` or `https://wurainteriors.com`) |
| `PAYSTACK_SECRET_KEY` | Paystack Secret Key (`sk_test_...` or `sk_live_...`) for initializing/verifying transactions and webhook signatures |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack Public Key (`pk_test_...` or `pk_live_...`) |
| `NEXT_PUBLIC_SITE_URL` | Production URL (e.g. `https://wurainteriors.com`), used for sitemaps, Open Graph, and Paystack callback URLs |

## 2. Set up Neon Postgres & Better Auth

1. Create a **Neon Postgres** project (via the Neon Console or Vercel Marketplace Storage).
2. Open the **Neon SQL Editor** and run [`db/schema.sql`](db/schema.sql). This creates:
   - Better Auth tables (`"user"`, `"session"`, `"account"`, `"verification"`) with `role` (`customer` | `admin`), `phone`, and `is_active` columns.
   - Studio CMS tables (`categories`, `projects`, `project_images`, `services`, `site_settings`).
   - E-commerce tables (`products`, `orders`, `order_items`).
3. Run [`db/seed.sql`](db/seed.sql) in the Neon SQL Editor to seed the initial portfolio projects, services, categories, site settings, and the 8 curated store pieces.
4. Register your account at `/sign-up`, then run [`db/make_admin.example.sql`](db/make_admin.example.sql) (replacing the email address with yours) to grant `role = 'admin'`.

## 3. Set up Paystack

1. Copy your `PAYSTACK_SECRET_KEY` and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` from **Paystack Dashboard → Settings → API Keys & Webhooks** into `.env.local` (and Vercel Environment Variables).
2. Set your Paystack Webhook URL in the Paystack Dashboard to:
   ```
   https://your-domain.com/api/paystack/webhook
   ```
   The webhook endpoint (`src/app/api/paystack/webhook/route.ts`) verifies the `x-paystack-signature` HMAC SHA-512 header and atomically marks matching orders as `paid` / `confirmed` while decrementing stock quantities for `in_stock` items.
3. During checkout, customers are redirected to Paystack's hosted checkout and return to `/checkout/verify?reference=...`, which also verifies the transaction server-side and redirects to `/orders/[order_number]`.

## 4. Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm run lint` | ESLint |
