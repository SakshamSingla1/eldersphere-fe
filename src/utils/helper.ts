import { useCallback, useRef } from "react";
import dayjs from "dayjs";
import type { PageResponse } from "./types";

export const replaceUrlParams = (url: string, params: Record<string, any>): string => {
  let result = url;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, String(value));
  }
  return result;
};

export function useDebounce<T extends any[]>(callback: (...args: T) => void, delay: number) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  return useCallback(
    (...args: T) => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callbackRef.current(...args), delay);
    },
    [delay]
  );
}

export const formatDate = (value?: string | null): string => {
  if (!value) return "—";
  const d = dayjs(value);
  return d.isValid() ? d.format("DD MMM YYYY") : "—";
};

export const formatDateTime = (value?: string | null): string => {
  if (!value) return "—";
  const d = dayjs(value);
  return d.isValid() ? d.format("DD MMM YYYY, hh:mm A") : "—";
};

export const formatCurrency = (value?: number | string | null): string => {
  if (value == null || value === "") return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(num)) return "—";
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const getInitials = (name?: string | null): string => {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
};

export const getErrorMessage = (error: any, fallback = "Something went wrong. Please try again."): string => {
  return error?.response?.data?.message || error?.message || fallback;
};

// The backend's ResponseModel envelope carries a machine-readable `errorCode` (e.g.
// "CARETAKER_UNAVAILABLE", "BOOKING_CONFLICT") alongside the human-readable `message` —
// use this when a caller wants to branch on the specific failure rather than just
// display the generic message.
export const getErrorCode = (error: any): string | undefined => {
  return error?.response?.data?.errorCode;
};

// Adapts a plain (non-paginated) list endpoint — e.g. GET /elder-profiles which returns
// a family's elders as a flat array — to the { content, totalElements } shape CrudModule
// expects, with client-side search + pagination. Fine for small per-user collections.
export function paginateClientSide<T>(
  items: T[],
  page: number,
  size: number,
  search: string,
  matchesSearch?: (item: T, search: string) => boolean
): PageResponse<T> {
  const filtered = search && matchesSearch ? items.filter((item) => matchesSearch(item, search.toLowerCase())) : items;
  const start = page * size;
  const content = filtered.slice(start, start + size);
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  return {
    content,
    totalElements: filtered.length,
    totalPages,
    number: page,
    size,
    first: page === 0,
    last: page >= totalPages - 1,
    numberOfElements: content.length,
    empty: content.length === 0,
  };
}
