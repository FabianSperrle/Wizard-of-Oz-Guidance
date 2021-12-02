import datetime

from sqlalchemy import Column, Integer, DateTime, String, TypeDecorator, BigInteger

from database.database import Base
from models.UnixTimeStamp import UnixTimeStamp


class MouseEvent(Base):
    __tablename__ = "mouseevents"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user = Column(String(80))
    role = Column(String(80))
    x = Column(Integer)
    y = Column(Integer)
    time = Column(UnixTimeStamp)
    type = Column(String(9))
    channel = Column(String(50))
    task = Column(String(50))
    condition = Column(String(50))
