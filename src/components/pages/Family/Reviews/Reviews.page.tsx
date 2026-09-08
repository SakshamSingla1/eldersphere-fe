import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, Typography, Stack, Box } from "@mui/material";
import RateReviewIcon from "@mui/icons-material/RateReview";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Button from "../../../atoms/Button/Button";
import TextField from "../../../atoms/TextField/TextField";
import ErrorMessage from "../../../atoms/ErrorMessage/ErrorMessage";
import RatingInput from "../../../atoms/RatingInput/RatingInput";
import PageHeader from "../../../molecules/PageHeader/PageHeader";
import { useReviewService } from "../../../../services/useReviewService";
import { useFileService } from "../../../../services/useFileService";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { getErrorMessage } from "../../../../utils/helper";

const FamilyReviewsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reviewService = useReviewService();
  const fileService = useFileService();
  const { showSnackbar } = useSnackbar();

  const bookingId = searchParams.get("bookingId");

  const [rating, setRating] = useState(5);
  const [punctualityRating, setPunctualityRating] = useState(5);
  const [careQualityRating, setCareQualityRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [comment, setComment] = useState("");
  const [photoFileAssetId, setPhotoFileAssetId] = useState<number | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const asset = await fileService.upload(file, "GENERAL");
      setPhotoFileAssetId(asset.id);
      setPhotoPreviewUrl(asset.url);
    } catch (err) {
      showSnackbar("error", getErrorMessage(err, "Photo upload failed"));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !bookingId) return;
    setError(null);
    setSubmitting(true);
    try {
      await reviewService.create({
        bookingId: Number(bookingId),
        rating,
        comment,
        punctualityRating,
        careQualityRating,
        communicationRating,
        photoFileAssetId: photoFileAssetId ?? undefined,
      });
      showSnackbar("success", "Thanks for your review!");
      navigate("/family/bookings");
    } catch (err) {
      setError(getErrorMessage(err, "Could not submit your review. It may already exist for this booking."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box maxWidth={560}>
      <PageHeader icon={<RateReviewIcon color="primary" />} title="Leave a Review" />
      {!bookingId ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary">
              Choose a completed booking from{" "}
              <Button variant="text" onClick={() => navigate("/family/bookings")}>
                My Bookings
              </Button>{" "}
              to leave a review for that caretaker.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <ErrorMessage message={error} />
            <Stack component="form" spacing={2} onSubmit={handleSubmit}>
              <Box>
                <Typography variant="body2" fontWeight={600} mb={0.5}>
                  Overall Rating
                </Typography>
                <RatingInput value={rating} onChange={setRating} />
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Box flex={1}>
                  <Typography variant="body2" fontWeight={600} mb={0.5}>
                    Punctuality
                  </Typography>
                  <RatingInput value={punctualityRating} onChange={setPunctualityRating} />
                </Box>
                <Box flex={1}>
                  <Typography variant="body2" fontWeight={600} mb={0.5}>
                    Care Quality
                  </Typography>
                  <RatingInput value={careQualityRating} onChange={setCareQualityRating} />
                </Box>
                <Box flex={1}>
                  <Typography variant="body2" fontWeight={600} mb={0.5}>
                    Communication
                  </Typography>
                  <RatingInput value={communicationRating} onChange={setCommunicationRating} />
                </Box>
              </Stack>

              <TextField
                label="Comment"
                multiline
                minRows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share how the caretaker's visit went..."
              />

              <Box>
                <Typography variant="body2" fontWeight={600} mb={0.5}>
                  Photo (optional)
                </Typography>
                <Button variant="outline" component="label" startIcon={<UploadFileIcon />} loading={uploadingPhoto}>
                  {photoPreviewUrl ? "Replace Photo" : "Add Photo"}
                  <input type="file" hidden accept="image/*" onChange={(e) => handlePhotoUpload(e.target.files?.[0])} />
                </Button>
                {photoPreviewUrl && (
                  <Box
                    component="img"
                    src={photoPreviewUrl}
                    alt="Review attachment preview"
                    sx={{ display: "block", mt: 1.5, maxWidth: 160, maxHeight: 160, borderRadius: "10px", objectFit: "cover" }}
                  />
                )}
              </Box>

              <Button type="submit" variant="primary" size="large" loading={submitting}>
                Submit Review
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default FamilyReviewsPage;
