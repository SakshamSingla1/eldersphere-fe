import React, { useCallback, useEffect, useState } from "react";
import { Box, Card, CardContent, Chip, Divider, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import TextField from "../../../atoms/TextField/TextField";
import Button from "../../../atoms/Button/Button";
import UserSearchAutocomplete from "../../../molecules/UserSearchAutocomplete/UserSearchAutocomplete";
import { useInviteService, type InviteResponse } from "../../../../services/useInviteService";
import type { FamilyMemberSummaryDTO } from "../../../../services/useElderProfileService";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { useAuthenticatedUser } from "../../../../hooks/useAuthenticatedUser";
import { getErrorMessage } from "../../../../utils/helper";
import { UserTypeEnum } from "../../../../utils/enums";
import type { UserLinkSearchResultDTO } from "../../../../services/useSearchService";

export interface FamilyMembersPanelProps {
  elderProfileId: number;
}

// Shown below the manual edit fields on ElderProfilesForm.page.tsx (edit mode only) — lets
// the profile owner see who else co-manages this elder and invite additional family
// members by search, mirroring LinkElderProfile.page.tsx's search-and-invite pattern but
// targeting FAMILY_MEMBER accounts instead of ELDER ones.
const FamilyMembersPanel: React.FC<FamilyMembersPanelProps> = ({ elderProfileId }) => {
  const inviteService = useInviteService();
  const { showSnackbar } = useSnackbar();
  const { user } = useAuthenticatedUser();

  const [members, setMembers] = useState<FamilyMemberSummaryDTO[]>([]);
  const [pendingInvites, setPendingInvites] = useState<InviteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserLinkSearchResultDTO | null>(null);
  const [relationshipLabel, setRelationshipLabel] = useState("");
  const [inviting, setInviting] = useState(false);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [busyInviteId, setBusyInviteId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([inviteService.listFamilyMembers(elderProfileId), inviteService.listForProfile(elderProfileId)])
      .then(([familyMembers, invites]) => {
        setMembers(familyMembers);
        setPendingInvites(invites.filter((i) => i.status === "PENDING"));
      })
      .catch((err) => showSnackbar("error", getErrorMessage(err, "Failed to load family members")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elderProfileId]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner = members.some((m) => m.isOwner && m.userId === user?.id);

  const handleInvite = async () => {
    if (!selectedUser || inviting) return;
    setInviting(true);
    try {
      await inviteService.createInvite(elderProfileId, {
        targetUserId: selectedUser.id,
        invitedRole: UserTypeEnum.FAMILY_MEMBER,
        relationshipLabel: relationshipLabel || undefined,
      });
      showSnackbar("success", `Invite sent to ${selectedUser.fullName}`);
      setSelectedUser(null);
      setRelationshipLabel("");
      load();
    } catch (err) {
      showSnackbar("error", getErrorMessage(err, "Failed to send invite"));
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: number) => {
    setBusyUserId(userId);
    try {
      await inviteService.removeFamilyMember(elderProfileId, userId);
      showSnackbar("success", "Family member removed");
      load();
    } catch (err) {
      showSnackbar("error", getErrorMessage(err, "Failed to remove family member"));
    } finally {
      setBusyUserId(null);
    }
  };

  const handleRevoke = async (inviteId: number) => {
    setBusyInviteId(inviteId);
    try {
      await inviteService.revoke(inviteId);
      showSnackbar("success", "Invite revoked");
      load();
    } catch (err) {
      showSnackbar("error", getErrorMessage(err, "Failed to revoke invite"));
    } finally {
      setBusyInviteId(null);
    }
  };

  if (loading) return null;

  return (
    <Card sx={{ mt: 3, p: { xs: 2, sm: 3 } }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          <GroupIcon color="primary" />
          <Typography variant="h6" fontWeight={800}>
            Family Members
          </Typography>
        </Stack>

        <List dense disablePadding>
          {members.map((member) => (
            <ListItem
              key={member.userId}
              divider
              secondaryAction={
                !member.isOwner && isOwner ? (
                  <Button
                    variant="text"
                    color="error"
                    size="small"
                    loading={busyUserId === member.userId}
                    onClick={() => handleRemove(member.userId)}
                  >
                    Remove
                  </Button>
                ) : undefined
              }
            >
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>{member.fullName ?? "Unknown"}</span>
                    {member.isOwner && <Chip label="Owner" size="small" color="primary" variant="outlined" />}
                  </Stack>
                }
                secondary={member.relationshipLabel}
              />
            </ListItem>
          ))}
        </List>

        {pendingInvites.length > 0 && (
          <>
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mt={2} mb={1}>
              Pending Invites
            </Typography>
            <List dense disablePadding>
              {pendingInvites.map((invite) => (
                <ListItem
                  key={invite.id}
                  divider
                  secondaryAction={
                    isOwner ? (
                      <Button
                        variant="text"
                        color="error"
                        size="small"
                        loading={busyInviteId === invite.id}
                        onClick={() => handleRevoke(invite.id)}
                      >
                        Revoke
                      </Button>
                    ) : undefined
                  }
                >
                  <ListItemText
                    primary={invite.invitedUserName ?? "Invited user"}
                    secondary={invite.invitedRole === UserTypeEnum.ELDER ? "Invited as elder" : invite.relationshipLabel}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}

        {isOwner && (
          <>
            <Divider sx={{ my: 2.5 }} />
            <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
              Invite a family member to co-manage this profile
            </Typography>
            <Stack spacing={2}>
              <UserSearchAutocomplete
                userType={UserTypeEnum.FAMILY_MEMBER}
                label="Search for family member"
                placeholder="Name, email, or phone"
                onSelect={setSelectedUser}
              />
              <TextField
                label="Relationship (optional)"
                placeholder="e.g. Sibling, Spouse"
                value={relationshipLabel}
                onChange={(e) => setRelationshipLabel(e.target.value)}
              />
              <Box>
                <Button variant="primary" onClick={handleInvite} loading={inviting} disabled={!selectedUser}>
                  Send Invite
                </Button>
              </Box>
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FamilyMembersPanel;
