'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchProperties, filterByType, getRecentProperties } from '../lib/api';

const categories = [
  { id: 'apartment', label: 'Apartments', type: 'Apartment' },
  { id: 'villa', label: 'Villa', type: 'Villa' },
  { id: 'townhouse', label: 'Townhouse', type: 'Townhouse' },
  { id: 'penthouse', label: 'Penthouse', type: 'Penthouse' },
];

// Property Card Component
function PropertyCard({ property }) {
  // Get the first image or use a fallback
  const imageUrl = property.image_urls && property.image_urls.length > 0 
    ? property.image_urls[0] 
    : '/Properties/1.webp';
  
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
    <Link href={`/property/${property.id}`}>
      <div className="relative flex-shrink-0 w-[350px] h-[500px] overflow-hidden group cursor-pointer">
        {/* Full Image Background */}
        <div className="absolute inset-0">
          <img
            src={imageUrl}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/Properties/1.webp';
            }}
          />
        </div>
        
        {/* Bottom Info Box - Solid Black, overlays on image */}
        <div className="absolute bottom-4 left-0 right-0 mx-4 bg-black px-5 py-4 flex items-center justify-between h-[72px]">
          {/* Property Info */}
          <div className="flex-1 min-w-0 mr-4">
            <h3 className="text-white text-[16px] font-medium leading-tight mb-1 truncate">
              {property.title || property.project_name}
            </h3>
            <p className="text-gray-500 text-[13px] truncate">
              {property.address || property.locality}, {property.city}
            </p>
          </div>
          
          {/* Price Badge */}
          <div className="bg-gradient-to-r from-[#253F94] to-[#001C79] px-4 py-2 rounded-md flex-shrink-0">
            <span className="text-white text-[13px] font-medium whitespace-nowrap">
              AED {formatPrice(property.min_price)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Loading skeleton
function PropertyCardSkeleton() {
  return (
    <div className="relative flex-shrink-0 w-[350px] h-[500px] overflow-hidden bg-gray-800 animate-pulse">
      <div className="absolute bottom-4 left-0 right-0 mx-4 bg-black px-5 py-4 h-[72px]">
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  );
}

export default function NewlyLaunched() {
  const [activeCategory, setActiveCategory] = useState('apartment');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchProperties();
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

  // Filter properties by selected category/type
  const filteredProperties = (() => {
    const category = categories.find(c => c.id === activeCategory);
    if (!category) return [];
    
    const filtered = filterByType(properties, category.type);
    // Get recently launched properties of this type
    return getRecentProperties(filtered, 10);
  })();

  return (
    <section className="bg-black py-20 px-8 lg:px-16 xl:px-24">
      {/* Header Row - Title and Category Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-12">
        {/* Title */}
        <h2 className="font-heading text-[32px] sm:text-[36px] lg:text-[40px] font-normal text-white leading-tight">
          Newly Launched<br />
          Projects
        </h2>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-6 py-2.5 rounded-lg text-[15px] font-medium transition-all ${
                activeCategory === category.id
                  ? 'bg-gradient-to-r from-[#253F94] to-[#001C79] text-white'
                  : 'bg-transparent border border-white/30 text-white hover:border-white/60'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Property Cards - Horizontal Scroll */}
      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
        {loading ? (
          // Loading skeletons
          <>
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
          </>
        ) : error ? (
          <div className="text-red-400 text-center w-full py-10">
            Failed to load properties. Please try again later.
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-gray-400 text-center w-full py-10">
            No properties found in this category.
          </div>
        ) : (
          filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))
        )}
      </div>
    </section>
  );
}
