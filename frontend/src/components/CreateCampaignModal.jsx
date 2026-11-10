import React, { useState } from 'react';
import Modal from './Modal';
import api from '../services/api';

export default function CreateCampaignModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    name: 'Fitness & Wellness Creator Q4',
    niche: 'Fitness & Wellness',
    platform: 'YouTube',
    min_followers: 5000,
    max_followers: 100000,
    min_engagement: 2.0,
    objective: 'Promote smart performance tracking app with 60-second dedicated integration.',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Campaign name is required.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      const created = await api.createCampaign(formData);
      if (onCreated) onCreated(created);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to create campaign.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Outreach Campaign" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Campaign Name
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Fitness Creator Outreach 2026"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Target Niche / Category
            </label>
            <input
              type="text"
              name="niche"
              required
              value={formData.niche}
              onChange={handleChange}
              placeholder="e.g. Fitness & Wellness"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Platform
            </label>
            <select
              name="platform"
              value={formData.platform}
              onChange={handleChange}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="YouTube">YouTube Data API</option>
              <option value="Instagram">Instagram (Official API)</option>
              <option value="TikTok">TikTok (Permitted Public)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Min Followers / Subs
            </label>
            <input
              type="number"
              name="min_followers"
              min="0"
              value={formData.min_followers}
              onChange={handleChange}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Max Followers / Subs
            </label>
            <input
              type="number"
              name="max_followers"
              min="0"
              value={formData.max_followers}
              onChange={handleChange}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Min Engagement Benchmark (%)
            </label>
            <input
              type="number"
              name="min_engagement"
              step="0.1"
              min="0"
              max="100"
              value={formData.min_engagement}
              onChange={handleChange}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Formula: ((likes + comments) / views) * 100 on recent eligible videos.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Target Follower Tier
            </label>
            <div className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-600">
              <span className="font-semibold text-slate-800">Micro-Influencer Tier:</span> 5k to 100k subscribers for high authenticity and reply rates.
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Campaign Objective & Collaboration Proposal
          </label>
          <textarea
            name="objective"
            rows="3"
            value={formData.objective}
            onChange={handleChange}
            placeholder="Describe your product value proposition, deliverables, and sponsorship structure..."
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            {saving ? 'Creating Campaign...' : 'Create Campaign'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

