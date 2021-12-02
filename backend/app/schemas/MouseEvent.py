from pydantic import BaseModel


class MouseEvent(BaseModel):
    id: int
    user: str
    role: str
    x: int
    y: int
    time: int
    type: str
    task: str
