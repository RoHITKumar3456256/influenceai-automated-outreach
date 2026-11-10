import re
from typing import List, Dict, Any, Optional, Tuple

EMAIL_REGEX = re.compile(r'([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)')

# Filter out common false positives and image/script artifacts
EXCLUDED_EMAIL_DOMAINS = ["example.com", "wix.com", "domain.com", "sentry.io"]

def extract_public_business_email(text: Optional[str]) -> Tuple[Optional[str], str]:
    """
    Inspects public text (e.g. channel description/bio) for an explicitly published contact email.
    Never guesses, synthesizes, or invents an email.
    Returns (email, email_status)
    """
    if not text:
        return None, "Not Found"
    
    matches = EMAIL_REGEX.findall(text)
    for email in matches:
        email_clean = email.strip().lower()
        domain = email_clean.split("@")[-1]
        if domain not in EXCLUDED_EMAIL_DOMAINS and "." in domain and len(domain) > 3:
            # Found a validly formatted public business email
            return email_clean, "Found"
            
    return None, "Not Found"

def calculate_video_engagement(videos: List[Dict[str, Any]], sample_window: int = 10) -> Tuple[Optional[float], Optional[int], int]:
    """
    For eligible recent videos, calculates ((likes + comments) / views) * 100,
    then averages those video-level rates.
    Excludes videos with zero or missing views.
    Returns: (average_engagement_rate, average_views, eligible_samples_count)
    """
    if not videos:
        return None, None, 0

    rates: List[float] = []
    views_list: List[int] = []

    for v in videos[:sample_window]:
        views = v.get("views")
        likes = v.get("likes", 0) or 0
        comments = v.get("comments", 0) or 0

        if views is not None and views > 0:
            views_list.append(views)
            interactions = likes + comments
            video_rate = (interactions / views) * 100.0
            rates.append(video_rate)

    if not rates:
        return None, None, 0

    avg_rate = round(sum(rates) / len(rates), 2)
    avg_views = int(sum(views_list) / len(views_list))
    return avg_rate, avg_views, len(rates)

