import React, { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, Typography, Stack } from "@mui/material";
import EventNoteIcon from "@mui/icons-material/EventNote";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import CrudModule from "../../../templates/Shared/CrudModule.template";
import type { TableColumn } from "../../../organisms/Table/TableV1";
import Button from "../../../atoms/Button/Button";
import DialogTransition from "../../../atoms/DialogTransition/DialogTransition";
import StatusChip from "../../../atoms/Chip/StatusChip";
import { BOOKING_STATUS_TONE } from "../../../atoms/Chip/statusTones";
import KeyValueGrid from "../../../molecules/KeyValueGrid/KeyValueGrid";
import { useBookingService, type BookingResponse } from "../../../../services/useBookingService";
import { useElderProfileService } from "../../../../services/useElderProfileService";
import { BookingStatusEnum } from "../../../../utils/enums";
import { formatCurrency, formatDate, formatDateTime, getVideoCallLink, paginateClientSide } from "../../../../utils/helper";

const VIDEO_CALL_ELIGIBLE: string[] = [BookingStatusEnum.CONFIRMED, BookingStatusEnum.IN_PROGRESS];

// The booking search endpoint only filters by familyUserId/caretakerId/status (no
// elderProfileId or elderUserId param exists on the backend), so — same spirit as
// ElderProfiles.page.tsx's client-side pagination for a small per-user collection — this
// fetches a generous page of bookings and filters to this elder's own profile in JS.
const ElderBookingsPage: React.FC = () => {
  const bookingService = useBookingService();
  const elderProfileService = useElderProfileService();
  const [elderProfileId, setElderProfileId] = useState<number | null>(null);
  const [viewing, setViewing] = useState<BookingResponse | null>(null);

  useEffect(() => {
    elderProfileService
      .getMyProfile()
      .then((p) => setElderProfileId(p.id))
      .catch(() => setElderProfileId(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: TableColumn<BookingResponse>[] = [
    { key: "caretaker", label: "Caretaker", render: (r) => r.caretakerName ?? "—" },
    { key: "service", label: "Service", render: (r) => r.serviceName ?? "—" },
    { key: "when", label: "When", render: (r) => `${formatDate(r.scheduledDate)} at ${r.scheduledTime}` },
    { key: "cost", label: "Cost", render: (r) => formatCurrency(r.cost) },
    { key: "status", label: "Status", render: (r) => <StatusChip label={r.status} tone={BOOKING_STATUS_TONE[r.status]} /> },
  ];

  const fetchPage = useCallback(
    async (page: number, size: number) => {
      if (!elderProfileId) {
        return { content: [], totalElements: 0, totalPages: 0, number: 0, size, first: true, last: true, numberOfElements: 0, empty: true };
      }
      const all = await bookingService.search({ page: 0, size: 1000, sort: "scheduledDate,desc" });
      const mine = all.content.filter((b) => b.elderProfileId === elderProfileId);
      return paginateClientSide(mine, page, size, "");
    },
    [bookingService, elderProfileId]
  );

  return (
    <>
      <CrudModule<BookingResponse>
        key={elderProfileId ?? "none"}
        title="My Bookings"
        description="Care visits booked on your behalf."
        icon={<EventNoteIcon color="primary" />}
        columns={columns}
        getRowId={(r) => r.id}
        fetchPage={fetchPage}
        searchable={false}
        entityLabel="booking"
        extraRowActions={(row) => (
          <Button
            variant="text"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setViewing(row);
            }}
          >
            View
          </Button>
        )}
        hideEditButton
      />
      <Dialog open={Boolean(viewing)} onClose={() => setViewing(null)} maxWidth="xs" fullWidth TransitionComponent={DialogTransition}>
        {viewing && (
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>
              Booking Details
            </Typography>
            <KeyValueGrid
              layout="stack"
              items={[
                { label: "Caretaker", value: viewing.caretakerName ?? "—" },
                { label: "Service", value: viewing.serviceName ?? "—" },
                { label: "Scheduled", value: `${formatDate(viewing.scheduledDate)} at ${viewing.scheduledTime}` },
                { label: "Cost", value: formatCurrency(viewing.cost) },
                { label: "Notes", value: viewing.notes || "—" },
                { label: "Created", value: formatDateTime(viewing.createdAt) },
              ]}
            />
            <Stack direction="row" spacing={1.5} mt={2}>
              {VIDEO_CALL_ELIGIBLE.includes(viewing.status) && (
                <Button
                  variant="primary"
                  size="small"
                  startIcon={<VideoCallIcon />}
                  onClick={() => window.open(getVideoCallLink(viewing.id), "_blank", "noopener,noreferrer")}
                >
                  Start Video Call
                </Button>
              )}
              <Button variant="text" onClick={() => setViewing(null)}>
                Close
              </Button>
            </Stack>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
};

export default ElderBookingsPage;
