from sqlalchemy import Column, String, Integer

from database.database import Base


class TLXModel(Base):
    __tablename__ = "tlx"

    user = Column(String(50), primary_key=True)
    role = Column(String(50), primary_key=True)
    condition = Column(String(50), primary_key=True)
    channel = Column(String(50), primary_key=True)

    mental = Column(Integer, nullable=True)
    temporal = Column(Integer, nullable=True)
    performance = Column(Integer, nullable=True)
    effort = Column(Integer, nullable=True)
    frustration = Column(Integer, nullable=True)
