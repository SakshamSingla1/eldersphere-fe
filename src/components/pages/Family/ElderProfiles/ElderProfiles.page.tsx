import React, { useCallback } from "react";
import PersonIcon from "@mui/icons-material/Person";
import CrudModule from "../../../templates/Shared/CrudModule.template";
import type { TableColumn } from "../../../organisms/Table/TableV1";
import { useElderProfileService, type ElderProfileResponse } from "../../../../services/useElderProfileService";
import { GenderEnum, enumToOptions } from "../../../../utils/enums";
import { formatDate, paginateClientSide } from "../../../../utils/helper";

const ElderProfilesPage: React.FC = () => {
  const elderProfileService = useElderProfileService();

  const columns: TableColumn<ElderProfileResponse>[] = [
    { key: "name", label: "Name", render: (r) => r.name },
    { key: "dob", label: "Date of Birth", render: (r) => formatDate(r.dateOfBirth) },
    { key: "gender", label: "Gender", render: (r) => r.gender ?? "—" },
    { key: "address", label: "Address", render: (r) => r.address || "—" },
    { key: "emergency", label: "Emergency Contact", render: (r) => r.emergencyContactName ? `${r.emergencyContactName} (${r.emergencyContactPhone ?? "—"})` : "—" },
  ];

  const fetchPage = useCallback(
    async (page: number, size: number, search: string) => {
      const all = await elderProfileService.getMine();
      return paginateClientSide(all, page, size, search, (item, s) => item.name.toLowerCase().includes(s));
    },
    [elderProfileService]
  );

  return (
    <CrudModule<ElderProfileResponse>
      title="Elder Profiles"
      description="The people you manage care for."
      icon={<PersonIcon color="primary" />}
      columns={columns}
      getRowId={(r) => r.id}
      fetchPage={fetchPage}
      entityLabel="elder profile"
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
      onDelete={async (row) => {
        await elderProfileService.remove(row.id);
      }}
    />
  );
};

export default ElderProfilesPage;
