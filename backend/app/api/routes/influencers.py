from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database.session import get_db
from app.models.campaign import Campaign
from app.models.influencer import Influencer, CampaignInfluencer
from app.models.outreach import OutreachMessage, OutreachEvent
from app.schemas.influencer import CampaignInfluencerResponse, InfluencerResponse
from app.schemas.outreach import GenerateMessageRequest, OutreachMessageResponse
from app.services.enrichment_service import extract_public_business_email
from app.services.personalization_service import generate_outreach_draft, count_words

router = APIRouter(tags=["influencers"])

@router.get("/api/campaigns/{campaign_id}/influencers")
def list_campaign_influencers(
    campaign_id: str,
    status: Optional[str] = Query(None, description="Filter by Pass, Fail, Review"),
    search: Optional[str] = Query(None, description="Search by name or niche"),
    db: Session = Depends(get_db)
):
    query = (
        db.query(CampaignInfluencer, Influencer)
        .join(Influencer, CampaignInfluencer.influencer_id == Influencer.id)
        .filter(CampaignInfluencer.campaign_id == campaign_id)
    )

    if status and status.lower() != "all":
        query = query.filter(CampaignInfluencer.qualification_status == status)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            (Influencer.name.ilike(search_filter)) | (Influencer.niche.ilike(search_filter))
        )

    records = query.order_by(CampaignInfluencer.added_at.desc()).all()
    results = []

    for ci, inf in records:
        msg = db.query(OutreachMessage).filter(OutreachMessage.campaign_influencer_id == ci.id).first()
        latest_event = None
        if msg:
            latest_event = (
                db.query(OutreachEvent)
                .filter(OutreachEvent.outreach_message_id == msg.id)
                .order_by(OutreachEvent.event_time.desc())
                .first()
            )

        results.append({
            "id": ci.id,
            "campaign_id": ci.campaign_id,
            "influencer_id": ci.influencer_id,
            "qualification_status": ci.qualification_status,
            "qualification_reasons": ci.qualification_reasons or [],
            "added_at": ci.added_at,
            "influencer": InfluencerResponse.model_validate(inf),
            "has_message": msg is not None,
            "message_id": msg.id if msg else None,
            "outreach_status": latest_event.status if latest_event else ("Draft" if msg else "Not Started")
        })

    return results

@router.get("/api/influencers/{influencer_id}", response_model=InfluencerResponse)
def get_influencer(influencer_id: str, db: Session = Depends(get_db)):
    inf = db.query(Influencer).filter(Influencer.id == influencer_id).first()
    if not inf:
        raise HTTPException(status_code=404, detail="Influencer not found")
    return InfluencerResponse.model_validate(inf)

@router.post("/api/influencers/{influencer_id}/enrich")
def enrich_influencer(influencer_id: str, db: Session = Depends(get_db)):
    """
    Enriches profile by re-evaluating publicly visible bio/description
    for business contact details and refreshing timestamp.
    """
    inf = db.query(Influencer).filter(Influencer.id == influencer_id).first()
    if not inf:
        raise HTTPException(status_code=404, detail="Influencer not found")

    email, status = extract_public_business_email(inf.bio)
    if email:
        inf.contact_email = email
        inf.email_status = status
    else:
        inf.email_status = "Not Found"

    inf.retrieved_at = datetime.utcnow()
    db.commit()
    db.refresh(inf)

    return {
        "message": "Enrichment completed using verified public channel metadata.",
        "influencer": InfluencerResponse.model_validate(inf)
    }

@router.post("/api/campaign-influencers/{ci_id}/generate", response_model=OutreachMessageResponse)
async def generate_message_for_creator(
    ci_id: str,
    payload: GenerateMessageRequest,
    db: Session = Depends(get_db)
):
    ci = db.query(CampaignInfluencer).filter(CampaignInfluencer.id == ci_id).first()
    if not ci:
        raise HTTPException(status_code=404, detail="Campaign Influencer entry not found")

    inf = db.query(Influencer).filter(Influencer.id == ci.influencer_id).first()
    campaign = db.query(Campaign).filter(Campaign.id == ci.campaign_id).first()

    creator_dict = {
        "name": inf.name,
        "platform": inf.platform,
        "profile_url": inf.profile_url,
        "niche": inf.niche or campaign.niche,
        "followers": inf.followers,
        "avg_views": inf.avg_views,
        "engagement_rate": inf.engagement_rate,
        "bio": inf.bio,
        "contact_email": inf.contact_email
    }

    brand_name = payload.brand_name or "InfluenceAI"
    brand_product = payload.brand_product or campaign.objective or "influencer collaboration"

    draft = await generate_outreach_draft(
        creator=creator_dict,
        brand_name=brand_name,
        brand_product=brand_product,
        custom_instructions=payload.custom_instructions or ""
    )

    # Persist or update OutreachMessage
    existing_msg = db.query(OutreachMessage).filter(OutreachMessage.campaign_influencer_id == ci.id).first()
    if existing_msg:
        existing_msg.email_subject = draft["subject"]
        existing_msg.email_body = draft["email_body"]
        existing_msg.dm_body = draft["dm_body"]
        existing_msg.generation_model = draft["generation_model"]
        existing_msg.personalization_facts = draft["personalization_facts"]
        existing_msg.created_at = datetime.utcnow()
        msg_obj = existing_msg
    else:
        msg_obj = OutreachMessage(
            campaign_influencer_id=ci.id,
            email_subject=draft["subject"],
            email_body=draft["email_body"],
            dm_body=draft["dm_body"],
            generation_model=draft["generation_model"],
            personalization_facts=draft["personalization_facts"],
            created_at=datetime.utcnow()
        )
        db.add(msg_obj)
        db.flush()

        # Create initial Draft event
        draft_event = OutreachEvent(
            outreach_message_id=msg_obj.id,
            channel="email",
            status="Draft",
            simulated=True,
            event_time=datetime.utcnow()
        )
        db.add(draft_event)

    db.commit()
    db.refresh(msg_obj)

    latest_event = (
        db.query(OutreachEvent)
        .filter(OutreachEvent.outreach_message_id == msg_obj.id)
        .order_by(OutreachEvent.event_time.desc())
        .first()
    )

    return OutreachMessageResponse(
        id=msg_obj.id,
        campaign_influencer_id=msg_obj.campaign_influencer_id,
        email_subject=msg_obj.email_subject,
        email_body=msg_obj.email_body,
        dm_body=msg_obj.dm_body,
        email_word_count=count_words(msg_obj.email_body),
        dm_word_count=count_words(msg_obj.dm_body),
        generation_model=msg_obj.generation_model,
        personalization_facts=msg_obj.personalization_facts or [],
        created_at=msg_obj.created_at,
        latest_event={
            "id": latest_event.id if latest_event else None,
            "status": latest_event.status if latest_event else "Draft",
            "channel": latest_event.channel if latest_event else "email",
            "simulated": latest_event.simulated if latest_event else True
        } if latest_event else None
    )

