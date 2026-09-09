import React, { useCallback } from "react";
import PersonIcon from "@mui/icons-material/Person";
import CrudFormPage from "../../../templates/Shared/CrudFormPage.template";
import { useElderProfileService, type ElderProfileResponse } from "../../../../services/useElderProfileService";
import { GenderEnum, enumToOptions } from "../../../../utils/enums";

// Add/Edit page for the family Elder Profiles module — see ElderProfiles.page.tsx for
// the listing this navigates back to (basePath="/family/elder-profiles").
const ElderProfilesFormPage: React.FC = () => {
  const elderProfileService = useElderProfileService();

  const getById = useCallback((id: string) => elderProfileService.getById(Number(id)), [elderProfileService]);

  return (
    <CrudFormPage<ElderProfileResponse>
      entityLabel="elder profile"
      icon={<PersonIcon color="primary" />}
      backPath="/family/elder-profiles"
      getById={getById}
      fields={[
        { name: "name", label: "Full Name", required: true },
        { name: "dateOfBirth", label: "Date of Birth", type: "date" },
        { name: "gender", label: "Gender", type: "select", options: enumToOptions(GenderEnum) },
        { name: "medicalConditions", label: "Medical Conditions", type: "textarea" },
        { name: "address", label: "Address", type: "textarea" },
        { name: "emergencyContactName", label: "Emergency Contact Name", gridSize: 6 },
        { name: "emergencyContactPhone", label: "Emergency Contact Phone", gridSize: 6 },
      ]}
      onCreate={async (values) => {
        await elderProfileService.create(values as any);
      }}
      onUpdate={async (row, values) => {
        await elderProfileService.update(row.id, values as any);
      }}
    />
  );
};

export default ElderProfilesFormPage;
