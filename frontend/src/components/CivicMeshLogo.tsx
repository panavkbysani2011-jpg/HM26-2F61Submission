import React from 'react';

interface CivicMeshLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
  subtext?: string;
}

export const CivicMeshLogo: React.FC<CivicMeshLogoProps> = ({
  size = 'md',
  className = '',
  showSubtitle = true,
  subtext = 'MYSURU',
}) => {
  const sizeMap = {
    sm: {
      text: 'text-lg',
      sub: 'text-[9px]',
      dot: 'w-1.5 h-1.5',
      tracking: 'tracking-tight',
    },
    md: {
      text: 'text-xl',
      sub: 'text-[10px]',
      dot: 'w-2 h-2',
      tracking: 'tracking-tight',
    },
    lg: {
      text: 'text-3xl',
      sub: 'text-xs',
      dot: 'w-2.5 h-2.5',
      tracking: 'tracking-tight',
    },
    xl: {
      text: 'text-4xl sm:text-5xl',
      sub: 'text-sm',
      dot: 'w-3 h-3',
      tracking: 'tracking-tighter',
    },
  };

  const current = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex flex-col select-none ${className}`}>
      <div className="inline-flex items-baseline gap-1 font-display">
        {/* 'Civic' in one solid color */}
        <span className={`${current.text} ${current.tracking} font-extrabold text-stone-900 dark:text-white leading-none`}>
          Civic
        </span>

        {/* 'Mesh' in one solid emerald accent color */}
        <span className={`${current.text} ${current.tracking} font-extrabold text-emerald-600 dark:text-emerald-400 leading-none`}>
          Mesh
        </span>
      </div>

      {showSubtitle && (
        <div className="flex items-center gap-1.5 mt-1 font-mono">
          <span className={`${current.sub} font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400 leading-none`}>
            {subtext}
          </span>
          <span className="text-stone-300 dark:text-stone-700 text-[10px]">•</span>
          <span className={`${current.sub} font-medium tracking-wider text-emerald-700 dark:text-emerald-400/90 leading-none`}>
            CIVIC GOVERNANCE
          </span>
        </div>
      )}
    </div>
  );
};
