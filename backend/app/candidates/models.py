from sqlalchemy import Column, String, Integer

from database.database import Base
from models.UnixTimeStamp import UnixTimeStamp


class CandidatesModel(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user = Column(String(50))
    task = Column(String(50))
    role = Column(String(50))
    channel = Column(String(50))
    condition = Column(String(50))
    candidates = Column(String(5000))

    start = Column(UnixTimeStamp, nullable=True)
    end = Column(UnixTimeStamp, nullable=True)
