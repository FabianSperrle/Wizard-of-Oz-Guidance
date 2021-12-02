import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker


def get_db_url():
    DB_PW = os.getenv('DB_PW', 'root')
    DB_USER = os.getenv('DB_USER', 'root')
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '3306')
    DB_NAME = os.getenv('DB_NAME', 'guidance')

    return f"postgresql://{DB_USER}:{DB_PW}@{DB_HOST}:{DB_PORT}/{DB_NAME}"


engine = create_engine(get_db_url())
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def keyvalgen(obj):
    """ Generate attr name/val pairs, filtering out SQLA attrs."""
    excl = ('_sa_adapter', '_sa_instance_state')
    for k, v in vars(obj).items():
        if not k.startswith('_') and not any(hasattr(v, a) for a in excl):
            yield k, v


class BaseClass:
    def __repr__(self):
        params = ', '.join(f'{k}={v}' for k, v in keyvalgen(self))
        return f"{self.__class__.__name__}({params})"


Base = declarative_base(cls=BaseClass)
