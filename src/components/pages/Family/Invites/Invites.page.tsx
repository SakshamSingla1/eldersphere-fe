import React, { useCallback, useEffect, useState } from "react";
import { Box, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PageHeader from "../../../molecules/PageHeader/PageHeader";
import EmptyState from "../../../molecules/EmptyState/EmptyState";
import Button from "../../../atoms/Button/Button";
import { CardGridSkeleton } from "../../../molecules/Skeletons/Skeletons";
import { useInviteService, type InviteResponse } from "../../../../services/useInviteService";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { getErrorMessage, formatDateTime } from "../../../../utils/helper";

// A family member's own inbox of pending "co-manage this elder" invites sent by another
// family member (see LinkElderProfile.page.tsx / ElderProfilesForm.page.tsx's Family
// Members panel for where these get sent). The symmetric ELDER-side inbox is
// Elder/Invites/Invites.page.tsx.
const FamilyInvitesPage: React.FC = () => {
  const inviteService = useInviteService();
  const { showSnackbar } = useSnackbar();
  const [invites, setInvites] = useState<InviteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    inviteService
      .myInvites()
      .then(setInvites)
      .catch((err) => showSnackbar("error", getErrorMessage(err, "Failed to load invites")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const respond = async (invite: InviteResponse, action: "accept" | "decline") => {
    setRespondingId(invite.id);
    try {
      await (action === "accept" ? inviteService.accept(invite.id) : inviteService.decline(invite.id));
      showSnackbar("success", action === "accept" ? `You're now linked to "${invite.elderName}"` : "Invite declined");
      load();
    } catch (err) {
      showSnackbar("error", getErrorMessage(err, "Failed to respond to invite"));
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <Box>
      <PageHeader icon={<MailOutlineIcon color="primary" />} title="Family Link Invites" />
      <Card>
        <CardContent>
          {loading ? (
            <CardGridSkeleton count={3} />
          ) : invites.length === 0 ? (
            <EmptyState
              icon={<MailOutlineIcon />}
              title="No pending invites"
              description="When another family member invites you to co-manage an elder profile, it will show up here."
              minHeight={220}
            />
          ) : (
            <Grid container spacing={2}>
              {invites.map((invite) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={invite.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {invite.elderName ?? "Elder profile"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Invited by {invite.invitedByName ?? "a family member"}
                        {invite.relationshipLabel ? ` · ${invite.relationshipLabel}` : ""}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" display="block" mb={1.5}>
                        {formatDateTime(invite.createdAt)}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="primary"
                          size="small"
                          loading={respondingId === invite.id}
                          onClick={() => respond(invite, "accept")}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="small"
                          disabled={respondingId === invite.id}
                          onClick={() => respond(invite, "decline")}
                        >
                          Decline
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default FamilyInvitesPage;
