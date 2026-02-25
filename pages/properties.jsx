'use client';

import Head from 'next/head';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import { fetchProjectsFromAlnair, filterAlnairProjects, cleanText } from '../lib/api';

const ITEMS_PER_PAGE = 12;

// Shared helper function for price formatting
const formatPrice = (price) => {
  if (!price) return 'N/A';
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}M`;
  }
  if (price >= 1000) {
    return `${(price / 1000).toFixed(0)}K`;
  }
  return price.toLocaleString();
};

// Property Card Component
function PropertyCard({ property }) {
  // Map Alnair fields to our display fields
  // Alnair API fields: id, title, type, cover, photos, statistics.units[], builder
  const id = property.id;
  const title = property.title || 'Unnamed Property';
  
  // Get image from cover or photos array
  let imageUrl = '/Villas/Image.webp';
  if (property.cover?.src) {
    imageUrl = property.cover.src;
  } else if (property.photos && property.photos.length > 0 && property.photos[0].src) {
    imageUrl = property.photos[0].src;
  }
  
  const description = property.description || property.shortDescription || '';
  
  // Get price from statistics.total.price_from (the actual Alnair API shape)
  // statistics.units is a keyed object like { "110": { price_from, count, ... }, "112": {...} }
  // statistics.total has the aggregate min price across all unit types
  let minPrice = 0;
  if (property.statistics?.total?.price_from) {
    minPrice = property.statistics.total.price_from;
  } else if (property.statistics?.units) {
    // Fallback: find the minimum price_from across all unit types
    const unitValues = Object.values(property.statistics.units);
    if (unitValues.length > 0) {
      const prices = unitValues.map(u => u.price_from).filter(Boolean);
      if (prices.length > 0) minPrice = Math.min(...prices);
    }
  }
  
  // Get bedroom info — unit type keys map to bedroom counts
  // 110 = Studio/Apartment, 111 = 1BR, 112 = 2BR, 113 = 3BR, etc.
  let bedrooms = null;
  if (property.statistics?.units) {
    const unitKeys = Object.keys(property.statistics.units);
    if (unitKeys.length > 0) {
      // Map the first unit type key to a bedroom label
      const unitTypeMap = { '110': 'Studio', '111': '1BR', '112': '2BR', '113': '3BR', '114': '4BR', '115': '5BR+' };
      bedrooms = unitTypeMap[unitKeys[0]] || null;
    }
  }
  
  const propertyType = property.type;

  // Truncate description
  const truncateText = (text, maxLength = 80) => {
    if (!text) return '';
    const cleaned = cleanText(text);
    if (cleaned.length <= maxLength) return cleaned;
    return cleaned.substring(0, maxLength) + '...';
  };

  // Get bedroom label
  const getBedroomLabel = (bedrooms) => {
    if (!bedrooms) return null;
    const bedroomMap = {
      'Studio': 'Studio',
      'One': '1-Bedroom',
      'Two': '2-Bedroom',
      'Three': '3-Bedroom',
      'Four': '4-Bedroom',
      'Five': '5-Bedroom',
      'Six': '6-Bedroom',
      'Seven': '7-Bedroom',
    };
    return bedroomMap[bedrooms] || `${bedrooms}-Bedroom`;
  };

  return (
    <div className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all">
      {/* Image */}
      <Link href={`/property/${id}`}>
        <div className="relative w-full h-[200px] overflow-hidden cursor-pointer">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/Villas/Image.webp';
            }}
          />
        </div>
      </Link>
      
      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <Link href={`/property/${id}`}>
          <h3 className="text-white text-lg font-semibold mb-2 line-clamp-2 min-h-[56px] hover:text-blue-400 transition-colors cursor-pointer">
            {title}
          </h3>
        </Link>
        
        {/* Description */}
        <p className="text-gray-400 text-sm mb-3 min-h-[40px]">
          {truncateText(description)}
          {description && description.length > 80 && (
            <Link href={`/property/${id}`} className="text-amber-400 ml-1 hover:underline">
              Read More
            </Link>
          )}
        </p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {bedrooms && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7v11a2 2 0 002 2h14a2 2 0 002-2V7"/>
                <path d="M21 7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v2"/>
                <path d="M3 12h18"/>
              </svg>
              {getBedroomLabel(bedrooms)}
            </span>
          )}
          {propertyType && typeof propertyType === 'string' && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
              {propertyType.toUpperCase()}
            </span>
          )}
        </div>
        
        {/* Price */}
        <p className="text-white text-xl font-bold mb-4">
          AED {formatPrice(minPrice)}
        </p>
        
        {/* View Details Button */}
        <Link href={`/property/${id}`}>
          <button className="w-full py-3 rounded-lg bg-[#1a1a1a] border border-white/20 text-white text-sm font-medium transition-all hover:bg-white/10">
            View Property Details
          </button>
        </Link>
      </div>
    </div>
  );
}

// Loading Skeleton
function PropertyCardSkeleton() {
  return (
    <div className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-white/10 animate-pulse">
      <div className="w-full h-[200px] bg-gray-800"></div>
      <div className="p-5">
        <div className="h-6 bg-gray-800 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-800 rounded w-full mb-1"></div>
        <div className="h-4 bg-gray-800 rounded w-2/3 mb-3"></div>
        <div className="flex gap-2 mb-4">
          <div className="h-6 bg-gray-800 rounded-full w-24"></div>
          <div className="h-6 bg-gray-800 rounded-full w-20"></div>
          <div className="h-6 bg-gray-800 rounded-full w-16"></div>
        </div>
        <div className="h-6 bg-gray-800 rounded w-1/3 mb-4"></div>
        <div className="h-12 bg-gray-800 rounded w-full"></div>
      </div>
    </div>
  );
}

// Map Modal Component
function MapModal({ properties, isOpen, onClose }) {
  const mapContainerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [L, setL] = useState(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Load Leaflet when modal opens
  useEffect(() => {
    if (!isOpen) return;

    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
      
      // Fix for default marker icons in Leaflet with webpack/next.js
      delete leaflet.default.Icon.Default.prototype._getIconUrl;
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      setMapLoaded(true);
    }).catch((err) => {
      console.error('Failed to load Leaflet:', err);
      setMapError('Failed to load map library');
    });
  }, [isOpen]);

  // Initialize map when Leaflet is loaded
  useEffect(() => {
    if (!isOpen || !mapLoaded || !L || !mapContainerRef.current) return;
    
    // Prevent re-initialization
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
      return;
    }

    // Ensure container has dimensions before initializing map
    const container = mapContainerRef.current;
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      console.log('Map container has no dimensions, waiting...');
      const timer = setTimeout(() => {
        setMapLoaded(false);
        setTimeout(() => setMapLoaded(true), 100);
      }, 100);
      return () => clearTimeout(timer);
    }

    try {
      const dubaiCenter = [25.15, 55.3];
      
      const map = L.map(mapContainerRef.current, {
        center: dubaiCenter,
        zoom: 10,
        zoomControl: true,
        attributionControl: false, // Disable Leaflet attribution
      });

      // Add dark theme tile layer (CartoDB Dark Matter)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: false, // Disable attribution control
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Create markers layer group
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

    const markerSize = 50;
    const markers = [];

    properties.forEach((property) => {
      if (property.latitude && property.longitude) {
          try {
            // Get developer logo from Alnair logo object
            const developerLogo = property.logo?.src;
        let icon;
        if (developerLogo) {
          icon = L.divIcon({
            className: 'custom-marker-icon',
            html: `
              <div style="
                width: ${markerSize}px;
                height: ${markerSize}px;
                border-radius: 50%;
                overflow: hidden;
                border: 3px solid #3B82F6;
                background: white;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <img 
                  src="${developerLogo}" 
                  alt="Developer" 
                  style="width: 100%; height: 100%; object-fit: cover;"
                  onerror="this.style.display='none'; this.parentElement.innerHTML='<svg width=\\'24\\' height=\\'24\\' viewBox=\\'0 0 24 24\\' fill=\\'#374151\\'><path d=\\'M12 5L19 11H17V18H14V14H10V18H7V11H5L12 5Z\\'/></svg>';"
                />
              </div>
            `,
            iconSize: [markerSize, markerSize],
            iconAnchor: [markerSize / 2, markerSize / 2],
            popupAnchor: [0, -markerSize / 2],
          });
        } else {
          icon = L.divIcon({
            className: 'custom-marker-icon',
            html: `
              <div style="
                width: ${markerSize}px;
                height: ${markerSize}px;
                border-radius: 50%;
                background: white;
                border: 3px solid #3B82F6;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#374151">
                  <path d="M12 5L19 11H17V18H14V14H10V18H7V11H5L12 5Z"/>
                </svg>
              </div>
            `,
            iconSize: [markerSize, markerSize],
            iconAnchor: [markerSize / 2, markerSize / 2],
            popupAnchor: [0, -markerSize / 2],
          });
        }

        // Create marker
        const marker = L.marker([property.latitude, property.longitude], { icon });

        // Create popup content - using Alnair field names
        const projectName = property.title || 'Property';
        const address = property.district?.title || '';
        const city = 'Dubai'; // Alnair API is Dubai-centric
        const unitPrice = property.statistics?.total?.price_from || 0;
        
        const popupContent = `
          <div style="padding: 8px; min-width: 200px; background: white; border-radius: 8px;">
            <a href="/property/${property.id}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
              <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #1f2937; cursor: pointer; transition: color 0.2s; flex: 1;"
                  onmouseover="this.style.color='#3b82f6'" 
                  onmouseout="this.style.color='#1f2937'">
                ${projectName}
              </h3>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" style="flex-shrink: 0;">
                <path d="M10 19H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h4"></path>
                <polyline points="15 8 21 2 21 8"></polyline>
                <line x1="15" y1="1" x2="15" y2="8"></line>
              </svg>
            </a>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">
              ${address}, ${city}
            </p>
            <p style="margin: 0; font-size: 12px; color: #374151; font-weight: 500;">
              AED ${unitPrice >= 1000000 ? (unitPrice / 1000000).toFixed(1) + 'M' : unitPrice >= 1000 ? (unitPrice / 1000).toFixed(0) + 'K' : unitPrice.toLocaleString()}
            </p>
          </div>
        `;

        marker.bindPopup(popupContent, {
          className: 'custom-popup',
          maxWidth: 300,
        });

            marker.addTo(markersLayerRef.current);
            markers.push(marker);
          } catch (markerError) {
            console.error('Error adding marker for property:', property.id, markerError);
          }
        }
      });

    // Fit bounds to show all markers
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      const bounds = group.getBounds();
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 14,
      });
    }

    // Invalidate size after a short delay
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);
    } catch (mapError) {
      console.error('Error initializing map:', mapError);
      mapInstanceRef.current = null;
      setMapLoaded(false);
    }

    // Cleanup on close
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, [isOpen, mapLoaded, L, properties]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
        integrity="sha512-h9FcoyWjHcOcmEVkxOfTLnmZFWIH0iZhZT1H2TbOq55xssQGEJHEaIm+PgoUaZbRvQTNTluNOEfb1ZRy6D3BOw=="
        crossOrigin="anonymous"
      />
      <style jsx global>{`
        .custom-marker-icon {
          background: transparent !important;
          border: none !important;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          background: white;
          border-radius: 8px;
          padding: 0;
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
        .leaflet-container {
          background: #0a0e17;
          font-family: 'Urbanist', sans-serif;
        }
      `}</style>
      <div className="relative w-full max-w-6xl h-[80vh] mx-4 bg-[#0a0a0a] rounded-2xl overflow-hidden border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-white text-lg font-semibold">All Properties on Map</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        {/* Map Container */}
        <div className="relative w-full h-[calc(100%-60px)]">
          {mapError ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src="/PropertyMap.svg"
                alt="Property locations map"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <>
              <div 
                ref={mapContainerRef}
                className="absolute inset-0 w-full h-full"
                style={{ background: '#0a0e17' }}
              />
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
                  <div className="text-white/60 text-sm">Loading map...</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Pagination Component
function Pagination({ currentPage, totalPages, onPageChange }) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 rounded-lg border border-white/20 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
      >
        Previous
      </button>
      
      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
              page === currentPage
                ? 'bg-gradient-to-r from-[#253F94] to-[#001C79] text-white'
                : page === '...'
                ? 'text-gray-500 cursor-default'
                : 'border border-white/20 text-white hover:bg-white/10'
            }`}
          >
            {page}
          </button>
        ))}
      </div>
      
      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 rounded-lg border border-white/20 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
      >
        Next
      </button>
    </div>
  );
}

export default function PropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [allProperties, setAllProperties] = useState([]); // For map
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'price-low', 'price-high', 'name'
  const [filterType, setFilterType] = useState('all'); // 'all', 'Villa', 'Apartment', 'Townhouse', 'Penthouse'
  const [filterCity, setFilterCity] = useState('all'); // 'all', 'Dubai', 'Abu Dhabi', 'Sharjah'
  const [developerName, setDeveloperName] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Get developer ID directly from router query (not state to avoid race conditions)
  const developerId = router.isReady ? (router.query.developer || null) : null;

  // Format price helper function
  const formatPrice = (price) => {
    if (!price) return 'N/A';
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    }
    if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K`;
    }
    return price.toLocaleString();
  };

  // Fetch properties with pagination using Alnair API
  const fetchPropertiesData = async (page, search, type, sort, devId, priceMin, priceMax, city) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all projects from Alnair (we'll paginate client-side for now)
      let projects = await fetchProjectsFromAlnair();
      
      // Build filters object
      const filters = {};
      
      // Add search filter if provided
      if (search && search.trim()) {
        filters.search = search.trim();
      }

      // Add type filter if not 'all'
      if (type && type !== 'all') {
        filters.type = type;
      }

      // Add city filter if not 'all'
      if (city && city !== 'all') {
        filters.city = city;
      }

      // Add price filters
      if (priceMin) {
        filters.minPrice = parseInt(priceMin);
      }
      if (priceMax) {
        filters.maxPrice = parseInt(priceMax);
      }

      // Add developer filter if provided (comes from ?developer=Name URL param)
      if (devId) {
        filters.developerName = decodeURIComponent(devId);
      }

      // Apply filters using utility function
      projects = await filterAlnairProjects(projects, filters);
      
      // Apply sorting - using correct Alnair field names
      if (sort === 'price-low') {
        projects.sort((a, b) => (a.statistics?.total?.price_from || 0) - (b.statistics?.total?.price_from || 0));
      } else if (sort === 'price-high') {
        projects.sort((a, b) => (b.statistics?.total?.price_from || 0) - (a.statistics?.total?.price_from || 0));
      } else if (sort === 'name') {
        projects.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      } else {
        // Default to newest (most recently updated first) - Alnair doesn't have updatedAt, use construction_percent as proxy
        projects.sort((a, b) => (b.weight || 0) - (a.weight || 0));
      }

      // Handle pagination client-side
      const totalResults = projects.length;
      const totalPagesCalculated = Math.ceil(totalResults / ITEMS_PER_PAGE);
      const offset = (page - 1) * ITEMS_PER_PAGE;
      const paginatedProjects = projects.slice(offset, offset + ITEMS_PER_PAGE);
      
      setProperties(paginatedProjects);
      setTotalPages(totalPagesCalculated);
      setTotalCount(totalResults);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all properties for map (without pagination, but with current filters)
  const fetchAllForMap = useCallback(async (search = '', type = 'all', sort = 'newest', devId = null, priceMin = '', priceMax = '', city = 'all') => {
    try {
      // Fetch all projects from Alnair
      let projects = await fetchProjectsFromAlnair();
      
      // Build filters object
      const filters = {};
      if (search && search.trim()) filters.search = search.trim();
      if (type && type !== 'all') filters.type = type;
      if (city && city !== 'all') filters.city = city;
      if (priceMin) filters.minPrice = parseInt(priceMin);
      if (priceMax) filters.maxPrice = parseInt(priceMax);
      
      if (devId) {
        filters.developerName = decodeURIComponent(devId);
      }

      // Apply filters
      projects = await filterAlnairProjects(projects, filters);
      
      // Apply sorting - using correct Alnair field names
      if (sort === 'price-low') {
        projects.sort((a, b) => (a.statistics?.total?.price_from || 0) - (b.statistics?.total?.price_from || 0));
      } else if (sort === 'price-high') {
        projects.sort((a, b) => (b.statistics?.total?.price_from || 0) - (a.statistics?.total?.price_from || 0));
      } else if (sort === 'name') {
        projects.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      }
      
      setAllProperties(projects);
    } catch (err) {
      console.error('Error fetching all properties for map:', err);
    }
  }, []);

  // Initial load - wait for router to be ready
  useEffect(() => {
    if (router.isReady && !initialLoadDone) {
      const devId = router.query.developer || null;
      const urlMinPrice = router.query.min_price || '';
      const urlMaxPrice = router.query.max_price || '';
      const urlType = router.query.type || 'all';
      const urlCity = router.query.emirate || router.query.city || 'all';
      
      // Set state from URL params
      if (urlMinPrice) setMinPrice(urlMinPrice);
      if (urlMaxPrice) setMaxPrice(urlMaxPrice);
      if (urlType && urlType !== 'all') setFilterType(urlType);
      if (urlCity && urlCity !== 'all') setFilterCity(urlCity);
      
      fetchPropertiesData(1, '', urlType, 'newest', devId, urlMinPrice, urlMaxPrice, urlCity);
      fetchAllForMap('', urlType, 'newest', devId, urlMinPrice, urlMaxPrice, urlCity);
      setInitialLoadDone(true);
    }
  }, [router.isReady, fetchAllForMap]),

  // Refetch when developer filter changes from URL
  useEffect(() => {
    if (router.isReady && initialLoadDone) {
      const devId = router.query.developer || null;
      setCurrentPage(1);
      fetchPropertiesData(1, searchQuery, filterType, sortBy, devId, minPrice, maxPrice, filterCity);
    }
  }, [router.query.developer]);

  // Refetch when sort or type filter changes (user interaction)
  useEffect(() => {
    if (router.isReady && initialLoadDone) {
      setCurrentPage(1);
      fetchPropertiesData(1, searchQuery, filterType, sortBy, developerId, minPrice, maxPrice, filterCity);
      fetchAllForMap(searchQuery, filterType, sortBy, developerId, minPrice, maxPrice, filterCity);
    }
  }, [sortBy, filterType, filterCity, fetchAllForMap]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchPropertiesData(page, searchQuery, filterType, sortBy, developerId, minPrice, maxPrice);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle search (form submit — Enter key)
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPropertiesData(1, searchQuery, filterType, sortBy, developerId, minPrice, maxPrice, filterCity);
    fetchAllForMap(searchQuery, filterType, sortBy, developerId, minPrice, maxPrice, filterCity);
  };

  // Real-time search — debounced 150ms after user stops typing
  useEffect(() => {
    if (!initialLoadDone) return;
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchPropertiesData(1, searchQuery, filterType, sortBy, developerId, minPrice, maxPrice, filterCity);
      fetchAllForMap(searchQuery, filterType, sortBy, developerId, minPrice, maxPrice, filterCity);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle price filter change
  const handlePriceFilter = () => {
    setCurrentPage(1);
    fetchPropertiesData(1, searchQuery, filterType, sortBy, developerId, minPrice, maxPrice, filterCity);
  };

  // Clear price filter
  const clearPriceFilter = () => {
    setMinPrice('');
    setMaxPrice('');
    setCurrentPage(1);
    fetchPropertiesData(1, searchQuery, filterType, sortBy, developerId, '', '', filterCity);
    // Update URL to remove price params
    const newQuery = { ...router.query };
    delete newQuery.min_price;
    delete newQuery.max_price;
    router.push({ pathname: '/properties', query: newQuery }, undefined, { shallow: true });
  };

  // Clear developer filter
  const clearDeveloperFilter = () => {
    router.push('/properties', undefined, { shallow: true });
  };

  return (
    <>
      <Head>
        <title>Properties | DMD</title>
        <meta
          name="description"
          content="Browse all available properties UAE. Find your perfect home or investment opportunity."
        />
      </Head>

      <div className="min-h-screen bg-black">
        <Header />
        
        {/* Main Content */}
        <main className="pt-24 pb-16 px-6 lg:px-12 xl:px-20">
          {/* Search Bar & Filters */}
          <div className="max-w-7xl mx-auto mb-10">
            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* Search Input */}
              <form onSubmit={handleSearch} className="flex-1 w-full">
                <div className="relative">
                  <svg 
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search for a Property by Name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-10 py-3.5 bg-[#1a1a1a] border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/40 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      aria-label="Clear search"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  )}
                </div>
              </form>
              
              {/* Sort & Filter */}
              <div className="flex items-center gap-2">
                {/* City Filter */}
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="px-3 py-4 bg-[#1a1a1a] border border-white/20 rounded-lg text-white text-xs focus:outline-none focus:border-white/40 transition-colors cursor-pointer"
                >
                  <option value="all">All Emirates</option>
                  <option value="Dubai">Dubai</option>
                  <option value="Abu_Dhabi">Abu Dhabi</option>
                  <option value="Sharjah">Sharjah</option>
                </select>

                {/* Property Type Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-4 bg-[#1a1a1a] border border-white/20 rounded-lg text-white text-xs focus:outline-none focus:border-white/40 transition-colors cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="Villa">Villa</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Penthouse">Penthouse</option>
                  <option value="Duplex">Duplex</option>
                </select>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-4 bg-[#1a1a1a] border border-white/20 rounded-lg text-white text-xs focus:outline-none focus:border-white/40 transition-colors cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price ↑</option>
                  <option value="price-high">Price ↓</option>
                  <option value="name">A-Z</option>
                </select>
              </div>
              
              {/* Show on Map Button */}
              <button
                onClick={() => setShowMap(true)}
                className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#253F94] to-[#001C79] rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2"/>
                  <line x1="8" y1="2" x2="8" y2="18"/>
                  <line x1="16" y1="6" x2="16" y2="22"/>
                </svg>
                Show on Map
              </button>
            </div>
            
            {/* Results Count & Demo Mode Indicator */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-gray-400 text-sm">
                  {(() => {
                    if (loading) return 'Loading...';
                    if (!totalCount) return 'Showing 0 of 0 properties';
                    const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
                    const end = Math.min(start + properties.length - 1, totalCount);
                    return `Showing ${start}-${end} of ${totalCount} properties`;
                  })()}
                </p>
                {developerId && (
                  <button
                    onClick={clearDeveloperFilter}
                    className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-xs font-medium hover:bg-blue-500/30 transition-colors"
                  >
                    <span>Developer Filter</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                )}
                {(minPrice || maxPrice) && (
                  <button
                    onClick={clearPriceFilter}
                    className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-xs font-medium hover:bg-green-500/30 transition-colors"
                  >
                    <span>
                      Price: {minPrice ? `AED ${formatPrice(parseInt(minPrice))}` : 'Any'} - {maxPrice ? `AED ${formatPrice(parseInt(maxPrice))}` : 'Any'}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Properties Grid */}
          <div className="max-w-7xl mx-auto">
            {error ? (
              <div className="text-center py-20">
                <p className="text-red-400 text-lg mb-4">Failed to load properties</p>
                <button
                  onClick={() => fetchPropertiesData(currentPage, searchQuery, filterType, sortBy, developerId, minPrice, maxPrice, filterCity)}
                  className="px-6 py-3 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loading ? (
                    // Show 12 skeletons (3x4)
                    Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                      <PropertyCardSkeleton key={i} />
                    ))
                  ) : properties.length === 0 ? (
                    <div className="col-span-3 text-center py-20">
                      <p className="text-gray-400 text-lg">No properties found</p>
                    </div>
                  ) : (
                    properties.map((property) => (
                      <PropertyCard key={property.id} property={property} />
                    ))
                  )}
                </div>
                
                {/* Pagination */}
                {!loading && totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>
      
      {/* Map Modal */}
      <MapModal 
        properties={allProperties}
        isOpen={showMap}
        onClose={() => setShowMap(false)}
      />
    </>
  );
}
