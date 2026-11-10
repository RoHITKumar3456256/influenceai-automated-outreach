import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey, UniqueConstraint, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base

class Influencer(Base):
    __tablename__ = "influencers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    platform = Column(String(50), nullable=False, default="YouTube")
    platform_user_id = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    profile_url = Column(Text, nullable=False)
    followers = Column(Integer, nullable=True)
    avg_views = Column(Integer, nullable=True)
    engagement_rate = Column(Float, nullable=True)
    niche = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    contact_email = Column(String(255), nullable=True)
    email_status = Column(String(50), default="Not Found")
    source_url = Column(Text, nullable=False)
    retrieved_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("platform", "platform_user_id", name="uq_platform_user"),
    )

    campaign_influencers = relationship("CampaignInfluencer", back_populates="influencer", cascade="all, delete-orphan")


class CampaignInfluencer(Base):
    __tablename__ = "campaign_influencers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String(36), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    influencer_id = Column(String(36), ForeignKey("influencers.id", ondelete="CASCADE"), nullable=False)
    qualification_status = Column(String(20), nullable=False)  # 'Pass', 'Fail', 'Review'
    qualification_reasons = Column(JSON, default=list)
    added_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("campaign_id", "influencer_id", name="uq_campaign_influencer"),
    )

    campaign = relationship("Campaign", back_populates="campaign_influencers")
    influencer = relationship("Influencer", back_populates="campaign_influencers")
    outreach_messages = relationship("OutreachMessage", back_populates="campaign_influencer", cascade="all, delete-orphan")
