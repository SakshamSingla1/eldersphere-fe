import React, { useCallback } from "react";
import WebIcon from "@mui/icons-material/Web";
import CrudFormPage from "../../templates/Shared/CrudFormPage.template";
import { useLandingService, type LandingTestimonialResponse } from "../../../services/useLandingService";

// Add/Edit page for the Testimonials sub-resource of Landing Page Management — see
// LandingManagement.page.tsx's Testimonials tab for the listing this navigates back to
// (basePath="/admin/landing-management/testimonials", backPath restores the
// "Testimonials" tab).
const AdminLandingTestimonialFormPage: React.FC = () => {
  const landingService = useLandingService();

  const getById = useCallback((id: string) => landingService.getTestimonialById(Number(id)), [landingService]);

  return (
    <CrudFormPage<LandingTestimonialResponse>
      entityLabel="testimonial"
      entityLabelPlural="testimonials"
      icon={<WebIcon color="primary" />}
      backPath="/admin/landing-management?tab=testimonials"
      getById={getById}
      initialValues={{ isActive: true, rating: 5 }}
      fields={[
        { name: "authorName", label: "Author Name", required: true, gridSize: 6, section: "Author" },
        { name: "authorRole", label: "Author Role", gridSize: 6, section: "Author" },
        { name: "avatarUrl", label: "Avatar URL", section: "Author" },
        { name: "content", label: "Content", type: "textarea", required: true, section: "Testimonial" },
        { name: "rating", label: "Rating (1-5)", type: "number", gridSize: 6, section: "Testimonial" },
        { name: "sortOrder", label: "Sort Order", type: "number", gridSize: 6, section: "Display" },
        { name: "isActive", label: "Active", type: "checkbox", gridSize: 6, section: "Display" },
      ]}
      onCreate={async (values) => {
        await landingService.createTestimonial(values as any);
      }}
      onUpdate={async (row, values) => {
        await landingService.updateTestimonial(row.id, values as any);
      }}
    />
  );
};

export default AdminLandingTestimonialFormPage;
