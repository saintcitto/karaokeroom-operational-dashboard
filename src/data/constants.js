export const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
export const ROOM_CAPACITY = {
  A: 10,
  B: 10,
  VIP: 10,
};

export const INITIAL_ROOMS = [
  { id: "KTV1", name: "KTV 1", capacity: ROOM_CAPACITY.A },
  { id: "KTV2", name: "KTV 2", capacity: ROOM_CAPACITY.A },
  { id: "KTV3", name: "KTV 3", capacity: ROOM_CAPACITY.A },
  { id: "KTV4", name: "KTV 4", capacity: ROOM_CAPACITY.A },
  { id: "KTV5", name: "KTV 5", capacity: ROOM_CAPACITY.B },
  { id: "KTV8", name: "KTV 8", capacity: ROOM_CAPACITY.B },
  { id: "KTV9", name: "KTV 9", capacity: ROOM_CAPACITY.B },
  { id: "KTV10", name: "KTV 10", capacity: ROOM_CAPACITY.B },
  { id: "KTV11", name: "KTV 11", capacity: ROOM_CAPACITY.VIP },
  { id: "KTV12", name: "KTV 12", capacity: ROOM_CAPACITY.VIP },
];

export const MOCK_USERS = {
  staff01: "1234",
  admin01: "admin",
};
