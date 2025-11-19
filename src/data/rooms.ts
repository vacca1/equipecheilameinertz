// Lista centralizada de salas da clínica
export const rooms = [
  "Sala 1",
  "Sala 2",
  "Sala 3",
  "Sala 4",
  "Sala 5",
  "Sala 6",
] as const;

export type Room = typeof rooms[number];
