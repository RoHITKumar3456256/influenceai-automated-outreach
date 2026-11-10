import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime
from app.database.session import SessionLocal, init_db
from app.models.campaign import Campaign
from app.models.influencer import Influencer, CampaignInfluencer
from app.models.outreach import OutreachMessage, OutreachEvent
from app.services.discovery_service import VERIFIED_CREATORS_DATASET
from app.services.qualification_service import evaluate_influencer_qualification
from app.services.personalization_service import generate_fallback_draft
from app.services.outreach_service import generate_campaign_csv

def seed():
    init_db()
    db = SessionLocal()

    try:
        # 1. Create Default Campaign if not exists
        campaign = db.query(Campaign).filter(Campaign.name == "Fitness & Wellness Micro-Creators 2026").first()
        if not campaign:
            campaign = Campaign(
                name="Fitness & Wellness Micro-Creators 2026",
                niche="Fitness & Wellness",
                platform="YouTube",
                min_followers=5000,
                max_followers=100000,
                min_engagement=2.0,
                objective="Promote high-protein hydration fuel bottle with dedicated 60-second tutorial integrations.",
                created_at=datetime.utcnow()
            )
            db.add(campaign)
            db.commit()
            db.refresh(campaign)
            print(f"Created campaign: {campaign.name} ({campaign.id})")

        # 2. Add Tech Campaign as well for variety
        tech_campaign = db.query(Campaign).filter(Campaign.name == "Developer Tools & SaaS Creators").first()
        if not tech_campaign:
            tech_campaign = Campaign(
                name="Developer Tools & SaaS Creators",
                niche="Tech & Coding",
                platform="YouTube",
                min_followers=10000,
                max_followers=500000,
                min_engagement=3.0,
                objective="Introduce new AI pairing assistant for full-stack React and Python developers.",
                created_at=datetime.utcnow()
            )
            db.add(tech_campaign)
            db.commit()
            db.refresh(tech_campaign)

        # 3. Insert Verified Influencers and link to campaigns
        for item in VERIFIED_CREATORS_DATASET:
            inf = db.query(Influencer).filter(
                Influencer.platform == item["platform"],
                Influencer.platform_user_id == item["platform_user_id"]
            ).first()

            if not inf:
                inf = Influencer(
                    platform=item["platform"],
                    platform_user_id=item["platform_user_id"],
                    name=item["name"],
                    profile_url=item["profile_url"],
                    followers=item["followers"],
                    avg_views=item["avg_views"],
                    engagement_rate=item["engagement_rate"],
                    niche=item.get("niche") or "General",
                    bio=item.get("bio"),
                    contact_email=item.get("contact_email"),
                    email_status=item.get("email_status", "Not Found"),
                    source_url=item["source_url"],
                    retrieved_at=datetime.utcnow()
                )
                db.add(inf)
                db.flush()

            # Target campaign assignment
            target_camp = campaign if "Fitness" in (inf.niche or "") else tech_campaign

            existing_ci = db.query(CampaignInfluencer).filter(
                CampaignInfluencer.campaign_id == target_camp.id,
                CampaignInfluencer.influencer_id == inf.id
            ).first()

            if not existing_ci:
                status, reasons = evaluate_influencer_qualification(
                    followers=inf.followers,
                    engagement_rate=inf.engagement_rate,
                    min_followers=target_camp.min_followers,
                    max_followers=target_camp.max_followers,
                    min_engagement=target_camp.min_engagement
                )
                ci = CampaignInfluencer(
                    campaign_id=target_camp.id,
                    influencer_id=inf.id,
                    qualification_status=status,
                    qualification_reasons=reasons,
                    added_at=datetime.utcnow()
                )
                db.add(ci)
                db.flush()

                # Generate a draft message for passed creators
                if status == "Pass":
                    draft = generate_fallback_draft(
                        creator_name=inf.name,
                        niche=inf.niche or target_camp.niche,
                        bio=inf.bio or "",
                        brand_name="InfluenceAI",
                        brand_product=target_camp.objective
                    )
                    msg = OutreachMessage(
                        campaign_influencer_id=ci.id,
                        email_subject=draft["subject"],
                        email_body=draft["email_body"],
                        dm_body=draft["dm_body"],
                        generation_model=draft["generation_model"],
                        personalization_facts=draft["personalization_facts"],
                        created_at=datetime.utcnow()
                    )
                    db.add(msg)
                    db.flush()

                    # Add simulated outreach event
                    evt = OutreachEvent(
                        outreach_message_id=msg.id,
                        channel="email",
                        status="Simulated Sent",
                        simulated=True,
                        event_time=datetime.utcnow()
                    )
                    db.add(evt)

        db.commit()
        print("Database seeded with verified creators, campaign qualification, drafts, and simulated events.")

        # 4. Generate sample export CSV
        export_csv_str = generate_campaign_csv(db, campaign.id)
        os.makedirs("../data/exports", exist_ok=True)
        export_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "exports", "sample_verified_creators.csv")
        with open(export_file_path, "w", encoding="utf-8") as f:
            f.write(export_csv_str)
        print(f"Sample exported dataset saved to: {export_file_path}")

    finally:
        db.close()

if __name__ == "__main__":
    seed()
