from sqlalchemy import Integer, Column, String, Float

from database.database import Base


class Station(Base):
    __tablename__ = 'stations'

    id = Column(Integer, primary_key=True, index=True)
    station = Column(String(50))
    name = Column(String(50))
    lat = Column(Float)
    long = Column(Float)
    elevation = Column(Float)
