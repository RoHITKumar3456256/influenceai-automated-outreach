import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const api = {
  // Campaigns
  getCampaigns: async () => {
    const res = await client.get('/api/campaigns');
    return res.data;
  },
  getCampaign: async (id) => {
    const res = await client.get(`/api/campaigns/${id}`);
    return res.data;
  },
  createCampaign: async (payload) => {
    const res = await client.post('/api/campaigns', payload);
    return res.data;
  },
  discoverCreators: async (campaignId, payload) => {
    const res = await client.post(`/api/campaigns/${campaignId}/discover`, payload);
    return res.data;
  },
  qualifyCampaign: async (campaignId, payload = {}) => {
    const res = await client.post(`/api/campaigns/${campaignId}/qualify`, payload);
    return res.data;
  },
  exportCsvUrl: (campaignId) => `${API_BASE}/api/campaigns/${campaignId}/export.csv`,
  downloadExportCsv: async (campaignId) => {
    const res = await client.get(`/api/campaigns/${campaignId}/export.csv`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `campaign_${campaignId}_export.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Influencers
  getCampaignInfluencers: async (campaignId, params = {}) => {
    const res = await client.get(`/api/campaigns/${campaignId}/influencers`, { params });
    return res.data;
  },
  getInfluencer: async (id) => {
    const res = await client.get(`/api/influencers/${id}`);
    return res.data;
  },
  enrichInfluencer: async (id) => {
    const res = await client.post(`/api/influencers/${id}/enrich`);
    return res.data;
  },

  // Outreach Studio & Messages
  generateOutreach: async (ciId, payload = {}) => {
    const res = await client.post(`/api/campaign-influencers/${ciId}/generate`, payload);
    return res.data;
  },
  getOutreachMessage: async (msgId) => {
    const res = await client.get(`/api/outreach/messages/${msgId}`);
    return res.data;
  },
  updateOutreachMessage: async (msgId, payload) => {
    const res = await client.put(`/api/outreach/messages/${msgId}`, payload);
    return res.data;
  },
  simulateOutreach: async (msgId, channel = 'email') => {
    const res = await client.post(`/api/outreach/${msgId}/simulate`, null, {
      params: { channel },
    });
    return res.data;
  },
  updateOutreachStatus: async (eventId, payload) => {
    const res = await client.patch(`/api/outreach/${eventId}/status`, payload);
    return res.data;
  },
  getOutreachTracker: async (params = {}) => {
    const res = await client.get('/api/outreach/tracker', { params });
    return res.data;
  },

  // Analytics
  getDashboardAnalytics: async () => {
    const res = await client.get('/api/analytics/dashboard');
    return res.data;
  },

  // Health
  getHealth: async () => {
    const res = await client.get('/health');
    return res.data;
  },
};

export default api;
