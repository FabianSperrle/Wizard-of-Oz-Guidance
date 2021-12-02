import typing

import orjson
import uvicorn
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi_health import health
from starlette.responses import JSONResponse

from dependencies.database import get_db
from guidance_channels.router import router as channel_router
from weather_data.measurements.router import router as measurement_router
from likert.router import router as likert_router
from candidates.router import router as candidates_router
from tlx.router import router as tlx_router


class ORJSONResponse(JSONResponse):
    media_type = "application/json"

    def render(self, content: typing.Any) -> bytes:
        return orjson.dumps(content)


app = FastAPI(default_response_class=ORJSONResponse)
app.include_router(channel_router)
app.include_router(measurement_router)
app.include_router(likert_router)
app.include_router(candidates_router)
app.include_router(tlx_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def is_database_online(session: bool = Depends(get_db)):
    return session


app.add_api_route("/health", health([is_database_online]))

if __name__ == '__main__':
    uvicorn.run("main:app", host='0.0.0.0', port=8082, reload=True)