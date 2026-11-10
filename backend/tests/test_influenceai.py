import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from app.services.qualification_service import evaluate_influencer_qualification
from app.services.enrichment_service import extract_public_business_email, calculate_video_engagement
from app.services.personalization_service import count_words, generate_fallback_draft
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_qualification_rules():
    # 1. Exact boundaries: min_followers=5000, max_followers=100000, min_eng=2.0%
    status, reasons = evaluate_influencer_qualification(
        followers=5000, engagement_rate=2.0, min_followers=5000, max_followers=100000, min_engagement=2.0
    )
    assert status == "Pass"
    assert any("meets/exceeds" in r for r in reasons)

    # Upper boundary
    status, _ = evaluate_influencer_qualification(
        followers=100000, engagement_rate=3.5, min_followers=5000, max_followers=100000, min_engagement=2.0
    )
    assert status == "Pass"

    # Below follower count -> Fail
    status, reasons = evaluate_influencer_qualification(
        followers=4999, engagement_rate=5.0, min_followers=5000, max_followers=100000, min_engagement=2.0
    )
    assert status == "Fail"
    assert any("below campaign minimum" in r for r in reasons)

    # Above follower count -> Fail
    status, reasons = evaluate_influencer_qualification(
        followers=100001, engagement_rate=5.0, min_followers=5000, max_followers=100000, min_engagement=2.0
    )
    assert status == "Fail"
    assert any("exceeds campaign maximum" in r for r in reasons)

    # Missing follower metric -> Review
    status, reasons = evaluate_influencer_qualification(
        followers=None, engagement_rate=5.0, min_followers=5000, max_followers=100000, min_engagement=2.0
    )
    assert status == "Review"

    # Missing engagement metric -> Review
    status, reasons = evaluate_influencer_qualification(
        followers=20000, engagement_rate=None, min_followers=5000, max_followers=100000, min_engagement=2.0
    )
    assert status == "Review"

    # Low engagement -> Fail
    status, reasons = evaluate_influencer_qualification(
        followers=20000, engagement_rate=1.8, min_followers=5000, max_followers=100000, min_engagement=2.0
    )
    assert status == "Fail"
    assert any("below campaign threshold" in r for r in reasons)


def test_engagement_calculation():
    # ((likes + comments) / views) * 100
    sample_videos = [
        {"views": 10000, "likes": 400, "comments": 100},  # (500 / 10000) * 100 = 5.0%
        {"views": 20000, "likes": 500, "comments": 100},  # (600 / 20000) * 100 = 3.0%
        {"views": 0, "likes": 50, "comments": 10},         # Excluded because zero views
    ]
    avg_rate, avg_views, sample_count = calculate_video_engagement(sample_videos)
    assert avg_rate == 4.0  # Average of 5.0% and 3.0%
    assert avg_views == 15000
    assert sample_count == 2


def test_email_extraction():
    bio_with_email = "Fitness coach and marathon runner. For business inquiries, email contact@marathonrunner.com or reach out on IG."
    email, status = extract_public_business_email(bio_with_email)
    assert email == "contact@marathonrunner.com"
    assert status == "Found"

    bio_without_email = "Daily workouts, kettlebell flows and mobility routines."
    email, status = extract_public_business_email(bio_without_email)
    assert email is None
    assert status == "Not Found"


def test_word_count_compliance():
    draft = generate_fallback_draft(
        creator_name="Alex Rivera",
        niche="Fitness",
        bio="Personal trainer sharing daily mobility drills.",
        brand_name="InfluenceAI",
        brand_product="hydration drink mix"
    )
    email_words = count_words(draft["email_body"])
    dm_words = count_words(draft["dm_body"])

    assert 60 <= email_words <= 90, f"Email words {email_words} outside 60-90 range"
    assert 15 <= dm_words <= 30, f"DM words {dm_words} outside 15-30 range"


def test_api_workflow_end_to_end():
    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    # 2. Create Campaign
    camp_res = client.post("/api/campaigns", json={
        "name": "E2E Automated Test Campaign",
        "niche": "Fitness & Wellness",
        "platform": "YouTube",
        "min_followers": 5000,
        "max_followers": 80000,
        "min_engagement": 2.5,
        "objective": "Test objective"
    })
    assert camp_res.status_code == 200
    campaign_id = camp_res.json()["id"]

    # 3. Discover creators (first run)
    disc_res1 = client.post(f"/api/campaigns/{campaign_id}/discover", json={
        "query": "Fitness",
        "max_results": 10
    })
    assert disc_res1.status_code == 200
    assert disc_res1.json()["imported_count"] > 0

    # 4. Discover creators (second run - test duplicate prevention!)
    disc_res2 = client.post(f"/api/campaigns/{campaign_id}/discover", json={
        "query": "Fitness",
        "max_results": 10
    })
    assert disc_res2.status_code == 200
    assert disc_res2.json()["duplicate_count"] > 0

    # 5. List influencers
    inf_res = client.get(f"/api/campaigns/{campaign_id}/influencers")
    assert inf_res.status_code == 200
    influencers = inf_res.json()
    assert len(influencers) > 0
    ci_id = influencers[0]["id"]

    # 6. Generate draft
    draft_res = client.post(f"/api/campaign-influencers/{ci_id}/generate", json={
        "brand_name": "TestBrand",
        "brand_product": "high performance running socks"
    })
    assert draft_res.status_code == 200
    msg_data = draft_res.json()
    assert 60 <= msg_data["email_word_count"] <= 90
    assert 15 <= msg_data["dm_word_count"] <= 30

    # 7. Simulate Outreach
    sim_res = client.post(f"/api/outreach/{msg_data['id']}/simulate?channel=email")
    assert sim_res.status_code == 200
    assert sim_res.json()["simulated"] is True
    assert sim_res.json()["status"] == "Simulated Sent"

    # 8. Export CSV
    csv_res = client.get(f"/api/campaigns/{campaign_id}/export.csv")
    assert csv_res.status_code == 200
    csv_text = csv_res.text
    assert "Campaign Name,Creator Name,Platform" in csv_text
    assert "Simulated Sent" in csv_text

