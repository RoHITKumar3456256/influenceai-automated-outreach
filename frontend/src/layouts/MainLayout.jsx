import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import CreateCampaignModal from '../components/CreateCampaignModal';
import { useCampaigns } from '../hooks/useCampaigns';

export default function MainLayout() {
  const { campaigns, activeCampaignId, setActiveCampaignId, fetchCampaigns, backendHealthy } = useCampaigns();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const handleCampaignCreated = (newCamp) => {
    fetchCampaigns();
    setActiveCampaignId(newCamp.id);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          campaigns={campaigns}
          activeCampaignId={activeCampaignId}
          onSelectCampaign={setActiveCampaignId}
          onOpenCreateCampaign={() => setCreateModalOpen(true)}
          backendHealthy={backendHealthy}
        />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Reusable Create Campaign Modal */}
      <CreateCampaignModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleCampaignCreated}
      />
    </div>
  );
}
