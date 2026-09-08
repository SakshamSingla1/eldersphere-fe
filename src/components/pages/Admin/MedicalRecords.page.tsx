import React, { useCallback, useState } from "react";
import { Card, CardContent, Stack, Alert, Typography } from "@mui/material";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import PageHeader from "../../molecules/PageHeader/PageHeader";
import CrudModule from "../../templates/Shared/CrudModule.template";
import type { TableColumn } from "../../organisms/Table/TableV1";
import TextField from "../../atoms/TextField/TextField";
import Button from "../../atoms/Button/Button";
import { useMedicalRecordService, type MedicalRecordResponse } from "../../../services/useMedicalRecordService";
import { MedicalRecordTypeEnum, enumToOptions } from "../../../utils/enums";
import { formatDateTime } from "../../../utils/helper";

// Note: MedicalRecordController only lists records scoped to one elder
// (`GET /medical-records/elder/{elderProfileId}`) — there's no admin-wide listing
// endpoint, so this page looks records up by elder ID rather than showing a global table.
const AdminMedicalRecordsPage: React.FC = () => {
  const medicalRecordService = useMedicalRecordService();
  const [elderIdInput, setElderIdInput] = useState("");
  const [activeElderId, setActiveElderId] = useState<number | null>(null);

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
        Records are only listable per elder profile — enter an elder's ID (visible from Admin &gt; Bookings) to view
        and manage their records.
      </Alert>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction="row"
            spacing={2}
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              setActiveElderId(Number(elderIdInput));
            }}
          >
            <TextField label="Elder Profile ID" type="number" value={elderIdInput} onChange={(e) => setElderIdInput(e.target.value)} />
            <Button type="submit" variant="primary">
              Load Records
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {activeElderId && (
        <CrudModule<MedicalRecordResponse>
          key={activeElderId}
          title={`Records for Elder #${activeElderId}`}
          columns={columns}
          getRowId={(r) => r.id}
          fetchPage={fetchPage}
          searchable={false}
          entityLabel="medical record"
          fields={[
            { name: "type", label: "Type", type: "select", required: true, options: enumToOptions(MedicalRecordTypeEnum) },
            { name: "title", label: "Title", required: true },
            { name: "notes", label: "Notes", type: "textarea" },
            { name: "sharedWithFamily", label: "Shared with family", type: "checkbox" },
          ]}
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
