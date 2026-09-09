import { describe, it, expect } from "vitest";
import { getErrorMessage, getErrorCode, formatCurrency, getInitials, paginateClientSide } from "./helper";

describe("getErrorCode", () => {
  it("reads the backend's machine-readable errorCode off the ResponseModel envelope", () => {
    const error = { response: { data: { errorCode: "BOOKING_CONFLICT", message: "Slot taken" } } };
    expect(getErrorCode(error)).toBe("BOOKING_CONFLICT");
  });

  it("returns undefined when the response has no errorCode (older/plain error shapes)", () => {
    expect(getErrorCode({ response: { data: { message: "Slot taken" } } })).toBeUndefined();
    expect(getErrorCode(new Error("network down"))).toBeUndefined();
    expect(getErrorCode(undefined)).toBeUndefined();
    expect(getErrorCode(null)).toBeUndefined();
  });

  it("lets a caller branch on a specific booking-conflict errorCode distinctly from a generic failure", () => {
    const conflict = { response: { data: { errorCode: "CARETAKER_UNAVAILABLE", message: "Not available" } } };
    const generic = { response: { data: { message: "Server error" } } };

    const describeFailure = (err: any) => {
      const code = getErrorCode(err);
      if (code === "CARETAKER_UNAVAILABLE") return "unavailable";
      if (code === "BOOKING_CONFLICT") return "conflict";
      return "generic";
    };

    expect(describeFailure(conflict)).toBe("unavailable");
    expect(describeFailure(generic)).toBe("generic");
  });
});

describe("getErrorMessage", () => {
  it("prefers the backend's human-readable message over the axios error message", () => {
    const error = { message: "Request failed with status code 409", response: { data: { message: "That slot was just booked." } } };
    expect(getErrorMessage(error)).toBe("That slot was just booked.");
  });

  it("falls back to error.message when there's no response body message", () => {
    expect(getErrorMessage(new Error("Network Error"))).toBe("Network Error");
  });

  it("falls back to the caller-supplied default when nothing else is available", () => {
    expect(getErrorMessage({}, "Could not save changes")).toBe("Could not save changes");
    expect(getErrorMessage(null, "Could not save changes")).toBe("Could not save changes");
  });

  it("uses the generic fallback message when the caller supplies none", () => {
    expect(getErrorMessage({})).toBe("Something went wrong. Please try again.");
  });
});

describe("formatCurrency", () => {
  it("formats a number as INR with two decimal places and thousands separators", () => {
    expect(formatCurrency(1234.5)).toBe("₹1,234.50");
  });

  it("parses a numeric string before formatting", () => {
    expect(formatCurrency("500")).toBe("₹500.00");
  });

  it("renders an em dash for undefined, null, empty string, or non-numeric input", () => {
    expect(formatCurrency(undefined)).toBe("—");
    expect(formatCurrency(null)).toBe("—");
    expect(formatCurrency("")).toBe("—");
    expect(formatCurrency("not-a-number")).toBe("—");
  });
});

describe("getInitials", () => {
  it("takes the first letter of up to the first two words, uppercased", () => {
    expect(getInitials("Asha Patel")).toBe("AP");
    expect(getInitials("madonna")).toBe("M");
    expect(getInitials("Mary Jane Watson")).toBe("MJ");
  });

  it("returns a placeholder for missing/blank names", () => {
    expect(getInitials(undefined)).toBe("?");
    expect(getInitials(null)).toBe("?");
    expect(getInitials("")).toBe("?");
  });
});

describe("paginateClientSide", () => {
  const items = Array.from({ length: 25 }, (_, i) => ({ id: i, name: `Item ${i}` }));

  it("slices the filtered list to the requested page/size and reports pagination flags", () => {
    const page0 = paginateClientSide(items, 0, 10, "");
    expect(page0.content).toHaveLength(10);
    expect(page0.content[0].id).toBe(0);
    expect(page0.first).toBe(true);
    expect(page0.last).toBe(false);
    expect(page0.totalElements).toBe(25);
    expect(page0.totalPages).toBe(3);

    const lastPage = paginateClientSide(items, 2, 10, "");
    expect(lastPage.content).toHaveLength(5);
    expect(lastPage.last).toBe(true);
  });

  it("filters by the search term via the supplied matcher before paginating", () => {
    const result = paginateClientSide(items, 0, 10, "item 1", (item, search) =>
      item.name.toLowerCase().includes(search)
    );
    // "item 1" matches Item 1, 10-19 -> 11 matches
    expect(result.totalElements).toBe(11);
  });

  it("skips filtering when no search term or matcher is supplied", () => {
    const result = paginateClientSide(items, 0, 100, "");
    expect(result.totalElements).toBe(25);
    expect(result.empty).toBe(false);
  });
});
