import React, { useCallback, useEffect, useState } from "react";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import CrudModule from "../../../templates/Shared/CrudModule.template";
import { NoRecordsIllustration } from "../../../atoms/Illustrations/Illustrations";
import type { TableColumn } from "../../../organisms/Table/TableV1";
import { useMedicalRecordService, type MedicalRecordResponse } from "../../../../services/useMedicalRecordService";
import { useElderProfileService } from "../../../../services/useElderProfileService";
import { formatDateTime } from "../../../../utils/helper";

// Read-only for the elder themself — records are created by caretakers/family on their
// behalf. sharedOnly=false (unlike the Family view) since this is the elder's own record
// of their own care, not the family-visible subset.
const ElderMedicalRecordsPage: React.FC = () => {
  const medicalRecordService = useMedicalRecordService();
  const elderProfileService = useElderProfileService();
  const [elderProfileId, setElderProfileId] = useState<number | null>(null);

  useEffect(() => {
    elderProfileService
      .getMyProfile()
      .then((p) => setElderProfileId(p.id))
      .catch(() => setElderProfileId(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: TableColumn<MedicalRecordResponse>[] = [
    { key: "type", label: "Type", render: (r) => r.type },
    { key: "title", label: "Title", render: (r) => r.title },
    { key: "notes", label: "Notes", render: (r) => r.notes || "—" },
    {
      key: "document",
      label: "Document",
      render: (r) =>
        r.documentUrl ? (
          <a href={r.documentUrl} target="_blank" rel="noreferrer">
            View
          </a>
        ) : (
          "—"
        ),
    },
    { key: "createdAt", label: "Added", render: (r) => formatDateTime(r.createdAt) },
  ];

  const fetchPage = useCallback(
    async (page: number, size: number) => {
      if (!elderProfileId) {
        return { content: [], totalElements: 0, totalPages: 0, number: 0, size, first: true, last: true, numberOfElements: 0, empty: true };
      }
      return medicalRecordService.getByElder(elderProfileId, false, page, size);
    },
    [medicalRecordService, elderProfileId]
  );

  return (
    <CrudModule<MedicalRecordResponse>
      key={elderProfileId ?? "none"}
      title="My Medical Records"
      description="Prescriptions, treatment notes and lab reports on file for you."
      icon={<FolderSharedIcon color="primary" />}
      columns={columns}
      getRowId={(r) => r.id}
      fetchPage={fetchPage}
      searchable={false}
      entityLabel="medical record"
      emptyIllustration={<NoRecordsIllustration size={96} />}
    />
  );
};

export default ElderMedicalRecordsPage;
