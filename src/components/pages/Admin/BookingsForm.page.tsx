import React, { useCallback } from "react";
import EventNoteIcon from "@mui/icons-material/EventNote";
import CrudFormPage from "../../templates/Shared/CrudFormPage.template";
import { useBookingService, type BookingResponse } from "../../../services/useBookingService";
import { BookingStatusEnum, enumToOptions } from "../../../utils/enums";

// Status-update page for the Bookings module (admins can only update status, not create
// bookings directly — see Bookings.page.tsx for the listing this navigates back to).
const AdminBookingFormPage: React.FC = () => {
  const bookingService = useBookingService();

  const getById = useCallback((id: string) => bookingService.getById(Number(id)), [bookingService]);

  return (
    <CrudFormPage<BookingResponse>
      entityLabel="booking"
      icon={<EventNoteIcon color="primary" />}
      backPath="/admin/bookings"
      getById={getById}
      toFormValues={(r) => ({ status: r.status })}
      fields={[{ name: "status", label: "Status", type: "select", required: true, options: enumToOptions(BookingStatusEnum) }]}
      onUpdate={async (row, values) => {
        await bookingService.updateStatus(row.id, values.status);
      }}
    />
  );
};

export default AdminBookingFormPage;
