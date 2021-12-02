from sqlalchemy.orm import Session

from models.GuidanceEvent import GuidanceEvent


def save_guidance(db: Session, guidance: GuidanceEvent):
    db.add(guidance)
    db.commit()
