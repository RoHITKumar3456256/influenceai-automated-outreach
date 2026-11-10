import sys
import os
import json
import csv
from datetime import datetime

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.session import SessionLocal
from app.models.campaign import Campaign
from app.models.influencer import Influencer, CampaignInfluencer
from app.models.outreach import OutreachMessage, OutreachEvent
from app.services.personalization_service import count_words

def export_submission_artifacts():
    db = SessionLocal()
    exports_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "exports")
    os.makedirs(exports_dir, exist_ok=True)

    try:
        # 1. Export Outreach Messages
        messages_records = (
            db.query(OutreachMessage, CampaignInfluencer, Influencer, Campaign)
            .join(CampaignInfluencer, OutreachMessage.campaign_influencer_id == CampaignInfluencer.id)
            .join(Influencer, CampaignInfluencer.influencer_id == Influencer.id)
            .join(Campaign, CampaignInfluencer.campaign_id == Campaign.id)
            .all()
        )

        messages_list = []
        for msg, ci, inf, camp in messages_records:
            messages_list.append({
                "message_id": msg.id,
                "campaign_id": camp.id,
                "campaign_name": camp.name,
                "creator_name": inf.name,
                "creator_platform_id": inf.platform_user_id,
                "profile_url": inf.profile_url,
                "qualification_status": ci.qualification_status,
                "email_subject": msg.email_subject,
                "email_body": msg.email_body,
                "email_word_count": count_words(msg.email_body),
                "dm_body": msg.dm_body,
                "dm_word_count": count_words(msg.dm_body),
                "generation_model": msg.generation_model,
                "personalization_facts": msg.personalization_facts,
                "created_at": msg.created_at.strftime("%Y-%m-%d %H:%M:%S") if msg.created_at else None
            })

        json_path = os.path.join(exports_dir, "outreach_messages_export.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(messages_list, f, indent=2)
        print(f"Exported {len(messages_list)} outreach message drafts to: {json_path}")

        # 2. Export Outreach Tracker CSV (Simulated vs Actual sends)
        tracker_path = os.path.join(exports_dir, "outreach_tracker_export.csv")
        events_records = (
            db.query(OutreachEvent, OutreachMessage, CampaignInfluencer, Influencer, Campaign)
            .join(OutreachMessage, OutreachEvent.outreach_message_id == OutreachMessage.id)
            .join(CampaignInfluencer, OutreachMessage.campaign_influencer_id == CampaignInfluencer.id)
            .join(Influencer, CampaignInfluencer.influencer_id == Influencer.id)
            .join(Campaign, CampaignInfluencer.campaign_id == Campaign.id)
            .order_by(OutreachEvent.event_time.desc())
            .all()
        )

        with open(tracker_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "Event ID",
                "Campaign Name",
                "Creator Name",
                "Channel",
                "Outreach Status",
                "Simulated Send",
                "Event Timestamp",
                "Subject Line",
                "Creator Email",
                "Email Status",
                "Error Message"
            ])
            for evt, msg, ci, inf, camp in events_records:
                writer.writerow([
                    evt.id,
                    camp.name,
                    inf.name,
                    evt.channel,
                    evt.status,
                    "Yes (Demo Mode)" if evt.simulated else "No (Real Send)",
                    evt.event_time.strftime("%Y-%m-%d %H:%M:%S") if evt.event_time else "",
                    msg.email_subject,
                    inf.contact_email or "Not Found",
                    inf.email_status or "Not Found",
                    evt.error_message or ""
                ])
        print(f"Exported {len(events_records)} tracker events to: {tracker_path}")

    finally:
        db.close()

if __name__ == "__main__":
    export_submission_artifacts()
