import React from 'react';
import { Clock, MapPin } from 'lucide-react';

export const ItemCard = ({ item, onClick, className = '' }) => {
  const isLost = item.type === 'LOST';

  return (
    <article
      onClick={() => onClick?.(item)}
      className={`group flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden text-left ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Card Image and Floating Status Badges */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 flex items-center justify-center">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.imageAlt || item.title}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.parentElement) {
                e.currentTarget.parentElement.classList.add('bg-slate-100');
              }
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 text-slate-400 p-4 text-center select-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {item.category || 'Item'}
            </span>
          </div>
        )}

        {/* Top-Left: Type Badge (LOST / FOUND) */}
        <div className="absolute top-3 left-3 flex items-center">
          {isLost ? (
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-[4px] bg-[#8B1D2C] text-white text-[11px] font-bold tracking-wider uppercase shadow-xs">
              LOST
            </span>
          ) : (
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-[4px] bg-[#0E7490] text-white text-[11px] font-bold tracking-wider uppercase shadow-xs">
              FOUND
            </span>
          )}
        </div>

        {/* Top-Right: Pill Badge with blue dot (Active / Resolved) */}
        <div className="absolute top-3 right-3 flex items-center">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-xs text-[#2563eb] text-xs font-semibold shadow-xs border border-blue-100/60">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" aria-hidden="true" />
            {item.status}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        {/* Category in royal blue */}
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563eb] mb-1">
          {item.category}
        </span>

        {/* Title */}
        <h3
          className="font-headline text-[17px] font-bold text-slate-900 tracking-tight leading-snug line-clamp-1 truncate"
          title={item.title}
        >
          {item.title}
        </h3>

        {/* Bottom Metadata: Date & Location on separate lines */}
        <div className="mt-4 flex flex-col gap-1.5 text-xs text-slate-600">
          {item.date && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              <span>{item.date}</span>
            </div>
          )}
          {item.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#2563eb] shrink-0" aria-hidden="true" />
              <span className="truncate" title={item.location}>
                {item.location}
              </span>
            </div>
          )}
          {!item.location && item.resolvedInfo && (
            <div className="flex items-center gap-1.5 text-slate-500">
              <span className="truncate" title={item.resolvedInfo}>
                {item.resolvedInfo}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default ItemCard;
