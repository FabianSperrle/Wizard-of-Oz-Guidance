import json
from typing import List

from fastapi import APIRouter, Depends
from starlette.websockets import WebSocket, WebSocketDisconnect

from crud.guidance import save_guidance
from crud.tracking import save_tracking
from database.database import SessionLocal
from dependencies.database import get_db
from dependencies.socket_manager import ConnectionManager
from guidance_channels.schemas import Channel
from dependencies import socket_manager
from crud.mouse import save_mouse
from models.GuidanceEvent import GuidanceEvent

import logging

logger = logging.Logger('catch_all')

router = APIRouter(
    prefix="/channels",
    tags=["channels"],
    responses={404: {"description": "Not found"}}
)


@router.get("/")
def get_channels(manager: ConnectionManager = Depends(socket_manager.get_connection_manager)) -> List[Channel]:
    return list(map(lambda x: Channel(name=x), manager.get_channels()))


@router.post("/create")
def create_channels(channel: Channel, manager: ConnectionManager = Depends(socket_manager.get_connection_manager)) -> List[Channel]:
    manager.register_channel(channel)
    return list(map(lambda x: Channel(name=x), manager.get_channels()))


@router.post("/delete")
async def delete_channels(channel: Channel, manager: ConnectionManager = Depends(socket_manager.get_connection_manager)) -> List[Channel]:
    print("deleting channel")
    await manager.delete_channel(channel)
    print(manager.get_channels)
    print("deleted channel")
    return list(map(lambda x: Channel(name=x), manager.get_channels()))


@router.websocket("/channels/{channel_name}/{client_id}")
async def chatroom_ws(client_id: str, websocket: WebSocket, channel_name: str,
                      manager: ConnectionManager = Depends(socket_manager.get_connection_manager),
                      session: SessionLocal = Depends(get_db)):
    if channel_name is None or client_id is None:
        raise ValueError("Please specify a channel name and a Client ID")
    channel = Channel(name=channel_name)
    await manager.connect(websocket, channel)
    try:
        while True:
            data = await websocket.receive_json(mode="text")
            try:
                await manager.broadcast(data, channel, websocket)
                # store to DB
                if data['type'] in ['mousemove', 'click']:
                    save_mouse(session, data)
                elif data['type'] == 'tracking':
                    # do not store values for now
                    if 'value' in data:
                        data['value'] = json.dumps(data['value'])
                    save_tracking(session, data)
                elif data['type'] == 'guidance':
                    value = None
                    if 'value' in data:
                        value = json.dumps(data['value'])
                    guidance = GuidanceEvent(
                        type=data['type'],
                        role=data['role'],
                        user=data['user'],
                        time=data['time'],
                        channel=data['channel'],
                        task=data['task'],
                        interaction=data['interaction'],
                        condition=data['condition'],
                        suggestion_event=data['suggestion']['event']['event'],
                        suggestion_id=data['suggestion']['event']['time'],
                        value=value
                    )
                    if 'degree' in data:
                        guidance.degree = data['degree']
                    save_guidance(session, guidance)
            except Exception as e:
                logger.error("got error while processing message", exc_info=True)
    except WebSocketDisconnect:
        print("got disconnect exception")
        await manager.disconnect(websocket)
