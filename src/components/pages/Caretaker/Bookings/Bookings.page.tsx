import React, { useCallback, useEffect, useState } from "react";
import EventNoteIcon from "@mui/icons-material/EventNote";
import CrudModule from "../../../templates/Shared/CrudModule.template";
import type { TableColumn } from "../../../organisms/Table/TableV1";
import Select from "../../../atoms/Select/Select";
import StatusChip from "../../../atoms/Chip/StatusChip";
import { BOOKING_STATUS_TONE } from "../../../atoms/Chip/statusTones";
import CaretakerBookingRowActions from "./CaretakerBookingRowActions";
import { useBookingService, type BookingResponse } from "../../../../services/useBookingService";
import { useCaretakerService } from "../../../../services/useCaretakerService";
import { BookingStatusEnum, enumToOptions } from "../../../../utils/enums";
import { formatCurrency, formatDate } from "../../../../utils/helper";

const CaretakerBookingsPage: React.FC = () => {
  const bookingService = useBookingService();
  const caretakerService = useCaretakerService();
  const [caretakerProfileId, setCaretakerProfileId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    caretakerService.getMyProfile().then((p) => setCaretakerProfileId(p.id)).catch(() => setCaretakerProfileId(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: TableColumn<BookingResponse>[] = [
    { key: "elder", label: "Elder", render: (r) => r.elderName ?? "—" },
    { key: "service", label: "Service", render: (r) => r.serviceName ?? "—" },
    { key: "when", label: "When", render: (r) => `${formatDate(r.scheduledDate)} at ${r.scheduledTime}` },
    { key: "cost", label: "Cost", render: (r) => formatCurrency(r.cost) },
    { key: "notes", label: "Notes", render: (r) => r.notes || "—" },
    { key: "status", label: "Status", render: (r) => <StatusChip label={r.status} tone={BOOKING_STATUS_TONE[r.status]} /> },
  ];

  const fetchPage = useCallback(
    async (page: number, size: number) => {
      if (!caretakerProfileId) return { content: [], totalElements: 0, totalPages: 0, number: 0, size, first: true, last: true, numberOfElements: 0, empty: true };
      return bookingService.search({
        caretakerId: caretakerProfileId,
        status: (statusFilter || null) as any,
        page,
        size,
        sort: "scheduledDate,desc",
      });
    },
    [bookingService, caretakerProfileId, statusFilter]
  );

  return (
    <CrudModule<BookingResponse>
      key={caretakerProfileId ?? "none"}
      title="My Bookings"
      description="Accept, start, and complete the bookings families have made with you."
      icon={<EventNoteIcon color="primary" />}
      columns={columns}
      getRowId={(r) => r.id}
      fetchPage={fetchPage}
      searchable={false}
      entityLabel="booking"
      extraRowActions={(row, reload) => <CaretakerBookingRowActions booking={row} reload={reload} />}
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

export default CaretakerBookingsPage;
