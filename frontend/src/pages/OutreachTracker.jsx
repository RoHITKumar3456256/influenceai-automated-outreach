import React, { useEffect, useState } from 'react';
import {
  ListOrdered,
  Filter,
  Download,
  ExternalLink,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Mail,
  MessageSquare
} from 'lucide-react';
import { useCampaigns } from '../hooks/useCampaigns';
import api from '../services/api';
import Skeleton from '../components/Skeleton';
import Tooltip from '../components/Tooltip';
import { formatDate } from '../utils/formatters';

const STATUS_OPTIONS = [
  'Draft',
  'Approved',
  'Simulated Sent',
  'Sent',
  'Replied',
  'No Response',
  'Interested',
  'Not Interested',
  'Bounced',
];

export default function OutreachTracker() {
  const { activeCampaign, activeCampaignId, campaigns } = useCampaigns();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const loadTracker = async () => {
    try {
      setLoading(true);
      const data = await api.getOutreachTracker({
        campaign_id: activeCampaignId || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        channel: channelFilter !== 'all' ? channelFilter : undefined,
      });
      setItems(data);
    } catch (err) {
      console.error('Failed to load outreach tracker', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTracker();
  }, [activeCampaignId, statusFilter, channelFilter]);

  const handleStatusChange = async (eventId, newStatus) => {
    if (!eventId) return;
    try {
      setUpdatingId(eventId);
      await api.updateOutreachStatus(eventId, { status: newStatus });
      loadTracker();
    } catch (err) {
      alert('Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Outreach Tracker</h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit message lifecycle, verify simulated send events, update reply statuses, and export results.
          </p>
        </div>

        {activeCampaign && (
          <button
            onClick={() => api.downloadExportCsv(activeCampaign.id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Campaign Tracker (CSV)</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-semibold uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Channel Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-semibold uppercase">Channel:</span>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="all">All Channels</option>
              <option value="email">Email</option>
              <option value="instagram_dm">Instagram DM</option>
            </select>
          </div>
        </div>

        <button
          onClick={loadTracker}
          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Refresh table"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-10 w-full" count={5} />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <ListOrdered className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">No outreach events logged yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Generate and simulate email or DM pitches in the Outreach Studio to populate the tracking log.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Creator / Campaign</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Current Status</th>
                  <th className="px-4 py-3">Delivery Mode</th>
                  <th className="px-4 py-3">Subject / Preview</th>
                  <th className="px-4 py-3">Last Activity</th>
                  <th className="px-4 py-3 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => {
                  return (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{item.creator_name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{item.campaign_name}</div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 capitalize font-medium text-slate-700">
                          {item.channel === 'email' ? (
                            <Mail className="w-3.5 h-3.5 text-blue-500" />
                          ) : (
                            <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
                          )}
                          <span>{item.channel.replace('_', ' ')}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            item.status === 'Simulated Sent'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : item.status === 'Approved'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : item.status === 'Replied' || item.status === 'Interested'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : item.status === 'Not Interested' || item.status === 'Bounced'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {item.simulated ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Simulated</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                            <span>Real Send</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 max-w-xs truncate text-slate-700" title={item.email_subject}>
                        {item.email_subject || 'No subject'}
                      </td>

                      <td className="px-4 py-3 text-slate-400 text-[11px]">
                        {formatDate(item.last_activity)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {item.event_id ? (
                          <select
                            value={item.status}
                            disabled={updatingId === item.event_id}
                            onChange={(e) => handleStatusChange(item.event_id, e.target.value)}
                            className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
                          >
                            {STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Draft</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
