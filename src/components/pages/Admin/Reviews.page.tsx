import React, { useCallback, useState } from "react";
import { Card, CardContent, Stack, Alert } from "@mui/material";
import RateReviewIcon from "@mui/icons-material/RateReview";
import CrudModule from "../../templates/Shared/CrudModule.template";
import type { TableColumn } from "../../organisms/Table/TableV1";
import TextField from "../../atoms/TextField/TextField";
import Button from "../../atoms/Button/Button";
import RatingDisplay from "../../atoms/RatingDisplay/RatingDisplay";
import PageHeader from "../../molecules/PageHeader/PageHeader";
import { useReviewService, type ReviewResponse } from "../../../services/useReviewService";
import { formatDate } from "../../../utils/helper";

// Note: ReviewController only exposes GET /reviews/caretaker/{caretakerId} — there's no
// admin-wide listing endpoint, so admins look up reviews per caretaker (ID visible from
// the Caretaker Verification queue) rather than browsing a global table.
const AdminReviewsPage: React.FC = () => {
  const reviewService = useReviewService();
  const [caretakerIdInput, setCaretakerIdInput] = useState("");
  const [activeCaretakerId, setActiveCaretakerId] = useState<number | null>(null);

  const columns: TableColumn<ReviewResponse>[] = [
    { key: "reviewer", label: "Reviewer", render: (r) => r.reviewerName ?? `#${r.reviewerId}` },
    { key: "rating", label: "Rating", render: (r) => <RatingDisplay value={r.rating} /> },
    { key: "comment", label: "Comment", render: (r) => r.comment || "—" },
    { key: "date", label: "Date", render: (r) => formatDate(r.createdAt) },
  ];

  const fetchPage = useCallback(
    async (page: number, size: number) => {
      if (!activeCaretakerId) return { content: [], totalElements: 0, totalPages: 0, number: 0, size, first: true, last: true, numberOfElements: 0, empty: true };
      return reviewService.getByCaretaker(activeCaretakerId, page, size);
    },
    [reviewService, activeCaretakerId]
  );

  return (
    <div>
      <PageHeader icon={<RateReviewIcon color="primary" />} title="Reviews" />
      <Alert severity="info" sx={{ mb: 2 }}>
        Reviews are only listable per caretaker — enter a caretaker's profile ID (visible from Caretaker
        Verification) to see the reviews they've received.
      </Alert>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction="row"
            spacing={2}
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              setActiveCaretakerId(Number(caretakerIdInput));
            }}
          >
            <TextField label="Caretaker Profile ID" type="number" value={caretakerIdInput} onChange={(e) => setCaretakerIdInput(e.target.value)} />
            <Button type="submit" variant="primary">
              Load Reviews
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {activeCaretakerId && (
        <CrudModule<ReviewResponse>
          key={activeCaretakerId}
          title={`Reviews for Caretaker #${activeCaretakerId}`}
          columns={columns}
          getRowId={(r) => r.id}
          fetchPage={fetchPage}
          searchable={false}
          entityLabel="review"
        />
      )}
    </div>
  );
};

export default AdminReviewsPage;
