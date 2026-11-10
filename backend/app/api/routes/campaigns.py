from fastapi import APIRouter, Depends, HTTPException, Response, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database.session import get_db
from app.models.campaign import Campaign
from app.models.influencer import Influencer, CampaignInfluencer
from app.models.outreach import OutreachMessage, OutreachEvent
from app.schemas.campaign import CampaignCreate, CampaignResponse
from app.schemas.influencer import DiscoveryRequest, QualifyRequest
from app.services.discovery_service import discover_youtube_creators
from app.services.qualification_service import evaluate_influencer_qualification
from app.services.outreach_service import generate_campaign_csv

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])

@router.post("", response_model=CampaignResponse)
def create_campaign(payload: CampaignCreate, db: Session = Depends(get_db)):
    campaign = Campaign(
        name=payload.name,
        niche=payload.niche,
        platform=payload.platform,
        min_followers=payload.min_followers,
        max_followers=payload.max_followers,
        min_engagement=payload.min_engagement,
        objective=payload.objective
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    
    resp = CampaignResponse.model_validate(campaign)
    return resp

@router.get("", response_model=List[CampaignResponse])
def list_campaigns(db: Session = Depends(get_db)):
    campaigns = db.query(Campaign).order_by(Campaign.created_at.desc()).all()
    results = []
    for c in campaigns:
        total = db.query(CampaignInfluencer).filter(CampaignInfluencer.campaign_id == c.id).count()
        passed = db.query(CampaignInfluencer).filter(
            CampaignInfluencer.campaign_id == c.id,
            CampaignInfluencer.qualification_status == "Pass"
        ).count()
        review = db.query(CampaignInfluencer).filter(
            CampaignInfluencer.campaign_id == c.id,
            CampaignInfluencer.qualification_status == "Review"
        ).count()
        failed = db.query(CampaignInfluencer).filter(
            CampaignInfluencer.campaign_id == c.id,
            CampaignInfluencer.qualification_status == "Fail"
        ).count()

        item = CampaignResponse.model_validate(c)
        item.influencers_count = total
        item.passed_count = passed
        item.review_count = review
        item.failed_count = failed
        results.append(item)
    return results

@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign(campaign_id: str, db: Session = Depends(get_db)):
    c = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    total = db.query(CampaignInfluencer).filter(CampaignInfluencer.campaign_id == c.id).count()
    passed = db.query(CampaignInfluencer).filter(
        CampaignInfluencer.campaign_id == c.id,
        CampaignInfluencer.qualification_status == "Pass"
    ).count()
    review = db.query(CampaignInfluencer).filter(
        CampaignInfluencer.campaign_id == c.id,
        CampaignInfluencer.qualification_status == "Review"
    ).count()
    failed = db.query(CampaignInfluencer).filter(
        CampaignInfluencer.campaign_id == c.id,
        CampaignInfluencer.qualification_status == "Fail"
    ).count()

    item = CampaignResponse.model_validate(c)
    item.influencers_count = total
    item.passed_count = passed
    item.review_count = review
    item.failed_count = failed
    return item

@router.post("/{campaign_id}/discover")
async def discover_and_add_creators(
    campaign_id: str,
    payload: DiscoveryRequest,
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Call discovery service
    query = payload.query or campaign.niche
    disc_result = await discover_youtube_creators(
        query=query,
        niche=campaign.niche,
        max_results=payload.max_results
    )

    imported_count = 0
    duplicate_count = 0

    for item in disc_result["creators"]:
        # Check if influencer exists globally
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
                niche=item.get("niche") or campaign.niche,
                bio=item.get("bio"),
                contact_email=item.get("contact_email"),
                email_status=item.get("email_status", "Not Found"),
                source_url=item["source_url"],
                retrieved_at=datetime.utcnow()
            )
            db.add(inf)
            db.flush()

        # Check duplicate campaign membership
        existing_ci = db.query(CampaignInfluencer).filter(
            CampaignInfluencer.campaign_id == campaign.id,
            CampaignInfluencer.influencer_id == inf.id
        ).first()

        if existing_ci:
            duplicate_count += 1
            continue

        # Run qualification
        status, reasons = evaluate_influencer_qualification(
            followers=inf.followers,
            engagement_rate=inf.engagement_rate,
            min_followers=campaign.min_followers,
            max_followers=campaign.max_followers,
            min_engagement=campaign.min_engagement
        )

        ci = CampaignInfluencer(
            campaign_id=campaign.id,
            influencer_id=inf.id,
            qualification_status=status,
            qualification_reasons=reasons,
            added_at=datetime.utcnow()
        )
        db.add(ci)
        imported_count += 1

    db.commit()

    return {
        "message": f"Discovery complete. Imported {imported_count} new creators, {duplicate_count} skipped duplicates.",
        "imported_count": imported_count,
        "duplicate_count": duplicate_count,
        "source": disc_result["source"],
        "api_error": disc_result.get("api_error")
    }

@router.post("/{campaign_id}/qualify")
def run_qualification(
    campaign_id: str,
    payload: Optional[QualifyRequest] = None,
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    min_followers = payload.min_followers if (payload and payload.min_followers is not None) else campaign.min_followers
    max_followers = payload.max_followers if (payload and payload.max_followers is not None) else campaign.max_followers
    min_eng = payload.min_engagement if (payload and payload.min_engagement is not None) else campaign.min_engagement

    ci_list = db.query(CampaignInfluencer).filter(CampaignInfluencer.campaign_id == campaign_id).all()
    updated_count = 0

    for ci in ci_list:
        inf = db.query(Influencer).filter(Influencer.id == ci.influencer_id).first()
        if inf:
            status, reasons = evaluate_influencer_qualification(
                followers=inf.followers,
                engagement_rate=inf.engagement_rate,
                min_followers=min_followers,
                max_followers=max_followers,
                min_engagement=min_eng
            )
            ci.qualification_status = status
            ci.qualification_reasons = reasons
            updated_count += 1

    db.commit()

    return {
        "message": f"Successfully requalified {updated_count} creators against campaign criteria.",
        "updated_count": updated_count
    }

@router.get("/{campaign_id}/export.csv")
def export_csv(campaign_id: str, db: Session = Depends(get_db)):
    try:
        csv_content = generate_campaign_csv(db, campaign_id)
        filename = f"campaign_{campaign_id}_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
