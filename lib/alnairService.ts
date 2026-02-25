/**
 * Alnair API Service
 * Handles all communication with api.alnair.ae
 */

import type {
  Project,
  ProjectFindResponse,
  ProjectDetails,
  ProjectSearchParams,
  ProjectMapMarker,
} from './types/alnair';

const ALNAIR_API_BASE = 'https://api.alnair.ae';
const AUTH_TOKEN = process.env.ALNAIR_AUTH_TOKEN;

const API_CACHE = {
  duration: 5 * 60 * 1000, // 5 minutes
  store: new Map<string, { data: any; timestamp: number }>(),
};

/**
 * Get cache key for parameters
 */
function getCacheKey(endpoint: string, params?: any): string {
  return `${endpoint}:${JSON.stringify(params || {})}`;
}

/**
 * Get data from cache if valid
 */
function getFromCache(key: string): any | null {
  const cached = API_CACHE.store.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > API_CACHE.duration) {
    API_CACHE.store.delete(key);
    return null;
  }
  
  return cached.data;
}

/**
 * Store data in cache
 */
function setInCache(key: string, data: any): void {
  API_CACHE.store.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Generic fetch wrapper with auth and error handling
 * Uses proxy endpoint to bypass CORS issues in browser
 */
async function fetchFromAlnair<T>(
  endpoint: string,
  options: RequestInit = {},
  queryParams: Record<string, any> = {}
): Promise<T> {
  const isServer = typeof window === 'undefined';

  let response: Response;

  if (isServer) {
    // Server-side: direct fetch to Alnair API.
    // NOTE: Server-side calls will fail if Cloudflare's managed challenge is active.
    // All Alnair data-fetching should happen client-side (in useEffect).
    const url = new URL(`${ALNAIR_API_BASE}${endpoint}`);
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(AUTH_TOKEN ? { 'Authorization': AUTH_TOKEN } : {}),
      ...options.headers,
    };

    response = await fetch(url.toString(), { ...options, headers });
  } else {
    // Client-side: use the proxy endpoint.
    // The proxy forwards the browser's Cookie (cf_clearance) and User-Agent to Alnair,
    // which is how Cloudflare's managed challenge is bypassed.
    const proxyUrl = `${window.location.origin}/api/alnair/proxy`;

    response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ endpoint, queryParams }),
    });
  }

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`Alnair API Error [${endpoint}]:`, errorData);
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Find projects by geographic area/search criteria
 * @param params - Search parameters (area bounds, zoom level, pagination)
 * @param forceRefresh - Skip cache
 */
export async function findProjects(
  params: ProjectSearchParams = {},
  forceRefresh = false
): Promise<ProjectFindResponse> {
  const cacheKey = getCacheKey('/project/find', params);
  
  if (!forceRefresh) {
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
  }

  // Build query string from params
  const queryParams = new URLSearchParams();
  
  if (params.search_area) {
    queryParams.append('search_area[east]', params.search_area.east.toString());
    queryParams.append('search_area[west]', params.search_area.west.toString());
    queryParams.append('search_area[north]', params.search_area.north.toString());
    queryParams.append('search_area[south]', params.search_area.south.toString());
  }
  
  if (params.has_cluster !== undefined) {
    queryParams.append('has_cluster', params.has_cluster ? '1' : '0');
  }
  
  if (params.has_boundary !== undefined) {
    queryParams.append('has_boundary', params.has_boundary ? '1' : '0');
  }
  
  if (params.zoom !== undefined) {
    queryParams.append('zoom', params.zoom.toString());
  }
  
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  } else {
    queryParams.append('limit', '100'); // Default limit
  }
  
  if (params.page !== undefined) {
    queryParams.append('page', params.page.toString());
  }

  const endpoint = `/project/find?${queryParams.toString()}`;
  const response = await fetchFromAlnair<ProjectFindResponse>(endpoint);
  
  setInCache(cacheKey, response);
  return response;
}

/**
 * Get detailed project information including full description
 * @param slug - Project slug (e.g., 'sea-legend-one')
 * @param propertyName - Property name/identifier
 * @param propertySlug - Property slug
 * @param forceRefresh - Skip cache
 */
export async function getProjectDetails(
  slug: string,
  propertyName: string,
  propertySlug: string,
  forceRefresh = false
): Promise<ProjectDetails> {
  const cacheKey = getCacheKey(`/project/look/${slug}`, { propertyName, propertySlug });
  
  if (!forceRefresh) {
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
  }

  const endpoint = `/project/look/${slug}/${propertyName}/${propertySlug}`;
  const response = await fetchFromAlnair<ProjectDetails>(endpoint);
  
  setInCache(cacheKey, response);
  return response;
}

/**
 * Find projects in Dubai (default search area for UAE context)
 * Coordinates for Dubai: East/West bounds and North/South bounds
 */
export async function findProjectsInDubai(
  options: { limit?: number; page?: number; forceRefresh?: boolean } = {}
): Promise<ProjectFindResponse> {
  // Dubai bounding box (approximate)
  const dubaiArea = {
    east: 55.529708862304695,
    west: 54.99275207519532,
    north: 25.24283273549745,
    south: 25.066319162978587,
  };

  return findProjects(
    {
      search_area: dubaiArea,
      has_cluster: 1,
      has_boundary: 0,
      zoom: 11,
      limit: options.limit || 100,
      page: options.page || 1,
    },
    options.forceRefresh
  );
}

/**
 * Convert Project to MapMarker for display on map
 */
export function projectToMapMarker(project: Project): ProjectMapMarker {
  return {
    id: project.id,
    title: project.title,
    latitude: project.latitude,
    longitude: project.longitude,
    min_price: project.statistics?.units?.[0]?.min_price,
    max_price: project.statistics?.units?.[0]?.max_price,
    builder: project.builder,
    logo: project.logo,
    cover: project.cover,
  };
}

/**
 * Parse description for display
 * Handles 1000+ line descriptions with smart truncation
 */
export function parseProjectDescription(
  description: string,
  maxLines: number = 20,
  maxChars: number = 1000
): { text: string; isTruncated: boolean; fullText: string } {
  if (!description) {
    return { text: '', isTruncated: false, fullText: '' };
  }

  // Split by newlines or paragraphs
  const paragraphs = description.split(/\n\n+|\r\n\r\n+/);
  
  let truncatedText = '';
  let lineCount = 0;
  let charCount = 0;

  for (const para of paragraphs) {
    if (lineCount >= maxLines || charCount + para.length > maxChars) {
      return {
        text: truncatedText.trim(),
        isTruncated: true,
        fullText: description,
      };
    }

    truncatedText += para + '\n\n';
    lineCount += para.split('\n').length + 1;
    charCount += para.length;
  }

  return {
    text: truncatedText.trim(),
    isTruncated: false,
    fullText: description,
  };
}

/**
 * Get construction progress percentage
 */
export function getConstructionProgress(project: Project): {
  percentage: number;
  status: 'planning' | 'foundation' | 'structure' | 'finishing' | 'completed';
} {
  const percent = parseInt(project.construction_percent) || 0;

  let status: 'planning' | 'foundation' | 'structure' | 'finishing' | 'completed';
  if (percent === 0) status = 'planning';
  else if (percent < 30) status = 'foundation';
  else if (percent < 70) status = 'structure';
  else if (percent < 100) status = 'finishing';
  else status = 'completed';

  return { percentage: percent, status };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Clear API cache
 */
export function clearCache(): void {
  API_CACHE.store.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: API_CACHE.store.size,
    keys: Array.from(API_CACHE.store.keys()),
  };
}
