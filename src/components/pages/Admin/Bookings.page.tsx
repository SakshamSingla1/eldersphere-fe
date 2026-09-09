import React, { useCallback, useState } from "react";
import EventNoteIcon from "@mui/icons-material/EventNote";
import CrudModule from "../../templates/Shared/CrudModule.template";
import type { TableColumn } from "../../organisms/Table/TableV1";
import Select from "../../atoms/Select/Select";
import StatusChip from "../../atoms/Chip/StatusChip";
import { BOOKING_STATUS_TONE } from "../../atoms/Chip/statusTones";
import { useBookingService, type BookingResponse } from "../../../services/useBookingService";
import { BookingStatusEnum, enumToOptions } from "../../../utils/enums";
import { formatCurrency, formatDate } from "../../../utils/helper";

const AdminBookingsPage: React.FC = () => {
  const bookingService = useBookingService();
  const [statusFilter, setStatusFilter] = useState("");

  const columns: TableColumn<BookingResponse>[] = [
    { key: "id", label: "ID", render: (r) => r.id },
    { key: "elder", label: "Elder", render: (r) => r.elderName ?? `#${r.elderProfileId}` },
    { key: "caretaker", label: "Caretaker", render: (r) => r.caretakerName ?? `#${r.caretakerId}` },
    { key: "service", label: "Service", render: (r) => r.serviceName ?? "—" },
    { key: "when", label: "When", render: (r) => `${formatDate(r.scheduledDate)} ${r.scheduledTime}` },
    { key: "cost", label: "Cost", render: (r) => formatCurrency(r.cost) },
    { key: "status", label: "Status", render: (r) => <StatusChip label={r.status} tone={BOOKING_STATUS_TONE[r.status]} /> },
  ];

  const fetchPage = useCallback(
    (page: number, size: number) =>
      bookingService.search({ status: (statusFilter || null) as any, page, size, sort: "scheduledDate,desc" }),
    [bookingService, statusFilter]
  );

  return (
    <CrudModule<BookingResponse>
      title="Bookings"
      description="All bookings across the platform."
      icon={<EventNoteIcon color="primary" />}
      columns={columns}
      getRowId={(r) => r.id}
      fetchPage={fetchPage}
      searchable={false}
      entityLabel="booking"
      addLabel="Update Status"
      basePath="/admin/bookings"
      onUpdate={async (row, values) => {
        await bookingService.updateStatus(row.id, values.status);
      }}
      extraToolbarContent={
        <Select
          label="Status"
          sx={{ minWidth: 180 }}
          placeholder="All statuses"
          value={statusFilter}
          options={enumToOptions(BookingStatusEnum)}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
      }
    />
  );
};

export default AdminBookingsPage;
