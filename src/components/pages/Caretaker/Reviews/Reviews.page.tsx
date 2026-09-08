import React, { useCallback, useEffect, useId, useState } from "react";
import { Box, Dialog, DialogContent, Stack, Typography } from "@mui/material";
import RateReviewIcon from "@mui/icons-material/RateReview";
import CrudModule from "../../../templates/Shared/CrudModule.template";
import type { TableColumn } from "../../../organisms/Table/TableV1";
import RatingDisplay from "../../../atoms/RatingDisplay/RatingDisplay";
import Button from "../../../atoms/Button/Button";
import TextField from "../../../atoms/TextField/TextField";
import ErrorMessage from "../../../atoms/ErrorMessage/ErrorMessage";
import FormShell from "../../../templates/Shared/FormShell.template";
import DialogTransition from "../../../atoms/DialogTransition/DialogTransition";
import { useReviewService, type ReviewResponse } from "../../../../services/useReviewService";
import { useCaretakerService } from "../../../../services/useCaretakerService";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { formatDate, getErrorMessage } from "../../../../utils/helper";

const CategoryBreakdown: React.FC<{ review: ReviewResponse }> = ({ review }) => (
  <Stack spacing={0.25}>
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Typography variant="caption" sx={{ width: 92 }} color="text.secondary">
        Punctuality
      </Typography>
      <RatingDisplay value={review.punctualityRating ?? review.rating} max={5} />
    </Stack>
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Typography variant="caption" sx={{ width: 92 }} color="text.secondary">
        Care Quality
      </Typography>
      <RatingDisplay value={review.careQualityRating ?? review.rating} max={5} />
    </Stack>
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Typography variant="caption" sx={{ width: 92 }} color="text.secondary">
        Communication
      </Typography>
      <RatingDisplay value={review.communicationRating ?? review.rating} max={5} />
    </Stack>
  </Stack>
);

const CaretakerReviewsPage: React.FC = () => {
  const reviewService = useReviewService();
  const caretakerService = useCaretakerService();
  const { showSnackbar } = useSnackbar();
  const [caretakerProfileId, setCaretakerProfileId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [replyTarget, setReplyTarget] = useState<ReviewResponse | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replying, setReplying] = useState(false);
  // The reply Dialog has no <DialogTitle> (FormShell renders its own header instead) —
  // wire FormShell's title to the Dialog via aria-labelledby so screen readers announce
  // the dialog's purpose instead of just "dialog".
  const replyDialogTitleId = useId();

  useEffect(() => {
    caretakerService.getMyProfile().then((p) => setCaretakerProfileId(p.id)).catch(() => setCaretakerProfileId(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: TableColumn<ReviewResponse>[] = [
    { key: "reviewer", label: "Family Member", render: (r) => r.reviewerName ?? "—" },
    { key: "rating", label: "Overall", render: (r) => <RatingDisplay value={r.rating} /> },
    { key: "categories", label: "Category Breakdown", render: (r) => <CategoryBreakdown review={r} /> },
    { key: "comment", label: "Comment", render: (r) => r.comment || "—" },
    {
      key: "photo",
      label: "Photo",
      render: (r) =>
        r.photoUrl ? (
          <Box component="img" src={r.photoUrl} alt="Review attachment" sx={{ width: 44, height: 44, borderRadius: "8px", objectFit: "cover" }} />
        ) : (
          "—"
        ),
    },
    {
      key: "reply",
      label: "Your Reply",
      render: (r) =>
        r.reply ? (
          <Typography variant="body2" sx={{ maxWidth: 220 }}>
            {r.reply.content}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.disabled">
            No reply yet
          </Typography>
        ),
    },
    { key: "date", label: "Date", render: (r) => formatDate(r.createdAt) },
  ];

  const fetchPage = useCallback(
    async (page: number, size: number) => {
      if (!caretakerProfileId) return { content: [], totalElements: 0, totalPages: 0, number: 0, size, first: true, last: true, numberOfElements: 0, empty: true };
      return reviewService.getByCaretaker(caretakerProfileId, page, size);
    },
    [reviewService, caretakerProfileId]
  );

  const openReplyDialog = (review: ReviewResponse) => {
    setReplyTarget(review);
    setReplyContent(review.reply?.content ?? "");
    setReplyError(null);
  };

  const handleSubmitReply = async () => {
    if (replying || !replyTarget || !replyContent.trim()) return;
    setReplying(true);
    setReplyError(null);
    try {
      await reviewService.reply(replyTarget.id, replyContent.trim());
      showSnackbar("success", "Reply posted");
      setReplyTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (error) {
      setReplyError(getErrorMessage(error, "Could not post your reply"));
    } finally {
      setReplying(false);
    }
  };

  return (
    <>
      <CrudModule<ReviewResponse>
        key={caretakerProfileId ?? "none"}
        title="Reviews Received"
        icon={<RateReviewIcon color="primary" />}
        columns={columns}
        getRowId={(r) => r.id}
        fetchPage={fetchPage}
        searchable={false}
        entityLabel="review"
        refreshKey={refreshKey}
        extraRowActions={(row) => (
          <Button variant="text" size="small" onClick={(e) => { e.stopPropagation(); openReplyDialog(row); }}>
            {row.reply ? "Edit Reply" : "Reply"}
          </Button>
        )}
      />

      <Dialog
        open={Boolean(replyTarget)}
        onClose={() => setReplyTarget(null)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={DialogTransition}
        aria-labelledby={replyDialogTitleId}
      >
        <DialogContent sx={{ pt: 3 }}>
          <FormShell
            titleId={replyDialogTitleId}
            title="Reply to review"
            actions={
              <>
                <Button variant="text" onClick={() => setReplyTarget(null)} disabled={replying}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmitReply} loading={replying} disabled={!replyContent.trim()}>
                  Post Reply
                </Button>
              </>
            }
          >
            <ErrorMessage message={replyError} />
            {replyTarget && (
              <Typography variant="body2" color="text.secondary" mb={2}>
                Replying to {replyTarget.reviewerName ?? "this family member"}'s review: "{replyTarget.comment || "(no comment)"}"
              </Typography>
            )}
            <TextField
              label="Your reply"
              multiline
              minRows={3}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Thank the family and address anything they raised..."
            />
          </FormShell>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CaretakerReviewsPage;
