from typing import Optional

from pydantic import BaseModel


class TLXResults(BaseModel):
    user: str
    role: str
    condition: str
    channel: str

    mental: Optional[int]
    temporal: Optional[int]
    performance: Optional[int]
    effort: Optional[int]
    frustration: Optional[int]

    class Config:
        orm_mode = True
