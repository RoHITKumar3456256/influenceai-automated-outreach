from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.core.config import settings
from app.models.campaign import Campaign
from app.models.influencer import Influencer, CampaignInfluencer
from app.models.outreach import OutreachMessage, OutreachEvent

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/dashboard")
def get_dashboard_analytics(db: Session = Depends(get_db)):
    campaign_count = db.query(Campaign).count()
    discovered_creators_count = db.query(Influencer).count()
    
    passed_count = db.query(CampaignInfluencer).filter(CampaignInfluencer.qualification_status == "Pass").count()
    review_count = db.query(CampaignInfluencer).filter(CampaignInfluencer.qualification_status == "Review").count()
    failed_count = db.query(CampaignInfluencer).filter(CampaignInfluencer.qualification_status == "Fail").count()
    
    drafts_count = db.query(OutreachMessage).count()
    
    # Outreach status breakdown
    status_counts = {}
    events = (
        db.query(OutreachEvent.status, func.count(OutreachEvent.id))
        .group_by(OutreachEvent.status)
        .all()
    )
    for st, count in events:
        status_counts[st] = count

    # Recent activity
    recent_events = (
        db.query(OutreachEvent, OutreachMessage, CampaignInfluencer, Influencer, Campaign)
        .join(OutreachMessage, OutreachEvent.outreach_message_id == OutreachMessage.id)
        .join(CampaignInfluencer, OutreachMessage.campaign_influencer_id == CampaignInfluencer.id)
        .join(Influencer, CampaignInfluencer.influencer_id == Influencer.id)
        .join(Campaign, CampaignInfluencer.campaign_id == Campaign.id)
        .order_by(OutreachEvent.event_time.desc())
        .limit(8)
        .all()
    )

    activity_log = []
    for evt, msg, ci, inf, camp in recent_events:
        activity_log.append({
            "id": evt.id,
            "creator_name": inf.name,
            "campaign_name": camp.name,
            "channel": evt.channel,
            "status": evt.status,
            "simulated": evt.simulated,
            "timestamp": evt.event_time
        })

    # API Connection health check
    api_health = {
        "youtube_api": "Configured" if bool(settings.youtube_api_key) else "Demo / Fallback Mode (Authentic Dataset)",
        "gemini_api": "Configured" if bool(settings.gemini_api_key) else "Deterministic Fallback Active",
        "database": "SQLite (Local Zero-Config)" if "sqlite" in settings.database_url else "PostgreSQL / Supabase",
        "outreach_mode": settings.outreach_mode
    }

    return {
        "campaign_count": campaign_count,
        "discovered_creators_count": discovered_creators_count,
        "qualification": {
            "pass": passed_count,
            "review": review_count,
            "fail": failed_count,
            "total_campaign_influencers": passed_count + review_count + failed_count
        },
        "drafts_generated": drafts_count,
        "outreach_status_distribution": status_counts,
        "recent_activity": activity_log,
        "api_health": api_health
    }
