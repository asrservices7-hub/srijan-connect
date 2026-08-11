import cv2
import numpy as np
import os
import uuid
import math

def generate_video(script_text: str) -> str:
    """
    Generates a simple video displaying the script_text word by word 
    over a dynamic gradient background.
    Returns the URL path of the generated video.
    """
    filename = f"gen_{uuid.uuid4().hex[:8]}.mp4"
    filepath = os.path.join("uploads", filename)
    
    width, height = 720, 1280
    fps = 30
    duration_sec = 5
    total_frames = fps * duration_sec
    
    # mp4v works well for most browsers, though avc1 is better if available
    # We will try mp4v first
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(filepath, fourcc, fps, (width, height))
    
    words = script_text.split()
    if not words:
        words = ["Srijan", "Autonomous", "Content", "Engine"]
        
    word_duration = total_frames // len(words)
    if word_duration == 0: word_duration = 1
    
    for i in range(total_frames):
        # Create a dynamic gradient background
        img = np.zeros((height, width, 3), dtype=np.uint8)
        
        # Simple animation: pulsating color based on frame
        color_r = int(128 + 127 * math.sin(i * 0.1))
        color_g = int(128 + 127 * math.sin(i * 0.13))
        color_b = int(128 + 127 * math.sin(i * 0.17))
        img[:] = (color_b, color_g, color_r)
        
        # Add text
        current_word_idx = min(i // word_duration, len(words) - 1)
        text = words[current_word_idx]
        
        # Calculate text size and center it
        font = cv2.FONT_HERSHEY_DUPLEX
        font_scale = 4.0
        thickness = 10
        (text_w, text_h), baseline = cv2.getTextSize(text, font, font_scale, thickness)
        
        x = (width - text_w) // 2
        y = (height + text_h) // 2
        
        # Draw shadow then text
        cv2.putText(img, text, (x+5, y+5), font, font_scale, (0, 0, 0), thickness)
        cv2.putText(img, text, (x, y), font, font_scale, (255, 255, 255), thickness)
        
        out.write(img)
        
    out.release()
    return f"/uploads/{filename}"

if __name__ == "__main__":
    url = generate_video("Hello World from Srijan Engine")
    print(f"Generated: {url}")
