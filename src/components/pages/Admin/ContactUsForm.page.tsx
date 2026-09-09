import React, { useCallback } from "react";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import CrudFormPage from "../../templates/Shared/CrudFormPage.template";
import { useContactUsService, type ContactUsResponse } from "../../../services/useContactUsService";
import { ContactUsStatusEnum, enumToOptions } from "../../../utils/enums";

// Status-update page for the Contact Us module (admins can only triage an existing
// submission, not create one — see ContactUs.page.tsx for the listing this navigates
// back to).
const AdminContactUsFormPage: React.FC = () => {
  const contactUsService = useContactUsService();

  const getById = useCallback((id: string) => contactUsService.getById(Number(id)), [contactUsService]);

  return (
    <CrudFormPage<ContactUsResponse>
      entityLabel="submission"
      icon={<ContactMailIcon color="primary" />}
      backPath="/admin/contact-us"
      getById={getById}
      toFormValues={(r) => ({ status: r.status })}
      fields={[{ name: "status", label: "Status", type: "select", required: true, options: enumToOptions(ContactUsStatusEnum) }]}
      onUpdate={async (row, values) => {
        await contactUsService.updateStatus(row.id, values.status);
      }}
    />
  );
};

export default AdminContactUsFormPage;
