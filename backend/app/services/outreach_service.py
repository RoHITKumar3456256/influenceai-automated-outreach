import io
import csv
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.campaign import Campaign
from app.models.influencer import Influencer, CampaignInfluencer
from app.models.outreach import OutreachMessage, OutreachEvent

def record_simulated_outreach(
    db: Session,
    message_id: str,
    channel: str = "email"
) -> OutreachEvent:
    """
    Creates an outreach event with simulated=True and status='Simulated Sent'.
    Does not send any real messages, maintaining demo safety.
    """
    message = db.query(OutreachMessage).filter(OutreachMessage.id == message_id).first()
    if not message:
        raise ValueError("Outreach message not found.")

    event = OutreachEvent(
        outreach_message_id=message_id,
        channel=channel,
        status="Simulated Sent",
        simulated=True,
        event_time=datetime.utcnow()
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

def update_outreach_status(
    db: Session,
    event_id: str,
    new_status: str,
    error_message: Optional[str] = None
) -> OutreachEvent:
    """
    Updates status of an existing outreach event.
    Valid states: Draft, Approved, Simulated Sent, Sent, Replied, No Response, Interested, Not Interested, Bounced
    """
    event = db.query(OutreachEvent).filter(OutreachEvent.id == event_id).first()
    if not event:
        raise ValueError("Outreach event not found.")

    event.status = new_status
    if error_message is not None:
        event.error_message = error_message
    event.event_time = datetime.utcnow()

    db.commit()
    db.refresh(event)
    return event

def generate_campaign_csv(db: Session, campaign_id: str) -> str:
    """
    Exports comprehensive campaign tracker CSV including:
    - Creator profile info & metrics
    - Source URL and retrieval timestamp
    - Qualification decision and transparent reasons
    - Contact email & email status
    - Outreach subject & status (simulated vs actual)
    """
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise ValueError("Campaign not found.")

    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    # Headers according to PRD / SRD
    headers = [
        "Campaign Name",
        "Creator Name",
        "Platform",
        "Platform ID",
        "Profile URL",
        "Followers",
        "Avg Views",
        "Engagement Rate (%)",
        "Qualification Status",
        "Qualification Reasons",
        "Contact Email",
        "Email Status",
        "Source URL",
        "Retrieval Timestamp",
        "Outreach Subject",
        "Outreach Status",
        "Channel",
        "Simulated Send",
        "Last Activity Time"
    ]
    writer.writerow(headers)

    records = (
        db.query(CampaignInfluencer, Influencer)
        .join(Influencer, CampaignInfluencer.influencer_id == Influencer.id)
        .filter(CampaignInfluencer.campaign_id == campaign_id)
        .all()
    )

    for ci, inf in records:
        # Check if message exists
        msg = db.query(OutreachMessage).filter(OutreachMessage.campaign_influencer_id == ci.id).first()
        latest_event = None
        if msg:
            latest_event = (
                db.query(OutreachEvent)
                .filter(OutreachEvent.outreach_message_id == msg.id)
                .order_by(OutreachEvent.event_time.desc())
                .first()
            )

        reasons_str = "; ".join(ci.qualification_reasons) if isinstance(ci.qualification_reasons, list) else str(ci.qualification_reasons or "")
        
        writer.writerow([
            campaign.name,
            inf.name,
            inf.platform,
            inf.platform_user_id,
            inf.profile_url,
            inf.followers if inf.followers is not None else "Unknown",
            inf.avg_views if inf.avg_views is not None else "Unknown",
            f"{inf.engagement_rate:.2f}%" if inf.engagement_rate is not None else "Unknown",
            ci.qualification_status,
            reasons_str,
            inf.contact_email or "Not Found",
            inf.email_status or "Not Found",
            inf.source_url,
            inf.retrieved_at.strftime("%Y-%m-%d %H:%M:%S") if inf.retrieved_at else "",
            msg.email_subject if msg else "No Draft",
            latest_event.status if latest_event else ("Draft" if msg else "Not Contacted"),
            latest_event.channel if latest_event else "email",
            "Yes" if (latest_event and latest_event.simulated) else "No",
            latest_event.event_time.strftime("%Y-%m-%d %H:%M:%S") if latest_event else ""
        ])

    return output.getvalue()
