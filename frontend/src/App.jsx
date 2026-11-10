import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import Discovery from './pages/Discovery';
import Influencers from './pages/Influencers';
import OutreachStudio from './pages/OutreachStudio';
import OutreachTracker from './pages/OutreachTracker';
import Settings from './pages/Settings';
import { CampaignProvider } from './hooks/useCampaigns';

export default function App() {
  return (
    <CampaignProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="discovery" element={<Discovery />} />
            <Route path="influencers" element={<Influencers />} />
            <Route path="outreach-studio" element={<OutreachStudio />} />
            <Route path="tracker" element={<OutreachTracker />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CampaignProvider>
  );
}
