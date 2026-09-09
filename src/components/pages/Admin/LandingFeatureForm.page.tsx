import React, { useCallback } from "react";
import WebIcon from "@mui/icons-material/Web";
import CrudFormPage from "../../templates/Shared/CrudFormPage.template";
import { useLandingService, type LandingFeatureResponse } from "../../../services/useLandingService";

// Add/Edit page for the Features sub-resource of Landing Page Management — see
// LandingManagement.page.tsx's Features tab for the listing this navigates back to
// (basePath="/admin/landing-management/features", backPath restores the "Features" tab).
const AdminLandingFeatureFormPage: React.FC = () => {
  const landingService = useLandingService();

  const getById = useCallback((id: string) => landingService.getFeatureById(Number(id)), [landingService]);

  return (
    <CrudFormPage<LandingFeatureResponse>
      entityLabel="feature"
      entityLabelPlural="features"
      icon={<WebIcon color="primary" />}
      backPath="/admin/landing-management?tab=features"
      getById={getById}
      initialValues={{ isActive: true }}
      fields={[
        { name: "title", label: "Title", required: true },
        { name: "description", label: "Description", type: "textarea" },
        { name: "iconName", label: "Icon Name" },
        { name: "sortOrder", label: "Sort Order", type: "number", gridSize: 6 },
        { name: "isActive", label: "Active", type: "checkbox", gridSize: 6 },
      ]}
      onCreate={async (values) => {
        await landingService.createFeature(values as any);
      }}
      onUpdate={async (row, values) => {
        await landingService.updateFeature(row.id, values as any);
      }}
    />
  );
};

export default AdminLandingFeatureFormPage;
