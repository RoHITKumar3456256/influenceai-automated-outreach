import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey, UniqueConstraint, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    niche = Column(String(100), nullable=False)
    platform = Column(String(50), nullable=False, default="YouTube")
    min_followers = Column(Integer, nullable=False, default=5000)
    max_followers = Column(Integer, nullable=False, default=100000)
    min_engagement = Column(Float, nullable=False, default=2.0)
    objective = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    campaign_influencers = relationship("CampaignInfluencer", back_populates="campaign", cascade="all, delete-orphan")

