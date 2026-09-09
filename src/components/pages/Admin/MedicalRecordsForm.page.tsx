import React, { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import CrudFormPage from "../../templates/Shared/CrudFormPage.template";
import { useMedicalRecordService, type MedicalRecordResponse } from "../../../services/useMedicalRecordService";
import { MedicalRecordTypeEnum, enumToOptions } from "../../../utils/enums";

// Edit page for the Admin Medical Records module (admins can only edit an existing
// record, not create one — see MedicalRecords.page.tsx for the elder-scoped listing this
// navigates back to). The `elderId` query param (added by CrudModule's `extraQuery`) is
// echoed back into `backPath` so Cancel/Save returns to the same elder's records instead
// of resetting to the blank lookup form.
const AdminMedicalRecordFormPage: React.FC = () => {
  const medicalRecordService = useMedicalRecordService();
  const [searchParams] = useSearchParams();
  const elderId = searchParams.get("elderId");

  const getById = useCallback((id: string) => medicalRecordService.getById(Number(id)), [medicalRecordService]);

  return (
    <CrudFormPage<MedicalRecordResponse>
      entityLabel="medical record"
      icon={<FolderSharedIcon color="primary" />}
      backPath={elderId ? `/admin/medical-records?elderId=${elderId}` : "/admin/medical-records"}
      getById={getById}
      fields={[
        { name: "type", label: "Type", type: "select", required: true, options: enumToOptions(MedicalRecordTypeEnum) },
        { name: "title", label: "Title", required: true },
        { name: "notes", label: "Notes", type: "textarea" },
        { name: "sharedWithFamily", label: "Shared with family", type: "checkbox" },
      ]}
      onUpdate={async (row, values) => {
        await medicalRecordService.update(row.id, {
          elderProfileId: row.elderProfileId,
          type: values.type,
          title: values.title,
          notes: values.notes,
          sharedWithFamily: Boolean(values.sharedWithFamily),
          documentFileAssetId: row.documentFileAssetId,
        });
      }}
    />
  );
};

export default AdminMedicalRecordFormPage;
