from typing import List, Dict
import json

from starlette.websockets import WebSocket
from fastapi import HTTPException

from guidance_channels.events.socket_events import CloseEvent
from guidance_channels.schemas import Channel


class ConnectionManager:
    def __init__(self):
        self.connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel: Channel):
        await websocket.accept()
        if channel.name not in self.connections:
            raise HTTPException(status_code=404, detail=f"Channel {channel.name} does not exist")
        self.connections[channel.name].append(websocket)

    async def broadcast(self, message: dict, channel: Channel, websocket: WebSocket):
        # do not broadcast wizard tracking messages
        if message['role'] == 'wizard' and message['type'] in ['tracking', 'mousemove', 'click']:
            return
        for connection in self.connections[channel.name]:
            # if connection is not websocket:
            await connection.send_json(message)

    def register_channel(self, channel: Channel):
        if channel.name in self.connections:
            raise HTTPException(status_code=422, detail=f"Channel {channel.name} does exist already.")
        self.connections[channel.name] = []

    async def delete_channel(self, channel: Channel):
        if channel.name not in self.connections:
            raise HTTPException(status_code=422, detail=f"Channel {channel.name} does not exist.")
        for connection in self.connections[channel.name]:
            await connection.send_text(json.dumps(CloseEvent(reason="Channel deleted").__dict__))
            await self.disconnect(connection)
        del self.connections[channel.name]

    async def disconnect(self, websocket: WebSocket):
        try:
            channel = websocket.url.components.path.split("/")[2]
            self.connections[channel].remove(websocket)
            await websocket.close()
        except RuntimeError:
            print("\n\nERROR ON DISCONNECT\n\n")
            pass

    def get_channels(self):
        return self.connections.keys()


manager = ConnectionManager()


def get_connection_manager():
    return manager

