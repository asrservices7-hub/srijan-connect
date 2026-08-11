from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime
from datetime import datetime
from database import Base

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    order_id = Column(String, unique=True, index=True)
    payment_id = Column(String, index=True, nullable=True)
    amount = Column(Integer)  # stored in paise (e.g. 10000 for 100 INR)
    currency = Column(String, default="INR")
    status = Column(String, default="created")  # created, paid, failed
    created_at = Column(DateTime, default=datetime.utcnow)

class AppData(Base):
    """
    Since we don't have full auth yet, this table stores the generic JSON payload 
    from the frontend (replacing database.json).
    """
    __tablename__ = "app_data"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(JSON)
