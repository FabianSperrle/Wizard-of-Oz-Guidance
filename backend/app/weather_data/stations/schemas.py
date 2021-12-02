from pydantic import BaseModel


class Station(BaseModel):
    id: int
    station: str
    name: str
    lat: float
    long: float
    elevation: float

    class Config:
        orm_mode = True
