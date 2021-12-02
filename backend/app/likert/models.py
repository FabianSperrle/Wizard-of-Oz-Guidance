from sqlalchemy import Column, String, Integer

from database.database import Base
from models.UnixTimeStamp import UnixTimeStamp


class LikertScaleResult(Base):
    __tablename__ = "likert"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user = Column(String(50))
    task = Column(String(50))
    channel = Column(String(50))
    role = Column(String(50))
    condition = Column(String(50))

    difficulty = Column(Integer, nullable=True)
    guidance_quality = Column(Integer, nullable=True)

    start = Column(UnixTimeStamp, nullable=True)
    end = Column(UnixTimeStamp, nullable=True)
