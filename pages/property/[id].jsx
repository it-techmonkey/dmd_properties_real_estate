'use client';

import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import Header from '../../components/Header';
import EnquiryModal from '../../components/EnquiryModal';
import { fetchProjectDetailsFromAlnair, cleanText } from '../../lib/api';

// Amenity icons mapping
const amenityIcons = {
  'Swimming Pool': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12h20M2 12c0-3.5 2-6 5-6s5 2.5 5 6M12 12c0-3.5 2-6 5-6s5 2.5 5 6M2 12v5c0 1 .5 2 2 2s2-1 2-2 .5-2 2-2 2 1 2 2 .5 2 2 2 2-1 2-2 .5-2 2-2 2 1 2 2 .5 2 2 2 2-1 2-2v-5"/>
    </svg>
  ),
  'Pool': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12h20M2 12c0-3.5 2-6 5-6s5 2.5 5 6M12 12c0-3.5 2-6 5-6s5 2.5 5 6M2 12v5c0 1 .5 2 2 2s2-1 2-2 .5-2 2-2 2 1 2 2 .5 2 2 2 2-1 2-2 .5-2 2-2 2 1 2 2 .5 2 2 2 2-1 2-2v-5"/>
    </svg>
  ),
  'Gym': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6.5 6.5h11M6.5 17.5h11M3 12h18M4.5 9v6M19.5 9v6M7.5 9v6M16.5 9v6"/>
    </svg>
  ),
  'Security': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  'Parking': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M9 17V7h4a3 3 0 110 6H9"/>
    </svg>
  ),
  'Garden': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22V12M12 12C12 12 7 10 7 6c0-2 1-4 5-4M12 12c0 0 5-2 5-6 0-2-1-4-5-4"/>
      <path d="M5 22h14"/>
    </svg>
  ),
  'Play Area': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
      <line x1="9" y1="9" x2="9.01" y2="9"/>
      <line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>
  ),
  'Lobby': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
  ),
  'Beach Access': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.5 21H6.5C5 21 4 20 4 18.5S5 16 6.5 16h11c1.5 0 2.5 1 2.5 2.5S19 21 17.5 21z"/>
      <path d="M5 12l7-7 7 7"/>
      <path d="M12 5v7"/>
    </svg>
  ),
  'Concierge': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8h1a4 4 0 010 8h-1"/>
      <path d="M6 8H5a4 4 0 000 8h1"/>
      <path d="M6 8a6 6 0 0112 0"/>
      <line x1="12" y1="16" x2="12" y2="20"/>
      <line x1="8" y1="20" x2="16" y2="20"/>
    </svg>
  ),
  'Private Pool': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12h20M2 12c0-3.5 2-6 5-6s5 2.5 5 6M12 12c0-3.5 2-6 5-6s5 2.5 5 6M2 12v5c0 1 .5 2 2 2s2-1 2-2 .5-2 2-2 2 1 2 2 .5 2 2 2 2-1 2-2 .5-2 2-2 2 1 2 2 .5 2 2 2 2-1 2-2v-5"/>
    </svg>
  ),
  'Jacuzzi': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 6c0-1.7 1.3-3 3-3s3 1.3 3 3"/>
      <path d="M3 14h18v2c0 2.2-1.8 4-4 4H7c-2.2 0-4-1.8-4-4v-2z"/>
      <path d="M3 14c0-2 1-4 3-5M21 14c0-2-1-4-3-5"/>
    </svg>
  ),
  'Parks': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22V12M12 12l-4 4M12 12l4 4"/>
      <path d="M17 8c0-3-2-5-5-5S7 5 7 8"/>
      <path d="M19 12c0-4-3-8-7-8s-7 4-7 8"/>
    </svg>
  ),
  'Smart Home': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <circle cx="12" cy="13" r="3"/>
    </svg>
  ),
  'Retail': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  ),
  'Community Pool': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12h20M2 12c0-3.5 2-6 5-6s5 2.5 5 6M12 12c0-3.5 2-6 5-6s5 2.5 5 6M2 12v5c0 1 .5 2 2 2s2-1 2-2 .5-2 2-2 2 1 2 2 .5 2 2 2 2-1 2-2 .5-2 2-2 2 1 2 2 .5 2 2 2 2-1 2-2v-5"/>
    </svg>
  ),
  'Golf Course': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="18" r="3"/>
      <path d="M12 2v13"/>
      <path d="M12 5l7 3-7 3"/>
    </svg>
  ),
  'Private Terrace': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18M3 10h18M5 6l7-4 7 4"/>
      <path d="M4 10v11M20 10v11"/>
    </svg>
  ),
};

// Default icon for unknown amenities
const defaultAmenityIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
    <line x1="9" y1="9" x2="9.01" y2="9"/>
    <line x1="15" y1="9" x2="15.01" y2="9"/>
  </svg>
);

export default function PropertyDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [L, setL] = useState(null);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [expandDescription, setExpandDescription] = useState(false);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Load Leaflet
  useEffect(() => {
    if (!property?.latitude || !property?.longitude) return;

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
    });
  }, [property]);

  // Initialize Leaflet map when loaded
  useEffect(() => {
    if (!mapLoaded || !L || !mapContainerRef.current || !property?.latitude || !property?.longitude) return;
    
    // Prevent re-initialization
    if (mapInstanceRef.current) return;

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

    const position = [property.latitude, property.longitude];
    
    try {
      const map = L.map(mapContainerRef.current, {
        center: position,
        zoom: 15,
        zoomControl: true,
        attributionControl: true,
      });

      // Add dark theme tile layer (CartoDB Dark Matter)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

       mapInstanceRef.current = map;

       // Get developer logo URL (Alnair uses companyLogo)
       const developerLogo = property?.logo?.src;
       const markerSize = 50;
    
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
      });
    }
    
    // Create marker
    try {
      L.marker(position, { icon }).addTo(map);
    } catch (markerError) {
      console.error('Error adding marker to map:', markerError);
    }

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
      }
    };
    } catch (mapError) {
      console.error('Error initializing map:', mapError);
      // Reset map state to allow retry
      mapInstanceRef.current = null;
      setMapLoaded(false);
    }
  }, [mapLoaded, L, property]);

  useEffect(() => {
    if (!id) return;

    const fetchProperty = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch from Alnair API
        const foundProperty = await fetchProjectDetailsFromAlnair(id);
        
        if (foundProperty) {
          setProperty(foundProperty);
        } else {
          throw new Error('Property not found');
        }
      } catch (err) {
        console.error('Error fetching property:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

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
    return bedroomMap[bedrooms] || bedrooms;
  };

  // Get developer name from Alnair data
  const getDeveloperName = () => {
    // Alnair uses 'builder' field for developer
    return property?.builder || null;
  };

  // Get developer logo from Alnair data
  const getDeveloperLogo = () => {
    // Alnair uses logo object with src property
    return property?.logo?.src || null;
  };

  // Format unit types for display
  // statistics.units is a keyed object: { "110": {...}, "112": {...} }
  // Keys: 110=Studio, 111=1BR, 112=2BR, 113=3BR, 114=4BR
  const getUnitTypesDisplay = () => {
    if (!property?.statistics?.units) return null;
    const unitKeyMap = { '110': 'Studio', '111': '1 BR', '112': '2 BR', '113': '3 BR', '114': '4 BR', '115': '5 BR+' };
    const keys = Object.keys(property.statistics.units);
    if (keys.length === 0) return null;
    const labels = keys.map(k => unitKeyMap[k] || k).join(', ');
    return labels;
  };

  // Get property type display (Alnair uses 'type')
  const getPropertyTypeDisplay = () => {
    return property?.type || null;
  };

  // Parse payment structure if available
  const getPaymentStructure = () => {
    if (!property?.payment_structure) return null;
    try {
      const structure = JSON.parse(property.payment_structure);
      return structure;
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading... | DMD</title>
        </Head>
        <div className="min-h-screen bg-black">
          <Header />
          <main className="pt-24 pb-16 px-6 lg:px-12 xl:px-20">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse">
                <div className="flex flex-col lg:flex-row gap-10">
                  {/* Left side skeleton */}
                  <div className="flex-1">
                    <div className="w-full aspect-[4/3] bg-gray-800 rounded-xl mb-4"></div>
                    <div className="flex gap-2">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="w-20 h-20 bg-gray-800 rounded-lg"></div>
                      ))}
                    </div>
                  </div>
                  {/* Right side skeleton */}
                  <div className="lg:w-[450px]">
                    <div className="h-10 bg-gray-800 rounded w-3/4 mb-4"></div>
                    <div className="h-6 bg-gray-800 rounded w-1/2 mb-6"></div>
                    <div className="h-32 bg-gray-800 rounded mb-6"></div>
                    <div className="flex gap-2 mb-6">
                      <div className="h-8 bg-gray-800 rounded-full w-24"></div>
                      <div className="h-8 bg-gray-800 rounded-full w-24"></div>
                    </div>
                    <div className="h-12 bg-gray-800 rounded w-1/3 mb-6"></div>
                    <div className="h-14 bg-gray-800 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  if (error || !property) {
    return (
      <>
        <Head>
          <title>Property Not Found | DMD</title>
        </Head>
        <div className="min-h-screen bg-black">
          <Header />
          <main className="pt-24 pb-16 px-6 lg:px-12 xl:px-20">
            <div className="max-w-7xl mx-auto text-center py-20">
              <h1 className="text-white text-2xl font-bold mb-4">Property Not Found</h1>
              <p className="text-gray-400 mb-8">{error || 'The property you are looking for does not exist.'}</p>
              <Link 
                href="/properties"
                className="inline-block px-6 py-3 bg-gradient-to-r from-[#253F94] to-[#001C79] rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
              >
                Back to Properties
              </Link>
            </div>
          </main>
        </div>
      </>
    );
  }

  // Build images array from Alnair cover + photos fields
  const images = (() => {
    const imgs = [];
    if (property.cover?.src) imgs.push(property.cover.src);
    if (property.photos?.length > 0) {
      property.photos.forEach(p => { if (p.src) imgs.push(p.src); });
    }
    return imgs.length > 0 ? imgs : ['/Villas/Image.webp'];
  })();

  return (
    <>
      <Head>
        <title>{property.title} | DMD</title>
        <meta name="description" content={cleanText(property.description)?.substring(0, 160) || `View details for ${property.title}`} />
      </Head>

      <div className="min-h-screen bg-black">
        <Header />
        
        <main className="pt-24 pb-16 px-6 lg:px-12 xl:px-20">
          <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back
            </button>

            {/* Main Content */}
            <div className="flex flex-col lg:flex-row gap-10">
              {/* Left Side - Images */}
              <div className="flex-1 max-w-full lg:max-w-[calc(100%-490px)]">
                {/* Main Image - Fixed height container */}
                <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px] rounded-xl overflow-hidden mb-4 bg-gray-900">
                  <img
                    src={images[selectedImageIndex]}
                    alt={property.title}
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/Villas/Image.webp';
                    }}
                  />
                </div>
                
                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImageIndex === index 
                            ? 'border-blue-500' 
                            : 'border-transparent hover:border-white/30'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${index + 1}`}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/Villas/Image.webp';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Side - Details */}
              <div className="lg:w-[450px] flex-shrink-0">
                {/* Title */}
                <h1 className="text-white text-2xl lg:text-3xl font-bold mb-2">
                  {property.title}
                </h1>
                
                {/* Location — Alnair uses district.title */}
                {(property.district?.title || property.locality || property.address) && (
                  <p className="text-blue-400 text-lg mb-4">
                    {property.district?.title || property.locality || property.address}
                    {', Dubai'}
                  </p>
                )}
                
                {/* Description - Fixed height scrollable box */}
                <div className="mb-6">
                  <p className="text-gray-500 text-sm mb-2">Description</p>
                  <div className="h-[200px] overflow-y-auto bg-white/5 border border-white/10 rounded-xl p-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                      {property.description 
                        ? cleanText(property.description)
                            .replace(/\.(?=[A-Z])/g, '.\n\n') // Add line breaks after sentences followed by capital letters
                            .trim()
                        : 'No description available.'}
                    </p>
                  </div>
                </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {getUnitTypesDisplay() && (
                    <span className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 7v11a2 2 0 002 2h14a2 2 0 002-2V7"/>
                        <path d="M21 7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v2"/>
                        <path d="M3 12h18"/>
                      </svg>
                      {getUnitTypesDisplay()}
                    </span>
                  )}
                  {getPropertyTypeDisplay() && (
                    <span className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                        <polyline points="9,22 9,12 15,12 15,22"/>
                      </svg>
                      {getPropertyTypeDisplay()}
                    </span>
                  )}
                </div>
                
                {/* Price — use statistics.total.price_from (Alnair API shape) */}
                <div className="mb-6">
                  <p className="text-gray-500 text-sm mb-1">Starting From</p>
                  <p className="text-white text-3xl font-bold">
                    AED {formatPrice(property.statistics?.total?.price_from || 0)}
                  </p>
                  {property.statistics?.total?.price_to &&
                   property.statistics.total.price_to !== property.statistics.total.price_from && (
                    <p className="text-gray-400 text-sm mt-1">
                      Up to AED {formatPrice(property.statistics.total.price_to)}
                    </p>
                  )}
                </div>
                
                {/* Payment Plan Info */}
                {getPaymentStructure() && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/20 rounded-xl">
                    <p className="text-green-400 text-sm font-medium mb-2 flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2"/>
                        <path d="M12 8v8M8 12h8"/>
                      </svg>
                      Payment Plan Available
                    </p>
                    {getPaymentStructure().phases && (
                      <div className="flex gap-4 text-sm">
                        {getPaymentStructure().phases.map((phase, idx) => (
                          <div key={idx} className="text-gray-300">
                            <span className="text-white font-medium">{phase.value}%</span>
                            <span className="text-gray-400 ml-1">
                              {phase.label === 'during_construction' ? 'During Construction' : 
                               phase.label === 'after_handover' ? 'After Handover' : phase.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Enquire Button */}
                <button 
                  onClick={() => setShowEnquiryModal(true)}
                  className="block w-full py-4 rounded-xl bg-white text-black text-base font-semibold hover:bg-gray-100 transition-colors mb-4 text-center"
                >
                  Enquire Now
                </button>

                {/* Brochure Download */}
                {property.brochure_url && (
                  <a 
                    href={property.brochure_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold transition-colors mb-4"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="7,10 12,15 17,10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download Brochure
                  </a>
                )}
              </div>
            </div>

            {/* Full Width Details Grid - Below main content */}
            
              {/* Description Section — from /project/look/{slug} */}
            {property.description && (
              <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-xl">
                <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                  About This Project
                </h3>
                {(() => {
                  const raw = property.description || '';

                  // Utility: decode HTML entities (2 passes handles double-encoding like &amp;lt;)
                  const decodeEntities = (str) => str
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/&apos;/g, "'");

                  // Step 1: Decode entities FIRST (must happen before tag stripping)
                  const decoded = decodeEntities(decodeEntities(raw));

                  // Step 2: Strip all HTML tags (now guaranteed to be real `<` brackets)
                  const clean = decoded
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<\/p>\s*/gi, '\n\n')
                    .replace(/<\/h[1-6]>\s*/gi, '\n\n')
                    .replace(/<\/li>\s*/gi, '\n')
                    .replace(/<li[^>]*>/gi, '\u2022 ')
                    .replace(/<[^>]+>/g, '')
                    .replace(/\n{3,}/g, '\n\n')
                    .trim();

                  const PREVIEW_CHARS = 500;
                  const isLong = clean.length > PREVIEW_CHARS;
                  const preview = isLong && !expandDescription ? clean.slice(0, PREVIEW_CHARS) + '...' : clean;

                  return (
                    <div>
                      <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-line">{preview}</p>
                      {isLong && (
                        <button
                          onClick={() => setExpandDescription(v => !v)}
                          className="mt-3 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                        >
                          {expandDescription ? '↑ Show Less' : '↓ Read Full Description'}
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Key Details & Amenities */}
              <div className="space-y-6">
                {/* Key Details Card */}
                <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                  <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <path d="M3 9h18M9 21V9"/>
                    </svg>
                    Key Details
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {getDeveloperName() && (
                      <div className="col-span-2 sm:col-span-3 flex items-center gap-3 p-3 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg">
                        {getDeveloperLogo() && (
                          <div className="w-12 h-12 bg-white rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={getDeveloperLogo()}
                              alt={getDeveloperName()}
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div>
                          <p className="text-gray-500 text-xs">Developer</p>
                          <p className="text-white font-semibold text-lg">{getDeveloperName()}</p>
                        </div>
                      </div>
                    )}
                    {/* Show area info from Alnair total stats */}
                    {property.statistics?.total?.units_area_mt && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Total Area</p>
                        <p className="text-white font-medium">
                          {Math.round(parseFloat(property.statistics.total.units_area_mt)).toLocaleString()} m²
                        </p>
                      </div>
                    )}
                    {getUnitTypesDisplay() && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Unit Types</p>
                        <p className="text-white font-medium">{getUnitTypesDisplay()}</p>
                      </div>
                    )}
                    {/* Handover from construction_inspection_date */}
                    {property.construction_inspection_date && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Handover</p>
                        <p className="text-white font-medium">
                          {new Date(property.construction_inspection_date).getFullYear()}
                        </p>
                      </div>
                    )}
                    {property.category && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Category</p>
                        <p className="text-white font-medium">{property.category === 'Off_plan' ? 'Off Plan' : property.category}</p>
                      </div>
                    )}
                    {/* Location from district.title */}
                    {(property.district?.title || property.locality || property.address) && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Location</p>
                        <p className="text-white font-medium">{property.district?.title || property.locality || property.address}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Amenities Card */}
                {property.amenities && property.amenities.length > 0 && (
                  <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                    <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22,4 12,14.01 9,11.01"/>
                      </svg>
                      Amenities & Features
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {property.amenities.map((amenity, index) => (
                        <div 
                          key={index}
                          className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg"
                        >
                          <span className="text-blue-400 flex-shrink-0">
                            {amenityIcons[amenity] || defaultAmenityIcon}
                          </span>
                          <span className="text-gray-300 text-sm">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Map */}
              {property.latitude && property.longitude && (
                <div className="p-6 bg-white/5 border border-white/10 rounded-xl h-fit">
                  <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Location
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {property.locality || property.address}{property.city ? `, ${property.city}` : ''}
                  </p>
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
                    .leaflet-container {
                      background: #1a1a2e;
                      font-family: 'Urbanist', sans-serif;
                    }
                  `}</style>
                  <div 
                    ref={mapContainerRef}
                    className="relative w-full h-[350px] rounded-lg overflow-hidden bg-gray-800 z-0"
                  >
                    {!mapLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Get Directions
                  </a>
                </div>
              )}
            </div>
          </div>
        </main>
        
      </div>

      {/* WhatsApp Button */}
      <a
        href="https://wa.me/971000000000"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors z-50"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* Enquiry Modal */}
      <EnquiryModal 
        isOpen={showEnquiryModal} 
        onClose={() => setShowEnquiryModal(false)} 
        property={property}
      />
    </>
  );
}
