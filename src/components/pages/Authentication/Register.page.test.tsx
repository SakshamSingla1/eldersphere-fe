import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import RegisterPage from "./Register.page";

const mockRegister = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../../../services/useAuthService", () => ({
  useAuthService: () => ({ register: mockRegister }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const fillRequiredFields = async (user: ReturnType<typeof userEvent.setup>, password: string) => {
  await user.type(screen.getByLabelText(/Full Name/i), "Priya Nair");
  await user.type(screen.getByLabelText(/^Email/i), "priya@example.com");
  await user.type(screen.getByLabelText(/^Password/i), password);
};

describe("RegisterPage password validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks submission and shows a validation error for a password that fails the backend's rule", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />, { wrapper: BrowserRouter });

    // Too short and missing an uppercase/digit — must not reach the register call.
    await fillRequiredFields(user, "weak");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(
      await screen.findByText(
        "Password must be at least 8 characters and include an uppercase letter and a digit."
      )
    ).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("rejects a password missing a digit even when long enough with an uppercase letter", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />, { wrapper: BrowserRouter });

    await fillRequiredFields(user, "LongEnoughPassword");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(
      await screen.findByText(
        "Password must be at least 8 characters and include an uppercase letter and a digit."
      )
    ).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("submits and redirects to the role's own login page once the password satisfies the rule", async () => {
    mockRegister.mockResolvedValue({ id: 1, email: "priya@example.com", fullName: "Priya Nair", userType: "FAMILY_MEMBER" });
    const user = userEvent.setup();
    render(<RegisterPage />, { wrapper: BrowserRouter });

    await fillRequiredFields(user, "Password123!");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: "Priya Nair",
          email: "priya@example.com",
          password: "Password123!",
          userType: "FAMILY_MEMBER",
        })
      )
    );
    expect(mockNavigate).toHaveBeenCalledWith("/login/family", { state: { registered: true } });
    expect(screen.queryByText(/Password must be at least/)).not.toBeInTheDocument();
  });

  it("surfaces the backend's error message and does not navigate when registration fails", async () => {
    mockRegister.mockRejectedValue({ response: { data: { message: "Email already registered." } } });
    const user = userEvent.setup();
    render(<RegisterPage />, { wrapper: BrowserRouter });

    await fillRequiredFields(user, "Password123!");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(await screen.findByText("Email already registered.")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("switches the target role (and its login redirect) when a different account type is selected", async () => {
    mockRegister.mockResolvedValue({ id: 2, email: "raj@example.com", fullName: "Raj Kumar", userType: "CARETAKER" });
    const user = userEvent.setup();
    render(<RegisterPage />, { wrapper: BrowserRouter });

    await user.click(screen.getByRole("button", { name: /Caretaker/i }));
    await user.type(screen.getByLabelText(/Full Name/i), "Raj Kumar");
    await user.type(screen.getByLabelText(/^Email/i), "raj@example.com");
    await user.type(screen.getByLabelText(/^Password/i), "Password123!");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({ userType: "CARETAKER" }))
    );
    expect(mockNavigate).toHaveBeenCalledWith("/login/caretaker", { state: { registered: true } });
  });
});
