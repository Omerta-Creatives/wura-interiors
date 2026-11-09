import { cache } from "react";
import { dbQuery } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/env";
import {
  SAMPLE_CATEGORIES,
  SAMPLE_PRODUCTS,
  SAMPLE_PROJECTS,
  SAMPLE_SERVICES,
  SAMPLE_SETTINGS,
  STORE_CATEGORIES,
} from "@/lib/sample-data";
import type {
  Category,
  OrderItem,
  OrderWithItems,
  ProductGalleryItem,
  ProjectImage,
  ProjectWithRelations,
  Service,
  SiteSettings,
  StoreCategory,
  StoreProduct,
} from "@/types";

export const DEFAULT_SETTINGS: SiteSettings = SAMPLE_SETTINGS;

function sortImages(project: ProjectWithRelations): ProjectWithRelations {
  return {
    ...project,
    images: [...(project.images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  };
}

function filterSampleProjects(categorySlug?: string): ProjectWithRelations[] {
  const list = categorySlug
    ? SAMPLE_PROJECTS.filter((p) => p.category?.slug === categorySlug)
    : SAMPLE_PROJECTS;
  return list.map(sortImages);
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (!isDatabaseConfigured) return DEFAULT_SETTINGS;

  try {
    const { rows } = await dbQuery<Partial<SiteSettings>>(
      `SELECT * FROM site_settings WHERE id = 1 LIMIT 1`,
    );
    const row = rows[0];
    if (!row) return DEFAULT_SETTINGS;

    return {
      ...DEFAULT_SETTINGS,
      ...row,
      tagline: row.tagline ?? DEFAULT_SETTINGS.tagline,
      about_story: row.about_story ?? DEFAULT_SETTINGS.about_story,
      design_philosophy: row.design_philosophy ?? DEFAULT_SETTINGS.design_philosophy,
    };
  } catch (err) {
    console.error("[data] site_settings:", err);
    return DEFAULT_SETTINGS;
  }
});

async function hydrateProjects(
  projectRows: Record<string, unknown>[],
): Promise<ProjectWithRelations[]> {
  if (projectRows.length === 0) return [];

  const projectIds = projectRows.map((p) => String(p.id));
  const { rows: imageRows } = await dbQuery<ProjectImage>(
    `SELECT * FROM project_images WHERE project_id = ANY($1::uuid[]) ORDER BY sort_order ASC`,
    [projectIds],
  );

  const imagesByProject = new Map<string, ProjectImage[]>();
  for (const img of imageRows) {
    const list = imagesByProject.get(img.project_id) ?? [];
    list.push(img);
    imagesByProject.set(img.project_id, list);
  }

  return projectRows.map((row) => {
    const slug = String(row.slug);
    const dbImages = imagesByProject.get(String(row.id)) ?? [];
    const fallbackImages =
      dbImages.length === 0
        ? (SAMPLE_PROJECTS.find((p) => p.slug === slug)?.images ?? [])
        : dbImages;

    return {
      id: String(row.id),
      title: String(row.title),
      slug,
      summary: (row.summary as string | null) ?? null,
      description: (row.description as string | null) ?? null,
      category_id: (row.category_id as string | null) ?? null,
      location: (row.location as string | null) ?? null,
      completed_on: row.completed_on ? String(row.completed_on).slice(0, 10) : null,
      featured: Boolean(row.featured),
      status: (row.status as ProjectWithRelations["status"]) ?? "draft",
      published_at: row.published_at ? new Date(String(row.published_at)).toISOString() : null,
      created_at: new Date(String(row.created_at ?? Date.now())).toISOString(),
      updated_at: new Date(String(row.updated_at ?? Date.now())).toISOString(),
      category:
        row.category_name && row.category_slug
          ? { name: String(row.category_name), slug: String(row.category_slug) }
          : null,
      images: fallbackImages,
    };
  });
}

export const getPublishedProjects = cache(
  async (categorySlug?: string): Promise<ProjectWithRelations[]> => {
    if (!isDatabaseConfigured) return filterSampleProjects(categorySlug);

    try {
      const params: unknown[] = [];
      let whereClause = `WHERE p.status = 'published'`;

      if (categorySlug) {
        params.push(categorySlug);
        whereClause += ` AND c.slug = $1`;
      }

      const { rows } = await dbQuery<Record<string, unknown>>(
        `SELECT p.*, c.name AS category_name, c.slug AS category_slug
         FROM projects p
         LEFT JOIN categories c ON c.id = p.category_id
         ${whereClause}
         ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC`,
        params,
      );

      if (rows.length === 0) {
        const { rows: countRows } = await dbQuery<{ count: string }>(
          `SELECT COUNT(*)::text AS count FROM projects WHERE status = 'published'`,
        );
        const totalPublished = Number(countRows[0]?.count ?? 0);
        return totalPublished === 0 ? filterSampleProjects(categorySlug) : [];
      }

      return await hydrateProjects(rows);
    } catch (err) {
      console.error("[data] getPublishedProjects:", err);
      return filterSampleProjects(categorySlug);
    }
  },
);

export const getProjectBySlug = cache(
  async (slug: string): Promise<ProjectWithRelations | null> => {
    if (!isDatabaseConfigured) {
      const sample = SAMPLE_PROJECTS.find((p) => p.slug === slug);
      return sample ? sortImages(sample) : null;
    }

    try {
      const { rows } = await dbQuery<Record<string, unknown>>(
        `SELECT p.*, c.name AS category_name, c.slug AS category_slug
         FROM projects p
         LEFT JOIN categories c ON c.id = p.category_id
         WHERE p.slug = $1 AND p.status = 'published'
         LIMIT 1`,
        [slug],
      );

      if (rows.length > 0) {
        const hydrated = await hydrateProjects(rows);
        return hydrated[0] ?? null;
      }
    } catch (err) {
      console.error("[data] getProjectBySlug:", err);
    }

    const sample = SAMPLE_PROJECTS.find((p) => p.slug === slug);
    return sample ? sortImages(sample) : null;
  },
);

export const getPortfolioCategories = cache(async (): Promise<Category[]> => {
  if (!isDatabaseConfigured) return SAMPLE_CATEGORIES;

  try {
    const { rows } = await dbQuery<Category>(
      `SELECT DISTINCT c.id, c.name, c.slug, c.sort_order
       FROM categories c
       INNER JOIN projects p ON p.category_id = c.id AND p.status = 'published'
       ORDER BY c.sort_order ASC, c.name ASC`,
    );
    return rows.length > 0 ? rows : SAMPLE_CATEGORIES;
  } catch (err) {
    console.error("[data] getPortfolioCategories:", err);
    return SAMPLE_CATEGORIES;
  }
});

export const getPublishedServices = cache(async (): Promise<Service[]> => {
  if (!isDatabaseConfigured) return SAMPLE_SERVICES;

  try {
    const { rows } = await dbQuery<Service>(
      `SELECT * FROM services WHERE status = 'published' ORDER BY sort_order ASC, title ASC`,
    );
    return rows.length > 0 ? rows : SAMPLE_SERVICES;
  } catch (err) {
    console.error("[data] getPublishedServices:", err);
    return SAMPLE_SERVICES;
  }
});

export const getServiceBySlug = cache(async (slug: string): Promise<Service | null> => {
  if (!isDatabaseConfigured) {
    return SAMPLE_SERVICES.find((s) => s.slug === slug) ?? null;
  }

  try {
    const { rows } = await dbQuery<Service>(
      `SELECT * FROM services WHERE slug = $1 AND status = 'published' LIMIT 1`,
      [slug],
    );
    if (rows[0]) return rows[0];
  } catch (err) {
    console.error("[data] getServiceBySlug:", err);
  }

  return SAMPLE_SERVICES.find((s) => s.slug === slug) ?? null;
});

export function coverImage(project: ProjectWithRelations) {
  return project.images.find((i) => i.is_cover) ?? project.images[0] ?? null;
}

/* ---------- E-Commerce Store Products ---------- */

function mapProductRow(row: Record<string, unknown>): StoreProduct {
  let gallery: ProductGalleryItem[] = [];
  if (Array.isArray(row.gallery_paths)) {
    gallery = row.gallery_paths as ProductGalleryItem[];
  } else if (typeof row.gallery_paths === "string") {
    try {
      const parsed = JSON.parse(row.gallery_paths);
      if (Array.isArray(parsed)) gallery = parsed;
    } catch {
      gallery = [];
    }
  }

  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    category: (row.category as StoreCategory) ?? "Objects & Decor",
    price: Number(row.price ?? 0),
    summary: String(row.summary ?? ""),
    description: String(row.description ?? ""),
    dimensions: String(row.dimensions ?? ""),
    materials: String(row.materials ?? ""),
    finish: String(row.finish ?? ""),
    lead_time: String(row.lead_time ?? ""),
    availability:
      row.availability === "made_to_order" ? "made_to_order" : "in_stock",
    stock_quantity: Number(row.stock_quantity ?? 5),
    featured: Boolean(row.featured),
    status: (row.status as StoreProduct["status"]) ?? "published",
    image_path: String(row.image_path ?? "/images/site/craftsmanship.jpg"),
    alt_text: String(row.alt_text ?? row.name ?? ""),
    gallery_paths: gallery,
    sort_order: Number(row.sort_order ?? 0),
    created_at: row.created_at ? new Date(String(row.created_at)).toISOString() : undefined,
    updated_at: row.updated_at ? new Date(String(row.updated_at)).toISOString() : undefined,
  };
}

export const getStoreCategories = cache(async (): Promise<StoreCategory[]> => {
  return STORE_CATEGORIES;
});

export const getStoreProducts = cache(
  async (category?: string): Promise<StoreProduct[]> => {
    const filterFallback = () => {
      if (!category) return SAMPLE_PRODUCTS;
      return SAMPLE_PRODUCTS.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase(),
      );
    };

    if (!isDatabaseConfigured) return filterFallback();

    try {
      const params: unknown[] = [];
      let where = `WHERE status = 'published'`;
      if (category) {
        params.push(category);
        where += ` AND LOWER(category) = LOWER($1)`;
      }

      const { rows } = await dbQuery<Record<string, unknown>>(
        `SELECT * FROM products ${where} ORDER BY sort_order ASC, featured DESC, created_at DESC`,
        params,
      );

      if (rows.length === 0) {
        const { rows: countRows } = await dbQuery<{ count: string }>(
          `SELECT COUNT(*)::text AS count FROM products WHERE status = 'published'`,
        );
        const totalPublished = Number(countRows[0]?.count ?? 0);
        return totalPublished === 0 ? filterFallback() : [];
      }

      return rows.map(mapProductRow);
    } catch (err) {
      console.error("[data] getStoreProducts:", err);
      return filterFallback();
    }
  },
);

export const getStoreProductBySlug = cache(
  async (slug: string): Promise<StoreProduct | null> => {
    if (isDatabaseConfigured) {
      try {
        const { rows } = await dbQuery<Record<string, unknown>>(
          `SELECT * FROM products WHERE slug = $1 AND status = 'published' LIMIT 1`,
          [slug],
        );
        if (rows[0]) return mapProductRow(rows[0]);
      } catch (err) {
        console.error("[data] getStoreProductBySlug:", err);
      }
    }

    return SAMPLE_PRODUCTS.find((p) => p.slug === slug) ?? null;
  },
);

export const getStoreProductById = cache(
  async (id: string): Promise<StoreProduct | null> => {
    if (isDatabaseConfigured) {
      try {
        const { rows } = await dbQuery<Record<string, unknown>>(
          `SELECT * FROM products WHERE id::text = $1 OR slug = $1 LIMIT 1`,
          [id],
        );
        if (rows[0]) return mapProductRow(rows[0]);
      } catch {
        // Fallback to sample products
      }
    }

    return SAMPLE_PRODUCTS.find((p) => p.id === id || p.slug === id) ?? null;
  },
);

/* ---------- Orders ---------- */

function mapOrderRow(
  row: Record<string, unknown>,
  items: OrderItem[],
): OrderWithItems {
  return {
    id: String(row.id),
    order_number: String(row.order_number),
    user_id: (row.user_id as string | null) ?? null,
    customer_name: String(row.customer_name),
    customer_email: String(row.customer_email),
    customer_phone: String(row.customer_phone),
    shipping_address: String(row.shipping_address),
    shipping_city: String(row.shipping_city),
    shipping_state: String(row.shipping_state),
    notes: (row.notes as string | null) ?? null,
    subtotal: Number(row.subtotal ?? 0),
    delivery_fee: Number(row.delivery_fee ?? 0),
    total: Number(row.total ?? 0),
    currency: String(row.currency ?? "NGN"),
    payment_status: (row.payment_status as OrderWithItems["payment_status"]) ?? "pending",
    order_status: (row.order_status as OrderWithItems["order_status"]) ?? "pending",
    paystack_reference: String(row.paystack_reference),
    paystack_access_code: (row.paystack_access_code as string | null) ?? null,
    paystack_authorization_url:
      (row.paystack_authorization_url as string | null) ?? null,
    paid_at: row.paid_at ? new Date(String(row.paid_at)).toISOString() : null,
    created_at: new Date(String(row.created_at ?? Date.now())).toISOString(),
    updated_at: new Date(String(row.updated_at ?? Date.now())).toISOString(),
    items,
  };
}

function mapOrderItemRow(row: Record<string, unknown>): OrderItem {
  return {
    id: String(row.id),
    order_id: String(row.order_id),
    product_id: String(row.product_id),
    product_name: String(row.product_name),
    product_slug: String(row.product_slug),
    product_image: String(row.product_image),
    unit_price: Number(row.unit_price ?? 0),
    quantity: Number(row.quantity ?? 1),
    line_total: Number(row.line_total ?? 0),
    lead_time: (row.lead_time as string | null) ?? null,
  };
}

export async function getOrderByReference(
  reference: string,
): Promise<OrderWithItems | null> {
  if (!isDatabaseConfigured) return null;

  try {
    const { rows } = await dbQuery<Record<string, unknown>>(
      `SELECT * FROM orders
       WHERE paystack_reference = $1 OR order_number = $1 OR id::text = $1
       LIMIT 1`,
      [reference],
    );
    const orderRow = rows[0];
    if (!orderRow) return null;

    const { rows: itemRows } = await dbQuery<Record<string, unknown>>(
      `SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC`,
      [orderRow.id],
    );

    return mapOrderRow(orderRow, itemRows.map(mapOrderItemRow));
  } catch (err) {
    console.error("[data] getOrderByReference:", err);
    return null;
  }
}

export async function getCustomerOrders(
  userId: string,
  email: string,
): Promise<OrderWithItems[]> {
  if (!isDatabaseConfigured) return [];

  try {
    const { rows } = await dbQuery<Record<string, unknown>>(
      `SELECT * FROM orders
       WHERE user_id = $1 OR LOWER(customer_email) = LOWER($2)
       ORDER BY created_at DESC`,
      [userId, email],
    );
    if (rows.length === 0) return [];

    const orderIds = rows.map((r) => String(r.id));
    const { rows: itemRows } = await dbQuery<Record<string, unknown>>(
      `SELECT * FROM order_items WHERE order_id = ANY($1::uuid[]) ORDER BY id ASC`,
      [orderIds],
    );

    const itemsByOrder = new Map<string, OrderItem[]>();
    for (const raw of itemRows) {
      const item = mapOrderItemRow(raw);
      const list = itemsByOrder.get(item.order_id) ?? [];
      list.push(item);
      itemsByOrder.set(item.order_id, list);
    }

    return rows.map((r) => mapOrderRow(r, itemsByOrder.get(String(r.id)) ?? []));
  } catch (err) {
    console.error("[data] getCustomerOrders:", err);
    return [];
  }
}
