'use client';

import Head from 'next/head';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import { getDevelopersFromAlnair } from '../lib/api';

const ITEMS_PER_PAGE = 16; // 4x4 grid

// Developer Card Component
function DeveloperCard({ developer }) {
  // Handle both database and Alnair formats
  const company = developer.Company;
  const name = developer.name || company?.name || 'Unknown Developer';
  const logoUrl = developer.logo || company?.logo || null;
  const projectCount = developer.projectCount || developer.project_count || 0;
  const developerId = developer.id;
  const [imageError, setImageError] = useState(false);
  
  // Get initials from company name
  const getInitials = (name) => {
    if (!name) return '?';
    const words = name.split(' ').filter(word => word.length > 0 && !['L.L.C', 'LLC', 'P.J.S.C', 'P.S.C.', 'P.S.C'].includes(word));
    if (words.length === 0) return name.charAt(0).toUpperCase();
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  };
  
  return (
    <Link href={`/properties?developer=${encodeURIComponent(name)}`}>
      <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/10 hover:border-white/30 transition-all p-6 flex flex-col items-center cursor-pointer hover:bg-[#222] h-[280px]">
        {/* Logo */}
        <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center overflow-hidden mb-4 flex-shrink-0 p-2">
          {logoUrl && !imageError ? (
            <img
              src={logoUrl}
              alt={name}
              className="w-full h-full object-contain"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <span className="text-3xl font-bold text-gray-700">
              {getInitials(name)}
            </span>
          )}
        </div>
        
        {/* Name */}
        <h3 className="text-white text-lg font-semibold text-center mb-2 line-clamp-2 min-h-[56px] flex items-center">
          {name}
        </h3>
        
        {/* Project Count */}
        <p className="text-gray-400 text-sm mt-auto">
          {projectCount} {projectCount === 1 ? 'Project' : 'Projects'}
        </p>
      </div>
    </Link>
  );
}

// Loading Skeleton
function DeveloperCardSkeleton() {
  return (
    <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/10 animate-pulse p-6 flex flex-col items-center h-[280px]">
      <div className="w-28 h-28 rounded-full bg-gray-800 mb-4 flex-shrink-0"></div>
      <div className="h-6 bg-gray-800 rounded w-32 mb-2"></div>
      <div className="h-4 bg-gray-800 rounded w-20 mt-auto"></div>
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

export default function DevelopersPage() {
  const [allDevelopers, setAllDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all developers on mount (from Alnair data)
  useEffect(() => {
    const loadDevelopers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDevelopersFromAlnair();
        setAllDevelopers(data);
      } catch (err) {
        console.error('Error loading developers:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadDevelopers();
  }, []);

  // Filter developers based on search (Alnair format uses 'name' field)
  const filteredDevelopers = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) {
      return allDevelopers;
    }
    const searchLower = searchQuery.toLowerCase().trim();
    return allDevelopers.filter(dev => {
      const devName = dev.name || dev.Company?.name || '';
      return devName.toLowerCase().includes(searchLower);
    });
  }, [allDevelopers, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredDevelopers.length / ITEMS_PER_PAGE) || 1;
  const totalCount = filteredDevelopers.length;
  
  // Get current page developers
  const currentDevelopers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDevelopers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDevelopers, currentPage]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle search input change
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page on search
  };

  return (
    <>
      <Head>
        <title>Developers | DMD</title>
        <meta
          name="description"
          content="Browse all property developers in UAE. Discover trusted developers for your next investment."
        />
      </Head>

      <div className="min-h-screen bg-black">
        <Header />
        
        {/* Main Content */}
        <main className="pt-24 pb-16 px-6 lg:px-12 xl:px-20">
          {/* Search Bar */}
          <div className="max-w-7xl mx-auto mb-10">
            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* Search Input */}
              <div className="flex-1 w-full max-w-2xl mx-auto">
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
                    placeholder="Search developers..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-[#1a1a1a] border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/40 transition-colors"
                  />
                </div>
              </div>
            </div>
            
            {/* Results Count */}
            <div className="flex items-center justify-center mt-4">
              <p className="text-gray-400 text-sm">
                {(() => {
                  if (loading) return 'Loading developers...';
                  const total = totalCount;
                  if (!total) return 'Showing 0 of 0 developers';
                  const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
                  const end = Math.min(start + currentDevelopers.length - 1, total);
                  return `Showing ${start}-${end} of ${total} developers`;
                })()}
              </p>
            </div>
          </div>
          
          {/* Developers Grid */}
          <div className="max-w-7xl mx-auto">
            {error ? (
              <div className="text-center py-20">
                <p className="text-red-400 text-lg mb-4">Failed to load developers</p>
                <button
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    fetchAllDevelopers(true).then(data => {
                      setAllDevelopers(data);
                      setLoading(false);
                    }).catch(err => {
                      setError(err.message);
                      setLoading(false);
                    });
                  }}
                  className="px-6 py-3 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {loading ? (
                    // Show 16 skeletons (4x4)
                    Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                      <DeveloperCardSkeleton key={i} />
                    ))
                  ) : currentDevelopers.length === 0 ? (
                    <div className="col-span-4 text-center py-20">
                      <p className="text-gray-400 text-lg">No developers found</p>
                    </div>
                  ) : (
                    currentDevelopers.map((developer) => (
                      <DeveloperCard key={developer.id} developer={developer} />
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
    </>
  );
}
