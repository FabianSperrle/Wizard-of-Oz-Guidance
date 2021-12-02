from pydantic import BaseModel


class CloseEvent:
    reason: str
    type = "CloseEvent"

    def __init__(self, reason):
        self.reason = reason
