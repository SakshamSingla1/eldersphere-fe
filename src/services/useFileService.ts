import { useMemo } from "react";
import { request } from ".";
import { replaceUrlParams } from "../utils/helper";
import type { ResourceTypeEnum } from "../utils/enums";

const FILE_URLS = {
  BASE: "/files",
  BY_ID: "/files/:id",
};

export interface FileAssetResponse {
  id: number;
  url: string;
  fileName: string;
  fileType: string;
  resourceType: ResourceTypeEnum;
  uploadedBy?: number;
}

// Mirrors the backend's allowlist exactly (see FileAssetServiceImpl#validateMimeType) so a
// disallowed file is caught here — instantly, no network round trip — instead of only after
// a full upload completes and the server 400s. Kept in one place so every upload surface in
// the app (chat attachments, generic CRUD-form file fields, ...) offers/accepts the same set.
export const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
  "video/x-msvideo",
  "video/x-ms-wmv",
  "video/mpeg",
  "video/3gpp",
  "video/3gpp2",
  "video/x-flv",
  "video/x-matroska",
]);

const isAllowedUploadMimeType = (mimeType: string) =>
  mimeType.startsWith("image/") || ALLOWED_UPLOAD_MIME_TYPES.has(mimeType);

// `accept` value for a general-purpose (not photo-only) file input — image/* plus the
// document and video extensions above, so the OS file picker itself filters out anything
// the backend would reject.
export const ALLOWED_UPLOAD_ACCEPT =
  "image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx";

// Matches the backend's spring.servlet.multipart.max-file-size (100MB) — checked here too so
// an oversized file fails immediately rather than after however long the upload takes to
// reach and get rejected by the server.
export const MAX_UPLOAD_FILE_SIZE_BYTES = 100 * 1024 * 1024;

export const useFileService = () => {
  return useMemo(
    () => ({
      upload: (file: File, resourceType: ResourceTypeEnum) => {
        if (!isAllowedUploadMimeType(file.type)) {
          return Promise.reject(
            new Error(`Unsupported file type: ${file.type || "unknown"}. Only images, PDF, Word, Excel, and video files are allowed.`)
          );
        }
        if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
          return Promise.reject(new Error("File is too large. Maximum upload size is 100MB."));
        }
        const formData = new FormData();
        formData.append("file", file);
        return request<FileAssetResponse>("POST", `${FILE_URLS.BASE}?resourceType=${resourceType}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      },
      getById: (id: number) => request<FileAssetResponse>("GET", replaceUrlParams(FILE_URLS.BY_ID, { id })),
      remove: (id: number) => request<string>("DELETE", replaceUrlParams(FILE_URLS.BY_ID, { id })),
    }),
    []
  );
};
