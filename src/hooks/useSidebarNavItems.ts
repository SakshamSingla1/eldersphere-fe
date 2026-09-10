import { useEffect, useState } from "react";
import { useNavLinkService } from "../services/useNavLinkService";
import { resolveNavIcon } from "../utils/navIcons";
import type { SidebarNavItem } from "../components/molecules/Sidebar/Sidebar";

// Resolves the current user's own sidebar from the DB-backed nav-links catalog (see
// NavLinkController's GET /nav-links/me) instead of each role's Routes.tsx hardcoding a
// NAV_ITEMS array — the backend has already applied super-admin-only and required-permission
// gating (AdminPermissionGuard), so every item returned here is meant to be shown as-is.
// Fetched once per mount (i.e. once per login/full page load for that portal), not on every
// navigation, since the underlying data changes rarely.
export const useSidebarNavItems = (): { navItems: SidebarNavItem[]; loading: boolean } => {
  const navLinkService = useNavLinkService();
  const [navItems, setNavItems] = useState<SidebarNavItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    navLinkService
      .getMine()
      .then((links) => {
        if (cancelled) return;
        setNavItems(
          links.map((link) => ({
            label: link.name,
            path: link.path,
            icon: resolveNavIcon(link.icon),
            group: link.navGroup ?? undefined,
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setNavItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { navItems, loading };
};
