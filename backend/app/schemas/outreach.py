from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class GenerateMessageRequest(BaseModel):
    brand_name: Optional[str] = "InfluenceAI"
    brand_product: Optional[str] = "creator partnership collaboration"
    custom_instructions: Optional[str] = ""

class OutreachMessageResponse(BaseModel):
    id: str
    campaign_influencer_id: str
    email_subject: str
    email_body: str
    dm_body: str
    email_word_count: int
    dm_word_count: int
    generation_model: str
    personalization_facts: List[str]
    created_at: datetime
    latest_event: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)

class OutreachMessageUpdate(BaseModel):
    email_subject: str
    email_body: str
    dm_body: str

class OutreachEventCreate(BaseModel):
    channel: str = Field(default="email", description="Channel: email or instagram_dm")
    simulated: bool = Field(default=True, description="Always true in demo mode")

class OutreachStatusUpdate(BaseModel):
    status: str = Field(..., description="Draft, Approved, Simulated Sent, Sent, Replied, No Response, Interested, Not Interested, Bounced")
    error_message: Optional[str] = None

class OutreachTrackerItem(BaseModel):
    event_id: Optional[str]
    message_id: str
    campaign_influencer_id: str
    campaign_id: str
    campaign_name: str
    creator_name: str
    creator_profile_url: str
    creator_email: Optional[str]
    email_status: str
    channel: str
    status: str
    simulated: bool
    last_activity: datetime
    email_subject: str
    error_message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
