import React, { useCallback, useState } from "react";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import CrudModule from "../../templates/Shared/CrudModule.template";
import type { TableColumn } from "../../organisms/Table/TableV1";
import Select from "../../atoms/Select/Select";
import { useServiceOfferingService, type ServiceOfferingResponse } from "../../../services/useServiceOfferingService";
import { ServiceCategoryEnum, ServiceCategoryLabels, enumToOptions } from "../../../utils/enums";
import { formatCurrency } from "../../../utils/helper";

const AdminServicesPage: React.FC = () => {
  const serviceOfferingService = useServiceOfferingService();
  const [categoryFilter, setCategoryFilter] = useState("");

  const columns: TableColumn<ServiceOfferingResponse>[] = [
    { key: "name", label: "Name", render: (r) => r.name },
    { key: "category", label: "Category", render: (r) => ServiceCategoryLabels[r.category] },
    { key: "basePrice", label: "Base Price", render: (r) => formatCurrency(r.basePrice) },
    { key: "duration", label: "Duration", render: (r) => (r.durationMinutes ? `${r.durationMinutes} min` : "—") },
    { key: "description", label: "Description", render: (r) => r.description || "—" },
  ];

  const fetchPage = useCallback(
    (page: number, size: number) => serviceOfferingService.list({ category: (categoryFilter || null) as any, page, size }),
    [serviceOfferingService, categoryFilter]
  );

  return (
    <CrudModule<ServiceOfferingResponse>
      title="Service Offerings"
      description="The catalog of bookable services families can choose from."
      icon={<MedicalServicesIcon color="primary" />}
      columns={columns}
      getRowId={(r) => r.id}
      fetchPage={fetchPage}
      searchable={false}
      entityLabel="service"
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "category", label: "Category", type: "select", required: true, options: enumToOptions(ServiceCategoryEnum, ServiceCategoryLabels) },
        { name: "description", label: "Description", type: "textarea" },
        { name: "basePrice", label: "Base Price (₹)", type: "number", gridSize: 6 },
        { name: "durationMinutes", label: "Duration (minutes)", type: "number", gridSize: 6 },
      ]}
      extraToolbarContent={
        <Select
          label="Category"
          sx={{ minWidth: 200 }}
          placeholder="All categories"
          value={categoryFilter}
          options={enumToOptions(ServiceCategoryEnum, ServiceCategoryLabels)}
          onChange={(e) => setCategoryFilter(e.target.value)}
        />
      }
      activeFilters={
        categoryFilter
          ? [
              {
                key: "category",
                label: `Category: ${ServiceCategoryLabels[categoryFilter as keyof typeof ServiceCategoryLabels] ?? categoryFilter}`,
                onRemove: () => setCategoryFilter(""),
              },
            ]
          : []
      }
      onClearFilters={() => setCategoryFilter("")}
      onCreate={async (values) => {
        await serviceOfferingService.create(values as any);
      }}
      onUpdate={async (row, values) => {
        await serviceOfferingService.update(row.id, values as any);
      }}
      onDelete={async (row) => {
        await serviceOfferingService.remove(row.id);
      }}
    />
  );
};

export default AdminServicesPage;
