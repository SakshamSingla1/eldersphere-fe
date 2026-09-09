import React, { useCallback } from "react";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import CrudFormPage from "../../templates/Shared/CrudFormPage.template";
import { useServiceOfferingService, type ServiceOfferingResponse } from "../../../services/useServiceOfferingService";
import { ServiceCategoryEnum, ServiceCategoryLabels, enumToOptions } from "../../../utils/enums";

// Add/Edit page for the Service Offerings module — see Services.page.tsx for the
// listing this navigates back to (basePath="/admin/services").
const AdminServiceFormPage: React.FC = () => {
  const serviceOfferingService = useServiceOfferingService();

  const getById = useCallback((id: string) => serviceOfferingService.getById(Number(id)), [serviceOfferingService]);

  return (
    <CrudFormPage<ServiceOfferingResponse>
      entityLabel="service"
      icon={<MedicalServicesIcon color="primary" />}
      backPath="/admin/services"
      getById={getById}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "category", label: "Category", type: "select", required: true, options: enumToOptions(ServiceCategoryEnum, ServiceCategoryLabels) },
        { name: "description", label: "Description", type: "textarea" },
        { name: "basePrice", label: "Base Price (₹)", type: "number", gridSize: 6 },
        { name: "durationMinutes", label: "Duration (minutes)", type: "number", gridSize: 6 },
      ]}
      onCreate={async (values) => {
        await serviceOfferingService.create(values as any);
      }}
      onUpdate={async (row, values) => {
        await serviceOfferingService.update(row.id, values as any);
      }}
    />
  );
};

export default AdminServiceFormPage;
