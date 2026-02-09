'use client';

import { useState, useEffect } from 'react';
import { X, Download, Eye, Sparkles, Monitor, Smartphone, Palette } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface DigitalArt {
  id: string;
  name: string;
  artist?: string;
  price: number;
  image: string;
  thumbnail?: string;
  description?: string;
  category: 'illustration' | 'abstract' | 'photography' | 'graphic-design' | '3d-art' | 'animation';
  fileFormats: string[]; // e.g., ['PNG', 'JPG', 'SVG', 'PSD']
  resolution: string; // e.g., '4K', '8K', '1080p'
  dimensions?: { width: number; height: number };
  tags?: string[];
  downloads?: number;
  featured?: boolean;
}

interface DigitalArtCardProps {
  art: DigitalArt;
  onQuickView: (art: DigitalArt) => void;
}

function DigitalArtCard({ art, onQuickView }: DigitalArtCardProps) {
  const getCategoryColor = () => {
    switch (art.category) {
      case 'illustration':
        return 'bg-purple-500';
      case 'abstract':
        return 'bg-pink-500';
      case 'photography':
        return 'bg-blue-500';
      case 'graphic-design':
        return 'bg-green-500';
      case '3d-art':
        return 'bg-orange-500';
      case 'animation':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-black/10 bg-white transition-all hover:shadow-xl">
      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-black/5 to-black/10">
        <img
          src={art.thumbnail || art.image}
          alt={art.name}
          className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110"
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`${getCategoryColor()} px-3 py-1 rounded-full text-[10px] font-semibold text-white uppercase tracking-wider`}>
            {art.category.replace('-', ' ')}
          </span>
          {art.featured && (
            <span className="bg-yellow-500 px-3 py-1 rounded-full text-[10px] font-semibold text-white uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Featured
            </span>
          )}
        </div>

        {/* Quick View Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button
            onClick={() => onQuickView(art)}
            className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-xl transition-transform hover:scale-105"
          >
            <Eye className="h-4 w-4" />
            View Artwork
          </button>
        </div>

        {/* Bottom info on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
          <div className="flex items-center gap-2 text-white text-xs">
            <Monitor className="h-3.5 w-3.5" />
            <span>{art.resolution}</span>
            <span className="mx-2">•</span>
            {art.dimensions && (
              <>
                <span>{art.dimensions.width} × {art.dimensions.height}px</span>
                <span className="mx-2">•</span>
              </>
            )}
            <span>{art.fileFormats.join(', ')}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-black truncate">{art.name}</h3>
            {art.artist && (
              <p className="mt-0.5 text-xs text-black/50">by {art.artist}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Palette className="h-4 w-4 text-black/40" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-base font-bold text-black">${art.price.toFixed(2)}</span>
          {art.downloads !== undefined && (
            <span className="text-[10px] text-black/40 flex items-center gap-1">
              <Download className="h-3 w-3" />
              {art.downloads} sales
            </span>
          )}
        </div>

        {art.tags && art.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {art.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[9px] px-2 py-0.5 rounded-full bg-black/5 text-black/50"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface DigitalArtViewerProps {
  art: DigitalArt;
  onClose: () => void;
}

function DigitalArtViewer({ art, onClose }: DigitalArtViewerProps) {
  const [selectedFormat, setSelectedFormat] = useState(art.fileFormats[0]);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative mx-4 w-full max-w-6xl max-h-[95vh] overflow-auto rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white/95 backdrop-blur-sm px-6 py-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-black/50">Digital Art</p>
            <h2 className="mt-1 text-xl font-bold text-black truncate">{art.name}</h2>
            {art.artist && (
              <p className="text-sm text-black/60">by {art.artist}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 text-black/70 transition-colors hover:bg-black/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 p-6">
          {/* Image Preview - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            {/* Preview Mode Toggle */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  previewMode === 'desktop'
                    ? 'bg-black text-white'
                    : 'bg-black/5 text-black/60 hover:bg-black/10'
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                Desktop
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  previewMode === 'mobile'
                    ? 'bg-black text-white'
                    : 'bg-black/5 text-black/60 hover:bg-black/10'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                Mobile
              </button>
            </div>

            {/* Image Display */}
            <div className={`relative rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden ${
              previewMode === 'desktop' ? 'aspect-video' : 'aspect-[9/16] max-w-sm mx-auto'
            }`}>
              <img
                src={art.image}
                alt={art.name}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Description */}
            {art.description && (
              <div className="rounded-xl bg-black/5 p-4">
                <p className="text-sm text-black/70 leading-relaxed">{art.description}</p>
              </div>
            )}

            {/* Technical Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-white border border-black/10 p-3">
                <p className="text-[10px] uppercase tracking-wider text-black/50 mb-1">Resolution</p>
                <p className="text-sm font-semibold text-black">{art.resolution}</p>
              </div>
              {art.dimensions && (
                <div className="rounded-xl bg-white border border-black/10 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-black/50 mb-1">Dimensions</p>
                  <p className="text-sm font-semibold text-black">
                    {art.dimensions.width} × {art.dimensions.height}
                  </p>
                </div>
              )}
              <div className="rounded-xl bg-white border border-black/10 p-3">
                <p className="text-[10px] uppercase tracking-wider text-black/50 mb-1">Formats</p>
                <p className="text-sm font-semibold text-black">{art.fileFormats.length}</p>
              </div>
              {art.downloads !== undefined && (
                <div className="rounded-xl bg-white border border-black/10 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-black/50 mb-1">Sales</p>
                  <p className="text-sm font-semibold text-black">{art.downloads}</p>
                </div>
              )}
            </div>
          </div>

          {/* Purchase Details */}
          <div className="flex flex-col">
            {/* Format Selection */}
            <div className="mb-6">
              <label className="flex items-center gap-2 mb-3 text-sm font-semibold text-black">
                <Download className="h-4 w-4" />
                Select Format
              </label>
              <div className="space-y-2">
                {art.fileFormats.map((format) => (
                  <button
                    key={format}
                    onClick={() => setSelectedFormat(format)}
                    className={`w-full rounded-xl border-2 p-3 text-left transition-all ${
                      selectedFormat === format
                        ? 'border-black bg-black text-white'
                        : 'border-black/10 bg-white text-black hover:border-black/30'
                    }`}
                  >
                    <div className="font-semibold text-sm">{format}</div>
                    <div className="text-[10px] mt-0.5 opacity-70">
                      {format === 'PSD' && 'Editable layers'}
                      {format === 'SVG' && 'Scalable vector'}
                      {format === 'PNG' && 'Transparent background'}
                      {format === 'JPG' && 'High quality'}
                      {format === 'AI' && 'Adobe Illustrator'}
                      {format === 'PDF' && 'Print ready'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* License Info */}
            <div className="mb-6 rounded-xl bg-blue-50 border border-blue-200 p-4">
              <p className="text-xs font-semibold text-blue-900 mb-2">Commercial License Included</p>
              <ul className="text-[11px] text-blue-800 space-y-1">
                <li>✓ Use in commercial projects</li>
                <li>✓ Unlimited reproductions</li>
                <li>✓ Print and digital usage</li>
                <li>✓ Modify and adapt</li>
              </ul>
            </div>

            {/* Tags */}
            {art.tags && art.tags.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-black mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {art.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full bg-black/5 text-[10px] font-medium text-black/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Price & Purchase Button */}
            <div className="mt-auto space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-black/60">Price:</span>
                <span className="text-3xl font-bold text-black">${art.price.toFixed(2)}</span>
              </div>
              <button className="w-full rounded-full bg-black px-6 py-4 text-sm font-semibold text-white transition-all hover:bg-black/90 hover:scale-[1.02] flex items-center justify-center gap-2">
                <Download className="h-4 w-4" />
                Purchase & Download
              </button>
              <p className="text-center text-[10px] text-black/40">
                Instant download • All formats included
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

interface DigitalArtSectionProps {
  arts: DigitalArt[];
  title?: string;
  subtitle?: string;
  filterByCategory?: DigitalArt['category'];
}

export function DigitalArtSection({ 
  arts, 
  title = "Digital Art Collection",
  subtitle = "Premium digital artwork for your projects",
  filterByCategory
}: DigitalArtSectionProps) {
  const [viewerArt, setViewerArt] = useState<DigitalArt | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DigitalArt['category'] | 'all'>(
    filterByCategory || 'all'
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const categories: Array<{ value: DigitalArt['category'] | 'all'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'illustration', label: 'Illustration' },
    { value: 'abstract', label: 'Abstract' },
    { value: 'photography', label: 'Photography' },
    { value: 'graphic-design', label: 'Graphic Design' },
    { value: '3d-art', label: '3D Art' },
    { value: 'animation', label: 'Animation' },
  ];

  const filteredArts = selectedCategory === 'all' 
    ? arts 
    : arts.filter(art => art.category === selectedCategory);

  return (
    <div className="w-full">
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-black/45">Digital Art</p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-black">{title}</h2>
        <p className="mt-2 text-sm text-black/60">{subtitle}</p>
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all ${
              selectedCategory === category.value
                ? 'bg-black text-white shadow-lg'
                : 'bg-white text-black/70 border border-black/10 hover:border-black/30'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {filteredArts.map((art) => (
          <DigitalArtCard
            key={art.id}
            art={art}
            onQuickView={setViewerArt}
          />
        ))}
      </div>

      {filteredArts.length === 0 && (
        <div className="rounded-2xl border border-black/10 bg-white p-12 text-center">
          <p className="text-sm text-black/60">No digital art available in this category.</p>
        </div>
      )}

      {/* Art Viewer Modal */}
      {mounted && viewerArt && (
        <DigitalArtViewer
          art={viewerArt}
          onClose={() => setViewerArt(null)}
        />
      )}
    </div>
  );
}

// Sample digital art data
export const SAMPLE_DIGITAL_ART: DigitalArt[] = [
  {
    id: 'art-1',
    name: 'Neon Dreams',
    artist: 'Alex Chen',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600',
    description: 'A vibrant cyberpunk-inspired digital illustration featuring neon lights and futuristic cityscapes.',
    category: 'illustration',
    fileFormats: ['PNG', 'JPG', 'PSD'],
    resolution: '4K',
    dimensions: { width: 3840, height: 2160 },
    tags: ['cyberpunk', 'neon', 'futuristic', 'city'],
    downloads: 234,
    featured: true,
  },
  {
    id: 'art-2',
    name: 'Abstract Waves',
    artist: 'Sarah Johnson',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=600',
    description: 'Flowing abstract patterns with gradient colors perfect for modern designs.',
    category: 'abstract',
    fileFormats: ['PNG', 'SVG', 'AI'],
    resolution: '8K',
    dimensions: { width: 7680, height: 4320 },
    tags: ['abstract', 'waves', 'gradient', 'modern'],
    downloads: 456,
    featured: true,
  },
  {
    id: 'art-3',
    name: 'Minimalist Landscape',
    artist: 'Mike Torres',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600',
    description: 'Clean and minimal landscape photography with stunning composition.',
    category: 'photography',
    fileFormats: ['JPG', 'PNG'],
    resolution: '4K',
    dimensions: { width: 4096, height: 2730 },
    tags: ['minimalist', 'landscape', 'nature', 'clean'],
    downloads: 189,
  },
  {
    id: 'art-4',
    name: 'Geometric Patterns',
    artist: 'Emma Wilson',
    price: 34.99,
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600',
    description: 'Professional geometric pattern designs for branding and backgrounds.',
    category: 'graphic-design',
    fileFormats: ['PNG', 'SVG', 'AI', 'PDF'],
    resolution: '8K',
    dimensions: { width: 8000, height: 8000 },
    tags: ['geometric', 'pattern', 'design', 'branding'],
    downloads: 567,
  },
  {
    id: 'art-5',
    name: '3D Crystal Render',
    artist: 'David Kim',
    price: 59.99,
    image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=600',
    description: 'Photorealistic 3D crystal renders with stunning lighting and reflections.',
    category: '3d-art',
    fileFormats: ['PNG', 'JPG'],
    resolution: '4K',
    dimensions: { width: 4000, height: 4000 },
    tags: ['3d', 'crystal', 'render', 'realistic'],
    downloads: 123,
    featured: true,
  },
  {
    id: 'art-6',
    name: 'Motion Graphics Pack',
    artist: 'Lisa Martinez',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=600',
    description: 'Collection of animated elements and transitions for video projects.',
    category: 'animation',
    fileFormats: ['PNG', 'GIF'],
    resolution: '1080p',
    dimensions: { width: 1920, height: 1080 },
    tags: ['animation', 'motion', 'video', 'transitions'],
    downloads: 345,
  },
];
