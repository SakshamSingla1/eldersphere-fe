// Mirrors com.eldersphere.payload.ResponseModel<T> — every backend response is wrapped in this envelope.
export interface ApiEnvelope<T> {
  message: string;
  status: "SUCCESS" | "FAILED" | "INTERNAL_SERVER_ERROR";
  data: T;
  errorCode?: string;
}

// Mirrors Spring's org.springframework.data.domain.Page<T> JSON shape.
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // current page, 0-based
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface AuditableResponse {
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiError {
  message: string;
  errorCode?: string;
  status?: number;
}
