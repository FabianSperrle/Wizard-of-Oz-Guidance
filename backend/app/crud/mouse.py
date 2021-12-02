from sqlalchemy.orm import Session

from models.MouseEvent import MouseEvent


def save_mouse(db: Session, mouse: dict):
    db_event = MouseEvent(**mouse)
    db.add(db_event)
    db.commit()
