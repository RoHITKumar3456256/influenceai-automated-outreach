import React, { useEffect, useState } from 'react';
import {
  Settings2,
  Key,
  Database,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Server,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { useCampaigns } from '../hooks/useCampaigns';
import api from '../services/api';

export default function Settings() {
  const { campaigns, activeCampaign, activeCampaignId } = useCampaigns();
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHealth() {
      try {
        setLoading(true);
        const data = await api.getDashboardAnalytics();
        setHealthData(data.api_health);
      } catch (err) {
        console.error('Failed to load health info', err);
      } finally {
        setLoading(false);
      }
    }
    loadHealth();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Configuration & Exports</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review service connectivity, demo-mode safety boundaries, and export full campaign research records.
        </p>
      </div>

      {/* CSV Export Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <FileSpreadsheet className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">Research & Outreach Data Export</h2>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Download standard RFC 4180 CSV files containing verified influencer profiles, subscriber counts, average video views, computed engagement rates, transparent qualification reasons, public business emails, and simulated send tracking timestamps.
        </p>

        {activeCampaign ? (
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => api.downloadExportCsv(activeCampaign.id)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Active Campaign ({activeCampaign.name})</span>
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">
            Please select an active campaign to export.
          </div>
        )}
      </div>

      {/* API Connection Health */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <Server className="w-5 h-5 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900">API Connection Health</h2>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div>
              <div className="font-semibold text-slate-800">YouTube Data API v3</div>
              <div className="text-[11px] text-slate-500">Channel statistics & video metric lookup</div>
            </div>
            <span className="font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
              {healthData?.youtube_api || 'Checking...'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div>
              <div className="font-semibold text-slate-800">Gemini LLM (Personalization)</div>
              <div className="text-[11px] text-slate-500">Subject, 60-90w Email, 15-30w DM</div>
            </div>
            <span className="font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-md">
              {healthData?.gemini_api || 'Checking...'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div>
              <div className="font-semibold text-slate-800">Database Engine</div>
              <div className="text-[11px] text-slate-500">Campaigns, Influencers, Messages, Events</div>
            </div>
            <span className="font-semibold text-slate-700 bg-slate-200 px-2.5 py-1 rounded-md">
              {healthData?.database || 'SQLite / PostgreSQL'}
            </span>
          </div>
        </div>
      </div>

      {/* Security & Demo Safety Notes */}
      <div className="bg-slate-900 text-slate-300 rounded-xl p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Security & Ethics Compliance (EDXSO Standards)</span>
        </div>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400 leading-relaxed">
          <li>
            <strong className="text-slate-200">No Secret Leaks:</strong> API keys (YouTube, Gemini, Supabase) are strictly held in backend environment variables and are never transmitted to the browser bundle.
          </li>
          <li>
            <strong className="text-slate-200">Simulation Honesty:</strong> Outreach mode is explicitly flagged as <code>simulation</code>. No automated real emails or DMs are triggered without explicit verified provider credentials.
          </li>
          <li>
            <strong className="text-slate-200">Anti-Scraping / Terms Compliance:</strong> The system only reads publicly permitted channel metadata from YouTube Data API v3 and does not bypass logins or access controls.
          </li>
          <li>
            <strong className="text-slate-200">Zero Hallucinations:</strong> The LLM personalization engine only passes ground-truth facts extracted from the creator record and enforces strict word count validation in Python.
          </li>
        </ul>
      </div>
    </div>
  );
}

