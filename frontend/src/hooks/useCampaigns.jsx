import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const CampaignContext = createContext(null);

export function CampaignProvider({ children }) {
  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaignId, setActiveCampaignId] = useState('');
  const [loading, setLoading] = useState(true);
  const [backendHealthy, setBackendHealthy] = useState(true);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await api.getCampaigns();
      setCampaigns(data);
      if (data.length > 0) {
        // If current active is not set or not in list, pick the first
        if (!activeCampaignId || !data.some((c) => c.id === activeCampaignId)) {
          setActiveCampaignId(data[0].id);
        }
      }
      setBackendHealthy(true);
    } catch (err) {
      console.error('Failed to fetch campaigns', err);
      setBackendHealthy(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const activeCampaign = campaigns.find((c) => c.id === activeCampaignId) || null;

  return (
    <CampaignContext.Provider
      value={{
        campaigns,
        activeCampaignId,
        setActiveCampaignId,
        activeCampaign,
        fetchCampaigns,
        loading,
        backendHealthy,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaigns() {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaigns must be used within a CampaignProvider');
  }
  return context;
}
