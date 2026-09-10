import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 6,
}) => {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="h-12 bg-slate-100/80 border-b border-slate-200" />
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex items-center px-6 py-4 gap-4">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="h-4 bg-slate-200 rounded-sm"
                style={{ width: `${Math.floor(60 + (cIdx * 23) % 40)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-24 h-4 bg-slate-200 rounded-sm" />
        <div className="w-8 h-8 bg-slate-200 rounded-lg" />
      </div>
      <div className="w-16 h-8 bg-slate-300 rounded-sm mb-2" />
      <div className="w-32 h-3 bg-slate-200 rounded-sm" />
    </div>
  );
};
