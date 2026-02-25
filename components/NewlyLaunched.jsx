'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchProjectsFromAlnair } from '../lib/api';

// Alnair API returns type:'project' for everything — filter by title keywords instead
const categories = [
  { id: 'all', label: 'All', keyword: null },
  { id: 'apartment', label: 'Apartments', keyword: ['apartment', 'residence', 'residences', 'tower', 'heights', 'views', 'creek', 'downtown', 'marina'] },
  { id: 'villa', label: 'Villa', keyword: ['villa', 'villas'] },
  { id: 'townhouse', label: 'Townhouse', keyword: ['townhouse', 'townhouses'] },
  { id: 'penthouse', label: 'Penthouse', keyword: ['penthouse', 'penthouses'] },
];

// Format price helper
const formatPrice = (price) => {
  if (!price) return 'N/A';
  if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M`;
  if (price >= 1000) return `${(price / 1000).toFixed(0)}K`;
  return price.toLocaleString();
};

// Get min price from Alnair statistics object
// statistics.total.price_from is the aggregate min price
// statistics.units is a keyed object: { "110": { price_from, count, ... }, ... }
function getMinPrice(property) {
  if (property.statistics?.total?.price_from) {
    return property.statistics.total.price_from;
  }
  if (property.statistics?.units) {
    const prices = Object.values(property.statistics.units)
      .map(u => u.price_from)
      .filter(Boolean);
    if (prices.length > 0) return Math.min(...prices);
  }
  return 0;
}

// Property Card Component
function PropertyCard({ property }) {
  const id = property.id;
  const title = property.title || 'Unnamed Property';

  // Get image from cover or first photo
  let imageUrl = '/Properties/1.webp';
  if (property.cover?.src) {
    imageUrl = property.cover.src;
  } else if (property.photos?.length > 0 && property.photos[0].src) {
    imageUrl = property.photos[0].src;
  }

  const address = property.district?.title || '';
  const city = 'Dubai';
  const minPrice = getMinPrice(property);

  return (
    <Link href={`/property/${id}`}>
      <div className="relative flex-shrink-0 w-[350px] h-[500px] overflow-hidden group cursor-pointer">
        {/* Full Image Background */}
        <div className="absolute inset-0">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/Properties/1.webp';
            }}
          />
        </div>

        {/* Bottom Info Box */}
        <div className="absolute bottom-4 left-0 right-0 mx-4 bg-black px-5 py-4 flex items-center justify-between h-[72px]">
          <div className="flex-1 min-w-0 mr-4">
            <h3 className="text-white text-[16px] font-medium leading-tight mb-1 truncate">
              {title}
            </h3>
            <p className="text-gray-500 text-[13px] truncate">
              {address}{address && city ? ', ' : ''}{city}
            </p>
          </div>

          <div className="bg-gradient-to-r from-[#253F94] to-[#001C79] px-4 py-2 rounded-md flex-shrink-0">
            <span className="text-white text-[13px] font-medium whitespace-nowrap">
              {minPrice ? `AED ${formatPrice(minPrice)}` : 'Price on Request'}
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
  const [activeCategory, setActiveCategory] = useState('all');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchProjectsFromAlnair();
        setProperties(data || []);
      } catch (err) {
        console.error('Error loading properties:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, []);

  // Filter properties by selected category using title keywords
  const filteredProperties = (() => {
    const category = categories.find(c => c.id === activeCategory);
    if (!category) return properties.slice(0, 10);

    // 'all' category — return top 10 by weight
    if (!category.keyword) {
      return [...properties]
        .sort((a, b) => (b.weight || 0) - (a.weight || 0))
        .slice(0, 10);
    }

    // Alnair type is always 'project' — match by title keywords instead
    const keywords = category.keyword;
    const filtered = properties.filter(p => {
      const titleLower = (p.title || '').toLowerCase();
      return keywords.some(kw => titleLower.includes(kw));
    });

    // If nothing matches, return top items (graceful fallback)
    const results = filtered.length > 0 ? filtered : properties;
    return results
      .sort((a, b) => (b.weight || 0) - (a.weight || 0))
      .slice(0, 10);
  })();

  return (
    <section className="bg-black py-20 px-8 lg:px-16 xl:px-24">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-12">
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
