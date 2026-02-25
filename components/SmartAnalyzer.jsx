'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { fetchProjectsFromAlnair, filterAlnairProjects, cleanText } from '../lib/api';

const steps = [
  {
    id: 'goal',
    question: 'Genrating Personalized Listing',
    layout: 'horizontal',
    options: [
      { label: 'Flipping', value: 'flipping', icon: '/HandCoins.svg' },
      { label: 'Capital Appreciation', value: 'appreciation', icon: '/Money.svg' },
    ],
  },
  {
    id: 'holding',
    question: 'How long do you usually hold a property before selling?',
    layout: 'horizontal',
    options: [
      { label: 'Less than 1 year', value: 'short' },
      { label: '1-3 years', value: 'mid' },
      { label: '3+ years', value: 'long' },
    ],
  },
  {
    id: 'returns',
    question: "What's your ideal return expectation?",
    layout: 'vertical',
    options: [
      { label: '6-10% short-term', value: 'return-short' },
      { label: '6-8% yearly stable return', value: 'return-stable' },
      { label: 'Anything above 20% if high potential', value: 'return-aggressive' },
    ],
  },
  {
    id: 'budget',
    question: "What's your investment range be you start investing?",
    layout: 'vertical',
    options: [
      { label: 'AED 500K - 800K', value: 'budget-low' },
      { label: 'AED 800K - 1.5M', value: 'budget-mid' },
      { label: 'AED 3M+', value: 'budget-high' },
    ],
  },
];

function SelectionButton({ option, isSelected, onClick, layout }) {
  const isHorizontal = layout === 'horizontal';
  
  return (
    <button
      type="button"
      onClick={() => onClick(option.value)}
      className={`py-2.5 rounded-lg text-sm font-medium transition-all duration-300 border flex items-center justify-center gap-2 whitespace-nowrap ${
        isHorizontal ? 'px-6 min-w-[220px]' : 'w-full max-w-[320px] px-5'
      } ${
        isSelected
          ? 'bg-gradient-to-r from-[#253F94] to-[#001C79] text-white border-transparent'
          : 'bg-white text-gray-800 border-white/80 hover:bg-white/90'
      }`}
    >
      {option.icon && (
        <Image src={option.icon} alt="" width={18} height={18} className="flex-shrink-0" />
      )}
      {option.label}
    </button>
  );
}

function FormStep({ step, activeValue, onSelect, visible, stepIndex }) {
  const isVertical = step.layout === 'vertical';
  const isFirstTwoSteps = stepIndex < 2;
  
  return (
    <div
      className="transition-all duration-500 ease-in-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
      }}
    >
      <p className="text-white/70 text-sm mb-5 text-center">{step.question}</p>
      <div className={`flex gap-3 ${
        isFirstTwoSteps 
          ? 'flex-row justify-center flex-wrap' 
          : 'flex-col items-center'
      }`}>
        {step.options.map((option) => (
          <SelectionButton
            key={option.value}
            option={option}
            isSelected={activeValue === option.value}
            onClick={onSelect}
            layout={isFirstTwoSteps ? 'horizontal' : 'vertical'}
          />
        ))}
      </div>
    </div>
  );
}

function AnalyzerMap({ filters, onSelectProperty }) {
  const [selected, setSelected] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [clickCount, setClickCount] = useState(0);
  const [trialExhausted, setTrialExhausted] = useState(false);
  const [email, setEmail] = useState('');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [L, setL] = useState(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const handleClickRef = useRef(null);
  const propertyDetailsRef = useRef(null);

  const MAX_FREE_CLICKS = 5;

  // Fetch properties from API using shared service
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        
        // Fetch from Alnair
        let projects = await fetchProjectsFromAlnair();
        
        // Build filters based on budget selection
        const alnairFilters = {};
        
        // Map budget filter to Alnair price filters
        if (filters.budget === 'budget-low') {
          alnairFilters.maxPrice = 800000;
        } else if (filters.budget === 'budget-mid') {
          alnairFilters.minPrice = 800000;
          alnairFilters.maxPrice = 1500000;
        } else if (filters.budget === 'budget-high') {
          alnairFilters.minPrice = 3000000;
        }
        
        // Apply filters
        const filteredProjects = await filterAlnairProjects(projects, alnairFilters);
        setProperties(filteredProjects.slice(0, 100)); // Limit to 100
      } catch (error) {
        console.error('Error fetching properties:', error);
        setFetchError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadProperties();
  }, [filters.budget]);

  const filtered = useMemo(() => {
    // Properties are already filtered by the API based on budget
    return properties;
  }, [properties]);

  // Handle property click with trial limit
  const handlePropertyClick = useCallback((property) => {
    if (trialExhausted) return;
    
    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);
    
    if (newClickCount >= MAX_FREE_CLICKS) {
      // Clear selection and show trial exhausted
      setSelected(null);
      setTrialExhausted(true);
      return;
    }
    
    setSelected(property);
    if (onSelectProperty) onSelectProperty(property);
    
    // Scroll to property details after a short delay
    setTimeout(() => {
      if (propertyDetailsRef.current) {
        propertyDetailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, [clickCount, trialExhausted, onSelectProperty]);

  // Keep the ref updated with latest callback
  useEffect(() => {
    handleClickRef.current = handlePropertyClick;
  }, [handlePropertyClick]);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    // Here you can add logic to save the email
    console.log('Email submitted:', email);
    // For now, just reset the trial
    setTrialExhausted(false);
    setClickCount(0);
    setEmail('');
  };

  // Load Leaflet
  useEffect(() => {
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
  }, []);

  // Initialize map after Leaflet loads
  useEffect(() => {
    if (!mapLoaded || !L || !mapContainerRef.current || mapInstanceRef.current) return;
    if (loading) return; // Wait for properties to load

    // Ensure container has dimensions
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

      const markerSize = 50;

      // Add markers for each property
      filtered.forEach((property) => {
        if (property.latitude && property.longitude) {
          // Alnair uses statistics.total.price_from for aggregate price
          const isRecommended = (property.statistics?.total?.price_from || 0) < 1000000;
          const borderColor = isRecommended ? '#F59E0B' : '#3B82F6';
          const developerLogo = property.logo?.src; // Alnair project logo

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
                  border: 3px solid ${borderColor};
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
                  border: 3px solid ${borderColor};
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
          const popupContent = `
            <div style="padding: 8px; min-width: 200px;">
              <a href="/property/${property.id}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #1f2937; cursor: pointer; transition: color 0.2s; flex: 1;" onmouseover="this.style.color='#3b82f6'" onmouseout="this.style.color='#1f2937'">${property.title}</h3>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" style="flex-shrink: 0;">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">${property.address || ''}, ${property.city || ''}</p>
              <p style="margin: 0; font-size: 12px; color: #374151; font-weight: 500;">Starting from AED ${property.min_price ? (property.min_price >= 1000000 ? (property.min_price / 1000000).toFixed(1) + 'M' : property.min_price >= 1000 ? (property.min_price / 1000).toFixed(0) + 'K' : property.min_price.toLocaleString()) : 'N/A'}</p>
            </div>
          `;

          marker.bindPopup(popupContent, {
            className: 'custom-popup',
            maxWidth: 300,
          });

          // Handle marker click using Leaflet's event system
          marker.on('click', () => {
            if (handleClickRef.current) {
              handleClickRef.current(property);
            }
          });

          marker.addTo(markersLayerRef.current);
        }
      });

      // Invalidate size after a short delay
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 100);

    } catch (error) {
      console.error('Error initializing Leaflet map:', error);
      setMapError('Failed to initialize map');
    }
  }, [mapLoaded, L, filtered, onSelectProperty, loading]);

  if (fetchError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#0a0e17]">
        <div className="text-center">
          <div className="text-red-400 text-sm mb-2">Failed to load properties</div>
          <div className="text-white/40 text-xs">{fetchError}</div>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#0a0e17]">
        <div className="text-red-400 text-sm">{mapError}</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
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
      
      {/* Map Container */}
      <div className="relative flex-1" style={{ minHeight: '80vh' }}>
        <div 
          ref={mapContainerRef}
          className={`absolute inset-0 w-full h-full transition-all duration-500 ${trialExhausted ? 'blur-md pointer-events-none' : ''}`}
          style={{ background: '#0a0e17' }}
        />
        {(!mapLoaded || loading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]">
            <div className="text-white/60 text-sm">
              {loading ? 'Loading properties...' : 'Loading map...'}
            </div>
          </div>
        )}
        
        {/* Trial Exhausted Overlay */}
        {trialExhausted && (
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <div className="bg-[#1a1a2e]/95 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
              <h3 className="text-white text-xl font-semibold mb-2">
                Opps! You have Exhausted Your Trial.
              </h3>
              <p className="text-white/60 text-sm mb-6">
                Add Your Email to View Full List of Properties
              </p>
              
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="text-white/50 text-xs block mb-2">Enter Your Email Id</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="xyz@gmail.com"
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-[#253F94] to-[#001C79] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  Get Report
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      
      {/* View All Properties Button */}
      <div className="bg-[#0a0e17] py-6 flex justify-center border-t border-white/10">
        <Link
          href={`/properties?${filters.budget === 'budget-low' ? 'max_price=800000' : filters.budget === 'budget-mid' ? 'min_price=800000&max_price=1500000' : filters.budget === 'budget-high' ? 'min_price=3000000' : ''}`}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#253F94] to-[#001C79] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          <span>View All Properties</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>
      
      {/* Property Details Panel - only show if not trial exhausted */}
      {selected && !trialExhausted && (
        <div ref={propertyDetailsRef} className="bg-[#0f1629] border-t border-white/10 p-6 animate-in slide-in-from-bottom duration-300">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-4">
              <Link href={`/property/${selected.id}`}>
                <h3 className="text-white font-semibold text-xl mb-1 hover:text-blue-400 transition-colors cursor-pointer">{selected.title}</h3>
              </Link>
              <p className="text-white/60 text-sm">{selected.district?.title || ''}{selected.district?.title ? ', Dubai' : 'Dubai'}</p>
            </div>

            {/* Images Gallery — Alnair uses cover + photos[] */}
            {(selected.cover?.src || (selected.photos && selected.photos.length > 0)) && (
              <div className="flex gap-3 overflow-x-auto pb-4 mb-4 scrollbar-thin scrollbar-thumb-white/20">
                {[selected.cover?.src, ...(selected.photos || []).map(p => p.src)]
                  .filter(Boolean)
                  .slice(0, 5)
                  .map((url, index) => (
                    <div key={index} className="relative flex-shrink-0 w-48 h-32 rounded-lg overflow-hidden">
                      <img
                        src={url}
                        alt={`${selected.title} - ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.src = '/Villas/Image.webp'; }}
                      />
                    </div>
                  ))}
              </div>
            )}

            {/* Property Details Grid — mapped to Alnair fields */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-white/50 text-xs uppercase mb-1">Starting Price</p>
                <p className="text-white font-semibold">
                  {(() => {
                    const p = selected.statistics?.total?.price_from || 0;
                    return p >= 1000000 ? `AED ${(p/1000000).toFixed(1)}M` : p >= 1000 ? `AED ${(p/1000).toFixed(0)}K` : p ? `AED ${p.toLocaleString()}` : 'N/A';
                  })()}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-white/50 text-xs uppercase mb-1">Units</p>
                <p className="text-white font-semibold">
                  {selected.statistics?.total?.units_count || 'N/A'}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-white/50 text-xs uppercase mb-1">Developer</p>
                <p className="text-white font-semibold">{selected.builder || 'N/A'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-white/50 text-xs uppercase mb-1">Handover</p>
                <p className="text-white font-semibold">
                  {selected.construction_inspection_date
                    ? new Date(selected.construction_inspection_date).getFullYear()
                    : 'TBA'}
                </p>
              </div>
            </div>

            {/* Amenities */}
            {selected.amenities && selected.amenities.length > 0 && (
              <div className="mb-4">
                <p className="text-white/50 text-xs uppercase mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {selected.amenities.map((amenity, index) => (
                    <span key={index} className="bg-white/10 text-white/80 text-xs px-3 py-1 rounded-full">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {selected.description && (
              <div className="mb-6">
                <p className="text-white/50 text-xs uppercase mb-2">Description</p>
                <p className="text-white/70 text-sm line-clamp-3">{cleanText(selected.description)}</p>
              </div>
            )}

            {/* Know More Button */}
            <div className="flex justify-center pt-2">
              <Link 
                href={`/property/${selected.id}`}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#253F94] to-[#001C79] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                <span>Know More</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SmartAnalyzer() {
  const router = useRouter();
  const [answers, setAnswers] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Check for query params from home page redirect
  useEffect(() => {
    if (router.isReady) {
      const { goal, holding, returns, budget } = router.query;
      if (budget) {
        // If we have answers from query params, skip to map
        setAnswers({ goal, holding, returns, budget });
        setCompleted(true);
        setShowMap(true);
      }
    }
  }, [router.isReady, router.query]);

  const handleSelect = (value) => {
    if (animating) return;
    const activeStep = steps[currentStep];
    setAnswers((prev) => ({ ...prev, [activeStep.id]: value }));
    setAnimating(true);
    setTimeout(() => {
      setAnimating(false);
      if (currentStep < steps.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        setCompleted(true);
        // Show loading then map
        setTimeout(() => {
          setShowMap(true);
        }, 1500);
      }
    }, 350);
  };

  // Show full-screen map after survey is completed
  if (showMap) {
    return (
      <div className="text-white flex flex-col bg-[#0a0e17] pt-[80px]" style={{ minHeight: '100vh' }}>
        <AnalyzerMap filters={{ budget: answers.budget }} />
      </div>
    );
  }

  return (
    <div className="relative h-[90vh] text-white flex flex-col overflow-hidden bg-[#0a0e17]">
      {/* Background Image - full width, centered vertically */}
      <img 
        src="/FormMap.webp" 
        alt="" 
        className="absolute inset-0 w-full h-auto min-h-full object-cover object-top pointer-events-none"
        style={{ zIndex: 0 }}
      />
      
      {/* Centered Content Area */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-16">
        {/* Smart Analyser Card - max-w-3xl */}
        <div className="w-full max-w-3xl bg-gradient-to-br from-[#1e293b]/95 via-[#1a2234]/95 to-[#0f172a]/95 backdrop-blur-md border border-white/20 rounded-2xl p-10 shadow-2xl min-h-[240px] flex flex-col justify-center">
          <h2 className="text-xl font-semibold mb-4 text-center">
            Welcome to DMD Smart Analyser
          </h2>

          {!completed ? (
            <div
              key={steps[currentStep].id}
              className={`transition-all duration-500 ${
                animating ? 'opacity-0 -translate-y-3' : 'opacity-100 translate-y-0'
              }`}
            >
              <FormStep
                step={steps[currentStep]}
                activeValue={answers[steps[currentStep].id]}
                onSelect={handleSelect}
                visible={!animating}
                stepIndex={currentStep}
              />
            </div>
          ) : (
            <div className="py-6 text-center text-white/60 text-sm uppercase tracking-[0.2em]">
              Generating personalized listing...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}