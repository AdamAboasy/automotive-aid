export type AppRole =
  | "admin"
  | "reception"
  | "customer_service"
  | "workshop_manager"
  | "technician"
  | "hr";

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "مدير عام",
  reception: "استقبال",
  customer_service: "خدمة عملاء",
  workshop_manager: "مدير ورشة",
  technician: "فني",
  hr: "موارد بشرية",
};

export const ALL_ROLES: AppRole[] = [
  "admin",
  "reception",
  "customer_service",
  "workshop_manager",
  "technician",
  "hr",
];

// Which roles can access which tab
export const TAB_ACCESS: Record<string, AppRole[]> = {
  dashboard: ["admin", "reception", "customer_service", "workshop_manager", "technician", "hr"],
  reception: ["admin", "reception"],
  customer_service: ["admin", "customer_service"],
  workshop: ["admin", "workshop_manager", "technician"],
  hr: ["admin", "hr"],
  settings: ["admin"],
};

export function canAccess(tab: keyof typeof TAB_ACCESS, roles: AppRole[]): boolean {
  return roles.some((r) => TAB_ACCESS[tab].includes(r));
}
