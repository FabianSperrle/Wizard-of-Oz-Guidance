export type OptionalNumber = number | undefined;

export function safeExtent([x, y]: [OptionalNumber, OptionalNumber]): [number, number] {
  return [Math.min(x ?? 0, 0), y ?? 0];
}

export function safeExtentMinZero([x, y]: [OptionalNumber, OptionalNumber]): [number, number] {
  return [0, y ?? 0];
}
