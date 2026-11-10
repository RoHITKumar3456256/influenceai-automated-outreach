from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database.session import get_db
from app.models.campaign import Campaign
from app.models.influencer import Influencer, CampaignInfluencer
from app.models.outreach import OutreachMessage, OutreachEvent
from app.schemas.outreach import (
    OutreachMessageResponse,
    OutreachMessageUpdate,
    OutreachStatusUpdate,
    OutreachTrackerItem
)
from app.services.outreach_service import record_simulated_outreach, update_outreach_status
from app.services.personalization_service import count_words

router = APIRouter(prefix="/api/outreach", tags=["outreach"])

@router.get("/tracker", response_model=List[OutreachTrackerItem])
def get_outreach_tracker(
    campaign_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    channel: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = (
        db.query(OutreachMessage, CampaignInfluencer, Campaign, Influencer)
        .join(CampaignInfluencer, OutreachMessage.campaign_influencer_id == CampaignInfluencer.id)
        .join(Campaign, CampaignInfluencer.campaign_id == Campaign.id)
        .join(Influencer, CampaignInfluencer.influencer_id == Influencer.id)
    )

    if campaign_id:
        query = query.filter(Campaign.id == campaign_id)

    results = []
    items = query.all()

    for msg, ci, camp, inf in items:
        latest_event = (
            db.query(OutreachEvent)
            .filter(OutreachEvent.outreach_message_id == msg.id)
            .order_by(OutreachEvent.event_time.desc())
            .first()
        )

        curr_status = latest_event.status if latest_event else "Draft"
        curr_channel = latest_event.channel if latest_event else "email"
        simulated = latest_event.simulated if latest_event else True
        event_time = latest_event.event_time if latest_event else msg.created_at
        err = latest_event.error_message if latest_event else None

        if status and status.lower() != "all" and curr_status != status:
            continue
        if channel and channel.lower() != "all" and curr_channel != channel:
            continue

        results.append(OutreachTrackerItem(
            event_id=latest_event.id if latest_event else None,
            message_id=msg.id,
            campaign_influencer_id=ci.id,
            campaign_id=camp.id,
            campaign_name=camp.name,
            creator_name=inf.name,
            creator_profile_url=inf.profile_url,
            creator_email=inf.contact_email,
            email_status=inf.email_status,
            channel=curr_channel,
            status=curr_status,
            simulated=simulated,
            last_activity=event_time,
            email_subject=msg.email_subject,
            error_message=err
        ))

    results.sort(key=lambda x: x.last_activity, reverse=True)
    return results

@router.get("/messages/{message_id}", response_model=OutreachMessageResponse)
def get_outreach_message(message_id: str, db: Session = Depends(get_db)):
    msg = db.query(OutreachMessage).filter(OutreachMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Outreach message not found")

    latest_event = (
        db.query(OutreachEvent)
        .filter(OutreachEvent.outreach_message_id == msg.id)
        .order_by(OutreachEvent.event_time.desc())
        .first()
    )

    return OutreachMessageResponse(
        id=msg.id,
        campaign_influencer_id=msg.campaign_influencer_id,
        email_subject=msg.email_subject,
        email_body=msg.email_body,
        dm_body=msg.dm_body,
        email_word_count=count_words(msg.email_body),
        dm_word_count=count_words(msg.dm_body),
        generation_model=msg.generation_model,
        personalization_facts=msg.personalization_facts or [],
        created_at=msg.created_at,
        latest_event={
            "id": latest_event.id if latest_event else None,
            "status": latest_event.status if latest_event else "Draft",
            "channel": latest_event.channel if latest_event else "email",
            "simulated": latest_event.simulated if latest_event else True
        } if latest_event else None
    )

@router.put("/messages/{message_id}", response_model=OutreachMessageResponse)
def update_outreach_message(message_id: str, payload: OutreachMessageUpdate, db: Session = Depends(get_db)):
    msg = db.query(OutreachMessage).filter(OutreachMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Outreach message not found")

    msg.email_subject = payload.email_subject
    msg.email_body = payload.email_body
    msg.dm_body = payload.dm_body
    db.commit()
    db.refresh(msg)

    latest_event = (
        db.query(OutreachEvent)
        .filter(OutreachEvent.outreach_message_id == msg.id)
        .order_by(OutreachEvent.event_time.desc())
        .first()
    )

    return OutreachMessageResponse(
        id=msg.id,
        campaign_influencer_id=msg.campaign_influencer_id,
        email_subject=msg.email_subject,
        email_body=msg.email_body,
        dm_body=msg.dm_body,
        email_word_count=count_words(msg.email_body),
        dm_word_count=count_words(msg.dm_body),
        generation_model=msg.generation_model,
        personalization_facts=msg.personalization_facts or [],
        created_at=msg.created_at,
        latest_event={
            "id": latest_event.id if latest_event else None,
            "status": latest_event.status if latest_event else "Draft",
            "channel": latest_event.channel if latest_event else "email",
            "simulated": latest_event.simulated if latest_event else True
        } if latest_event else None
    )

@router.post("/{message_id}/simulate")
def simulate_outreach(
    message_id: str,
    channel: str = Query("email", description="Channel: email or instagram_dm"),
    db: Session = Depends(get_db)
):
    """
    Records a demo-safe simulated send event.
    Marked explicitly simulated=True and status='Simulated Sent'.
    """
    try:
        event = record_simulated_outreach(db, message_id=message_id, channel=channel)
        return {
            "message": "Simulated send recorded successfully. (Demo mode: no real transmission made).",
            "event_id": event.id,
            "status": event.status,
            "channel": event.channel,
            "simulated": event.simulated,
            "timestamp": event.event_time
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.patch("/{event_id}/status")
def patch_outreach_status(
    event_id: str,
    payload: OutreachStatusUpdate,
    db: Session = Depends(get_db)
):
    try:
        event = update_outreach_status(db, event_id=event_id, new_status=payload.status, error_message=payload.error_message)
        return {
            "message": f"Outreach status updated to '{payload.status}'",
            "event_id": event.id,
            "status": event.status,
            "timestamp": event.event_time
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
