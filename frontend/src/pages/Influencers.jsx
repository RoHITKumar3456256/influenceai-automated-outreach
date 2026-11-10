import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Mail,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  XCircle,
  SlidersHorizontal,
  Download,
  Calendar,
  Eye,
  SendHorizontal
} from 'lucide-react';
import { useCampaigns } from '../hooks/useCampaigns';
import api from '../services/api';
import QualificationBadge from '../components/QualificationBadge';
import Tooltip from '../components/Tooltip';
import Skeleton from '../components/Skeleton';
import Modal from '../components/Modal';
import { formatNumber, formatPercent, formatDate } from '../utils/formatters';

export default function Influencers() {
  const { activeCampaign, activeCampaignId, campaigns, setActiveCampaignId } = useCampaigns();
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [enriching, setEnriching] = useState(false);
  const [requalifying, setRequalifying] = useState(false);
  const [banner, setBanner] = useState(null);
  const navigate = useNavigate();

  const loadInfluencers = async () => {
    if (!activeCampaignId) return;
    try {
      setLoading(true);
      const data = await api.getCampaignInfluencers(activeCampaignId, {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
      });
      setInfluencers(data);
    } catch (err) {
      console.error('Failed to load influencers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInfluencers();
  }, [activeCampaignId, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadInfluencers();
  };

  const handleEnrich = async (infId) => {
    try {
      setEnriching(true);
      const res = await api.enrichInfluencer(infId);
      setBanner({
        type: 'success',
        text: `Enrichment refreshed. Email status: ${res.influencer.email_status}`,
      });
      loadInfluencers();
      if (selectedCreator && selectedCreator.influencer.id === infId) {
        setSelectedCreator((prev) => ({
          ...prev,
          influencer: res.influencer,
        }));
      }
    } catch (err) {
      setBanner({ type: 'error', text: 'Failed to enrich influencer.' });
    } finally {
      setEnriching(false);
    }
  };

  const handleRequalify = async () => {
    if (!activeCampaignId) return;
    try {
      setRequalifying(true);
      const res = await api.qualifyCampaign(activeCampaignId);
      setBanner({ type: 'success', text: res.message });
      loadInfluencers();
    } catch (err) {
      setBanner({ type: 'error', text: 'Requalification failed.' });
    } finally {
      setRequalifying(false);
    }
  };

  const handleOpenStudio = (ciId) => {
    navigate(`/outreach-studio?ci_id=${ciId}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campaign Influencer Roster</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review qualification decisions, inspect verified evidence, and generate personalized outreach drafts.
          </p>
        </div>

        {activeCampaign && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleRequalify}
              disabled={requalifying}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${requalifying ? 'animate-spin' : ''}`} />
              <span>Re-qualify Campaign</span>
            </button>
            <button
              onClick={() => api.downloadExportCsv(activeCampaign.id)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* Banner */}
      {banner && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
            banner.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{banner.text}</span>
          <button
            onClick={() => setBanner(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search creator name or niche..."
            className="w-full text-xs border border-slate-300 rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </form>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {['all', 'Pass', 'Review', 'Fail'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-12 w-full" count={6} />
        </div>
      ) : influencers.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">No influencers found in this campaign</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Head over to Discovery to find and import public YouTube creator channels.
          </p>
          <button
            onClick={() => navigate('/discovery')}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            Go to Discovery
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Creator / Channel</th>
                  <th className="px-4 py-3">Followers</th>
                  <th className="px-4 py-3">Avg Views</th>
                  <th className="px-4 py-3">
                    <span className="flex items-center gap-1">
                      <span>Engagement</span>
                      <Tooltip text="((likes + comments) / views) * 100 on sample videos." />
                    </span>
                  </th>
                  <th className="px-4 py-3">Qualification</th>
                  <th className="px-4 py-3">Business Email</th>
                  <th className="px-4 py-3 text-right">Outreach Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {influencers.map((item) => {
                  const inf = item.influencer;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>{inf.name}</span>
                          <button
                            onClick={() => setSelectedCreator(item)}
                            title="Inspect Profile Evidence"
                            className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <a
                          href={inf.profile_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-0.5"
                        >
                          <span>{inf.profile_url.replace('https://www.youtube.com/', '')}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-800">
                        {formatNumber(inf.followers)}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {formatNumber(inf.avg_views)}
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {formatPercent(inf.engagement_rate)}
                      </td>

                      <td className="px-4 py-3">
                        <QualificationBadge
                          status={item.qualification_status}
                          reasons={item.qualification_reasons}
                        />
                      </td>

                      <td className="px-4 py-3">
                        {inf.contact_email ? (
                          <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                            {inf.contact_email}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not Found</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenStudio(item.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            <span>{item.has_message ? 'Edit Draft' : 'Draft Outreach'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Creator Inspector Modal */}
      {selectedCreator && (
        <Modal
          isOpen={Boolean(selectedCreator)}
          onClose={() => setSelectedCreator(null)}
          title={`Creator Profile: ${selectedCreator.influencer.name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Header info */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-slate-900">{selectedCreator.influencer.name}</h4>
                <a
                  href={selectedCreator.influencer.profile_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1 mt-0.5 text-xs"
                >
                  <span>{selectedCreator.influencer.profile_url}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <QualificationBadge
                status={selectedCreator.qualification_status}
                reasons={selectedCreator.qualification_reasons}
              />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-slate-500 text-[10px] uppercase font-bold">Subscribers</div>
                <div className="text-sm font-bold text-slate-900 mt-1">
                  {formatNumber(selectedCreator.influencer.followers)}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-slate-500 text-[10px] uppercase font-bold">Average Views</div>
                <div className="text-sm font-bold text-slate-900 mt-1">
                  {formatNumber(selectedCreator.influencer.avg_views)}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-slate-500 text-[10px] uppercase font-bold">Engagement Rate</div>
                <div className="text-sm font-bold text-slate-900 mt-1">
                  {formatPercent(selectedCreator.influencer.engagement_rate)}
                </div>
              </div>
            </div>

            {/* Bio / Description */}
            <div>
              <span className="font-semibold text-slate-700 uppercase tracking-wider block mb-1 text-[11px]">
                Public Channel Bio / Description
              </span>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-700 leading-relaxed max-h-36 overflow-y-auto">
                {selectedCreator.influencer.bio || 'No public channel description available.'}
              </div>
            </div>

            {/* Contact Email Verification */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  Public Business Contact
                </span>
                <span className="font-semibold text-slate-800 text-xs">
                  {selectedCreator.influencer.contact_email || 'No email published in public bio.'}
                </span>
              </div>
              <button
                onClick={() => handleEnrich(selectedCreator.influencer.id)}
                disabled={enriching}
                className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
              >
                {enriching ? 'Enriching...' : 'Re-scan Public Bio'}
              </button>
            </div>

            {/* Qualification Evidence Breakdown */}
            <div>
              <span className="font-semibold text-slate-700 uppercase tracking-wider block mb-1 text-[11px]">
                Transparent Qualification Audit
              </span>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                {selectedCreator.qualification_reasons?.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>

            {/* Audit & Retrieval Timestamps */}
            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>Platform ID: {selectedCreator.influencer.platform_user_id}</span>
              <span>Retrieved: {formatDate(selectedCreator.influencer.retrieved_at)}</span>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                onClick={() => handleOpenStudio(selectedCreator.id)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open in Outreach Studio</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

