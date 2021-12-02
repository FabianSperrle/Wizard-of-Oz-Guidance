import datetime
from typing import Optional

from pydantic import BaseModel


class SimpleMeasurement(BaseModel):
    id: int
    station: str
    date: datetime.datetime
    continent: Optional[str] = None

    humidity: Optional[float] = None
    pressure: Optional[float] = None
    temperature: Optional[float] = None
    min_temp: Optional[float] = None
    max_temp: Optional[float] = None
    wind_direction: Optional[float] = None
    wind_speed: Optional[float] = None
    rainy_days: Optional[float] = None
    foggy_days: Optional[float] = None
    snowy_days: Optional[float] = None
    stormy_days: Optional[float] = None
    cloudy_days: Optional[float] = None
    # rain: Optional[float] = None
    # snow: Optional[float] = None

    class Config:
        orm_mode = True
