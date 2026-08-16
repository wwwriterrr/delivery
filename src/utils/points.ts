/**
 * СДЭК returns `type: "PVZ" | "POSTAMAT"`. Anything unrecognised — including a
 * missing value — is treated as a staffed point, which is the safe default:
 * it promises the customer less automation, not more.
 */
export type PointKind = "pvz" | "postamat";

export function pointKind(type: string | undefined): PointKind {
  return type?.toUpperCase() === "POSTAMAT" ? "postamat" : "pvz";
}

export const POINT_KIND_LABEL: Record<PointKind, string> = {
  pvz: "ПВЗ",
  postamat: "Постамат",
};
