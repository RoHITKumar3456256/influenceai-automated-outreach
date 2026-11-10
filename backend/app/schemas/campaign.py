from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class CampaignBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Campaign Name")
    niche: str = Field(..., min_length=2, max_length=100, description="Campaign Niche / Category")
    platform: str = Field(default="YouTube", description="Social Platform")
    min_followers: int = Field(default=5000, ge=0, description="Minimum followers/subscribers")
    max_followers: int = Field(default=100000, ge=0, description="Maximum followers/subscribers")
    min_engagement: float = Field(default=2.0, ge=0.0, le=100.0, description="Minimum engagement rate percentage")
    objective: Optional[str] = Field(default="", description="Campaign objective and brand pitch notes")

class CampaignCreate(CampaignBase):
    pass

class CampaignResponse(CampaignBase):
    id: str
    created_at: datetime
    influencers_count: Optional[int] = 0
    passed_count: Optional[int] = 0
    review_count: Optional[int] = 0
    failed_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

class CampaignDetailResponse(CampaignResponse):
    pass
