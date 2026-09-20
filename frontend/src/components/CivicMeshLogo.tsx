import React from 'react';

interface CivicMeshLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  subtext?: string;
}

export const CivicMeshLogo: React.FC<CivicMeshLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  subtext,
}) => {
  const sizeMap = {
    sm: { box: 'w-7 h-7', icon: 28, text: 'text-base', sub: 'text-[10px]' },
    md: { box: 'w-10 h-10', icon: 40, text: 'text-lg', sub: 'text-xs' },
    lg: { box: 'w-14 h-14', icon: 56, text: 'text-2xl', sub: 'text-sm' },
    xl: { box: 'w-20 h-20', icon: 80, text: 'text-3xl', sub: 'text-base' },
  };

  const current = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Bespoke Geometric Civic Mesh Crest */}
      <div className={`relative ${current.box} shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs transition-transform duration-300 group-hover:scale-105"
          aria-hidden="true"
        >
          {/* Base Shield / Hexagon Frame */}
          <rect
            x="4"
            y="4"
            width="56"
            height="56"
            rx="16"
            className="fill-stone-900 dark:fill-stone-900 stroke-stone-800 dark:stroke-stone-700"
            strokeWidth="2"
          />

          {/* Mysore Heritage Gold Accent Glow */}
          <circle cx="32" cy="32" r="22" className="fill-amber-500/10 dark:fill-amber-400/10" />

          {/* Interconnected Municipal Elastic Grid */}
          <path
            d="M 32 14 L 48 24 L 48 40 L 32 50 L 16 40 L 16 24 Z"
            className="stroke-amber-400 dark:stroke-amber-300"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Coordinate Triangulation Mesh Nodes */}
          <line x1="32" y1="14" x2="32" y2="32" className="stroke-emerald-400/80" strokeWidth="2" strokeDasharray="3 2" />
          <line x1="48" y1="24" x2="32" y2="32" className="stroke-emerald-400/80" strokeWidth="2" strokeDasharray="3 2" />
          <line x1="48" y1="40" x2="32" y2="32" className="stroke-emerald-400/80" strokeWidth="2" strokeDasharray="3 2" />
          <line x1="32" y1="50" x2="32" y2="32" className="stroke-emerald-400/80" strokeWidth="2" strokeDasharray="3 2" />
          <line x1="16" y1="40" x2="32" y2="32" className="stroke-emerald-400/80" strokeWidth="2" strokeDasharray="3 2" />
          <line x1="16" y1="24" x2="32" y2="32" className="stroke-emerald-400/80" strokeWidth="2" strokeDasharray="3 2" />

          {/* Peripheral Node Anchors (MCC & Panchayats) */}
          <circle cx="32" cy="14" r="3" className="fill-amber-300" />
          <circle cx="48" cy="24" r="3" className="fill-emerald-400" />
          <circle cx="48" cy="40" r="3" className="fill-emerald-400" />
          <circle cx="32" cy="50" r="3" className="fill-amber-300" />
          <circle cx="16" cy="40" r="3" className="fill-emerald-400" />
          <circle cx="16" cy="24" r="3" className="fill-emerald-400" />

          {/* Central Elastic Clearing Hub */}
          <circle cx="32" cy="32" r="5" className="fill-white dark:fill-white stroke-emerald-500" strokeWidth="2" />
          <circle cx="32" cy="32" r="2" className="fill-emerald-600" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={`font-extrabold ${current.text} text-stone-900 dark:text-white tracking-tight leading-none`}>
              Civic Mesh
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
              Mysuru
            </span>
          </div>
          {subtext && (
            <span className={`${current.sub} text-stone-500 dark:text-stone-400 font-medium leading-tight mt-0.5`}>
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
