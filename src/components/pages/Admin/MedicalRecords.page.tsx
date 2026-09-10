import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, Alert } from "@mui/material";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import PageHeader from "../../molecules/PageHeader/PageHeader";
import CrudModule from "../../templates/Shared/CrudModule.template";
import type { TableColumn } from "../../organisms/Table/TableV1";
import ElderProfileSearchAutocomplete from "../../molecules/ElderProfileSearchAutocomplete/ElderProfileSearchAutocomplete";
import { useMedicalRecordService, type MedicalRecordResponse } from "../../../services/useMedicalRecordService";
import { useElderProfileService } from "../../../services/useElderProfileService";
import { formatDateTime } from "../../../utils/helper";

// Note: MedicalRecordController only lists records scoped to one elder
// (`GET /medical-records/elder/{elderProfileId}`) — there's no admin-wide listing
// endpoint, so this page looks records up by elder (found by name) rather than showing a
// global table.
const AdminMedicalRecordsPage: React.FC = () => {
  const medicalRecordService = useMedicalRecordService();
  const elderProfileService = useElderProfileService();
  const [searchParams] = useSearchParams();
  const [activeElderId, setActiveElderId] = useState<number | null>(() => {
    const fromUrl = searchParams.get("elderId");
    return fromUrl ? Number(fromUrl) : null;
  });
  const [activeElderName, setActiveElderName] = useState<string | null>(null);

  // Returning here from the edit page (see MedicalRecordsForm.page.tsx, which passes
  // `?elderId=` back through as part of its backPath) should land back on the same elder's
  // records rather than resetting to the blank lookup form — this re-syncs from the URL if
  // it changes (e.g. the browser back button) without re-running on every render. The name
  // isn't in the URL, so it's re-fetched by ID in that case (a name-search picker has no
  // reason to know it up front).
  useEffect(() => {
    const fromUrl = searchParams.get("elderId");
    const fromUrlId = fromUrl ? Number(fromUrl) : null;
    if (fromUrlId && fromUrlId !== activeElderId) {
      setActiveElderId(fromUrlId);
    }
    if (fromUrlId && !activeElderName) {
      elderProfileService.getById(fromUrlId).then((profile) => setActiveElderName(profile.name)).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const columns: TableColumn<MedicalRecordResponse>[] = [
    { key: "type", label: "Type", render: (r) => r.type },
    { key: "title", label: "Title", render: (r) => r.title },
    { key: "shared", label: "Shared with Family", render: (r) => (r.sharedWithFamily ? "Yes" : "No") },
    { key: "notes", label: "Notes", render: (r) => r.notes || "—" },
    { key: "createdAt", label: "Added", render: (r) => formatDateTime(r.createdAt) },
  ];

  const fetchPage = useCallback(
    async (page: number, size: number) => {
      if (!activeElderId) return { content: [], totalElements: 0, totalPages: 0, number: 0, size, first: true, last: true, numberOfElements: 0, empty: true };
      return medicalRecordService.getByElder(activeElderId, false, page, size);
    },
    [medicalRecordService, activeElderId]
  );

  return (
    <div>
      <PageHeader icon={<FolderSharedIcon color="primary" />} title="Medical Records" />
      <Alert severity="info" sx={{ mb: 2 }}>
        Records are only listable per elder profile — find an elder by name to view and manage their records.
      </Alert>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <ElderProfileSearchAutocomplete
            label="Find an elder"
            placeholder="Search by name"
            onSelect={(profile) => {
              setActiveElderId(profile?.id ?? null);
              setActiveElderName(profile?.name ?? null);
            }}
          />
        </CardContent>
      </Card>

      {activeElderId && (
        <CrudModule<MedicalRecordResponse>
          key={activeElderId}
          title={activeElderName ? `Records for ${activeElderName}` : `Records for Elder #${activeElderId}`}
          columns={columns}
          getRowId={(r) => r.id}
          fetchPage={fetchPage}
          searchable={false}
          entityLabel="medical record"
          basePath="/admin/medical-records"
          extraQuery={`elderId=${activeElderId}`}
          onUpdate={async (row, values) => {
            await medicalRecordService.update(row.id, {
              elderProfileId: activeElderId,
              type: values.type,
              title: values.title,
              notes: values.notes,
              sharedWithFamily: Boolean(values.sharedWithFamily),
              documentFileAssetId: row.documentFileAssetId,
            });
          }}
          onDelete={async (row) => {
            await medicalRecordService.remove(row.id);
          }}
        />
      )}
    </div>
  );
};

export default AdminMedicalRecordsPage;
