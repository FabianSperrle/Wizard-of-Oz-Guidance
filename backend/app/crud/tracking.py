from sqlalchemy.orm import Session

from models.TrackingEvent import TrackingEvent


def save_tracking(db: Session, event: dict):
    db_event = TrackingEvent(**event)
    db.add(db_event)
    db.commit()
