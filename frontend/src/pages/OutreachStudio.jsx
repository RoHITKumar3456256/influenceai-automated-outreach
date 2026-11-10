import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  MailCheck,
  Sparkles,
  Send,
  Save,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  ExternalLink,
  MessageSquare,
  Mail,
  UserCheck
} from 'lucide-react';
import { useCampaigns } from '../hooks/useCampaigns';
import api from '../services/api';
import Tooltip from '../components/Tooltip';
import Skeleton from '../components/Skeleton';
import { countWords, formatNumber, formatPercent } from '../utils/formatters';

export default function OutreachStudio() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeCampaign, activeCampaignId } = useCampaigns();

  const [influencers, setInfluencers] = useState([]);
  const [selectedCiId, setSelectedCiId] = useState('');
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  // Form edit states
  const [subject, setSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [dmBody, setDmBody] = useState('');
  const [brandProduct, setBrandProduct] = useState('');

  // 1. Fetch influencers in campaign
  useEffect(() => {
    async function loadCampaignInfluencers() {
      if (!activeCampaignId) return;
      try {
        setLoading(true);
        const data = await api.getCampaignInfluencers(activeCampaignId);
        setInfluencers(data);

        // Pre-select via query param or default to first creator
        const paramCiId = searchParams.get('ci_id');
        if (paramCiId && data.some((item) => item.id === paramCiId)) {
          setSelectedCiId(paramCiId);
        } else if (data.length > 0) {
          setSelectedCiId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load campaign influencers', err);
      } finally {
        setLoading(false);
      }
    }
    loadCampaignInfluencers();
  }, [activeCampaignId, searchParams]);

  // 2. Fetch or load existing draft whenever selected creator changes
  useEffect(() => {
    async function loadDraftForCreator() {
      if (!selectedCiId) return;
      const ci = influencers.find((i) => i.id === selectedCiId);
      if (!ci) return;

      if (ci.message_id) {
        try {
          setLoading(true);
          const msg = await api.getOutreachMessage(ci.message_id);
          setDraft(msg);
          setSubject(msg.email_subject);
          setEmailBody(msg.email_body);
          setDmBody(msg.dm_body);
        } catch (err) {
          console.error('Failed to fetch message draft', err);
        } finally {
          setLoading(false);
        }
      } else {
        // No draft yet -> clear form
        setDraft(null);
        setSubject('');
        setEmailBody('');
        setDmBody('');
      }
    }
    loadDraftForCreator();
  }, [selectedCiId, influencers]);

  const activeCi = influencers.find((i) => i.id === selectedCiId);

  // Generate / Regenerate AI Draft
  const handleGenerate = async () => {
    if (!selectedCiId) return;
    try {
      setGenerating(true);
      setNotification(null);
      const res = await api.generateOutreach(selectedCiId, {
        brand_name: 'InfluenceAI',
        brand_product: brandProduct || (activeCampaign ? activeCampaign.objective : 'creator sponsorship partnership'),
      });
      setDraft(res);
      setSubject(res.email_subject);
      setEmailBody(res.email_body);
      setDmBody(res.dm_body);

      // Update message_id in local state
      setInfluencers((prev) =>
        prev.map((item) =>
          item.id === selectedCiId ? { ...item, has_message: true, message_id: res.id } : item
        )
      );

      setNotification({
        type: 'success',
        text: `AI outreach generated successfully using model: ${res.generation_model}`,
      });
    } catch (err) {
      setNotification({
        type: 'error',
        text: err?.response?.data?.detail || 'Failed to generate outreach message.',
      });
    } finally {
      setGenerating(false);
    }
  };

  // Save manual edits
  const handleSaveEdits = async () => {
    if (!draft?.id) return;
    try {
      setSaving(true);
      const updated = await api.updateOutreachMessage(draft.id, {
        email_subject: subject,
        email_body: emailBody,
        dm_body: dmBody,
      });
      setDraft(updated);
      setNotification({ type: 'success', text: 'Draft revisions saved successfully.' });
    } catch (err) {
      setNotification({ type: 'error', text: 'Failed to save changes.' });
    } finally {
      setSaving(false);
    }
  };

  // Simulate Send (Safe Demo Mode)
  const handleSimulateSend = async (channel = 'email') => {
    if (!draft?.id) return;
    try {
      setSimulating(true);
      setNotification(null);
      const res = await api.simulateOutreach(draft.id, channel);
      setNotification({
        type: 'success',
        text: `Simulated outreach logged. Status: "${res.status}" for channel [${channel.toUpperCase()}]. No real transmission occurred.`,
      });
      // Refresh draft state to show updated event
      const updatedDraft = await api.getOutreachMessage(draft.id);
      setDraft(updatedDraft);
    } catch (err) {
      setNotification({ type: 'error', text: 'Failed to record simulated send.' });
    } finally {
      setSimulating(false);
    }
  };

  // Live word counts
  const emailWords = countWords(emailBody);
  const dmWords = countWords(dmBody);

  const emailWordValid = emailWords >= 60 && emailWords <= 90;
  const dmWordValid = dmWords >= 15 && dmWords <= 30;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Outreach Studio</h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate, validate, and safely simulate personalized outreach messages with strict word counts and zero hallucinations.
          </p>
        </div>

        {/* Creator Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Creator:</span>
          <select
            value={selectedCiId}
            onChange={(e) => setSelectedCiId(e.target.value)}
            className="text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            {influencers.map((ci) => (
              <option key={ci.id} value={ci.id}>
                {ci.influencer.name} ({ci.qualification_status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notification banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{notification.text}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Active Creator Summary Bar */}
      {activeCi && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
              {activeCi.influencer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">{activeCi.influencer.name}</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    activeCi.qualification_status === 'Pass'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : activeCi.qualification_status === 'Review'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {activeCi.qualification_status}
                </span>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                <span>Subscribers: <strong className="text-slate-700">{formatNumber(activeCi.influencer.followers)}</strong></span>
                <span>•</span>
                <span>Engagement: <strong className="text-slate-700">{formatPercent(activeCi.influencer.engagement_rate)}</strong></span>
                <span>•</span>
                <span>Email: <strong className="text-slate-700">{activeCi.influencer.contact_email || 'Not Found'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              <span>{draft ? 'Regenerate Draft' : 'Generate AI Pitch'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Editor & Personalization Facts Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Email Draft Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Personalized Email Draft</h3>
              </div>

              {/* Email Word Count Pill */}
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    emailWordValid
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {emailWords} / 60–90 words
                </span>
                <Tooltip text="The EDXSO SRD mandates email length between 60 and 90 words to maximize reply rates without fluff." />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject line will appear here..."
                className="w-full text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Email Body
              </label>
              <textarea
                rows="7"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Click 'Generate AI Pitch' or type your outreach draft here..."
                className="w-full text-xs leading-relaxed border border-slate-300 rounded-lg p-3 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={handleSaveEdits}
                disabled={saving || !draft}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Revisions</span>
              </button>

              <button
                onClick={() => handleSimulateSend('email')}
                disabled={simulating || !draft}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simulate Send Email</span>
              </button>
            </div>
          </div>

          {/* Instagram DM Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">Instagram / Short DM</h3>
              </div>

              {/* DM Word Count Pill */}
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    dmWordValid
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {dmWords} / 15–30 words
                </span>
                <Tooltip text="The EDXSO SRD mandates DM length between 15 and 30 words for high readability on mobile." />
              </div>
            </div>

            <div>
              <textarea
                rows="3"
                value={dmBody}
                onChange={(e) => setDmBody(e.target.value)}
                placeholder="Concise DM message..."
                className="w-full text-xs leading-relaxed border border-slate-300 rounded-lg p-3 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => handleSimulateSend('instagram_dm')}
                disabled={simulating || !draft}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simulate Send DM</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Context & Verified Facts (1 column) */}
        <div className="space-y-6">
          {/* Ground Truth Verified Facts */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Ground Truth Facts</span>
            </div>
            <p className="text-xs text-slate-500">
              Personalization is strictly limited to verified facts from the channel record. Hallucinations are actively blocked.
            </p>

            <div className="space-y-2 pt-1">
              {draft?.personalization_facts?.length > 0 ? (
                draft.personalization_facts.map((fact, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{fact}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic py-2">
                  No facts generated yet. Click "Generate AI Pitch" to create structured outreach.
                </div>
              )}
            </div>

            {draft?.generation_model && (
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                <span>Model Engine:</span>
                <span className="font-semibold text-slate-700">{draft.generation_model}</span>
              </div>
            )}
          </div>

          {/* Simulation Guarantee Disclaimer */}
          <div className="bg-slate-900 text-slate-300 rounded-xl p-5 text-xs space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Safe Simulation Mode</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Clicking "Simulate Send" logs an event with <code>simulated=true</code> and updates status to <strong>Simulated Sent</strong> in the Outreach Tracker. No real emails or messages will be sent unless authorized provider credentials are explicitly enabled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
