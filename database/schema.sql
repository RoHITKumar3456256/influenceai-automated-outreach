-- InfluenceAI PostgreSQL Database Schema
-- Compatible with Supabase PostgreSQL and standard PostgreSQL 14+

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    niche VARCHAR(100) NOT NULL,
    platform VARCHAR(50) NOT NULL DEFAULT 'YouTube',
    min_followers INTEGER NOT NULL DEFAULT 5000,
    max_followers INTEGER NOT NULL DEFAULT 100000,
    min_engagement NUMERIC(5, 2) NOT NULL DEFAULT 2.0,
    objective TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: influencers
CREATE TABLE IF NOT EXISTS influencers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(50) NOT NULL DEFAULT 'YouTube',
    platform_user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    profile_url TEXT NOT NULL,
    followers INTEGER,
    avg_views INTEGER,
    engagement_rate NUMERIC(5, 2),
    niche VARCHAR(100),
    bio TEXT,
    contact_email VARCHAR(255),
    email_status VARCHAR(50) DEFAULT 'Not Found',
    source_url TEXT NOT NULL,
    retrieved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_platform_user UNIQUE (platform, platform_user_id)
);

-- Table: campaign_influencers
CREATE TABLE IF NOT EXISTS campaign_influencers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
    qualification_status VARCHAR(20) NOT NULL CHECK (qualification_status IN ('Pass', 'Fail', 'Review')),
    qualification_reasons JSONB DEFAULT '[]'::jsonb,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_campaign_influencer UNIQUE (campaign_id, influencer_id)
);

-- Table: outreach_messages
CREATE TABLE IF NOT EXISTS outreach_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_influencer_id UUID NOT NULL REFERENCES campaign_influencers(id) ON DELETE CASCADE,
    email_subject VARCHAR(255) NOT NULL,
    email_body TEXT NOT NULL,
    dm_body TEXT NOT NULL,
    generation_model VARCHAR(100) NOT NULL DEFAULT 'gemini-1.5-flash',
    personalization_facts JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: outreach_events
CREATE TABLE IF NOT EXISTS outreach_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    outreach_message_id UUID NOT NULL REFERENCES outreach_messages(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL DEFAULT 'email',
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    event_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    simulated BOOLEAN NOT NULL DEFAULT TRUE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_created ON campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_influencers_platform_user ON influencers(platform, platform_user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_influencers_status ON campaign_influencers(qualification_status);
CREATE INDEX IF NOT EXISTS idx_campaign_influencers_campaign ON campaign_influencers(campaign_id);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_ci ON outreach_messages(campaign_influencer_id);
CREATE INDEX IF NOT EXISTS idx_outreach_events_message ON outreach_events(outreach_message_id);
CREATE INDEX IF NOT EXISTS idx_outreach_events_status ON outreach_events(status);

