// === Landing Page Data Types ===

export interface SiteSettings {
  site_logo: string;
  site_name: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image: string;
  about_title: string;
  about_content: string;
  about_image: string;
  wa_number: string;
  wa_message: string;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  social_media: SocialMediaItem[];
  footer_description: string;
}

export interface SocialMediaItem {
  platform: string;
  url: string;
  icon: string;
}

export interface CategoryWithProductCount {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
  _count: { products: number };
}

export interface ProductWithCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  images: string[];
  categoryId: string;
  category: { name: string; slug: string };
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
}

// === API Response Types ===

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// === Admin Stats ===
export interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  activeProducts: number;
  inactiveProducts: number;
}
