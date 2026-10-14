// engine/roomManager.js
// Mantém a sala atual e o histórico mínimo usado pelo minimapa.

class RoomManager {
  constructor(rooms, initialRoomId) {
    this.rooms = rooms;
    this.currentRoomId = null;
    this.visited = new Set();
    this.enter(initialRoomId);
  }

  get currentRoom() {
    return this.rooms[this.currentRoomId];
  }

  getRoom(roomId) {
    return this.rooms[roomId] || null;
  }

  enter(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return null;
    this.currentRoomId = roomId;
    this.visited.add(roomId);
    return room;
  }

  getSpawn(spawnId) {
    const room = this.currentRoom;
    if (!room) return null;
    return room.spawns[spawnId] || null;
  }
}

if (typeof module !== 'undefined') module.exports = RoomManager;
