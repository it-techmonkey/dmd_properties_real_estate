'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchPropertiesWithoutPriority, filterByType, filterByBedrooms } from '../lib/api';

const categories = [
  { id: 'luxury-villa', label: 'Luxury Villa', type: 'Villa', bedrooms: null },
  { id: '3bhk', label: '3 BHK', type: null, bedrooms: 'Three' },
  { id: '2bhk', label: '2 BHK', type: null, bedrooms: 'Two' },
];

// Property Card Component with custom border colors
function PropertyCard({ property }) {
  // Get the first image or use a fallback
  const imageUrl = property.image_urls && property.image_urls.length > 0 
    ? property.image_urls[0] 
    : '/Villas/Image.webp';
  
  // Format price
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

  return (
    <div className="relative group h-full font-urbanist">
      {/* Custom border using individual sides */}
      <div className="h-full rounded-xl overflow-hidden border-t border-l border-white/40 border-r-white/10 border-b-white/10 bg-[#0d1520]" 
           style={{ borderRightColor: 'rgba(255,255,255,0.1)', borderBottomColor: 'rgba(255,255,255,0.1)' }}>
        {/* Image */}
        <Link href={`/property/${property.id}`}>
          <div className="relative w-full h-[130px] overflow-hidden cursor-pointer">
            <img
              src={imageUrl}
              alt={property.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/Villas/Image.webp';
              }}
            />
          </div>
        </Link>
        
        {/* Content */}
        <div className="p-4">
          {/* Property Name */}
          <Link href={`/property/${property.id}`}>
            <h3 className="text-white text-[20px] font-semibold mb-1 line-clamp-1 hover:text-blue-400 transition-colors cursor-pointer">
              {property.title || property.project_name}
            </h3>
          </Link>
          
          {/* Price */}
          <p className="text-white/60 text-[15px] mb-3">
            From AED {formatPrice(property.min_price)}
          </p>
          
          {/* View Details Button - Black */}
          <Link href={`/property/${property.id}`}>
            <button className="w-full py-2 rounded-md bg-black border border-white/20 text-white text-[16px] font-medium transition-all hover:bg-white/10">
              View Property Details
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton
function PropertyCardSkeleton() {
  return (
    <div className="relative h-full font-urbanist">
      <div className="h-full rounded-xl overflow-hidden border border-white/10 bg-[#0d1520] animate-pulse">
        <div className="w-full h-[130px] bg-gray-700"></div>
        <div className="p-4">
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-700 rounded w-1/2 mb-3"></div>
          <div className="h-8 bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    </div>
  );
}

// Format price helper
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

// Leaflet Map Component (client-side only)
function LeafletMapComponent({ properties, categoryId }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const [isClient, setIsClient] = useState(false);
  const [L, setL] = useState(null);
  const [mapError, setMapError] = useState(null);

  // Initialize Leaflet on client-side only
  useEffect(() => {
    setIsClient(true);
    
    // Dynamically import Leaflet
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
      
      // Fix for default marker icons in Leaflet with webpack/next.js
      delete leaflet.default.Icon.Default.prototype._getIconUrl;
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
    }).catch((err) => {
      console.error('Failed to load Leaflet:', err);
      setMapError('Failed to load map library');
    });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isClient || !L || !mapRef.current || mapInstanceRef.current) return;

    // Dubai center coordinates
    const dubaiCenter = [25.15, 55.3];

    // Create map instance
    const map = L.map(mapRef.current, {
      center: dubaiCenter,
      zoom: 11,
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

    // Invalidate size after a short delay to ensure proper rendering
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, [isClient, L]);

  // Update markers when properties change
  useEffect(() => {
    if (!L || !mapInstanceRef.current || !markersLayerRef.current) return;

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    const markerSize = 50;

    // Create markers for each property
    const markers = [];
    
    properties.forEach((property) => {
      if (property.latitude && property.longitude) {
        const developerLogo = property.developer_logo || property.Developer?.Company?.logo;

        // Create custom icon
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

        // Create popup content
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

        const popupContent = `
          <div style="padding: 8px; min-width: 200px;">
            <a href="/property/${property.id}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
              <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #1f2937; cursor: pointer; transition: color 0.2s; flex: 1;" onmouseover="this.style.color='#3b82f6'" onmouseout="this.style.color='#1f2937'">${property.title}</h3>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" style="flex-shrink: 0;">
                <path d="M10 19H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h4"></path>
                <polyline points="15 8 21 2 21 8"></polyline>
                <line x1="15" y1="1" x2="15" y2="8"></line>
              </svg>
            </a>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">${property.address || property.locality || ''}, ${property.city || ''}</p>
            <p style="margin: 0; font-size: 12px; color: #374151; font-weight: 500;">From AED ${formatPrice(property.min_price)}</p>
          </div>
        `;

        marker.bindPopup(popupContent, {
          className: 'custom-popup',
          maxWidth: 300,
        });

        marker.addTo(markersLayerRef.current);
        markers.push(marker);
      }
    });

    // Fit bounds to show all markers
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      const bounds = group.getBounds();
      
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 14, // Don't zoom in too much
      });
    }
  }, [L, properties, categoryId]);

  // Show fallback on error
  if (mapError) {
    return (
      <div className="absolute inset-0">
        <Image
          src="/PropertyMap.svg"
          alt="Property locations map"
          fill
          className="object-cover"
        />
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]">
        <div className="text-white/60 text-sm">Loading map...</div>
      </div>
    );
  }

  return (
    <>
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
      <div 
        ref={mapRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: '#0a0e17' }}
      />
    </>
  );
}

// Category Map Component - wrapper for dynamic import
function CategoryMap({ properties, categoryId }) {
  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <LeafletMapComponent 
        properties={properties} 
        categoryId={categoryId}
      />
    </div>
  );
}

export default function PropertyExplorer() {
  const [activeCategory, setActiveCategory] = useState('luxury-villa');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPropertiesWithoutPriority();
        setProperties(data);
      } catch (err) {
        console.error('Error loading properties:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadProperties();
  }, []);

  // Get filtered properties for a category
  const getFilteredProperties = useCallback((categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return [];
    
    let filtered = properties;
    
    if (category.type) {
      filtered = filterByType(filtered, category.type);
    }
    
    if (category.bedrooms) {
      filtered = filterByBedrooms(filtered, category.bedrooms);
    }
    
    return filtered;
  }, [properties]);

  // Filter properties for display (limit to 6)
  const filteredProperties = getFilteredProperties(activeCategory).slice(0, 6);
  
  // Properties for the map (same 6 as displayed)
  const mapProperties = filteredProperties;

  return (
    <section className="relative bg-transparent py-20 px-8 lg:px-16 xl:px-24 font-urbanist">

      <div className="relative z-10">
        {/* Main Container with custom border colors per side */}
        <div className="rounded-2xl bg-[#0a1020] p-5 lg:p-6 border-t border-l border-white/40"
             style={{ borderRight: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {/* Two Column Layout */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Side - Properties */}
              <div className="flex-1">
                {/* Category Buttons */}
                <div className="flex flex-wrap gap-3 mb-6">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`px-6 py-2.5 rounded-lg text-[14px] font-medium transition-all ${
                        activeCategory === category.id
                          ? 'bg-gradient-to-r from-[#253F94] to-[#001C79] text-white'
                          : 'bg-transparent border border-white/30 text-white hover:border-white/60'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>

                {/* Properties 3x2 Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {loading ? (
                    // Loading skeletons
                    <>
                      <PropertyCardSkeleton />
                      <PropertyCardSkeleton />
                      <PropertyCardSkeleton />
                      <PropertyCardSkeleton />
                      <PropertyCardSkeleton />
                      <PropertyCardSkeleton />
                    </>
                  ) : error ? (
                    <div className="col-span-3 text-red-400 text-center py-10">
                      Failed to load properties.
                    </div>
                  ) : filteredProperties.length === 0 ? (
                    <div className="col-span-3 text-gray-400 text-center py-10">
                      No properties found in this category.
                    </div>
                  ) : (
                    filteredProperties.map((property) => (
                      <PropertyCard key={property.id} property={property} />
                    ))
                  )}
                </div>
              </div>

              {/* Right Side - Dynamic Map */}
              <div className="w-full lg:w-[520px] flex-shrink-0 lg:self-stretch">
                <div className="relative w-full h-[400px] lg:h-full min-h-[400px] rounded-xl overflow-hidden">
                  {!loading && mapProperties.length > 0 ? (
                    <CategoryMap 
                      properties={mapProperties} 
                      categoryId={activeCategory}
                    />
                  ) : (
                    <Image
                      src="/PropertyMap.svg"
                      alt="Property locations map"
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              </div>
            </div>
        </div>
      </div>
    </section>
  );
}
