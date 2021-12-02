from typing import Optional

from pydantic import BaseModel


class LikertScaleResults(BaseModel):
    user: str
    task: str
    role: str
    condition: str
    channel: str
    difficulty: Optional[int]
    guidance_quality: Optional[int]
    start: int
    end: int

    class Config:
        orm_mode = True
