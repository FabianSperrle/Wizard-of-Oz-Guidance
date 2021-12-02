from sqlalchemy import String, Column, Integer, BigInteger

from database.database import Base
from models.UnixTimeStamp import UnixTimeStamp


class TrackingEvent(Base):
    __tablename__ = "tracking"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    type = Column(String(50))
    role = Column(String(10))
    user = Column(String(50))
    channel = Column(String(50))
    time = Column(UnixTimeStamp)
    task = Column(String(50))
    condition = Column(String(50))

    value = Column(String(50000))

    component = Column(String(50))
    name = Column(String(50))
    event = Column(String(50))
