import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import CrudModule from "../../../templates/Shared/CrudModule.template";
import type { TableColumn } from "../../../organisms/Table/TableV1";
import Select from "../../../atoms/Select/Select";
import { NoRecordsIllustration } from "../../../atoms/Illustrations/Illustrations";
import { useMedicalRecordService, type MedicalRecordResponse } from "../../../../services/useMedicalRecordService";
import { useElderProfileService, type ElderProfileResponse } from "../../../../services/useElderProfileService";
import { MedicalRecordTypeEnum, enumToOptions } from "../../../../utils/enums";
import { formatDateTime } from "../../../../utils/helper";

const FamilyMedicalRecordsPage: React.FC = () => {
  const navigate = useNavigate();
  const medicalRecordService = useMedicalRecordService();
  const elderProfileService = useElderProfileService();
  const [elders, setElders] = useState<ElderProfileResponse[]>([]);
  const [selectedElder, setSelectedElder] = useState<number | "">("");

  useEffect(() => {
    elderProfileService.getMine().then((list) => {
      setElders(list);
      if (list.length > 0) setSelectedElder(list[0].id);
    });
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
      if (!selectedElder) return { content: [], totalElements: 0, totalPages: 0, number: 0, size, first: true, last: true, numberOfElements: 0, empty: true };
      // Family members only ever see records the caretaker/creator has flagged as shared.
      return medicalRecordService.getByElder(selectedElder, true, page, size);
    },
    [medicalRecordService, selectedElder]
  );

  return (
    <CrudModule<MedicalRecordResponse>
      key={selectedElder}
      title="Medical Records"
      description="Prescriptions, treatment notes and lab reports shared by caretakers."
      icon={<FolderSharedIcon color="primary" />}
      columns={columns}
      getRowId={(r) => r.id}
      fetchPage={fetchPage}
      searchable={false}
      entityLabel="medical record"
      emptyIllustration={<NoRecordsIllustration size={96} />}
      onRowClick={(row) => navigate(`/family/medical-records/${row.id}`)}
      extraToolbarContent={
        <Select
          label="Elder"
          sx={{ minWidth: 200 }}
          value={selectedElder}
          options={elders.map((e) => ({ value: e.id, label: e.name }))}
          onChange={(e) => setSelectedElder(Number(e.target.value))}
        />
      }
      fields={[
        { name: "type", label: "Type", type: "select", required: true, options: enumToOptions(MedicalRecordTypeEnum) },
        { name: "title", label: "Title", required: true },
        { name: "notes", label: "Notes", type: "textarea" },
        { name: "document", label: "Attach Document", type: "file", resourceType: "MEDICAL_RECORD_DOCUMENT" as any },
        { name: "sharedWithFamily", label: "Shared with family", type: "checkbox" },
      ]}
      initialValues={{ sharedWithFamily: true }}
      onCreate={
        selectedElder
          ? async (values) => {
              await medicalRecordService.create({
                elderProfileId: Number(selectedElder),
                type: values.type,
                title: values.title,
                notes: values.notes,
                sharedWithFamily: Boolean(values.sharedWithFamily),
                documentFileAssetId: values.document ?? undefined,
              });
            }
          : undefined
      }
      onDelete={async (row) => {
        await medicalRecordService.remove(row.id);
      }}
    />
  );
};

export default FamilyMedicalRecordsPage;
