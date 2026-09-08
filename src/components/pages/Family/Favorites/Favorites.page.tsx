import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Grid, Card, CardContent, Stack, Typography, Chip, Box } from "@mui/material";
import { motion } from "framer-motion";
import FavoriteIcon from "@mui/icons-material/Favorite";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import RoomIcon from "@mui/icons-material/Room";
import ListingShell from "../../../templates/Shared/ListingShell.template";
import Button from "../../../atoms/Button/Button";
import Avatar from "../../../atoms/Avatar/Avatar";
import RatingDisplay from "../../../atoms/RatingDisplay/RatingDisplay";
import EmptyState from "../../../molecules/EmptyState/EmptyState";
import { CardGridSkeleton } from "../../../molecules/Skeletons/Skeletons";
import { useFavoriteCaretakerService } from "../../../../services/useFavoriteCaretakerService";
import { type CaretakerSearchResultDTO } from "../../../../services/useSearchService";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { ServiceCategoryLabels, CaretakerVerificationStatusEnum } from "../../../../utils/enums";
import { formatCurrency, getErrorMessage } from "../../../../utils/helper";

const FavoritesPage: React.FC = () => {
  const favoriteService = useFavoriteCaretakerService();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState<CaretakerSearchResultDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    favoriteService
      .listFavorites()
      .then(setFavorites)
      .catch((err) => showSnackbar("error", getErrorMessage(err, "Could not load your favorites")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemove = async (e: React.MouseEvent, caretaker: CaretakerSearchResultDTO) => {
    e.stopPropagation();
    setBusyId(caretaker.id);
    try {
      await favoriteService.removeFavorite(caretaker.id);
      setFavorites((prev) => prev.filter((f) => f.id !== caretaker.id));
      // Removing a favorite is cheaply reversible via the same addFavorite endpoint, so
      // give a few seconds to undo instead of forcing a re-search to re-add them.
      showSnackbar("success", `Removed ${caretaker.fullName} from favorites`, 6000, {
        label: "Undo",
        onClick: async () => {
          try {
            await favoriteService.addFavorite(caretaker.id);
            setFavorites((prev) => (prev.some((f) => f.id === caretaker.id) ? prev : [...prev, caretaker]));
          } catch (err) {
            showSnackbar("error", getErrorMessage(err, "Could not restore this favorite"));
          }
        },
      });
    } catch (err) {
      showSnackbar("error", getErrorMessage(err, "Could not remove this favorite"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ListingShell
      title="My Favorites"
      description="Caretakers you've saved for quick re-booking."
      icon={<FavoriteIcon color="primary" />}
      count={loading ? undefined : favorites.length}
    >
      <Box sx={{ p: 2.5 }}>
        {loading ? (
          <CardGridSkeleton count={6} />
        ) : favorites.length === 0 ? (
          <EmptyState
            icon={<FavoriteIcon />}
            title="No favorites yet"
            description="Save caretakers from search or their profile page to find them here quickly."
            actionLabel="Find a Caretaker"
            onAction={() => navigate("/family/caretakers")}
          />
        ) : (
          <Grid container spacing={2}>
            {favorites.map((c, idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={c.id}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(idx, 8) * 0.05, ease: "easeOut" }}
                  whileHover={{ y: -4 }}
                  style={{ height: "100%" }}
                >
                  <Card sx={{ height: "100%", cursor: "pointer" }} onClick={() => navigate(`/family/caretakers/${c.id}`)}>
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="center" mb={1.5}>
                        <Avatar src={c.profilePhotoUrl ?? undefined} name={c.fullName} seed={c.id} sx={{ width: 52, height: 52 }} />
                        <Box minWidth={0}>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography fontWeight={700} noWrap>
                              {c.fullName}
                            </Typography>
                            {c.verificationStatus === CaretakerVerificationStatusEnum.VERIFIED && (
                              <VerifiedUserIcon sx={{ fontSize: 16, color: "primary.main" }} titleAccess="Verified caretaker" />
                            )}
                          </Stack>
                          <RatingDisplay value={c.ratingAverage} />
                          {c.serviceArea && (
                            <Stack direction="row" spacing={0.5} alignItems="center" mt={0.25}>
                              <RoomIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {c.serviceArea}
                              </Typography>
                            </Stack>
                          )}
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" mb={1.5}>
                        {(c.specialties ?? []).map((s) => (
                          <Chip key={s} label={ServiceCategoryLabels[s]} size="small" sx={{ mb: 0.5 }} />
                        ))}
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Typography fontWeight={700} color="primary.main">
                          {formatCurrency(c.hourlyRate)}/hr
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="primary"
                          size="small"
                          fullWidth
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/family/caretakers/${c.id}`);
                          }}
                        >
                          Book Now
                        </Button>
                        <Button
                          variant="outline"
                          color="error"
                          size="small"
                          loading={busyId === c.id}
                          onClick={(e) => handleRemove(e, c)}
                        >
                          Remove
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </ListingShell>
  );
};

export default FavoritesPage;
