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

export const useFileService = () => {
  return useMemo(
    () => ({
      upload: (file: File, resourceType: ResourceTypeEnum) => {
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
