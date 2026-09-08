import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import Button from "../../../atoms/Button/Button";
import ConfirmableButton from "../../../atoms/ConfirmableButton/ConfirmableButton";
import { useBookingService, type BookingResponse } from "../../../../services/useBookingService";
import { useCaretakerService } from "../../../../services/useCaretakerService";
import { useMessagingService } from "../../../../services/useMessagingService";
import { BookingStatusEnum } from "../../../../utils/enums";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { getErrorMessage } from "../../../../utils/helper";

const CANCELLABLE: string[] = [BookingStatusEnum.PENDING, BookingStatusEnum.CONFIRMED];

const BookingRowActions: React.FC<{ booking: BookingResponse; reload: () => void }> = ({ booking, reload }) => {
  const bookingService = useBookingService();
  const caretakerService = useCaretakerService();
  const messagingService = useMessagingService();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [messaging, setMessaging] = useState(false);

  const handleCancel = async () => {
    try {
      await bookingService.updateStatus(booking.id, BookingStatusEnum.CANCELLED);
      showSnackbar("success", "Booking cancelled");
      reload();
    } catch (error) {
      showSnackbar("error", getErrorMessage(error, "Could not cancel this booking"));
      throw error;
    }
  };

  const handleCancelSeries = async () => {
    if (!booking.recurringGroupId) return;
    try {
      await bookingService.cancelSeries(booking.recurringGroupId);
      showSnackbar("success", "Recurring booking series cancelled");
      reload();
    } catch (error) {
      showSnackbar("error", getErrorMessage(error, "Could not cancel this series"));
      throw error;
    }
  };

  // `booking.caretakerId` is the caretaker *profile* id (see BookingResponse), while
  // messaging needs the caretaker's *user* id (ConversationCreateRequest#otherUserId) —
  // one extra lookup bridges the two, same as the caretaker profile view page does.
  const handleMessage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMessaging(true);
    try {
      const caretaker = await caretakerService.getById(booking.caretakerId);
      const conversation = await messagingService.getOrCreateConversation(caretaker.userId, booking.id);
      navigate(`/family/messages?conversationId=${conversation.id}`);
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
      {CANCELLABLE.includes(booking.status) && (
        <ConfirmableButton
          variant="text"
          size="small"
          color="error"
          confirmTitle="Cancel booking"
          confirmMessage="Are you sure you want to cancel this booking?"
          confirmLabel="Cancel Booking"
          danger
          onClick={(e) => e.stopPropagation()}
          onConfirm={handleCancel}
        >
          Cancel
        </ConfirmableButton>
      )}
      {booking.recurringGroupId && CANCELLABLE.includes(booking.status) && (
        <ConfirmableButton
          variant="text"
          size="small"
          color="error"
          confirmTitle="Cancel entire series"
          confirmMessage="This will cancel every booking in this recurring series. This action cannot be undone."
          confirmLabel="Cancel Entire Series"
          danger
          onClick={(e) => e.stopPropagation()}
          onConfirm={handleCancelSeries}
        >
          Cancel Series
        </ConfirmableButton>
      )}
    </>
  );
};

export default BookingRowActions;
