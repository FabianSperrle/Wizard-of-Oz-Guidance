from sqlalchemy.orm import Session

from likert.models import LikertScaleResult


def save_likert(db: Session, likert: LikertScaleResult):
    db.add(likert)
    db.commit()
