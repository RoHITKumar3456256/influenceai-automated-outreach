import React, { useState } from 'react';
import { HelpCircle, Info } from 'lucide-react';

export default function Tooltip({ text, children, icon = true, position = 'top' }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <div
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="cursor-pointer inline-flex items-center"
      >
        {children ? children : (
          <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors ml-1" />
        )}
      </div>

      {visible && (
        <div
          className={`absolute z-50 w-64 p-2.5 text-xs font-normal text-white bg-slate-900 rounded-lg shadow-xl pointer-events-none transition-all duration-150 ${
            position === 'top'
              ? 'bottom-full mb-2 left-1/2 -translate-x-1/2'
              : position === 'bottom'
              ? 'top-full mt-2 left-1/2 -translate-x-1/2'
              : 'left-full ml-2 top-1/2 -translate-y-1/2'
          }`}
        >
          {text}
          <div
            className={`absolute border-4 border-transparent ${
              position === 'top'
                ? 'top-full left-1/2 -translate-x-1/2 border-t-slate-900'
                : 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900'
            }`}
          />
        </div>
      )}
    </div>
  );
}

