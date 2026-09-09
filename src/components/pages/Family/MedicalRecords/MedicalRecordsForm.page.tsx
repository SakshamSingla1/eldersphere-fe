import React from "react";
import { useSearchParams } from "react-router-dom";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import CrudFormPage from "../../../templates/Shared/CrudFormPage.template";
import { useMedicalRecordService } from "../../../../services/useMedicalRecordService";
import { MedicalRecordTypeEnum, enumToOptions } from "../../../../utils/enums";

// Add page for the family Medical Records module — create-only (family members can't
// edit a record after creating it; see MedicalRecords.page.tsx for the elder-scoped
// listing this navigates back to). The `elderId` query param (added by CrudModule's
// `extraQuery`) is echoed back into `backPath` so Cancel/Save returns with the same
// elder still selected instead of resetting to the first one in the list.
const FamilyMedicalRecordFormPage: React.FC = () => {
  const medicalRecordService = useMedicalRecordService();
  const [searchParams] = useSearchParams();
  const elderId = searchParams.get("elderId");

  return (
    <CrudFormPage
      entityLabel="medical record"
      icon={<FolderSharedIcon color="primary" />}
      backPath={elderId ? `/family/medical-records?elderId=${elderId}` : "/family/medical-records"}
      initialValues={{ sharedWithFamily: true }}
      fields={[
        { name: "type", label: "Type", type: "select", required: true, options: enumToOptions(MedicalRecordTypeEnum) },
        { name: "title", label: "Title", required: true },
        { name: "notes", label: "Notes", type: "textarea" },
        { name: "document", label: "Attach Document", type: "file", resourceType: "MEDICAL_RECORD_DOCUMENT" as any },
        { name: "sharedWithFamily", label: "Shared with family", type: "checkbox" },
      ]}
      onCreate={
        elderId
          ? async (values) => {
              await medicalRecordService.create({
                elderProfileId: Number(elderId),
                type: values.type,
                title: values.title,
                notes: values.notes,
                sharedWithFamily: Boolean(values.sharedWithFamily),
                documentFileAssetId: values.document ?? undefined,
              });
            }
          : undefined
      }
    />
  );
};

export default FamilyMedicalRecordFormPage;
