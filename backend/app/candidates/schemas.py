from pydantic import BaseModel


class Candidates(BaseModel):
    user: str
    task: str
    role: str
    condition: str
    channel: str
    candidates: str
    start: int
    end: int

    class Config:
        orm_mode = True
