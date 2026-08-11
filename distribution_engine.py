import time
import random

def post_to_youtube(video_path: str, title: str) -> dict:
    """
    Mock integration for YouTube Data API v3 (Videos.insert)
    """
    print(f"[YouTube] Uploading {video_path} as '{title}'...")
    # Simulate network delay for upload and transcoding
    time.sleep(random.uniform(1.5, 3.0))
    print("[YouTube] Upload successful! Video ID generated.")
    return {
        "status": "success",
        "platform": "youtube",
        "url": f"https://youtube.com/shorts/mock{random.randint(1000,9999)}"
    }

def post_to_instagram(video_path: str, title: str) -> dict:
    """
    Mock integration for Instagram Graph API (Media Publishing)
    """
    print(f"[Instagram] Uploading {video_path} as '{title}'...")
    # Simulate network delay for upload and publishing
    time.sleep(random.uniform(1.5, 3.0))
    print("[Instagram] Reel published successfully!")
    return {
        "status": "success",
        "platform": "instagram",
        "url": f"https://instagram.com/reels/mock{random.randint(1000,9999)}"
    }

def distribute_video(video_path: str, title: str, platforms: list) -> dict:
    """
    Distributes a video to multiple platforms.
    """
    results = {}
    if "youtube" in platforms:
        results["youtube"] = post_to_youtube(video_path, title)
    if "instagram" in platforms:
        results["instagram"] = post_to_instagram(video_path, title)
        
    return {
        "status": "success",
        "results": results
    }
