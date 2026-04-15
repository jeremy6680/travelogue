export type EventKind =
  | "concerts"
  | "sport-events"
  | "tech-events"
  | "running"
  | "weddings";

export function getEventDetailHref(kind: EventKind, id: number) {
  return `/events/${kind}/${id}`;
}
