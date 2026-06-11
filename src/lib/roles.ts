export type AppRole = "admin" | "reception" | "workshop_manager" | "technician" | "hr";

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "مدير عام",
  reception: "خدمة عملاء واستقبال",
  workshop_manager: "مدير ورشة",
  technician: "فني",
  hr: "موارد بشرية",
};

export const ALL_ROLES: AppRole[] = ["admin", "reception", "workshop_manager", "technician", "hr"];

// Which roles can access which tab
export const TAB_ACCESS: Record<string, AppRole[]> = {
  dashboard: ["admin", "reception", "workshop_manager", "technician", "hr"],
  reception: ["admin", "reception"],
  workshop: ["admin", "workshop_manager", "technician"],
  hr: ["admin", "hr"],
  settings: ["admin"],
};

export function canAccess(tab: keyof typeof TAB_ACCESS, roles: AppRole[]): boolean {
  return roles.some((r) => TAB_ACCESS[tab].includes(r));
}
