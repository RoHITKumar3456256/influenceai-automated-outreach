import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Users,
  CheckCircle2,
  MailCheck,
  Compass,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Send,
  Download,
  Activity,
  FileSpreadsheet,
  Check,
  Sparkles,
  ChevronRight,
  ListOrdered
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import StatCard from '../components/StatCard';
import Skeleton from '../components/Skeleton';
import api from '../services/api';
import { useCampaigns } from '../hooks/useCampaigns';
import { formatDate } from '../utils/formatters';

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444'];
const STATUS_BAR_COLOR = '#3b82f6';

const DEMO_STEPS = [
  { id: 1, title: 'Open Dashboard', path: '/', desc: 'Review high-level KPIs and qualification charts' },
  { id: 2, title: 'Create Campaign', path: '/campaigns', desc: 'Define niche, follower bounds, and engagement benchmark' },
  { id: 3, title: 'Discover Creators', path: '/discovery', desc: 'Query YouTube Data API with duplicate protection' },
  { id: 4, title: 'Inspect Evidence', path: '/influencers', desc: 'Audit verified channel statistics and timestamps' },
  { id: 5, title: 'Run Qualification', path: '/influencers', desc: 'Evaluate Pass/Fail/Review with explicit reasons' },
  { id: 6, title: 'Generate AI Pitch', path: '/outreach-studio', desc: 'Enforce 60-90w Email & 15-30w DM constraints' },
  { id: 7, title: 'Edit & Preview', path: '/outreach-studio', desc: 'Review live word counts and mobile/inbox mockups' },
  { id: 8, title: 'Simulate Send', path: '/outreach-studio', desc: 'Record demo-safe simulated send event' },
  { id: 9, title: 'Inspect Tracker', path: '/tracker', desc: 'Audit event history and update reply lifecycle' },
  { id: 10, title: 'Export CSV', path: '/settings', desc: 'Download comprehensive research dataset' },
];

export default function Dashboard() {
  const { campaigns, activeCampaign, activeCampaignId } = useCampaigns();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDemoTour, setShowDemoTour] = useState(true);
  const [completedSteps, setCompletedSteps] = useState([1]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await api.getDashboardAnalytics();
        setAnalytics(data);

        // Auto-detect completed steps based on live data
        const steps = [1];
        if (data.campaign_count > 0) steps.push(2);
        if (data.discovered_creators_count > 0) steps.push(3, 4, 5);
        if (data.drafts_generated > 0) steps.push(6, 7);
        if (Object.keys(data.outreach_status_distribution || {}).length > 0) steps.push(8, 9, 10);
        setCompletedSteps(Array.from(new Set(steps)));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeCampaignId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-28" count={4} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  const qualData = [
    { name: 'Passed', value: analytics?.qualification?.pass || 0 },
    { name: 'Review', value: analytics?.qualification?.review || 0 },
    { name: 'Failed', value: analytics?.qualification?.fail || 0 },
  ];

  const statusData = Object.entries(analytics?.outreach_status_distribution || {}).map(
    ([status, count]) => ({
      status,
      count,
    })
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campaign Intelligence Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time influencer qualification metrics, AI drafts, and simulated outreach status.
          </p>
        </div>

        {activeCampaign && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => api.downloadExportCsv(activeCampaign.id)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <Link
              to="/discovery"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
            >
              <Compass className="w-4 h-4" />
              <span>Discover Creators</span>
            </Link>
          </div>
        )}
      </div>

      {/* Guided 10-Step Evaluation Sequence Banner (Section 8 Checklist) */}
      {showDemoTour && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/30 flex items-center justify-center text-blue-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Evaluation & Demonstration Sequence (Section 8)</h3>
                <p className="text-[11px] text-blue-200">
                  Follow this verified 10-step sequence to test the entire automated workflow end-to-end.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDemoTour(false)}
              className="text-xs text-blue-300 hover:text-white px-2 py-1 rounded"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
            {DEMO_STEPS.map((s) => {
              const isDone = completedSteps.includes(s.id);
              return (
                <Link
                  key={s.id}
                  to={s.path}
                  className={`p-2.5 rounded-xl border text-xs transition-all ${
                    isDone
                      ? 'bg-blue-800/40 border-blue-500/50 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[10px] text-blue-300">STEP {s.id}</span>
                    {isDone ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </div>
                  <div className="font-semibold text-[11px] truncate">{s.title}</div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Campaigns"
          value={analytics?.campaign_count || 0}
          subtitle="Saved outreach projects"
          icon={FolderKanban}
          color="blue"
          tooltip="Total distinct outreach campaigns configured in InfluenceAI."
        />
        <StatCard
          title="Discovered Creators"
          value={analytics?.discovered_creators_count || 0}
          subtitle="Public profiles indexed"
          icon={Users}
          color="purple"
          tooltip="Total public creators indexed with stable platform IDs and channel URLs."
        />
        <StatCard
          title="Qualified (Passed)"
          value={analytics?.qualification?.pass || 0}
          subtitle={`${analytics?.qualification?.review || 0} require review`}
          icon={CheckCircle2}
          color="emerald"
          tooltip="Creators meeting both follower criteria and minimum engagement benchmark."
        />
        <StatCard
          title="AI Outreach Drafts"
          value={analytics?.drafts_generated || 0}
          subtitle="Email (60-90w) & DM (15-30w)"
          icon={MailCheck}
          color="amber"
          tooltip="Strictly validated personalized outreach drafts referencing only verified facts."
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Qualification Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Qualification Results</h2>
              <p className="text-xs text-slate-500">Deterministic criteria validation across all campaigns</p>
            </div>
            <div className="text-xs font-medium text-slate-500">
              Total: {analytics?.qualification?.total_campaign_influencers || 0}
            </div>
          </div>

          {analytics?.qualification?.total_campaign_influencers === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center p-4">
              <ShieldAlert className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm text-slate-600 font-medium">No qualification data yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Run discovery on your campaign to import and evaluate creator profiles.
              </p>
              <Link
                to="/discovery"
                className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                <span>Go to Discovery</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={qualData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {qualData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 pr-6">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-600">Pass:</span>
                  <span className="font-bold text-slate-900">{analytics?.qualification?.pass}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-slate-600">Review:</span>
                  <span className="font-bold text-slate-900">{analytics?.qualification?.review}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-slate-600">Fail:</span>
                  <span className="font-bold text-slate-900">{analytics?.qualification?.fail}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Outreach Funnel / Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Outreach Execution Tracker</h2>
              <p className="text-xs text-slate-500">Drafted vs Simulated Sent events</p>
            </div>
            <Link
              to="/tracker"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View Full Tracker</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {statusData.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center p-4">
              <Send className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm text-slate-600 font-medium">No outreach activity logged yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Generate outreach messages and simulate sending them in the Outreach Studio.
              </p>
              <Link
                to="/outreach-studio"
                className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                <span>Open Outreach Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill={STATUS_BAR_COLOR} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Recent Activity Feed</span>
            </h2>
          </div>

          {analytics?.recent_activity?.length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center">
              No recent simulated sends or draft status changes yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {analytics?.recent_activity?.map((act) => (
                <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-800">{act.creator_name}</span>
                      <span className="text-slate-500 ml-1.5">
                        ({act.campaign_name}) — Status: <strong className="text-slate-700">{act.status}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="text-slate-400 shrink-0">{formatDate(act.timestamp)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System & API Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-3">System & Services</h2>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">YouTube Data API</span>
                <span className="font-medium text-slate-800">{analytics?.api_health?.youtube_api}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Gemini LLM</span>
                <span className="font-medium text-slate-800">{analytics?.api_health?.gemini_api}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Database Engine</span>
                <span className="font-medium text-slate-800">{analytics?.api_health?.database}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Outreach Execution</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {analytics?.api_health?.outreach_mode || 'simulation'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 leading-tight">
            InfluenceAI strictly avoids scraping behind login, respects API quotas, and guarantees demo-safe simulation.
          </div>
        </div>
      </div>
    </div>
  );
}
