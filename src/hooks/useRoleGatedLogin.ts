import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthService } from "../services/useAuthService";
import { useUserSelfService } from "../services/useUserSelfService";
import { useAuthenticatedUser } from "./useAuthenticatedUser";
import { homePathForUser } from "../routes/ProtectedRoute";
import { setWsToken } from "../utils/wsToken";
import type { UserTypeEnum } from "../utils/enums";

// Result of a login attempt that succeeded at the auth layer but was rejected for landing
// on the wrong portal (e.g. an admin using the regular /login, or a non-admin using
// /admin/login). Distinct from a thrown error, which means the credentials themselves
// were bad — callers should only show the "wrong portal" copy for this shape.
export interface RoleGatedLoginRejection {
  rejected: true;
  userType: UserTypeEnum;
}

export type RoleGatedLoginResult = RoleGatedLoginRejection | { rejected: false };

// Shared login logic for every portal that only wants to admit certain user types
// (the regular /login page is now a role picker; each dedicated page — /admin/login,
// /login/super-admin, /login/elder, /login/caretaker, /login/family — passes the one or
// two UserTypeEnum values it accepts). Centralizing this means extending the check later
// only requires touching this one hook instead of every page that logs a user in.
//
// Accounts can hold MULTIPLE roles (e.g. the same email/password as both FAMILY_MEMBER and
// CARETAKER) — the login response carries `userType` (the account's current primary/default
// role) alongside `roles` (every role it holds). So "does this portal admit this account"
// is no longer just "is userType in the allowed list": it's "does the account hold ANY of
// the allowed roles at all", and if the role it's logging in as isn't currently primary,
// this hook switches the account's primary role to it (via PUT /users/me/default-role)
// before establishing the session, so the redirect lands on the role's own dashboard.
//
// On success for an account holding at least one allowed role:
//   - if that role is already primary, establishes the session exactly like the
//     pre-existing login flow (ws token + AuthenticatedUserContext + redirect home).
//   - if it's held but not primary, switches the primary role first, then does the above
//     using the newly-primary role.
// On success for an account holding NONE of the allowed roles: undoes anything the
// successful auth call established (via the same `logout()` used elsewhere — clears the
// httpOnly cookie server-side, the local user profile, and the ws token) and resolves
// { rejected: true, userType } instead of navigating anywhere, so the caller can render a
// portal-specific rejection message.
// On a genuine auth failure (bad credentials, network error), the underlying error is
// rethrown for the caller's existing try/catch.
export const useRoleGatedLogin = (allowedUserTypes: UserTypeEnum[]) => {
  const authService = useAuthService();
  const userSelfService = useUserSelfService();
  const { setAuthenticatedUser, logout } = useAuthenticatedUser();
  const navigate = useNavigate();

  const login = useCallback(
    async (email: string, password: string): Promise<RoleGatedLoginResult> => {
      const response = await authService.login(email, password);
      // Older backends (or a response missing the field) only ever gave us the one
      // primary role — treat that as the account's complete role set in that case.
      const heldRoles = response.roles && response.roles.length > 0 ? response.roles : [response.userType];

      const matchedRole = allowedUserTypes.find((rt) => heldRoles.includes(rt));
      if (!matchedRole) {
        // This account holds none of the roles this portal admits — don't leave it
        // half-authenticated.
        await logout();
        return { rejected: true, userType: response.userType };
      }

      let effectiveUserType = response.userType;
      if (matchedRole !== response.userType) {
        // Account holds the role this portal wants, just not as its current primary —
        // flip it server-side before establishing the session so the redirect (and future
        // logins) land here.
        await userSelfService.switchDefaultRole(matchedRole);
        effectiveUserType = matchedRole;
      }

      // Login is the only response that ever carries the raw JWT (see LoginResponseDTO) —
      // stash it for the WebSocket handshake; every other request relies on the httpOnly cookie.
      setWsToken(response.token);
      setAuthenticatedUser({
        id: response.id,
        fullName: response.fullName,
        email: response.email,
        phone: response.phone,
        userType: effectiveUserType,
        status: response.status,
        roleId: response.roleId ?? undefined,
        roleName: response.roleName ?? undefined,
        roles: heldRoles,
      });
      navigate(homePathForUser(effectiveUserType));
      return { rejected: false };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authService, userSelfService, logout, setAuthenticatedUser, navigate, ...allowedUserTypes]
  );

  return useMemo(() => ({ login }), [login]);
};
