// API service with caching for property data
// All fetch calls go through Next.js proxy routes (/api/*) to avoid CORS issues.

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// In-memory cache for normal properties (no priority)
const cache = {
  data: null,
  timestamp: null,
  pending: null,
};

// In-memory cache for priority properties (Azizi has higher priority)
const priorityCache = {
  data: null,
  timestamp: null,
  pending: null,
};

// Developers cache - separate from properties cache
const developersCache = {
  data: null,
  timestamp: null,
  pending: null,
};

/**
 * Clean text by fixing common encoding issues
 * @param {string} text - Text to clean
 * @returns {string} - Cleaned text
 */
export function cleanText(text) {
  if (!text) return "";
  return text
    .replace(/ΓÇÖ/g, "'") // Right single quote
    .replace(/ΓÇ£/g, '"') // Left double quote
    .replace(/ΓÇ¥/g, '"') // Right double quote
    .replace(/ΓÇô/g, "–") // En dash
    .replace(/ΓÇö/g, "—") // Em dash
    .replace(/ΓÇª/g, "...") // Ellipsis
    .replace(/├ž/g, "ç") // ç character (variant 1)
    .replace(/├º/g, "ç") // ç character (variant 2)
    .replace(/├ç/g, "Ç") // Ç uppercase
    .replace(/├®/g, "è") // è character
    .replace(/├¿/g, "è") // è character (variant)
    .replace(/├⌐/g, "é") // é character
    .replace(/├®/g, "é") // é character (variant)
    .replace(/├á/g, "à") // à character
    .replace(/├á/g, "â") // â character
    .replace(/├í/g, "á") // á character
    .replace(/├╝/g, "ü") // ü character
    .replace(/├╣/g, "ù") // ù character
    .replace(/├║/g, "ú") // ú character
    .replace(/├╗/g, "û") // û character
    .replace(/├Â/g, "ö") // ö character
    .replace(/├▓/g, "ò") // ò character
    .replace(/├│/g, "ó") // ó character
    .replace(/├┤/g, "ô") // ô character
    .replace(/├ñ/g, "ä") // ä character
    .replace(/├á/g, "à") // à character
    .replace(/├¡/g, "í") // í character
    .replace(/├¼/g, "ì") // ì character
    .replace(/├«/g, "î") // î character
    .replace(/├»/g, "ï") // ï character
    .replace(/├▒/g, "ñ") // ñ character
    .replace(/Γäó/g, "™") // Trademark
    .replace(/┬░/g, "°") // Degree symbol
    .replace(/┬▓/g, "²") // Superscript 2
    .replace(/┬│/g, "³") // Superscript 3
    .replace(/┬®/g, "®") // Registered trademark
    .replace(/┬⌐/g, "©"); // Copyright
}

/**
 * Fetch all properties with priority (Azizi has higher priority)
 * Used for: Newly Launched Projects section
 * @param {boolean} forceRefresh - Force refresh the cache
 * @returns {Promise<Array>} - Array of properties with priority ordering
 */
export async function fetchPropertiesWithPriority(forceRefresh = false) {
  const now = Date.now();

  // Return cached data if valid
  if (
    !forceRefresh &&
    priorityCache.data &&
    priorityCache.timestamp &&
    now - priorityCache.timestamp < CACHE_DURATION
  ) {
    return priorityCache.data;
  }

  // If there's already a pending request, wait for it
  if (priorityCache.pending) {
    return priorityCache.pending;
  }

  // Create new fetch promise
  priorityCache.pending = (async () => {
    try {
      const response = await fetch(`/api/projects?page=1&limit=100`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priority_company_ids: [
            "98ccae3b-02eb-46c0-b311-2e480f7ad3bc",
            "7b36ecea-e621-45f5-8fc8-009340772fdb",
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        priorityCache.data = result.data;
        priorityCache.timestamp = now;
        return result.data;
      } else {
        throw new Error(result.message || "Failed to fetch properties");
      }
    } finally {
      priorityCache.pending = null;
    }
  })();

  return priorityCache.pending;
}

/**
 * Fetch all properties with caching - kept for backward compatibility
 * Alias for fetchPropertiesWithPriority
 * @param {boolean} forceRefresh - Force refresh the cache
 * @returns {Promise<Array>} - Array of properties
 */
export async function fetchProperties(forceRefresh = false) {
  return fetchPropertiesWithPriority(forceRefresh);
}

/**
 * Fetch all properties without priority - used for general property search/explorer
 * @param {boolean} forceRefresh - Force refresh the cache
 * @returns {Promise<Array>} - Array of properties sorted by created_at (newest first)
 */
export async function fetchPropertiesWithoutPriority(forceRefresh = false) {
  try {
    const response = await fetch(`/api/projects?page=1&limit=100`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}), // No priority company IDs
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.data) {
      // Sort by created_at (newest first)
      const sorted = [...result.data].sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA; // Newest first
      });
      return sorted;
    } else {
      throw new Error(result.message || "Failed to fetch properties");
    }
  } catch (error) {
    console.error("Error fetching properties without priority:", error);
    throw error;
  }
}

/**
 * Filter data with given filters (for client-side filtering)
 * @param {Array} data - Data array
 * @param {Object} filters - Filter options
 * @returns {Array} - Filtered data
 */
export function filterData(data, filters = {}) {
  let result = [...data];

  // Apply type filter
  if (filters.type && filters.type.length > 0) {
    const typeFilters = Array.isArray(filters.type)
      ? filters.type
      : [filters.type];
    result = result.filter((property) => {
      if (!property.type) return false;
      // Handle both string and array types
      if (Array.isArray(property.type)) {
        return property.type.some((t) =>
          typeFilters.some((f) => f.toLowerCase() === t.toLowerCase()),
        );
      } else if (typeof property.type === "string") {
        return typeFilters.some(
          (f) => f.toLowerCase() === property.type.toLowerCase(),
        );
      }
      return false;
    });
  }

  // Apply category filter
  if (filters.category) {
    result = result.filter(
      (property) =>
        property.category &&
        property.category.toLowerCase() === filters.category.toLowerCase(),
    );
  }

  // Apply bedrooms filter
  if (filters.bedrooms) {
    result = result.filter(
      (property) =>
        property.unit_types &&
        property.unit_types.some(
          (ut) => ut.toLowerCase() === filters.bedrooms.toLowerCase(),
        ),
    );
  }

  // Apply price range filter
  if (filters.minPrice) {
    result = result.filter(
      (property) => property.min_price >= filters.minPrice,
    );
  }
  if (filters.maxPrice) {
    result = result.filter(
      (property) => property.min_price <= filters.maxPrice,
    );
  }

  // Apply search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter(
      (property) =>
        (property.title &&
          property.title.toLowerCase().includes(searchLower)) ||
        (property.address &&
          property.address.toLowerCase().includes(searchLower)) ||
        (property.city && property.city.toLowerCase().includes(searchLower)),
    );
  }

  return result;
}

/**
 * Fetch properties with specific filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} - Object with data array and pagination info
 */
export async function fetchFilteredProperties(filters = {}) {
  try {
    const queryParams = new URLSearchParams({
      page: filters.page || 1,
      limit: filters.limit || 100,
    });

    const response = await fetch(`/api/projects?${queryParams}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filters),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || "Failed to fetch properties");
    }
  } catch (error) {
    console.error("Error fetching filtered properties:", error);
    throw error;
  }
}

/**
 * Filter properties by type (Villa, Apartment, Townhouse, etc.)
 * @param {Array} properties - Array of properties
 * @param {string} type - Property type to filter
 * @returns {Array} - Filtered properties
 */
export function filterByType(properties, type) {
  if (!type || !properties) return properties || [];
  return properties.filter((property) => {
    if (!property.type) return false;

    // Handle both string and array types
    if (Array.isArray(property.type)) {
      return property.type.some((t) => t.toLowerCase() === type.toLowerCase());
    } else if (typeof property.type === "string") {
      return property.type.toLowerCase() === type.toLowerCase();
    }
    return false;
  });
}

/**
 * Filter properties by number of bedrooms
 * @param {Array} properties - Array of properties
 * @param {string} bedroomFilter - Bedroom filter (e.g., 'Studio', 'One', 'Two', 'Three')
 * @returns {Array} - Filtered properties
 */
export function filterByBedrooms(properties, bedroomFilter) {
  if (!bedroomFilter || !properties) return properties || [];

  const bedroomMap = {
    studio: "Studio",
    one: "One",
    two: "Two",
    three: "Three",
    four: "Four",
    five: "Five",
    six: "Six",
    seven: "Seven",
  };

  const normalizedFilter =
    bedroomMap[bedroomFilter.toLowerCase()] || bedroomFilter;

  return properties.filter((property) => {
    if (!property.unit_types) return false;
    return property.unit_types.some(
      (ut) => ut.toLowerCase() === normalizedFilter.toLowerCase(),
    );
  });
}

/**
 * Filter properties by category (Off_plan, Ready, etc.)
 * @param {Array} properties - Array of properties
 * @param {string} category - Category to filter
 * @returns {Array} - Filtered properties
 */
export function filterByCategory(properties, category) {
  if (!category || !properties) return properties || [];
  return properties.filter(
    (property) =>
      property.category &&
      property.category.toLowerCase() === category.toLowerCase(),
  );
}

/**
 * Get recently created properties (sorted by created_at)
 * @param {Array} properties - Array of properties
 * @param {number} limit - Number of properties to return
 * @returns {Array} - Recently created properties
 */
export function getRecentProperties(properties, limit = 10) {
  if (!properties) return [];
  return [...properties]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);
}

/**
 * Fetch a single property by ID
 * @param {string} id - Property ID
 * @returns {Promise<Object|null>} - Property object or null if not found
 */
export async function fetchPropertyById(id) {
  try {
    // First try to find in priority cache (Newly Launched)
    if (priorityCache.data) {
      const found = priorityCache.data.find((property) => property.id === id);
      if (found) return found;
    }

    // Then try normal cache
    if (cache.data) {
      const found = cache.data.find((property) => property.id === id);
      if (found) return found;
    }

    // If not in cache, fetch the specific property via GET endpoint
    const response = await fetch(`/api/projects/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching property by ID:", error);
    // Try fallback to cached data
    if (priorityCache.data) {
      return priorityCache.data.find((property) => property.id === id) || null;
    }
    if (cache.data) {
      return cache.data.find((property) => property.id === id) || null;
    }
    return null;
  }
}

/**
 * Get total count of properties (for pagination)
 * @param {Object} filters - Filter options
 * @returns {Promise<number>} - Total count
 */
export async function getTotalPropertyCount(filters = {}) {
  try {
    const allProperties = await fetchProperties();
    const filteredData = filterData(allProperties, filters);
    return filteredData.length;
  } catch (error) {
    console.error("Error getting total count:", error);
    return 0;
  }
}

/**
 * Clear the cache
 */
export function clearCache() {
  cache.data = null;
  cache.timestamp = null;
  cache.pending = null;
  priorityCache.data = null;
  priorityCache.timestamp = null;
  priorityCache.pending = null;
  developersCache.data = null;
  developersCache.timestamp = null;
  developersCache.pending = null;
}

// ============================================================================
// ALNAIR DATA LAYER — served from /public/all_data.json (static, no API calls)
// all_data.json contains 2,441 projects in the same Alnair API shape.
// This completely bypasses Cloudflare / proxy issues on Vercel.
// ============================================================================

/** In-memory cache — loaded once per session, instant on repeat calls */
let _allProjectsCache = null;

/**
 * Load all Alnair projects from the static /all_data.json file.
 * - Server-side (SSR/API routes): reads directly from filesystem via fs
 * - Client-side: fetches from /all_data.json (served by Vercel CDN)
 */
async function _loadAllProjects() {
  if (_allProjectsCache) return _allProjectsCache;

  let json;

  if (typeof window === 'undefined') {
    // SERVER-SIDE: read file directly — no HTTP needed
    const path = require('path');
    const fs = require('fs');
    const filePath = path.join(process.cwd(), 'public', 'all_data.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    json = JSON.parse(raw);
  } else {
    // CLIENT-SIDE: fetch from CDN (Vercel serves /public as static assets)
    const res = await fetch('/all_data.json', { cache: 'force-cache' });
    if (!res.ok) throw new Error(`Failed to load all_data.json: ${res.status}`);
    json = await res.json();
  }

  // Support { data: { items: [...] } } shape (Alnair API format)
  const items = json?.data?.items || json?.projects || (Array.isArray(json) ? json : []);
  _allProjectsCache = items;
  return items;
}

/**
 * Fetch all Alnair projects (or a slice of them).
 * All filtering/pagination is done in-memory from the static JSON.
 */
export async function fetchProjectsFromAlnair(params = {}) {
  const all = await _loadAllProjects();

  // Client-side pagination if requested
  if (params.page && params.limit) {
    const start = (params.page - 1) * params.limit;
    return all.slice(start, start + params.limit);
  }
  if (params.limit) return all.slice(0, params.limit);

  return all;
}

/** In-memory cache for descriptions { slug: htmlString } */
let _descriptionsCache = null;

/**
 * Load descriptions from public/descriptions.json (keyed by slug).
 * Server-side: reads from filesystem. Client-side: fetches from CDN.
 */
async function _loadDescriptions() {
  if (_descriptionsCache) return _descriptionsCache;

  try {
    if (typeof window === 'undefined') {
      const path = require('path');
      const fs = require('fs');
      const filePath = path.join(process.cwd(), 'public', 'descriptions.json');
      if (fs.existsSync(filePath)) {
        _descriptionsCache = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } else {
        _descriptionsCache = {};
      }
    } else {
      const res = await fetch('/descriptions.json', { cache: 'force-cache' });
      _descriptionsCache = res.ok ? await res.json() : {};
    }
  } catch {
    _descriptionsCache = {};
  }

  return _descriptionsCache;
}

/**
 * Find a single project by numeric ID and attach its description.
 * Instant lookup from in-memory cache — zero network calls on Vercel.
 */
export async function fetchProjectDetailsFromAlnair(projectId) {
  const id = String(projectId);
  const [all, descriptions] = await Promise.all([_loadAllProjects(), _loadDescriptions()]);

  const found = all.find(p => String(p.id) === id);
  if (!found) {
    console.warn(`[all_data] Project ${id} not found`);
    return null;
  }

  // Attach description from descriptions.json (keyed by slug)
  const description = found.slug ? (descriptions[found.slug] || null) : null;
  return { ...found, description };
}

/**
 * Filter Alnair projects using utility functions
 * @param {Array} projects - Array of Alnair projects
 * @param {Object} filters - Filter criteria
 * @returns {Array} - Filtered projects
 */
export async function filterAlnairProjects(projects, filters = {}) {
  try {
    // Import the utility functions
    const {
      filterByPrice,
      filterByPropertyType,
      filterByBedrooms: filterByBedroomsUtil,
      filterByDeveloper,
    } = await import('./alnairUtils');
    
    let filtered = [...projects];
    
    // Apply filters in order
    if (filters.minPrice || filters.maxPrice) {
      filtered = filterByPrice(filtered, filters.minPrice, filters.maxPrice);
    }
    
    if (filters.type && filters.type.length > 0) {
      const types = Array.isArray(filters.type) ? filters.type : [filters.type];
      for (const type of types) {
        filtered = filterByPropertyType(filtered, type);
      }
    }
    
    if (filters.bedrooms) {
      filtered = filterByBedroomsUtil(filtered, filters.bedrooms);
    }
    
    if (filters.developerName) {
      filtered = filterByDeveloper(filtered, filters.developerName);
    }
    
    // Apply search if provided (search in title, builder, district)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        (p.title && p.title.toLowerCase().includes(searchTerm)) ||
        (p.builder && p.builder.toLowerCase().includes(searchTerm)) ||
        (p.district?.title && p.district.title.toLowerCase().includes(searchTerm))
      );
    }
    
    // Apply city filter — Alnair uses district.title, not a city field
    // We match district or builder against city name
    if (filters.city && filters.city !== 'all') {
      const cityLower = filters.city.toLowerCase().replace('_', ' ');
      filtered = filtered.filter(p => {
        const districtTitle = (p.district?.title || '').toLowerCase();
        // For Dubai: match projects in Dubai region (most Alnair projects)
        // For Abu Dhabi / Sharjah: match district or title keywords
        if (cityLower === 'dubai') {
          // Dubai projects have lat/lng in Dubai range
          return (p.latitude >= 25.0 && p.latitude <= 25.4 && p.longitude >= 54.9 && p.longitude <= 55.6) ||
                 districtTitle.includes('dubai') || districtTitle.length > 0;
        }
        if (cityLower === 'abu dhabi') {
          return (p.latitude >= 23.9 && p.latitude <= 24.5 && p.longitude >= 53.4 && p.longitude <= 54.6) ||
                 districtTitle.includes('abu dhabi');
        }
        if (cityLower === 'sharjah') {
          return (p.latitude >= 25.2 && p.latitude <= 25.4 && p.longitude >= 55.3 && p.longitude <= 55.7) ||
                 districtTitle.includes('sharjah');
        }
        return true;
      });
    }
    
    return filtered;
  } catch (error) {
    console.error('Error filtering Alnair projects:', error);
    throw error;
  }
}

/**
 * Get unique developers from Alnair projects
 * @returns {Promise<Array>} - Array of unique developers with project count
 */
export async function getDevelopersFromAlnair() {
  try {
    const projects = await fetchProjectsFromAlnair();
    
    // Group projects by builder/developer
    const developerMap = new Map();
    
    projects.forEach(project => {
      const company = project.builder || 'Unknown Developer';
      const logo = project.logo?.src || null;
      
      if (!developerMap.has(company)) {
        developerMap.set(company, {
          name: company,
          logo: logo,
          projectCount: 0,
          projects: [],
        });
      }
      
      const dev = developerMap.get(company);
      dev.projectCount += 1;
      dev.projects.push(project.id);
    });
    
    // Convert to array and sort by project count (descending)
    return Array.from(developerMap.values())
      .sort((a, b) => b.projectCount - a.projectCount);
  } catch (error) {
    console.error('Error getting developers from Alnair:', error);
    throw error;
  }
}

/**
 * Fetch all developers with caching - DEPRECATED
 * @deprecated Use getDevelopersFromAlnair instead for Alnair API
 * @param {boolean} forceRefresh - Force refresh the cache
 * @returns {Promise<Array>} - Array of all developers
 */
export async function fetchAllDevelopers(forceRefresh = false) {
  // For backward compatibility, redirect to Alnair function
  return getDevelopersFromAlnair();
}
