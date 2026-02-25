/**
 * Alnair API Types and Interfaces
 * Real estate property data structures
 */

/**
 * Media object (logo, cover, photos)
 */
export interface MediaObject {
  id: number;
  hash: string;
  src: string;
  logo?: string;
  name?: string;
}

/**
 * District information
 */
export interface District {
  id: number;
  title: string;
}

/**
 * Unit type with pricing
 */
export interface UnitType {
  id: number;
  title: string;
  count: number;
  min_price?: number;
  max_price?: number;
  avg_price?: number;
}

/**
 * Transaction statistics
 */
export interface TransactionStats {
  total: number;
  sales: number;
  rentals: number;
  [key: string]: any;
}

/**
 * Statistics object
 */
export interface Statistics {
  transactions?: TransactionStats;
  rents?: TransactionStats;
  total?: {
    units: number;
    transactions: number;
    rentals: number;
  };
  units?: UnitType[];
}

/**
 * Project catalog data (badges, status, etc)
 */
export interface Catalogs {
  project_badges?: number[];
  project_sales_status?: number[];
  [key: string]: any;
}

/**
 * Main Project object from /project/find endpoint
 */
export interface Project {
  id: number;
  slug: string;
  city_id: number;
  type: string;
  title: string;
  builder: string;
  latitude: number;
  longitude: number;
  weight: number;
  agent_fee_value: string;
  construction_percent: string;
  construction_inspection_date: string;
  construction_percent_out_of_plan?: number | null;
  logo: MediaObject;
  cover: MediaObject;
  photos: MediaObject[];
  district: District;
  catalogs: Catalogs;
  statistics?: Statistics;
}

/**
 * Response from /project/find endpoint
 */
export interface ProjectFindResponse {
  data: {
    items: Project[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
}

/**
 * Project description/details object from /project/look/{slug}/{propertyname}/{slug} endpoint
 */
export interface ProjectDetails {
  id: number;
  slug: string;
  title: string;
  builder: string;
  description: string; // Can be 1000+ lines
  latitude: number;
  longitude: number;
  logo: MediaObject;
  cover: MediaObject;
  photos: MediaObject[];
  district: District;
  statistics?: Statistics;
  [key: string]: any; // Other fields as needed
}

/**
 * Map display data (subset of project for UI)
 */
export interface ProjectMapMarker {
  id: number;
  title: string;
  latitude: number;
  longitude: number;
  min_price?: number;
  max_price?: number;
  builder?: string;
  logo?: MediaObject;
  cover?: MediaObject;
}

/**
 * API Request body for project search/filter
 */
export interface ProjectSearchParams {
  search_area?: {
    east: number;
    west: number;
    north: number;
    south: number;
  };
  has_cluster?: 0 | 1;
  has_boundary?: 0 | 1;
  zoom?: number;
  limit?: number;
  page?: number;
  [key: string]: any;
}

/**
 * Clustered projects data (for map clustering)
 */
export interface ClusteredProjectResponse {
  data: {
    items: Project[];
    clusters?: Array<{
      count: number;
      latitude: number;
      longitude: number;
      projects?: Project[];
    }>;
  };
}
