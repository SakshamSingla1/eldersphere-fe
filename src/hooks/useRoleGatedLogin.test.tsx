import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRoleGatedLogin } from "./useRoleGatedLogin";
import { UserTypeEnum } from "../utils/enums";

// vi.mock factories below are hoisted above any top-level const, so the mock fns they
// close over must themselves be created inside vi.hoisted() rather than as plain consts.
const {
  mockLogin,
  mockSwitchDefaultRole,
  mockSetAuthenticatedUser,
  mockLogout,
  mockNavigate,
  mockSetWsToken,
  mockApplyActiveColorTheme,
} = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockSwitchDefaultRole: vi.fn(),
  mockSetAuthenticatedUser: vi.fn(),
  mockLogout: vi.fn(),
  mockNavigate: vi.fn(),
  mockSetWsToken: vi.fn(),
  mockApplyActiveColorTheme: vi.fn(),
}));

vi.mock("../services/useAuthService", () => ({
  useAuthService: () => ({ login: mockLogin }),
}));

vi.mock("../services/useUserSelfService", () => ({
  useUserSelfService: () => ({ switchDefaultRole: mockSwitchDefaultRole }),
}));

vi.mock("./useAuthenticatedUser", () => ({
  useAuthenticatedUser: () => ({
    setAuthenticatedUser: mockSetAuthenticatedUser,
    logout: mockLogout,
  }),
}));

vi.mock("../contexts/ThemeModeContext", () => ({
  useThemeMode: () => ({
    applyActiveColorTheme: mockApplyActiveColorTheme,
  }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../utils/wsToken", () => ({
  setWsToken: mockSetWsToken,
}));

// Base shape of a successful /auth/login response — individual tests override `userType`
// and `roles` to exercise the multi-role gating logic.
const baseResponse = {
  id: 1,
  fullName: "Jamie Rivera",
  email: "jamie@example.com",
  phone: "555-0100",
  status: "ACTIVE",
  roleId: 10,
  roleName: "Family Member",
  token: "jwt-token-abc",
};

describe("useRoleGatedLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs in directly when the account's primary role is already an allowed role", async () => {
    mockLogin.mockResolvedValue({
      ...baseResponse,
      userType: UserTypeEnum.FAMILY_MEMBER,
      roles: [UserTypeEnum.FAMILY_MEMBER],
    });

    const { result } = renderHook(() => useRoleGatedLogin([UserTypeEnum.FAMILY_MEMBER]));

    let outcome;
    await act(async () => {
      outcome = await result.current.login("jamie@example.com", "Password123!");
    });

    expect(outcome).toEqual({ rejected: false });
    // Already primary — the default-role switch must never be called.
    expect(mockSwitchDefaultRole).not.toHaveBeenCalled();
    expect(mockSetWsToken).toHaveBeenCalledWith("jwt-token-abc");
    expect(mockSetAuthenticatedUser).toHaveBeenCalledWith(
      expect.objectContaining({ userType: UserTypeEnum.FAMILY_MEMBER, roles: [UserTypeEnum.FAMILY_MEMBER] })
    );
    expect(mockNavigate).toHaveBeenCalledWith("/family/dashboard");
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it("switches the default role and logs in when the allowed role is held but not primary", async () => {
    mockLogin.mockResolvedValue({
      ...baseResponse,
      userType: UserTypeEnum.FAMILY_MEMBER,
      roles: [UserTypeEnum.FAMILY_MEMBER, UserTypeEnum.CARETAKER],
    });
    mockSwitchDefaultRole.mockResolvedValue({
      userId: 1,
      roles: [UserTypeEnum.FAMILY_MEMBER, UserTypeEnum.CARETAKER],
      primaryRole: UserTypeEnum.CARETAKER,
    });

    // This portal only admits CARETAKER — the account's primary role is FAMILY_MEMBER,
    // but it also holds CARETAKER, so the hook should flip the primary role rather than
    // rejecting the login.
    const { result } = renderHook(() => useRoleGatedLogin([UserTypeEnum.CARETAKER]));

    let outcome;
    await act(async () => {
      outcome = await result.current.login("jamie@example.com", "Password123!");
    });

    expect(outcome).toEqual({ rejected: false });
    expect(mockSwitchDefaultRole).toHaveBeenCalledWith(UserTypeEnum.CARETAKER);
    expect(mockSetAuthenticatedUser).toHaveBeenCalledWith(
      expect.objectContaining({ userType: UserTypeEnum.CARETAKER })
    );
    // Redirect lands on the newly-primary role's own dashboard, not the old primary's.
    expect(mockNavigate).toHaveBeenCalledWith("/caretaker/dashboard");
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it("rejects and logs out when the account holds none of the allowed roles", async () => {
    mockLogin.mockResolvedValue({
      ...baseResponse,
      userType: UserTypeEnum.FAMILY_MEMBER,
      roles: [UserTypeEnum.FAMILY_MEMBER],
    });

    // This portal only admits ADMIN/SUPER_ADMIN — a family-member account must be
    // rejected, not silently let in.
    const { result } = renderHook(() => useRoleGatedLogin([UserTypeEnum.ADMIN, UserTypeEnum.SUPER_ADMIN]));

    let outcome;
    await act(async () => {
      outcome = await result.current.login("jamie@example.com", "Password123!");
    });

    expect(outcome).toEqual({ rejected: true, userType: UserTypeEnum.FAMILY_MEMBER });
    // Must undo whatever the successful /auth/login call established server-side.
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockSwitchDefaultRole).not.toHaveBeenCalled();
    expect(mockSetAuthenticatedUser).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockSetWsToken).not.toHaveBeenCalled();
  });

  it("falls back to treating userType as the sole held role when the response omits `roles`", async () => {
    mockLogin.mockResolvedValue({
      ...baseResponse,
      userType: UserTypeEnum.ELDER,
      roles: null,
    });

    const { result } = renderHook(() => useRoleGatedLogin([UserTypeEnum.ELDER]));

    let outcome;
    await act(async () => {
      outcome = await result.current.login("elder@example.com", "Password123!");
    });

    expect(outcome).toEqual({ rejected: false });
    expect(mockSwitchDefaultRole).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/elder/dashboard");
  });

  it("rethrows a genuine auth failure (bad credentials/network error) without touching auth state", async () => {
    const authError = new Error("Invalid credentials");
    mockLogin.mockRejectedValue(authError);

    const { result } = renderHook(() => useRoleGatedLogin([UserTypeEnum.FAMILY_MEMBER]));

    await expect(
      act(async () => {
        await result.current.login("jamie@example.com", "wrong-password");
      })
    ).rejects.toThrow("Invalid credentials");

    expect(mockLogout).not.toHaveBeenCalled();
    expect(mockSetAuthenticatedUser).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
