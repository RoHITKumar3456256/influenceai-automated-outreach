import React, { useState } from 'react';
import {
  Compass,
  Search,
  ExternalLink,
  Plus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Info,
  Check
} from 'lucide-react';
import { useCampaigns } from '../hooks/useCampaigns';
import api from '../services/api';
import Tooltip from '../components/Tooltip';
import Skeleton from '../components/Skeleton';
import { formatNumber, formatPercent, formatDate } from '../utils/formatters';

export default function Discovery() {
  const { activeCampaign, activeCampaignId, campaigns, fetchCampaigns } = useCampaigns();
  const [searchQuery, setSearchQuery] = useState('');
  const [maxResults, setMaxResults] = useState(15);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const handleDiscover = async (e) => {
    if (e) e.preventDefault();
    if (!activeCampaignId) {
      alert('Please select or create an active campaign first.');
      return;
    }

    try {
      setLoading(true);
      setFeedback(null);
      const res = await api.discoverCreators(activeCampaignId, {
        query: searchQuery.trim() || (activeCampaign ? activeCampaign.niche : 'fitness'),
        max_results: Number(maxResults),
      });
      setResults(res);
      setFeedback({
        type: 'success',
        text: res.message || `Discovered and processed creators successfully.`,
      });
      fetchCampaigns();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err?.response?.data?.detail || 'Discovery request failed. Check API configuration.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Public Creator Discovery</h1>
        <p className="text-xs text-slate-500 mt-1">
          Search real, verifiable channel profiles via YouTube Data API v3 with automatic metric extraction and duplicate prevention.
        </p>
      </div>

      {/* Campaign context banner */}
      {activeCampaign ? (
        <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div>
            <span className="font-semibold text-blue-900">Targeting Campaign:</span>{' '}
            <strong className="text-blue-800">{activeCampaign.name}</strong> ({activeCampaign.niche})
            <span className="text-blue-600 block sm:inline sm:ml-2">
              • Threshold: {activeCampaign.min_followers.toLocaleString()} – {activeCampaign.max_followers.toLocaleString()} subs, min {activeCampaign.min_engagement}% engagement.
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-xs">
          Please select or create a campaign in the top navigation bar to import discovered creators.
        </div>
      )}

      {/* Search Bar Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <form onSubmit={handleDiscover} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Search Query / Channel Keyword
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={activeCampaign ? `e.g. ${activeCampaign.niche} tutorials, review` : 'e.g. Calisthenics, React web dev, skincare'}
                  className="w-full text-sm border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Sample Size (Max Results)
              </label>
              <select
                value={maxResults}
                onChange={(e) => setMaxResults(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value={10}>10 Creators</option>
                <option value={15}>15 Creators</option>
                <option value={25}>25 Creators</option>
                <option value={50}>50 Creators</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading || !activeCampaignId}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs py-2.5 px-4 rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Indexing API...</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-4 h-4" />
                    <span>Discover & Qualify</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              <span>Only public metadata indexed. Zero private data scraping.</span>
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>Duplicate detection enforced: skips creators already in this campaign.</span>
            </span>
          </div>
        </form>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="font-semibold">{feedback.text}</div>
            {results?.source && (
              <div className="mt-1 text-[11px] text-slate-600">
                Source: <strong className="uppercase">{results.source.replace(/_/g, ' ')}</strong>
                {results.api_error && ` — Note: ${results.api_error}`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Discovered Creators Preview Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-10 w-full" count={5} />
        </div>
      ) : results?.creators?.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Discovered Creators ({results.creators.length} items)
            </h3>
            <span className="text-xs text-slate-500">
              Imported: {results.imported_count} new, {results.duplicate_count} skipped
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Creator / Channel</th>
                  <th className="px-4 py-3">Subscribers</th>
                  <th className="px-4 py-3">Avg Views</th>
                  <th className="px-4 py-3">
                    <span className="flex items-center gap-1">
                      <span>Engagement Rate</span>
                      <Tooltip text="Calculated as ((likes + comments) / views) * 100 on recent eligible sample videos." />
                    </span>
                  </th>
                  <th className="px-4 py-3">Business Email</th>
                  <th className="px-4 py-3">Source & Retrieval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.creators.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <a
                        href={c.profile_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-0.5"
                      >
                        <span>{c.profile_url.replace('https://www.youtube.com/', '')}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {formatNumber(c.followers)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatNumber(c.avg_views)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {formatPercent(c.engagement_rate)}
                    </td>
                    <td className="px-4 py-3">
                      {c.contact_email ? (
                        <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                          {c.contact_email}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not Found</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Just now</span>
                      </div>
                      <a
                        href={c.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-500 hover:text-blue-600 underline"
                      >
                        Canonical Source
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Compass className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">Ready to discover creators</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Choose your max results count and click "Discover & Qualify" to index real creator channels.
          </p>
        </div>
      )}
    </div>
  );
}

