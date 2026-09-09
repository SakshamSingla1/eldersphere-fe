import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import PageHeader from "../../../molecules/PageHeader/PageHeader";
import FormShell from "../../../templates/Shared/FormShell.template";
import TextField from "../../../atoms/TextField/TextField";
import Button from "../../../atoms/Button/Button";
import ErrorMessage from "../../../atoms/ErrorMessage/ErrorMessage";
import UserSearchAutocomplete from "../../../molecules/UserSearchAutocomplete/UserSearchAutocomplete";
import { useElderProfileService } from "../../../../services/useElderProfileService";
import { useInviteService } from "../../../../services/useInviteService";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { getErrorMessage } from "../../../../utils/helper";
import { UserTypeEnum } from "../../../../utils/enums";
import type { UserLinkSearchResultDTO } from "../../../../services/useSearchService";

// Alternate "add" flow to ElderProfilesForm.page.tsx's manual entry: instead of typing an
// elder's details from scratch, search for their existing ELDER account and send them a
// link request. The elder must accept (see Elder/Invites/Invites.page.tsx) before the
// profile shows as linked — this only creates a placeholder profile + a pending invite.
const LinkElderProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const elderProfileService = useElderProfileService();
  const inviteService = useInviteService();

  const [selectedUser, setSelectedUser] = useState<UserLinkSearchResultDTO | null>(null);
  const [relationshipLabel, setRelationshipLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backPath = "/family/elder-profiles";

  const handleSubmit = async () => {
    if (!selectedUser || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const profile = await elderProfileService.create({ name: selectedUser.fullName });
      await inviteService.createInvite(profile.id, {
        targetUserId: selectedUser.id,
        invitedRole: UserTypeEnum.ELDER,
        relationshipLabel: relationshipLabel || undefined,
      });
      showSnackbar("success", `Link request sent to ${selectedUser.fullName}`);
      navigate(backPath);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send link request"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        icon={<PersonSearchIcon color="primary" />}
        title="Link an Existing Elder Account"
        onBack={() => navigate(backPath)}
        backLabel="Back to elder profiles"
      />
      <Card sx={{ p: { xs: 2, sm: 3 } }}>
        <CardContent>
          <FormShell
            actions={
              <>
                <Button variant="text" onClick={() => navigate(backPath)} disabled={submitting}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmit} loading={submitting} disabled={!selectedUser}>
                  Send Link Request
                </Button>
              </>
            }
          >
            <ErrorMessage message={error} />
            <Stack spacing={2.5}>
              <Typography variant="body2" color="text.secondary">
                Search for the elder's existing ElderSphere account by name, email, or phone. They'll
                receive a request and must accept it before the profile appears as linked.
              </Typography>
              <UserSearchAutocomplete
                userType={UserTypeEnum.ELDER}
                label="Search for elder account"
                placeholder="Name, email, or phone"
                onSelect={setSelectedUser}
              />
              <TextField
                label="Relationship (optional)"
                placeholder="e.g. Mother, Father, Grandparent"
                value={relationshipLabel}
                onChange={(e) => setRelationshipLabel(e.target.value)}
              />
            </Stack>
          </FormShell>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LinkElderProfilePage;
