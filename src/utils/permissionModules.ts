// Groups the flat RBAC permission catalog (see PermissionController#getAll — names like
// "BOOKINGS_VIEW"/"BOOKINGS_MANAGE") by the admin-panel module they gate, for the Roles &
// Permissions admin UI's permission picker and the Admin Users "assign role" consequence
// copy. Friendly labels are hand-mapped for the actual seeded catalog (see
// V36__seed_admin_rbac_permissions_and_demo_role.sql) with a title-case fallback for
// anything created later through the Permissions CRUD tab that doesn't fit the pattern.
const MODULE_LABELS: Record<string, string> = {
  USERS: "Users",
  CARETAKER_VERIFICATION: "Caretaker Verification",
  ELDER_PROFILES: "Elder Profiles",
  SERVICES: "Services",
  BOOKINGS: "Bookings",
  MEDICAL_RECORDS: "Medical Records",
  REVIEWS: "Reviews",
  EMERGENCY_ALERTS: "Emergency Alerts",
  LANDING_MANAGEMENT: "Landing Management",
  CONTACT_US: "Contact Us",
  ROLES_PERMISSIONS: "Roles & Permissions",
  PLATFORM_SETTINGS: "Platform Settings",
  ANALYTICS: "Analytics",
};

export function permissionModuleKey(permissionName: string): string {
  return permissionName.replace(/_(VIEW|MANAGE)$/, "");
}

export function permissionModuleLabel(moduleKey: string): string {
  if (MODULE_LABELS[moduleKey]) return MODULE_LABELS[moduleKey];
  return moduleKey
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export interface PermissionModuleGroup<T> {
  moduleKey: string;
  moduleLabel: string;
  permissions: T[];
}

export function groupPermissionsByModule<T extends { name: string }>(permissions: T[]): PermissionModuleGroup<T>[] {
  const map = new Map<string, T[]>();
  for (const p of permissions) {
    const key = permissionModuleKey(p.name);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return Array.from(map.entries())
    .map(([moduleKey, perms]) => ({ moduleKey, moduleLabel: permissionModuleLabel(moduleKey), permissions: perms }))
    .sort((a, b) => a.moduleLabel.localeCompare(b.moduleLabel));
}

/** Distinct module labels a set of permission names touches, in display order — used for
 * "this admin will only be able to access: X, Y, Z" copy. */
export function distinctModuleLabels(permissionNames: string[]): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const name of permissionNames) {
    const key = permissionModuleKey(name);
    if (!seen.has(key)) {
      seen.add(key);
      labels.push(permissionModuleLabel(key));
    }
  }
  return labels.sort((a, b) => a.localeCompare(b));
}
