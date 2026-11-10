from typing import Tuple, List, Optional

def evaluate_influencer_qualification(
    followers: Optional[int],
    engagement_rate: Optional[float],
    min_followers: int,
    max_followers: int,
    min_engagement: float
) -> Tuple[str, List[str]]:
    """
    Evaluates influencer against campaign criteria with transparent reasons.
    Returns (status, reasons) where status is 'Pass', 'Fail', or 'Review'.
    """
    reasons: List[str] = []

    # 1. Evaluate Follower Count
    if followers is None:
        reasons.append("Follower count is unknown or unlisted (requires manual review).")
        return "Review", reasons
    
    if followers < min_followers:
        reasons.append(f"Follower count ({followers:,}) is below campaign minimum ({min_followers:,}).")
        return "Fail", reasons
    
    if followers > max_followers:
        reasons.append(f"Follower count ({followers:,}) exceeds campaign maximum ({max_followers:,}).")
        return "Fail", reasons
    
    reasons.append(f"Follower count ({followers:,}) is within target range ({min_followers:,} - {max_followers:,}).")

    # 2. Evaluate Engagement Rate
    if engagement_rate is None:
        reasons.append("Engagement rate cannot be computed reliably (insufficient video/interaction metrics).")
        return "Review", reasons
    
    if engagement_rate >= min_engagement:
        reasons.append(f"Engagement rate ({engagement_rate:.2f}%) meets/exceeds campaign threshold ({min_engagement:.2f}%).")
        return "Pass", reasons
    else:
        reasons.append(f"Engagement rate ({engagement_rate:.2f}%) is below campaign threshold ({min_engagement:.2f}%).")
        return "Fail", reasons

