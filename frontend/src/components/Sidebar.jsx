import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Compass,
  Users,
  MailCheck,
  ListOrdered,
  Settings2,
  Sparkles,
  ShieldCheck,
  SendHorizontal
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Campaigns', path: '/campaigns', icon: FolderKanban },
  { name: 'Discovery', path: '/discovery', icon: Compass },
  { name: 'Influencers', path: '/influencers', icon: Users },
  { name: 'Outreach Studio', path: '/outreach-studio', icon: MailCheck },
  { name: 'Outreach Tracker', path: '/tracker', icon: ListOrdered },
  { name: 'Settings & Export', path: '/settings', icon: Settings2 },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between shrink-0 min-h-screen">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80 bg-slate-950/40">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white text-base tracking-tight leading-tight">
              Influence<span className="text-blue-400">AI</span>
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
              Outreach System
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 mt-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer / Demo Mode Badge */}
      <div className="p-4 m-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Demo Mode Active</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Outreach is safely simulated. No external emails or DMs are triggered without approval.
        </p>
      </div>
    </aside>
  );
}
