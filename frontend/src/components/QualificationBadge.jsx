import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

export default function QualificationBadge({ status, reasons = [] }) {
  const [showTooltip, setShowTooltip] = useState(false);

  let badgeClasses = 'bg-slate-100 text-slate-700 border-slate-300';
  let Icon = AlertCircle;

  if (status === 'Pass') {
    badgeClasses = 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100';
    Icon = CheckCircle2;
  } else if (status === 'Fail') {
    badgeClasses = 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100';
    Icon = XCircle;
  } else if (status === 'Review') {
    badgeClasses = 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100';
    Icon = AlertCircle;
  }

  const reasonList = Array.isArray(reasons) ? reasons : [String(reasons || '')];

  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border cursor-help transition-colors ${badgeClasses}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {status || 'Unknown'}
      </span>

      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-slate-900 text-white rounded-lg shadow-xl text-xs space-y-1.5 pointer-events-none">
          <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 flex items-center justify-between">
            <span>Qualification Decision: {status}</span>
          </div>
          {reasonList.length > 0 ? (
            <ul className="list-disc pl-4 space-y-1 text-slate-300">
              {reasonList.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400">No specific qualification reasons recorded.</p>
          )}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}
