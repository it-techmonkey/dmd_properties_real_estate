/**
 * Alnair Project Details Page Component
 * Shows full project information with large description handling
 */

'use client';

import { useState, useEffect } from 'react';
import { fetchProjectDetailsFromAlnair } from '../lib/api';
import { parseProjectDescription } from '../lib/alnairService';

interface ProjectDetailsPageProps {
  /** Accepts either a slug string OR a numeric project ID */
  slug: string;
}

export default function AlnairProjectDetailsPage({ slug }: ProjectDetailsPageProps) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDescription, setExpandedDescription] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        // If slug looks like a number, fetch by ID; otherwise find by slug
        const isId = /^\d+$/.test(slug);
        let data = null;
        if (isId) {
          data = await fetchProjectDetailsFromAlnair(slug);
        } else {
          // Find by slug in the full list
          const { fetchProjectsFromAlnair } = await import('../lib/api');
          const all = await fetchProjectsFromAlnair();
          data = all.find((p: any) => p.slug === slug) || null;
        }
        setProject(data);
        if (!data) setError('Project not found');
      } catch (err) {
        console.error('Failed to load project:', err);
        setError(err instanceof Error ? err.message : 'Failed to load project details');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-32 pb-16 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-96 bg-gray-800 rounded-xl" />
            <div className="h-8 bg-gray-800 rounded w-3/4" />
            <div className="h-4 bg-gray-800 rounded w-1/2" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-800 rounded" />
              <div className="h-4 bg-gray-800 rounded" />
              <div className="h-4 bg-gray-800 rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-red-400 mb-4">
            <p className="text-lg font-semibold">Error Loading Project</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-gradient-to-r from-[#253F94] to-[#001C79] text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-black pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center text-gray-400">
          Project not found
        </div>
      </div>
    );
  }

  const imageUrl = project.cover?.logo || project.logo?.logo || '/PropertyMap.svg';
  const { text: descriptionPreview, isTruncated, fullText } = parseProjectDescription(
    project.description,
    15, // Max 15 lines preview
    500 // Max 500 chars preview
  );

  const descriptionFull = parseProjectDescription(project.description, 200, 5000);

  return (
    <div className="min-h-screen bg-black pt-32 pb-16 px-6 lg:px-12">
      <div className="max-w-4xl mx-auto">
        {/* Hero Image */}
        <div className="relative w-full h-96 rounded-xl overflow-hidden mb-8 border border-white/10">
          <img
            src={imageUrl}
            alt={project.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/PropertyMap.svg';
            }}
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{project.title}</h1>
          <p className="text-gray-400 text-lg mb-4">by {project.builder}</p>

          {project.district && (
            <p className="text-gray-500 text-sm mb-4">
              📍 {project.district.title}
            </p>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <p className="text-gray-400 text-xs mb-1">Coordinates</p>
              <p className="text-white text-sm font-mono">
                {project.latitude?.toFixed(4)}, {project.longitude?.toFixed(4)}
              </p>
            </div>

            {project.statistics?.units && project.statistics.units.length > 0 && (
              <>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <p className="text-gray-400 text-xs mb-1">Total Units</p>
                  <p className="text-white text-sm font-semibold">
                    {project.statistics.units.reduce((sum, u) => sum + (u.count || 0), 0)}
                  </p>
                </div>

                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <p className="text-gray-400 text-xs mb-1">Starting Price</p>
                  <p className="text-white text-sm font-semibold">
                    {project.statistics.units[0]?.min_price
                      ? `AED ${(project.statistics.units[0].min_price / 1000000).toFixed(1)}M`
                      : 'On Request'}
                  </p>
                </div>

                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <p className="text-gray-400 text-xs mb-1">Unit Types</p>
                  <p className="text-white text-sm font-semibold">
                    {project.statistics.units.length}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Description Section with Expandable Content */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">About This Project</h2>

          {/* Preview (always visible) */}
          <div className={`text-gray-300 leading-relaxed mb-4 ${!expandedDescription ? 'line-clamp-5' : ''}`}>
            <p className="whitespace-pre-wrap">{descriptionPreview}</p>
          </div>

          {/* Show more/less button */}
          {isTruncated && (
            <button
              onClick={() => setExpandedDescription(!expandedDescription)}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors mb-4 inline-block"
            >
              {expandedDescription ? '← Show Less' : 'Read Full Description →'}
            </button>
          )}

          {/* Full description (when expanded) */}
          {expandedDescription && isTruncated && (
            <div className="mt-6 p-6 bg-black/30 rounded-lg border border-white/5">
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                {descriptionFull.text}
              </div>
              {descriptionFull.isTruncated && (
                <p className="text-gray-500 text-xs mt-4 italic">
                  ...and more content available
                </p>
              )}
            </div>
          )}
        </div>

        {/* Unit Types Table */}
        {project.statistics?.units && project.statistics.units.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Unit Types</h2>
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                      Count
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                      Min Price
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                      Max Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {project.statistics.units.map((unit, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-gray-300">{unit.title}</td>
                      <td className="px-6 py-4 text-gray-300">{unit.count}</td>
                      <td className="px-6 py-4 text-gray-300">
                        {unit.min_price ? `AED ${(unit.min_price / 1000000).toFixed(1)}M` : '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {unit.max_price ? `AED ${(unit.max_price / 1000000).toFixed(1)}M` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Gallery */}
        {project.photos && project.photos.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Gallery</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {project.photos.slice(0, 6).map((photo, idx) => (
                <div
                  key={idx}
                  className="relative h-48 rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition-colors"
                >
                  <img
                    src={photo.logo || photo.src}
                    alt={`Project photo ${idx + 1}`}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/PropertyMap.svg';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[#253F94]/20 to-[#001C79]/20 border border-blue-500/20 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-semibold text-white mb-2">Interested in This Project?</h3>
          <p className="text-gray-400 mb-6">
            Get detailed information, floor plans, and special offers
          </p>
          <button className="px-8 py-3 bg-gradient-to-r from-[#253F94] to-[#001C79] text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
            Request Information
          </button>
        </div>
      </div>
    </div>
  );
}
