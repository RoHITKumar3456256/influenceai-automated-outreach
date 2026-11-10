import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Users,
  CheckCircle2,
  AlertCircle,
  Download,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useCampaigns } from '../hooks/useCampaigns';
import CreateCampaignModal from '../components/CreateCampaignModal';
import Tooltip from '../components/Tooltip';
import api from '../services/api';
import { formatDate } from '../utils/formatters';

export default function Campaigns() {
  const { campaigns, activeCampaignId, setActiveCampaignId, fetchCampaigns, loading } = useCampaigns();
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  const handleSelect = (id) => {
    setActiveCampaignId(id);
    navigate('/influencers');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campaigns</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your targeted micro-influencer outreach campaigns and criteria.
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Campaign</span>
        </button>
      </div>

      {campaigns.length === 0 && !loading ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No campaigns yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Get started by creating your first outreach campaign with custom follower and engagement thresholds.
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((c) => {
            const isActive = c.id === activeCampaignId;
            return (
              <div
                key={c.id}
                className={`bg-white rounded-xl border transition-all shadow-xs flex flex-col justify-between ${
                  isActive ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {c.platform} • {c.niche}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">
                        {c.name}
                      </h3>
                    </div>
                    {isActive && (
                      <span className="shrink-0 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>

                  {c.objective && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {c.objective}
                    </p>
                  )}

                  {/* Criteria Box */}
                  <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1.5 border border-slate-100">
                    <div className="flex justify-between text-slate-600">
                      <span>Follower Range:</span>
                      <span className="font-semibold text-slate-800">
                        {c.min_followers.toLocaleString()} – {c.max_followers.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Min Engagement:</span>
                      <span className="font-semibold text-slate-800">{c.min_engagement}%</span>
                    </div>
                  </div>

                  {/* Creators breakdown stats */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg py-1.5">
                      <div className="text-sm font-bold text-emerald-700">{c.passed_count || 0}</div>
                      <div className="text-[10px] text-emerald-600">Passed</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-lg py-1.5">
                      <div className="text-sm font-bold text-amber-700">{c.review_count || 0}</div>
                      <div className="text-[10px] text-amber-600">Review</div>
                    </div>
                    <div className="bg-rose-50 border border-rose-100 rounded-lg py-1.5">
                      <div className="text-sm font-bold text-rose-700">{c.failed_count || 0}</div>
                      <div className="text-[10px] text-rose-600">Failed</div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(c.created_at)}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => api.downloadExportCsv(c.id)}
                      title="Download Campaign CSV Export"
                      className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSelect(c.id)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                    >
                      <span>Manage</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateCampaignModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(newCamp) => {
          fetchCampaigns();
          setActiveCampaignId(newCamp.id);
        }}
      />
    </div>
  );
}

