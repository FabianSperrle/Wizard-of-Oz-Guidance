from sqlalchemy.orm import Session

from tlx.models import TLXModel


def save_tlx(db: Session, tlx: TLXModel):
    db.add(tlx)
    db.commit()
