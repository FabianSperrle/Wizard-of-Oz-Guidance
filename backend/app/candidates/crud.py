from sqlalchemy.orm import Session

from candidates.models import CandidatesModel


def save_candidates(db: Session, candidates: CandidatesModel):
    db.add(candidates)
    db.commit()
