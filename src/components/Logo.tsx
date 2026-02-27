import React from 'react';
import { cn } from '../lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Icon */}
      <div className="bg-black text-brand-orange w-12 h-12 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <path d="M2 20h20M5 20l-2-12 5 4 4-8 4 8 5-4-2 12" />
        </svg>
      </div>
      {/* Text */}
      <div className="flex flex-col justify-center leading-none">
        <span className="text-black font-bold tracking-widest text-xs uppercase mb-[-2px]">Colégio</span>
        <span className="text-brand-orange font-black text-3xl tracking-tighter uppercase">Real</span>
      </div>
    </div>
  );
}
