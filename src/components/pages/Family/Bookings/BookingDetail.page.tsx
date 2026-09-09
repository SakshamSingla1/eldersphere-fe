import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, Stack, Typography, Divider, Chip, Alert } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EventNoteIcon from "@mui/icons-material/EventNote";
import PrintIcon from "@mui/icons-material/Print";
import RepeatIcon from "@mui/icons-material/Repeat";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import Button from "../../../atoms/Button/Button";
import ConfirmableButton from "../../../atoms/ConfirmableButton/ConfirmableButton";
import Loader from "../../../atoms/Loader/Loader";
import ErrorMessage from "../../../atoms/ErrorMessage/ErrorMessage";
import StatusChip from "../../../atoms/Chip/StatusChip";
import { BOOKING_STATUS_TONE } from "../../../atoms/Chip/statusTones";
import PageHeader from "../../../molecules/PageHeader/PageHeader";
import KeyValueGrid from "../../../molecules/KeyValueGrid/KeyValueGrid";
import { useBookingService, type BookingResponse } from "../../../../services/useBookingService";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { BookingStatusEnum } from "../../../../utils/enums";
import { formatCurrency, formatDate, getErrorMessage, getVideoCallLink } from "../../../../utils/helper";

const CANCELLABLE: string[] = [BookingStatusEnum.PENDING, BookingStatusEnum.CONFIRMED];
const VIDEO_CALL_ELIGIBLE: string[] = [BookingStatusEnum.CONFIRMED, BookingStatusEnum.IN_PROGRESS];

const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const bookingId = Number(id);
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const bookingService = useBookingService();

  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [series, setSeries] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const b = await bookingService.getById(bookingId);
      setBooking(b);
      if (b.recurringGroupId) {
        const s = await bookingService.getRecurringSeries(b.recurringGroupId);
        setSeries(s);
      } else {
        setSeries([]);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Could not load this booking"));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  useEffect(() => {
    if (bookingId) load();
  }, [bookingId, load]);

  const handleCancel = async () => {
    if (!booking) return;
    try {
      await bookingService.updateStatus(booking.id, BookingStatusEnum.CANCELLED);
      showSnackbar("success", "Booking cancelled");
      load();
    } catch (err) {
      showSnackbar("error", getErrorMessage(err, "Could not cancel this booking"));
      throw err;
    }
  };

  const handleCancelSeries = async () => {
    if (!booking?.recurringGroupId) return;
    try {
      await bookingService.cancelSeries(booking.recurringGroupId);
      showSnackbar("success", "Recurring booking series cancelled");
      load();
    } catch (err) {
      showSnackbar("error", getErrorMessage(err, "Could not cancel this series"));
      throw err;
    }
  };

  if (loading) return <Loader minHeight={400} />;
  if (!booking) return <ErrorMessage message={error ?? "Booking not found"} />;

  return (
    <div>
      <Button variant="text" className="no-print" startIcon={<ArrowBackIcon />} onClick={() => navigate("/family/bookings")} sx={{ mb: 2 }}>
        Back to bookings
      </Button>

      <Card className="print-section" sx={{ p: { xs: 2, sm: 3 } }}>
        <CardContent>
          <PageHeader
            icon={<EventNoteIcon color="primary" fontSize="large" />}
            title="Booking Confirmation"
            subtitle={`Booking #${booking.id}`}
            actions={
              <>
                <StatusChip label={booking.status} tone={BOOKING_STATUS_TONE[booking.status]} />
                {booking.recurringGroupId && (
                  <Chip icon={<RepeatIcon />} label="Part of a recurring series" size="small" color="secondary" variant="outlined" />
                )}
              </>
            }
          />

          <Divider sx={{ mb: 2 }} />

          <KeyValueGrid
            items={[
              { label: "Elder", value: booking.elderName ?? "—" },
              { label: "Caretaker", value: booking.caretakerName ?? "—" },
              { label: "Service", value: booking.serviceName ?? "—" },
              { label: "Date", value: formatDate(booking.scheduledDate) },
              { label: "Time", value: booking.scheduledTime },
              { label: "Cost", value: formatCurrency(booking.cost) },
            ]}
          />

          {booking.notes && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary" display="block">
                Notes
              </Typography>
              <Typography>{booking.notes}</Typography>
            </>
          )}

          {series.length > 1 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Recurring series ({series.length} bookings)
              </Typography>
              <Stack spacing={0.75}>
                {series.map((s) => (
                  <Stack key={s.id} direction="row" spacing={1.5} alignItems="center">
                    <Typography variant="body2" sx={{ minWidth: 110 }}>
                      {formatDate(s.scheduledDate)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 70 }}>
                      {s.scheduledTime}
                    </Typography>
                    <StatusChip label={s.status} tone={BOOKING_STATUS_TONE[s.status]} />
                  </Stack>
                ))}
              </Stack>
            </>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }} className="no-print">
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Stack direction="row" spacing={1.5} mt={2.5} className="no-print" flexWrap="wrap">
        <Button variant="outline" startIcon={<PrintIcon />} onClick={() => window.print()}>
          Print / Save as PDF
        </Button>
        {VIDEO_CALL_ELIGIBLE.includes(booking.status) && (
          <Button
            variant="primary"
            startIcon={<VideoCallIcon />}
            onClick={() => window.open(getVideoCallLink(booking.id), "_blank", "noopener,noreferrer")}
          >
            Start Video Call
          </Button>
        )}
        {CANCELLABLE.includes(booking.status) && (
          <ConfirmableButton
            variant="danger"
            confirmTitle="Cancel booking"
            confirmMessage="Are you sure you want to cancel this booking?"
            confirmLabel="Cancel Booking"
            danger
            onConfirm={handleCancel}
          >
            Cancel Booking
          </ConfirmableButton>
        )}
        {booking.recurringGroupId && series.some((s) => CANCELLABLE.includes(s.status)) && (
          <ConfirmableButton
            variant="danger"
            confirmTitle="Cancel entire series"
            confirmMessage={`This will cancel all ${series.length} bookings in this recurring series. This action cannot be undone.`}
            confirmLabel="Cancel Entire Series"
            danger
            onConfirm={handleCancelSeries}
          >
            Cancel Entire Series
          </ConfirmableButton>
        )}
      </Stack>
    </div>
  );
};

export default BookingDetailPage;
