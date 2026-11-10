from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Any
from datetime import datetime

class InfluencerBase(BaseModel):
    platform: str = "YouTube"
    platform_user_id: str
    name: str
    profile_url: str
    followers: Optional[int] = None
    avg_views: Optional[int] = None
    engagement_rate: Optional[float] = None
    niche: Optional[str] = None
    bio: Optional[str] = None
    contact_email: Optional[str] = None
    email_status: Optional[str] = "Not Found"
    source_url: str

class InfluencerCreate(InfluencerBase):
    pass

class InfluencerResponse(InfluencerBase):
    id: str
    retrieved_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CampaignInfluencerResponse(BaseModel):
    id: str  # campaign_influencer_id
    campaign_id: str
    influencer_id: str
    qualification_status: str
    qualification_reasons: List[str]
    added_at: datetime
    influencer: InfluencerResponse
    has_message: bool = False
    message_id: Optional[str] = None
    outreach_status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class DiscoveryRequest(BaseModel):
    query: Optional[str] = None
    max_results: int = Field(default=15, ge=1, le=50)

class QualifyRequest(BaseModel):
    min_followers: Optional[int] = None
    max_followers: Optional[int] = None
    min_engagement: Optional[float] = None
