export type EventKind = "concerts" | "sport-events" | "weddings";

export function getEventDetailHref(kind: EventKind, id: number) {
  return `/events/${kind}/${id}`;
}
