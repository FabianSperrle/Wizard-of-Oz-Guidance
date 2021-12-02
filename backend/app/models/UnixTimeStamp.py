from datetime import datetime, timezone

from sqlalchemy import TypeDecorator, DateTime


class UnixTimeStamp(TypeDecorator):
    impl = DateTime

    def __init__(self):
        TypeDecorator.__init__(self)

    def process_bind_param(self, value, dialect):
        return datetime.utcfromtimestamp(value / 1000)

    def process_result_value(self, value, dialect):
        return value.replace(tzinfo=timezone.utc).timestamp() * 1000
