import React, { useCallback, useState } from "react";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import CrudModule from "../../templates/Shared/CrudModule.template";
import type { TableColumn } from "../../organisms/Table/TableV1";
import Select from "../../atoms/Select/Select";
import StatusChip from "../../atoms/Chip/StatusChip";
import { CONTACT_US_STATUS_TONE } from "../../atoms/Chip/statusTones";
import { useContactUsService, type ContactUsResponse } from "../../../services/useContactUsService";
import { ContactUsStatusEnum, enumToOptions } from "../../../utils/enums";
import { formatDateTime } from "../../../utils/helper";

const AdminContactUsPage: React.FC = () => {
  const contactUsService = useContactUsService();
  const [statusFilter, setStatusFilter] = useState("");

  const columns: TableColumn<ContactUsResponse>[] = [
    { key: "name", label: "Name", render: (r) => r.name },
    { key: "email", label: "Email", render: (r) => r.email },
    { key: "phone", label: "Phone", render: (r) => r.phone || "—" },
    { key: "message", label: "Message", render: (r) => r.message },
    { key: "status", label: "Status", render: (r) => <StatusChip label={r.status} tone={CONTACT_US_STATUS_TONE[r.status]} /> },
    { key: "createdAt", label: "Submitted", render: (r) => formatDateTime(r.createdAt) },
  ];

  const fetchPage = useCallback(
    (page: number, size: number, search: string) =>
      contactUsService.search({ search: search || undefined, status: (statusFilter || undefined) as any, page, size }),
    [contactUsService, statusFilter]
  );

  return (
    <CrudModule<ContactUsResponse>
      title="Contact Us Submissions"
      description="Messages submitted through the public contact form."
      icon={<ContactMailIcon color="primary" />}
      columns={columns}
      getRowId={(r) => r.id}
      fetchPage={fetchPage}
      entityLabel="submission"
      addLabel="Update Status"
      toFormValues={(r) => ({ status: r.status })}
      fields={[{ name: "status", label: "Status", type: "select", required: true, options: enumToOptions(ContactUsStatusEnum) }]}
      onUpdate={async (row, values) => {
        await contactUsService.updateStatus(row.id, values.status);
      }}
      onDelete={async (row) => {
        await contactUsService.remove(row.id);
      }}
      extraToolbarContent={
        <Select
          label="Status"
          sx={{ minWidth: 180 }}
          placeholder="All statuses"
          value={statusFilter}
          options={enumToOptions(ContactUsStatusEnum)}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
      }
    />
  );
};

export default AdminContactUsPage;
