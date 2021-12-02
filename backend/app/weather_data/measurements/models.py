from sqlalchemy import Integer, Column, String, DateTime, Float

from database.database import Base


class Measurement(Base):
    __tablename__ = 'measurements'

    id = Column(Integer, primary_key=True, index=True)
    station = Column(String(50)) # TODO add foreign key
    continent = Column(String(50))
    date = Column(DateTime)

    humidity = Column(Float)
    pressure = Column(Float)
    temperature = Column(Float)
    min_temp = Column(Float)
    max_temp = Column(Float)
    wind_direction = Column(Float)
    wind_speed = Column(Float)
    rainy_days = Column(Float)
    foggy_days = Column(Float)
    snowy_days = Column(Float)
    stormy_days = Column(Float)
    cloudy_days = Column(Float)
    rain = Column(Float)
    snow = Column(Float)
