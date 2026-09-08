import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import Button from "../../../atoms/Button/Button";
import ConfirmableButton from "../../../atoms/ConfirmableButton/ConfirmableButton";
import { useBookingService, type BookingResponse } from "../../../../services/useBookingService";
import { useMessagingService } from "../../../../services/useMessagingService";
import { BookingStatusEnum } from "../../../../utils/enums";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { getErrorMessage } from "../../../../utils/helper";

const NEXT_ACTION: Record<string, { label: string; next: string; color?: "error" }[]> = {
  PENDING: [
    { label: "Accept", next: BookingStatusEnum.CONFIRMED },
    { label: "Decline", next: BookingStatusEnum.CANCELLED, color: "error" },
  ],
  CONFIRMED: [{ label: "Start Visit", next: BookingStatusEnum.IN_PROGRESS }],
  IN_PROGRESS: [{ label: "Mark Complete", next: BookingStatusEnum.COMPLETED }],
};

const CaretakerBookingRowActions: React.FC<{ booking: BookingResponse; reload: () => void }> = ({ booking, reload }) => {
  const bookingService = useBookingService();
  const messagingService = useMessagingService();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [loadingNext, setLoadingNext] = useState<string | null>(null);
  const [messaging, setMessaging] = useState(false);

  const actions = NEXT_ACTION[booking.status] ?? [];

  const handleClick = async (next: string) => {
    if (loadingNext) return;
    setLoadingNext(next);
    try {
      await bookingService.updateStatus(booking.id, next as any);
      showSnackbar("success", "Booking updated");
      reload();
    } catch (error) {
      showSnackbar("error", getErrorMessage(error, "Could not update this booking"));
      throw error;
    } finally {
      setLoadingNext(null);
    }
  };

  // `booking.familyUserId` is already a user id (see BookingResponse) — no lookup needed.
  const handleMessage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMessaging(true);
    try {
      const conversation = await messagingService.getOrCreateConversation(booking.familyUserId, booking.id);
      navigate(`/caretaker/messages?conversationId=${conversation.id}`);
    } catch (error) {
      showSnackbar("error", getErrorMessage(error, "Could not start a conversation"));
    } finally {
      setMessaging(false);
    }
  };

  return (
    <>
      <Button variant="text" size="small" startIcon={<ChatBubbleOutlineIcon fontSize="small" />} loading={messaging} onClick={handleMessage}>
        Message
      </Button>
      {actions.map((action) =>
        action.next === BookingStatusEnum.CANCELLED ? (
          <ConfirmableButton
            key={action.next}
            variant="text"
            size="small"
            color={action.color}
            confirmTitle="Decline booking"
            confirmMessage="Are you sure you want to decline this booking? The family will be notified and this can't be undone."
            confirmLabel="Decline Booking"
            danger
            onClick={(e) => e.stopPropagation()}
            onConfirm={() => handleClick(action.next)}
          >
            {action.label}
          </ConfirmableButton>
        ) : (
          <Button
            key={action.next}
            variant="text"
            size="small"
            color={action.color}
            loading={loadingNext === action.next}
            onClick={(e) => {
              e.stopPropagation();
              handleClick(action.next).catch(() => {});
            }}
          >
            {action.label}
          </Button>
        )
      )}
    </>
  );
};

export default CaretakerBookingRowActions;
