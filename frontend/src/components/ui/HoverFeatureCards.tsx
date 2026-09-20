import React, { useState } from 'react';
import { motion } from 'motion/react';

export interface HoverFeatureCardItem {
  id: string;
  name: string;
  badge: string;
  badgeClass?: string;
  description: string;
  subdetail: string;
  ctaText: string;
  icon: React.ReactNode;
  iconBgClass: string;
  accentBorderClass: string;
  onClick: () => void;
}

interface HoverFeatureCardsProps {
  items: HoverFeatureCardItem[];
  className?: string;
}

export const HoverFeatureCards: React.FC<HoverFeatureCardsProps> = ({
  items,
  className = '',
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
      {items.map((item) => {
        const isHovered = hoveredId === item.id;

        return (
          <motion.div
            key={item.id}
            id={`feature-card-${item.id}`}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`group relative rounded-3xl bg-white dark:bg-[#121214] border border-stone-200/90 dark:border-stone-800/90 p-7 shadow-xs transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer ${item.accentBorderClass}`}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.99 }}
            onClick={item.onClick}
          >
            {/* Top Row: Icon & Status Badge */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.iconBgClass}`}>
                  {item.icon}
                </div>
                <span className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${item.badgeClass}`}>
                  {item.badge}
                </span>
              </div>

              {/* Title in Bricolage Grotesque */}
              <h3 className="text-2xl font-bold font-display text-stone-900 dark:text-white tracking-tight mb-2.5">
                {item.name}
              </h3>

              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-6 font-sans">
                {item.description}
              </p>

              {/* Micro Detail Pill */}
              <div className="text-xs font-sans text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-900/90 rounded-xl p-3 border border-stone-200/70 dark:border-stone-800/80 mb-6 flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="text-[11px] leading-snug">{item.subdetail}</span>
              </div>
            </div>

            {/* Slide-Up Interactive Action Trigger */}
            <div className="pt-2">
              <motion.button
                type="button"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-950 font-semibold text-sm transition-all shadow-xs cursor-pointer select-none"
                whileTap={{ scale: 0.98 }}
              >
                <span>{item.ctaText}</span>
                <motion.svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={{ x: isHovered ? 4 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </motion.svg>
              </motion.button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
