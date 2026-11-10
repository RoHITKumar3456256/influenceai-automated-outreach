import React from 'react';

export default function Skeleton({ className = 'h-4 w-full', count = 1 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-slate-200 rounded ${className}`}
        />
      ))}
    </div>
  );
}

