import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FavoritesPage from "./Favorites.page";
import { CaretakerVerificationStatusEnum, ServiceCategoryEnum } from "../../../../utils/enums";

const mockListFavorites = vi.fn();
const mockRemoveFavorite = vi.fn();
const mockShowSnackbar = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../../../../services/useFavoriteCaretakerService", () => ({
  useFavoriteCaretakerService: () => ({
    listFavorites: mockListFavorites,
    removeFavorite: mockRemoveFavorite,
    addFavorite: vi.fn(),
  }),
}));

vi.mock("../../../../contexts/SnackbarContext", () => ({
  useSnackbar: () => ({ showSnackbar: mockShowSnackbar }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const favorite = (overrides: Partial<any> = {}) => ({
  id: 1,
  fullName: "Nina Fernandez",
  profilePhotoUrl: null,
  ratingAverage: 4.5,
  serviceArea: "Andheri West",
  specialties: [ServiceCategoryEnum.NURSING],
  hourlyRate: 500,
  verificationStatus: CaretakerVerificationStatusEnum.VERIFIED,
  ...overrides,
});

describe("FavoritesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads and renders each saved caretaker", async () => {
    mockListFavorites.mockResolvedValue([favorite(), favorite({ id: 2, fullName: "Omar Siddiqui" })]);

    render(<FavoritesPage />);

    expect(await screen.findByText("Nina Fernandez")).toBeInTheDocument();
    expect(screen.getByText("Omar Siddiqui")).toBeInTheDocument();
    expect(mockListFavorites).toHaveBeenCalledTimes(1);
  });

  it("shows the empty state with a CTA when there are no favorites", async () => {
    mockListFavorites.mockResolvedValue([]);

    render(<FavoritesPage />);

    expect(await screen.findByText("No favorites yet")).toBeInTheDocument();
    const cta = screen.getByRole("button", { name: "Find a Caretaker" });
    await userEvent.click(cta);
    expect(mockNavigate).toHaveBeenCalledWith("/family/caretakers");
  });

  it("shows an error snackbar and an empty list when loading favorites fails", async () => {
    // getErrorMessage prefers response.data.message, then error.message, then the
    // caller's fallback — a plain rejection with neither of the first two must surface
    // the fallback text supplied at the call site ("Could not load your favorites").
    mockListFavorites.mockRejectedValue({});

    render(<FavoritesPage />);

    await waitFor(() => expect(mockShowSnackbar).toHaveBeenCalledWith("error", "Could not load your favorites"));
    expect(await screen.findByText("No favorites yet")).toBeInTheDocument();
  });

  it("removes a favorite on click without navigating to the caretaker's profile", async () => {
    mockListFavorites.mockResolvedValue([favorite()]);
    mockRemoveFavorite.mockResolvedValue("removed");
    const user = userEvent.setup();

    render(<FavoritesPage />);
    await screen.findByText("Nina Fernandez");

    const removeButton = screen.getByRole("button", { name: "Remove" });
    await user.click(removeButton);

    await waitFor(() => expect(mockRemoveFavorite).toHaveBeenCalledWith(1));
    // The card itself has an onClick that navigates to the profile — clicking Remove must
    // stop that click from bubbling, so no navigation should have happened.
    expect(mockNavigate).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText("Nina Fernandez")).not.toBeInTheDocument());
    // Removal now offers an "Undo" action (re-adds the favorite via addFavorite) alongside
    // the success message, so the call carries a duration + action object too.
    expect(mockShowSnackbar).toHaveBeenCalledWith(
      "success",
      "Removed Nina Fernandez from favorites",
      expect.any(Number),
      expect.objectContaining({ label: "Undo", onClick: expect.any(Function) })
    );
  });

  it("shows an error snackbar and keeps the card when removal fails", async () => {
    mockListFavorites.mockResolvedValue([favorite()]);
    mockRemoveFavorite.mockRejectedValue({});
    const user = userEvent.setup();

    render(<FavoritesPage />);
    await screen.findByText("Nina Fernandez");

    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() =>
      expect(mockShowSnackbar).toHaveBeenCalledWith("error", "Could not remove this favorite")
    );
    expect(screen.getByText("Nina Fernandez")).toBeInTheDocument();
  });

  it("navigates to the caretaker's profile when the card (not Remove) is clicked", async () => {
    mockListFavorites.mockResolvedValue([favorite()]);
    const user = userEvent.setup();

    render(<FavoritesPage />);
    await screen.findByText("Nina Fernandez");

    await user.click(screen.getByRole("button", { name: "Book Now" }));
    expect(mockNavigate).toHaveBeenCalledWith("/family/caretakers/1");
  });
});
