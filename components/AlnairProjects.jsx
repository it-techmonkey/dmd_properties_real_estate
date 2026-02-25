/**
 * Alnair Projects Component
 * Displays real estate projects from Alnair API with map integration
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchProjectsFromAlnair } from '../lib/api';
import {
  projectToMapMarker,
  parseProjectDescription,
  getConstructionProgress,
} from '../lib/alnairService';
import type {
  Project,
  ProjectMapMarker,
} from '../lib/types/alnair';

/**
 * Project Card Component
 */
function ProjectCard({ project }: { project: Project }) {
  const imageUrl = project.cover?.logo || project.logo?.logo || '/PropertyMap.svg';
  const { percentage, status } = getConstructionProgress(project);

  return (
    <div className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all group">
      {/* Image */}
      <div className="relative w-full h-[200px] overflow-hidden">
        <img
          src={imageUrl}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/PropertyMap.svg';
          }}
        />
        {/* Construction Badge */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-white">
          {percentage}% Built
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title & Builder */}
        <h3 className="text-white text-lg font-semibold mb-1 line-clamp-2 hover:text-blue-400 transition-colors">
          {project.title}
        </h3>
        <p className="text-gray-400 text-sm mb-3">{project.builder}</p>

        {/* Location */}
        <p className="text-gray-500 text-xs mb-3">
          📍 {project.district?.title || 'Dubai'}
        </p>

        {/* Construction Progress Bar */}
        <div className="mb-4">
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                status === 'completed'
                  ? 'bg-green-500'
                  : status === 'finishing'
                  ? 'bg-blue-500'
                  : status === 'structure'
                  ? 'bg-yellow-500'
                  : 'bg-gray-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {status.charAt(0).toUpperCase() + status.slice(1)} Phase
          </p>
        </div>

        {/* Stats */}
        {project.statistics?.units && project.statistics.units.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
            <div className="bg-white/5 p-2 rounded">
              <p className="text-gray-400">Units</p>
              <p className="text-white font-semibold">
                {project.statistics.units[0].count}
              </p>
            </div>
            <div className="bg-white/5 p-2 rounded">
              <p className="text-gray-400">Price Range</p>
              <p className="text-white font-semibold">
                {project.statistics.units[0].min_price
                  ? `AED ${(project.statistics.units[0].min_price / 1000000).toFixed(1)}M+`
                  : 'N/A'}
              </p>
            </div>
          </div>
        )}

        {/* View Details Button */}
        <button className="w-full py-3 rounded-lg bg-gradient-to-r from-[#253F94] to-[#001C79] text-white text-sm font-medium hover:opacity-90 transition-opacity">
          View Details
        </button>
      </div>
    </div>
  );
}

/**
 * Loading Skeleton
 */
function ProjectCardSkeleton() {
  return (
    <div className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-white/10 animate-pulse">
      <div className="w-full h-[200px] bg-gray-800" />
      <div className="p-5">
        <div className="h-6 bg-gray-800 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-800 rounded w-1/2 mb-3" />
        <div className="h-4 bg-gray-800 rounded w-full mb-2" />
        <div className="h-4 bg-gray-800 rounded w-2/3 mb-4" />
        <div className="h-12 bg-gray-800 rounded w-full" />
      </div>
    </div>
  );
}

/**
 * Map Component with Leaflet
 */
function ProjectsMapView({ projects }: { projects: ProjectMapMarker[] }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [L, setL] = useState<any>(null);

  // Load Leaflet
  useEffect(() => {
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);

      // Fix marker icons
      delete leaflet.default.Icon.Default.prototype._getIconUrl;
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      setMapLoaded(true);
    });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !L || !mapContainerRef.current) return;

    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [25.2048, 55.2708], // Dubai center
      zoom: 11,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: false,
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    setTimeout(() => map.invalidateSize(), 100);
  }, [mapLoaded, L]);

  // Update markers when projects change
  useEffect(() => {
    if (!L || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const markers: any[] = [];

    projects.forEach((project) => {
      if (!project.latitude || !project.longitude) return;

      const icon = L.divIcon({
        className: 'custom-marker-icon',
        html: `
          <div style="
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: 3px solid #3B82F6;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          ">
            🏢
          </div>
        `,
        iconSize: [50, 50],
        iconAnchor: [25, 25],
        popupAnchor: [0, -25],
      });

      const marker = L.marker([project.latitude, project.longitude], { icon });

      const popupContent = `
        <div style="padding: 12px; min-width: 250px;">
          <h4 style="margin: 0 0 6px 0; font-weight: bold; color: #1f2937;">
            ${project.title}
          </h4>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">
            ${project.builder || 'Developer'}
          </p>
          <p style="margin: 0; font-size: 12px; color: #374151; font-weight: 500;">
            ${project.min_price ? `From AED ${(project.min_price / 1000000).toFixed(1)}M` : 'Price on request'}
          </p>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(map);
      markers.push(marker);
    });

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 12 });
    }
  }, [L, projects]);

  return (
    <>
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
        .leaflet-popup-content-wrapper {
          background: white;
          border-radius: 8px;
        }
        .leaflet-container {
          background: #0a0e17;
          font-family: 'Urbanist', sans-serif;
        }
      `}</style>
      <div
        ref={mapContainerRef}
        className="w-full h-[400px] md:h-[500px] rounded-xl overflow-hidden"
      />
    </>
  );
}

/**
 * Main Alnair Projects Component
 */
export default function AlnairProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [mapMarkers, setMapMarkers] = useState<ProjectMapMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  // Fetch projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        // Load from static all_data.json — no API call needed
        const items = await fetchProjectsFromAlnair({ limit: 12 });
        setProjects(items);
        setMapMarkers(items.map(projectToMapMarker));
      } catch (err) {
        console.error('Failed to load projects:', err);
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  return (
    <section className="py-20 px-6 lg:px-12 xl:px-20 bg-black">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Featured Projects in Dubai
            </h2>
            <p className="text-gray-400">
              Browse premium real estate developments across Dubai
            </p>
          </div>
          <button
            onClick={() => setShowMap(!showMap)}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#253F94] to-[#001C79] text-white font-medium hover:opacity-90 transition-opacity"
          >
            {showMap ? 'Hide Map' : 'Show Map'}
          </button>
        </div>

        {/* Map Section */}
        {showMap && (
          <div className="mb-10">
            <ProjectsMapView projects={mapMarkers} />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 mb-10">
            Error: {error}
          </div>
        )}

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 9 }).map((_, i) => <ProjectCardSkeleton key={i} />)
          ) : projects.length === 0 ? (
            <div className="col-span-3 text-center py-12 text-gray-400">
              No projects found
            </div>
          ) : (
            projects.map((project) => <ProjectCard key={project.id} project={project} />)
          )}
        </div>
      </div>
    </section>
  );
}
