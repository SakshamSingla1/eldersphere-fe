import React, { useEffect, useState } from "react";
import { Card, CardContent, Stack, Typography, List, ListItem, ListItemIcon, ListItemText, Link } from "@mui/material";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import DescriptionIcon from "@mui/icons-material/Description";
import Loader from "../../atoms/Loader/Loader";
import { useCaretakerService, type CaretakerVerificationDocumentResponse } from "../../../services/useCaretakerService";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { formatDateTime, getErrorMessage } from "../../../utils/helper";

export interface CaretakerVerificationDocumentsPanelProps {
  caretakerId: number;
}

// Shown below the verification-status form on CaretakerVerificationForm.page.tsx — lets an
// admin actually see the evidence (ID, certification, background-check document) a
// caretaker submitted before flipping their status to VERIFIED, instead of approving on
// trust alone. Read-only here: uploading happens on the caretaker's own profile page
// (Caretaker/MyProfile/MyProfile.page.tsx), since only that endpoint is caretaker-authenticated.
const CaretakerVerificationDocumentsPanel: React.FC<CaretakerVerificationDocumentsPanelProps> = ({ caretakerId }) => {
  const caretakerService = useCaretakerService();
  const { showSnackbar } = useSnackbar();
  const [documents, setDocuments] = useState<CaretakerVerificationDocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    caretakerService
      .listVerificationDocuments(caretakerId)
      .then(setDocuments)
      .catch((err) => showSnackbar("error", getErrorMessage(err, "Could not load verification documents")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caretakerId]);

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          <VerifiedUserIcon color="primary" />
          <Typography variant="h6" fontWeight={800}>
            Submitted Verification Documents
          </Typography>
        </Stack>
        {loading ? (
          <Loader minHeight={80} />
        ) : documents.length === 0 ? (
          <Typography color="text.secondary">This caretaker hasn't submitted any verification documents yet.</Typography>
        ) : (
          <List dense disablePadding>
            {documents.map((doc) => (
              <ListItem
                key={doc.id}
                divider
                secondaryAction={
                  <Link href={doc.url} target="_blank" rel="noreferrer" underline="hover">
                    View
                  </Link>
                }
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <DescriptionIcon color="action" />
                </ListItemIcon>
                <ListItemText primary={doc.fileName} secondary={`Uploaded ${formatDateTime(doc.createdAt)}`} />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default CaretakerVerificationDocumentsPanel;
