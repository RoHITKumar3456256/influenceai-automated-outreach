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
  UserCheck,
  Copy,
  Check,
  Eye,
  Edit3,
  Smartphone
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
  const [previewMode, setPreviewMode] = useState(false);

  // Form edit states
  const [subject, setSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [dmBody, setDmBody] = useState('');
  const [brandProduct, setBrandProduct] = useState('');

  // Copy feedback states
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedDm, setCopiedDm] = useState(false);

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
      const updatedDraft = await api.getOutreachMessage(draft.id);
      setDraft(updatedDraft);
    } catch (err) {
      setNotification({ type: 'error', text: 'Failed to record simulated send.' });
    } finally {
      setSimulating(false);
    }
  };

  // Copy helpers
  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'subject') {
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    } else if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else if (type === 'dm') {
      setCopiedDm(true);
      setTimeout(() => setCopiedDm(false), 2000);
    }
  };

  // Live word counts
  const emailWords = countWords(emailBody);
  const dmWords = countWords(dmBody);

  const emailWordValid = emailWords >= 60 && emailWords <= 90;
  const dmWordValid = dmWords >= 15 && dmWords <= 30;

  return (
    <div className="space-y-6">
      {/* Title & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Outreach Studio</h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate, validate, and safely simulate personalized outreach messages with strict word counts and zero hallucinations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setPreviewMode(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                !previewMode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editor Mode</span>
            </button>
            <button
              onClick={() => setPreviewMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                previewMode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>Realistic Preview</span>
            </button>
          </div>

          {/* Creator Selector Dropdown */}
          <div className="flex items-center gap-1.5">
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

      {/* Editor OR Realistic Preview View */}
      {!previewMode ? (
        /* Standard Edit Mode */
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

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(emailBody, 'email')}
                    disabled={!emailBody}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedEmail ? 'Copied Body!' : 'Copy Email'}</span>
                  </button>

                  {/* Email Word Count Pill */}
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Subject Line
                  </label>
                  <button
                    onClick={() => handleCopy(subject, 'subject')}
                    disabled={!subject}
                    className="text-[10px] text-slate-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    {copiedSubject ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSubject ? 'Copied!' : 'Copy Subject'}</span>
                  </button>
                </div>
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

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(dmBody, 'dm')}
                    disabled={!dmBody}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-purple-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    {copiedDm ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDm ? 'Copied DM!' : 'Copy DM'}</span>
                  </button>

                  {/* DM Word Count Pill */}
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
      ) : (
        /* Realistic Preview Mode */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gmail / Desktop Mail Card Mockup */}
          <div className="bg-white rounded-2xl border border-slate-300 shadow-lg overflow-hidden flex flex-col justify-between">
            <div>
              {/* Mail Header */}
              <div className="bg-slate-100 px-5 py-3 border-b border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="font-bold text-slate-700 ml-2">Inbox Preview — Partnerships Mailer</span>
                </div>
                <span className="text-[11px] text-slate-400">Just now</span>
              </div>

              {/* Mail Meta */}
              <div className="p-6 space-y-2 border-b border-slate-100 text-xs">
                <div className="flex gap-2">
                  <span className="text-slate-400 font-semibold w-16">Subject:</span>
                  <span className="text-slate-900 font-bold">{subject || 'No Subject Line'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-400 font-semibold w-16">From:</span>
                  <span className="text-slate-700">partnerships@influenceai.com &lt;InfluenceAI Collaborations&gt;</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-400 font-semibold w-16">To:</span>
                  <span className="text-slate-700 font-medium">
                    {activeCi?.influencer?.contact_email ? `${activeCi.influencer.contact_email}` : `${activeCi?.influencer?.name} (Direct Business)`}
                  </span>
                </div>
              </div>

              {/* Mail Content */}
              <div className="p-6 text-xs text-slate-800 leading-relaxed whitespace-pre-line font-sans">
                {emailBody || 'Draft an email message to see the formatted inbox preview.'}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500 font-medium">Word count: {emailWords} words</span>
              <button
                onClick={() => handleCopy(emailBody, 'email')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEmail ? 'Copied!' : 'Copy to Clipboard'}</span>
              </button>
            </div>
          </div>

          {/* Instagram Mobile Phone Frame Mockup */}
          <div className="flex justify-center">
            <div className="w-[320px] bg-slate-900 rounded-[36px] p-3 shadow-2xl border-4 border-slate-800">
              {/* Screen Notch */}
              <div className="w-28 h-4 bg-slate-900 mx-auto rounded-b-xl mb-1 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-slate-800 mr-2" />
                <div className="w-8 h-1 bg-slate-800 rounded" />
              </div>

              {/* Screen Content */}
              <div className="bg-white rounded-[26px] h-[520px] overflow-hidden flex flex-col justify-between">
                {/* IG Header */}
                <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 p-[2px]">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-bold text-xs text-slate-800">
                      {activeCi?.influencer?.name.slice(0, 1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-tight">{activeCi?.influencer?.name}</div>
                    <div className="text-[10px] text-emerald-600 font-medium">Active now</div>
                  </div>
                </div>

                {/* IG Chat Body */}
                <div className="p-4 flex-1 flex flex-col justify-end space-y-2 bg-slate-50">
                  <div className="max-w-[85%] ml-auto bg-blue-600 text-white text-xs p-3 rounded-2xl rounded-br-xs shadow-xs leading-relaxed">
                    {dmBody || 'Draft an Instagram DM to view the live mobile preview.'}
                    <div className="text-[9px] text-blue-200 text-right mt-1">Sent • Just now</div>
                  </div>
                </div>

                {/* IG Bottom input bar */}
                <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="italic text-[11px]">{dmWords} words (Limit: 15–30)</span>
                  <button
                    onClick={() => handleCopy(dmBody, 'dm')}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-purple-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Copy DM"
                  >
                    {copiedDm ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
