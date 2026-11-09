export type ProjectStatus = "draft" | "published" | "archived";
export type ServiceStatus = "draft" | "published";
export type ProductStatus = "draft" | "published" | "archived";

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at?: string;
}

export interface ProjectImage {
  id: string;
  project_id: string;
  storage_path: string;
  caption: string | null;
  alt_text: string | null;
  width: number | null;
  height: number | null;
  sort_order: number;
  is_cover: boolean;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  category_id: string | null;
  location: string | null;
  completed_on: string | null;
  featured: boolean;
  status: ProjectStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithRelations extends Project {
  category: Pick<Category, "name" | "slug"> | null;
  images: ProjectImage[];
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  sort_order: number;
  status: ServiceStatus;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  business_name: string;
  tagline: string | null;
  whatsapp_number: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  logo_path: string | null;
  about_story: string | null;
  design_philosophy: string | null;
  founder_name: string | null;
  founder_bio: string | null;
}

export type UserRole = "customer" | "admin";

export interface AdminProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "admin";
  is_active: boolean;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  is_active: boolean;
}

export type StoreCategory =
  | "Seating"
  | "Dining"
  | "Tables"
  | "Storage"
  | "Lighting"
  | "Objects & Decor";

export type ProductAvailability = "in_stock" | "made_to_order";

export interface ProductGalleryItem {
  path: string;
  alt: string;
  caption?: string;
}

export interface StoreProduct {
  id: string;
  name: string;
  slug: string;
  category: StoreCategory;
  price: number;
  summary: string;
  description: string;
  dimensions: string;
  materials: string;
  finish: string;
  lead_time: string;
  availability: ProductAvailability;
  stock_quantity?: number;
  featured: boolean;
  status?: ProductStatus;
  image_path: string;
  alt_text: string;
  gallery_paths: ProductGalleryItem[];
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "in_production"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  product_image: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  lead_time: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  notes: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  currency: string;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  paystack_reference: string;
  paystack_access_code: string | null;
  paystack_authorization_url: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}
