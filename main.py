import os
import uuid
import json
from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from pydantic import BaseModel
import razorpay

from database import engine, Base, get_db
import models
import video_engine
import distribution_engine

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Razorpay Client Setup (Using Dummy Test Keys for prototype)
RAZORPAY_KEY_ID = "rzp_test_123dummykey"
RAZORPAY_KEY_SECRET = "dummysecret456"
# Note: In a real app, do not hardcode these.
if "dummy" in RAZORPAY_KEY_ID:
    razorpay_client = None
else:
    try:
        razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    except Exception as e:
        razorpay_client = None


# Mount static files for the uploads folder
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/api/data")
def get_data(db: Session = Depends(get_db)):
    record = db.query(models.AppData).filter(models.AppData.key == "global_state").first()
    if record and record.value:
        return record.value
    return {}

@app.post("/api/data")
async def save_data(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    record = db.query(models.AppData).filter(models.AppData.key == "global_state").first()
    if not record:
        record = models.AppData(key="global_state", value=data)
        db.add(record)
    else:
        record.value = data
    db.commit()
    return {"status": "success"}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    filename = f"{uuid.uuid4()}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)
    return {"url": f"/uploads/{filename}"}

@app.post("/api/generate-video")
async def api_generate_video(req: dict, db: Session = Depends(get_db)):
    record = db.query(models.AppData).filter(models.AppData.key == "global_state").first()
    if not record or not record.value:
        # Initialize an empty global state if this is a fresh deployment
        data = {}
        if not record:
            record = models.AppData(key="global_state", value=data)
            db.add(record)
    else:
        data = record.value
    
    # Paywall Logic
    videos_generated = data.get("videos_generated_count", 0)
    is_subscribed = data.get("is_subscribed", False)
    
    if videos_generated >= 1 and not is_subscribed:
        return {"status": "error", "requires_subscription": True, "message": "Please subscribe to generate more videos."}
        
    script = req.get("script", "Srijan Autonomous Engine")
    try:
        video_url = video_engine.generate_video(script)
    except Exception as e:
        import traceback
        return {"status": "error", "message": f"Engine error: {str(e)}", "trace": traceback.format_exc()}
    
    # Increment count
    data["videos_generated_count"] = videos_generated + 1
    
    # Inject into Social Feed directly
    posts = data.get("posts", [])
    posts.insert(0, {
        "id": uuid.uuid4().hex[:8],
        "type": "video",
        "text": f"🤖 Autonomous Video: {script}",
        "media": video_url,
        "likes": 0,
        "comments": []
    })
    data["posts"] = posts
    
    # SQLAlchemy JSON columns sometimes need reassignment to detect changes
    # Use flag_modified to ensure it saves
    flag_modified(record, "value")
    db.commit()
    
    return {"status": "success", "video_url": video_url, "video_id": posts[0]["id"]}

@app.post("/api/publish")
async def api_publish(req: dict, db: Session = Depends(get_db)):
    video_id = req.get("video_id")
    platforms = req.get("platforms", ["youtube", "instagram"])
    
    record = db.query(models.AppData).filter(models.AppData.key == "global_state").first()
    if not record or not record.value:
        data = {}
        if not record:
            record = models.AppData(key="global_state", value=data)
            db.add(record)
    else:
        data = record.value
    posts = data.get("posts", [])
    
    target_post = None
    for p in posts:
        if p.get("id") == video_id:
            target_post = p
            break
            
    if not target_post:
        return {"status": "error", "message": "Video not found"}
        
    video_path = target_post.get("media")
    title = target_post.get("text", "Untitled Video")
    
    dist_results = distribution_engine.distribute_video(video_path, title, platforms)
    
    current_published = target_post.get("published_platforms", [])
    for p in platforms:
        if p not in current_published:
            current_published.append(p)
    target_post["published_platforms"] = current_published
    
    import copy
    record.value = copy.deepcopy(data)
    db.commit()
    
    return {"status": "success", "results": dist_results}

# --- RAZORPAY ENDPOINTS ---

class OrderCreateRequest(BaseModel):
    amount: int  # in INR

@app.post("/api/create-order")
def create_order(req: OrderCreateRequest, db: Session = Depends(get_db)):
    if not razorpay_client:
        # Fallback for local dev without real keys
        order_id = f"order_mock_{uuid.uuid4().hex[:10]}"
        new_tx = models.Transaction(
            user_id="user_1",
            order_id=order_id,
            amount=req.amount * 100,
            status="created"
        )
        db.add(new_tx)
        db.commit()
        return {"id": order_id, "amount": req.amount * 100, "currency": "INR", "mock": True}

    # Create Razorpay Order
    amount_in_paise = req.amount * 100
    try:
        order_data = {
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": f"receipt_{uuid.uuid4().hex[:8]}"
        }
        order = razorpay_client.order.create(data=order_data)
        
        # Save to database ledger
        new_tx = models.Transaction(
            user_id="user_1", # static user for prototype
            order_id=order["id"],
            amount=amount_in_paise,
            status="created"
        )
        db.add(new_tx)
        db.commit()
        return order
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class PaymentVerification(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@app.post("/api/verify-payment")
def verify_payment(data: PaymentVerification, db: Session = Depends(get_db)):
    tx = db.query(models.Transaction).filter(models.Transaction.order_id == data.razorpay_order_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Order not found")

    if data.razorpay_order_id.startswith("order_mock_"):
        # Mock verification for testing without real keys
        tx.status = "paid"
        tx.payment_id = data.razorpay_payment_id
        db.commit()
        return {"status": "success", "message": "Mock payment verified"}

    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Razorpay client not configured")

    try:
        # Verify the signature
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': data.razorpay_order_id,
            'razorpay_payment_id': data.razorpay_payment_id,
            'razorpay_signature': data.razorpay_signature
        })
        
        # Update ledger
        tx.status = "paid"
        tx.payment_id = data.razorpay_payment_id
        db.commit()
        
        # Activate subscription in global state
        record = db.query(models.AppData).filter(models.AppData.key == "global_state").first()
        if record and record.value:
            data_dict = record.value
            data_dict["is_subscribed"] = True
            import copy
            record.value = copy.deepcopy(data_dict)
            db.commit()
            
        return {"status": "success"}
    except razorpay.errors.SignatureVerificationError:
        tx.status = "failed"
        db.commit()
        raise HTTPException(status_code=400, detail="Signature verification failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mount frontend at root
app.mount("/", StaticFiles(directory=".", html=True), name="frontend")
