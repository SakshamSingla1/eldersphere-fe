import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import EventNoteIcon from "@mui/icons-material/EventNote";
import RepeatIcon from "@mui/icons-material/Repeat";
import { Chip, Stack } from "@mui/material";
import CrudModule from "../../../templates/Shared/CrudModule.template";
import type { TableColumn } from "../../../organisms/Table/TableV1";
import Select from "../../../atoms/Select/Select";
import Button from "../../../atoms/Button/Button";
import StatusChip from "../../../atoms/Chip/StatusChip";
import { BOOKING_STATUS_TONE } from "../../../atoms/Chip/statusTones";
import BookingRowActions from "./BookingRowActions";
import { useBookingService, type BookingResponse } from "../../../../services/useBookingService";
import { useAuthenticatedUser } from "../../../../hooks/useAuthenticatedUser";
import { BookingStatusEnum, enumToOptions } from "../../../../utils/enums";
import { formatCurrency, formatDate } from "../../../../utils/helper";

const FamilyBookingsPage: React.FC = () => {
  const bookingService = useBookingService();
  const { user } = useAuthenticatedUser();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("");

  const columns: TableColumn<BookingResponse>[] = [
    { key: "elder", label: "Elder", render: (r) => r.elderName ?? "—" },
    { key: "caretaker", label: "Caretaker", render: (r) => r.caretakerName ?? "—" },
    { key: "service", label: "Service", render: (r) => r.serviceName ?? "—" },
    {
      key: "when",
      label: "When",
      render: (r) => (
        <Stack spacing={0.25}>
          <span>{`${formatDate(r.scheduledDate)} at ${r.scheduledTime}`}</span>
          {r.recurringGroupId && (
            <Chip icon={<RepeatIcon />} label="Recurring series" size="small" color="secondary" variant="outlined" sx={{ width: "fit-content" }} />
          )}
        </Stack>
      ),
    },
    { key: "cost", label: "Cost", render: (r) => formatCurrency(r.cost) },
    { key: "status", label: "Status", render: (r) => <StatusChip label={r.status} tone={BOOKING_STATUS_TONE[r.status]} /> },
    {
      key: "review",
      label: "",
      render: (r) =>
        r.status === BookingStatusEnum.COMPLETED ? (
          <Button variant="text" size="small" onClick={(e) => { e.stopPropagation(); navigate(`/family/reviews?bookingId=${r.id}&caretakerId=${r.caretakerId}`); }}>
            Leave Review
          </Button>
        ) : null,
    },
  ];

  const fetchPage = useCallback(
    async (page: number, size: number) => {
      if (!user) return { content: [], totalElements: 0, totalPages: 0, number: 0, size, first: true, last: true, numberOfElements: 0, empty: true };
      return bookingService.search({
        familyUserId: user.id,
        status: (statusFilter || null) as any,
        page,
        size,
        sort: "scheduledDate,desc",
      });
    },
    [bookingService, user, statusFilter]
  );

  return (
    <CrudModule<BookingResponse>
      title="My Bookings"
      description="Bookings you've made for the people you care for."
      icon={<EventNoteIcon color="primary" />}
      columns={columns}
      getRowId={(r) => r.id}
      fetchPage={fetchPage}
      searchable={false}
      entityLabel="booking"
      onRowClick={(row) => navigate(`/family/bookings/${row.id}`)}
      extraRowActions={(row, reload) => <BookingRowActions booking={row} reload={reload} />}
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

export default FamilyBookingsPage;
