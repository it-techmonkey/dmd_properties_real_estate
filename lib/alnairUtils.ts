/**
 * Alnair Utility Functions
 * Helper functions for Alnair API integration
 */

import type { Project, ProjectDetails } from './types/alnair';

/**
 * Format price for display
 */
export function formatPrice(
  price: number | undefined | null,
  format: 'aed' | 'short' = 'aed'
): string {
  if (!price || price === 0) return 'Price on Request';

  if (format === 'short') {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    }
    if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K`;
    }
    return price.toLocaleString();
  }

  if (price >= 1000000) {
    return `AED ${(price / 1000000).toFixed(2)}M`;
  }
  if (price >= 1000) {
    return `AED ${(price / 1000).toFixed(0)}K`;
  }
  return `AED ${price.toLocaleString()}`;
}

/**
 * Get construction status badge text and color
 */
export function getConstructionStatusBadge(
  percentage: number
): {
  label: string;
  color: string;
  bgColor: string;
  progress: number;
} {
  if (percentage === 0) {
    return {
      label: 'Planning',
      color: 'text-gray-400',
      bgColor: 'bg-gray-500',
      progress: 5,
    };
  }
  if (percentage < 30) {
    return {
      label: 'Foundation',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500',
      progress: percentage,
    };
  }
  if (percentage < 70) {
    return {
      label: 'Under Construction',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500',
      progress: percentage,
    };
  }
  if (percentage < 100) {
    return {
      label: 'Finishing Touches',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500',
      progress: percentage,
    };
  }
  return {
    label: 'Completed',
    color: 'text-green-400',
    bgColor: 'bg-green-500',
    progress: 100,
  };
}

/**
 * Get all unit types summary
 */
export function getUnitTypesSummary(project: Project | ProjectDetails): {
  total: number;
  types: string[];
  priceRange: { min: number; max: number } | null;
} {
  // statistics.units is a keyed object: { "110": { price_from, price_to, count }, ... }
  const unitsObj = project.statistics?.units;
  const unitValues = unitsObj ? Object.values(unitsObj as Record<string, any>) : [];

  if (unitValues.length === 0) {
    return { total: 0, types: [], priceRange: null };
  }

  const unitKeyMap: Record<string, string> = {
    '110': 'Studio', '111': '1 BR', '112': '2 BR', '113': '3 BR', '114': '4 BR', '115': '5 BR+',
  };
  const keys = unitsObj ? Object.keys(unitsObj as Record<string, any>) : [];
  const types = keys.map(k => unitKeyMap[k] || k);

  const prices = unitValues
    .map((u: any) => [u.price_from || 0, u.price_to || 0])
    .flat()
    .filter((p: number) => p > 0);

  // Use statistics.total for aggregate counts
  const totalUnits = (project.statistics as any)?.total?.units_count ||
    unitValues.reduce((sum: number, u: any) => sum + (u.count || 0), 0);

  return {
    total: totalUnits,
    types,
    priceRange:
      prices.length > 0
        ? { min: Math.min(...prices), max: Math.max(...prices) }
        : null,
  };
}

/**
 * Get amenities/features from project title
 * Useful for quick display of project characteristics
 */
export function extractProjectFeatures(project: Project | ProjectDetails): string[] {
  const title = project.title.toLowerCase();
  const features: string[] = [];

  // Common keywords
  const keywords: { [key: string]: string } = {
    luxury: 'Luxury',
    villa: 'Villa',
    apartment: 'Apartment',
    townhouse: 'Townhouse',
    penthouse: 'Penthouse',
    duplex: 'Duplex',
    studio: 'Studio',
    creek: 'Waterfront',
    marina: 'Marina',
    'gated community': 'Gated Community',
    retail: 'Mixed-Use',
    commercial: 'Commercial',
  };

  for (const [keyword, feature] of Object.entries(keywords)) {
    if (title.includes(keyword)) {
      features.push(feature);
    }
  }

  return features.length > 0 ? features : ['Residential'];
}

/**
 * Get distance from user location to project
 * Returns formatted distance string
 */
export function getFormattedDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${(distanceKm * 1000).toFixed(0)}m away`;
  }
  return `${distanceKm.toFixed(1)}km away`;
}

/**
 * Validate project coordinates
 */
export function isValidCoordinates(latitude: number, longitude: number): boolean {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Check if project is in Dubai
 */
export function isInDubai(latitude: number, longitude: number): boolean {
  // Dubai approximate bounds
  const dubaiLatMin = 25.06;
  const dubaiLatMax = 25.25;
  const dubaiLonMin = 54.99;
  const dubaiLonMax = 55.53;

  return (
    latitude >= dubaiLatMin &&
    latitude <= dubaiLatMax &&
    longitude >= dubaiLonMin &&
    longitude <= dubaiLonMax
  );
}

/**
 * Check if project is in Abu Dhabi
 */
export function isInAbuDhabi(latitude: number, longitude: number): boolean {
  // Abu Dhabi approximate bounds
  const abuDhabiLatMin = 23.95;
  const abuDhabiLatMax = 24.4;
  const abuDhabiLonMin = 53.5;
  const abuDhabiLonMax = 54.5;

  return (
    latitude >= abuDhabiLatMin &&
    latitude <= abuDhabiLatMax &&
    longitude >= abuDhabiLonMin &&
    longitude <= abuDhabiLonMax
  );
}

/**
 * Check if project is in Sharjah
 */
export function isInSharjah(latitude: number, longitude: number): boolean {
  // Sharjah approximate bounds
  const sharjahLatMin = 25.24;
  const sharjahLatMax = 25.35;
  const sharjahLonMin = 55.35;
  const sharjahLonMax = 55.65;

  return (
    latitude >= sharjahLatMin &&
    latitude <= sharjahLatMax &&
    longitude >= sharjahLonMin &&
    longitude <= sharjahLonMax
  );
}

/**
 * Get emirate name from coordinates
 */
export function getEmirateFromCoordinates(
  latitude: number,
  longitude: number
): 'Dubai' | 'Abu Dhabi' | 'Sharjah' | 'Other' {
  if (isInDubai(latitude, longitude)) return 'Dubai';
  if (isInAbuDhabi(latitude, longitude)) return 'Abu Dhabi';
  if (isInSharjah(latitude, longitude)) return 'Sharjah';
  return 'Other';
}

/**
 * Compare two projects by price
 */
export function compareProjectsByPrice(
  p1: Project | ProjectDetails,
  p2: Project | ProjectDetails
): number {
  // Use statistics.total.price_from (aggregate min price)
  const price1 = (p1.statistics as any)?.total?.price_from || 0;
  const price2 = (p2.statistics as any)?.total?.price_from || 0;
  return price1 - price2;
}

/**
 * Compare two projects by unit count
 */
export function compareProjectsByUnitCount(
  p1: Project | ProjectDetails,
  p2: Project | ProjectDetails
): number {
  // statistics.units is a keyed object
  const units1 = (p1.statistics as any)?.units;
  const units2 = (p2.statistics as any)?.units;
  const count1 = units1
    ? (Object.values(units1) as any[]).reduce((sum: number, u: any) => sum + (u.count || 0), 0) as number
    : 0;
  const count2 = units2
    ? (Object.values(units2) as any[]).reduce((sum: number, u: any) => sum + (u.count || 0), 0) as number
    : 0;
  return (count2 as number) - (count1 as number);
}

/**
 * Compare two projects by construction progress
 */
export function compareProjectsByProgress(
  p1: Project | ProjectDetails,
  p2: Project | ProjectDetails
): number {
  const prog1 = parseInt(p1.construction_percent) || 0;
  const prog2 = parseInt(p2.construction_percent) || 0;
  return prog2 - prog1; // Higher progress first
}

/**
 * Filter projects by emirate
 */
export function filterByEmirate(
  projects: (Project | ProjectDetails)[],
  emirate: 'Dubai' | 'Abu Dhabi' | 'Sharjah'
): (Project | ProjectDetails)[] {
  return projects.filter((p) => {
    const locationEmirate = getEmirateFromCoordinates(p.latitude, p.longitude);
    return locationEmirate === emirate;
  });
}

/**
 * Filter projects by price range
 * Uses statistics.total.price_from (aggregate min price across all unit types)
 */
export function filterByPriceRange(
  projects: (Project | ProjectDetails)[],
  minPrice: number,
  maxPrice: number
): (Project | ProjectDetails)[] {
  return projects.filter((p) => {
    const projectMin = (p.statistics as any)?.total?.price_from || 0;
    const projectMax = (p.statistics as any)?.total?.price_to || projectMin;
    if (minPrice > 0 && projectMax < minPrice) return false;
    if (maxPrice > 0 && projectMin > maxPrice) return false;
    return true;
  });
}

/**
 * Filter by price range — alias used by filterAlnairProjects in api.js
 */
export function filterByPrice(
  projects: (Project | ProjectDetails)[],
  minPrice?: number,
  maxPrice?: number
): (Project | ProjectDetails)[] {
  return projects.filter((p) => {
    const projectMin = (p.statistics as any)?.total?.price_from || 0;
    const projectMax = (p.statistics as any)?.total?.price_to || projectMin;
    if (minPrice && projectMax < minPrice) return false;
    if (maxPrice && projectMin > maxPrice) return false;
    return true;
  });
}

/**
 * Filter by property type using title keyword matching.
 * Alnair API returns type:'project' for everything, so we match by title.
 */
export function filterByPropertyType(
  projects: (Project | ProjectDetails)[],
  type: string
): (Project | ProjectDetails)[] {
  const lowerType = type.toLowerCase();
  
  // Map display labels to title keyword arrays
  const typeKeywords: Record<string, string[]> = {
    villa: ['villa', 'villas'],
    apartment: ['apartment', 'residence', 'residences', 'tower', 'heights', 'views'],
    townhouse: ['townhouse', 'townhouses'],
    penthouse: ['penthouse', 'penthouses'],
    compound: ['compound'],
    // Allow direct type match as fallback
    project: [], // returns all
  };
  
  const keywords = typeKeywords[lowerType];
  
  // If no keywords defined (unknown type), try direct type field match
  if (keywords === undefined) {
    return projects.filter((p) => p.type?.toLowerCase() === lowerType);
  }
  
  // 'project' or 'all' returns everything
  if (keywords.length === 0) return projects;
  
  return projects.filter((p) => {
    const titleLower = (p.title || '').toLowerCase();
    return keywords.some(kw => titleLower.includes(kw));
  });
}

/**
 * Filter by bedrooms — uses statistics.units keyed object
 * Keys: 110=Studio, 111=1BR, 112=2BR, 113=3BR, 114=4BR
 */
export function filterByBedrooms(
  projects: (Project | ProjectDetails)[],
  bedrooms: string | number
): (Project | ProjectDetails)[] {
  const bedroomStr = String(bedrooms);
  const textToKey: Record<string, string> = {
    studio: '110', '0': '110',
    '1': '111', one: '111',
    '2': '112', two: '112',
    '3': '113', three: '113',
    '4': '114', four: '114',
    '5': '115', five: '115',
  };
  const targetKey = textToKey[bedroomStr.toLowerCase()] || bedroomStr;
  return projects.filter((p) => {
    const units = (p.statistics as any)?.units;
    return units && units[targetKey] != null;
  });
}

/**
 * Filter by developer name
 */
export function filterByDeveloper(
  projects: (Project | ProjectDetails)[],
  developer: string
): (Project | ProjectDetails)[] {
  const lowerDev = developer.toLowerCase();
  return projects.filter((p) => p.builder?.toLowerCase().includes(lowerDev));
}

/**
 * Filter projects by builder/developer
 */
export function filterByBuilder(
  projects: (Project | ProjectDetails)[],
  builder: string
): (Project | ProjectDetails)[] {
  const searchTerm = builder.toLowerCase();
  return projects.filter((p) => p.builder.toLowerCase().includes(searchTerm));
}

/**
 * Filter projects by construction status
 */
export function filterByConstructionStatus(
  projects: (Project | ProjectDetails)[],
  status: 'planning' | 'foundation' | 'structure' | 'finishing' | 'completed'
): (Project | ProjectDetails)[] {
  return projects.filter((p) => {
    const percent = parseInt(p.construction_percent) || 0;
    switch (status) {
      case 'planning':
        return percent === 0;
      case 'foundation':
        return percent > 0 && percent < 30;
      case 'structure':
        return percent >= 30 && percent < 70;
      case 'finishing':
        return percent >= 70 && percent < 100;
      case 'completed':
        return percent === 100;
      default:
        return false;
    }
  });
}

/**
 * Search projects by title
 */
export function searchProjects(
  projects: (Project | ProjectDetails)[],
  query: string
): (Project | ProjectDetails)[] {
  const lowerQuery = query.toLowerCase();
  return projects.filter(
    (p) =>
      p.title.toLowerCase().includes(lowerQuery) ||
      p.builder.toLowerCase().includes(lowerQuery) ||
      p.district?.title.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Group projects by district
 */
export function groupByDistrict(
  projects: (Project | ProjectDetails)[]
): { [key: string]: (Project | ProjectDetails)[] } {
  return projects.reduce(
    (groups, project) => {
      const district = project.district?.title || 'Unknown';
      if (!groups[district]) {
        groups[district] = [];
      }
      groups[district].push(project);
      return groups;
    },
    {} as { [key: string]: (Project | ProjectDetails)[] }
  );
}

/**
 * Group projects by builder
 */
export function groupByBuilder(
  projects: (Project | ProjectDetails)[]
): { [key: string]: (Project | ProjectDetails)[] } {
  return projects.reduce(
    (groups, project) => {
      const builder = project.builder || 'Unknown Developer';
      if (!groups[builder]) {
        groups[builder] = [];
      }
      groups[builder].push(project);
      return groups;
    },
    {} as { [key: string]: (Project | ProjectDetails)[] }
  );
}

/**
 * Get recommended projects (based on multiple criteria)
 */
export function getRecommendedProjects(
  projects: (Project | ProjectDetails)[],
  limit: number = 6
): (Project | ProjectDetails)[] {
  const scored = projects.map((p) => {
    const progress = parseInt(p.construction_percent) || 0;
    // statistics.units is a keyed object
    const units = (p.statistics as any)?.units;
    const unitCount: number = units
      ? ((Object.values(units) as any[]).reduce((sum: number, u: any) => sum + (u.count || 0), 0) as number)
      : 0;

    const score = (progress as number) * 0.4 + (Math.min(unitCount / 10, 10) * 0.6);
    return { project: p, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.project);
}
