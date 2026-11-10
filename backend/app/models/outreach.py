import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base

class OutreachMessage(Base):
    __tablename__ = "outreach_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_influencer_id = Column(String(36), ForeignKey("campaign_influencers.id", ondelete="CASCADE"), nullable=False)
    email_subject = Column(String(255), nullable=False)
    email_body = Column(Text, nullable=False)
    dm_body = Column(Text, nullable=False)
    generation_model = Column(String(100), default="gemini-1.5-flash")
    personalization_facts = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    campaign_influencer = relationship("CampaignInfluencer", back_populates="outreach_messages")
    events = relationship("OutreachEvent", back_populates="message", cascade="all, delete-orphan")


class OutreachEvent(Base):
    __tablename__ = "outreach_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    outreach_message_id = Column(String(36), ForeignKey("outreach_messages.id", ondelete="CASCADE"), nullable=False)
    channel = Column(String(50), nullable=False, default="email")  # 'email', 'instagram_dm'
    status = Column(String(50), nullable=False, default="Draft")  # 'Draft', 'Approved', 'Simulated Sent', 'Sent', etc.
    event_time = Column(DateTime, default=datetime.utcnow)
    error_message = Column(Text, nullable=True)
    simulated = Column(Boolean, default=True, nullable=False)

    message = relationship("OutreachMessage", back_populates="events")

