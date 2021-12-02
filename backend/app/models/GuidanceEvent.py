from sqlalchemy import Column, String, Integer, BigInteger

from database.database import Base
from models.UnixTimeStamp import UnixTimeStamp


class GuidanceEvent(Base):
    __tablename__ = "guidance"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    type = Column(String(50))
    role = Column(String(50))
    user = Column(String(50))
    channel = Column(String(50))
    time = Column(UnixTimeStamp)
    task = Column(String(50))
    condition = Column(String(50))

    value = Column(String(50000))

    interaction = Column(String(50))
    degree = Column(String(50), nullable=True)

    suggestion_id = Column(BigInteger)
    suggestion_event = Column(String(50))
