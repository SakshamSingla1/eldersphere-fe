import React, { useCallback } from "react";
import WebIcon from "@mui/icons-material/Web";
import CrudFormPage from "../../templates/Shared/CrudFormPage.template";
import { useLandingService, type LandingFaqResponse } from "../../../services/useLandingService";

// Add/Edit page for the FAQs sub-resource of Landing Page Management — see
// LandingManagement.page.tsx's FAQs tab for the listing this navigates back to
// (basePath="/admin/landing-management/faqs", backPath restores the "FAQs" tab).
const AdminLandingFaqFormPage: React.FC = () => {
  const landingService = useLandingService();

  const getById = useCallback((id: string) => landingService.getFaqById(Number(id)), [landingService]);

  return (
    <CrudFormPage<LandingFaqResponse>
      entityLabel="FAQ"
      entityLabelPlural="FAQs"
      icon={<WebIcon color="primary" />}
      backPath="/admin/landing-management?tab=faqs"
      getById={getById}
      initialValues={{ isActive: true }}
      fields={[
        { name: "question", label: "Question", required: true },
        { name: "answer", label: "Answer", type: "textarea", required: true },
        { name: "sortOrder", label: "Sort Order", type: "number", gridSize: 6 },
        { name: "isActive", label: "Active", type: "checkbox", gridSize: 6 },
      ]}
      onCreate={async (values) => {
        await landingService.createFaq(values as any);
      }}
      onUpdate={async (row, values) => {
        await landingService.updateFaq(row.id, values as any);
      }}
    />
  );
};

export default AdminLandingFaqFormPage;
