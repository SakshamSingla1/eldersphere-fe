import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Grid, Card, CardContent, Stack, Typography, Chip, Pagination, Box, IconButton } from "@mui/material";
import { motion } from "framer-motion";
import SearchIcon from "@mui/icons-material/Search";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import RoomIcon from "@mui/icons-material/Room";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ListingShell from "../../../templates/Shared/ListingShell.template";
import Select from "../../../atoms/Select/Select";
import TextField from "../../../atoms/TextField/TextField";
import Button from "../../../atoms/Button/Button";
import Avatar from "../../../atoms/Avatar/Avatar";
import RatingDisplay from "../../../atoms/RatingDisplay/RatingDisplay";
import EmptyState from "../../../molecules/EmptyState/EmptyState";
import { NoSearchResultsIllustration } from "../../../atoms/Illustrations/Illustrations";
import { CardGridSkeleton } from "../../../molecules/Skeletons/Skeletons";
import { useSearchService, type CaretakerSearchResultDTO } from "../../../../services/useSearchService";
import { useFavoriteCaretakerService } from "../../../../services/useFavoriteCaretakerService";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { ServiceCategoryEnum, ServiceCategoryLabels, CaretakerVerificationStatusEnum, enumToOptions } from "../../../../utils/enums";
import { formatCurrency, getErrorMessage, useDebounce } from "../../../../utils/helper";

const PAGE_SIZE = 9;

const CaretakerSearchPage: React.FC = () => {
  const searchService = useSearchService();
  const favoriteService = useFavoriteCaretakerService();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [category, setCategory] = useState("");
  const [minRating, setMinRating] = useState("");
  const [minRate, setMinRate] = useState("");
  const [maxRate, setMaxRate] = useState("");
  const [location, setLocation] = useState("");
  // The min/max rate + location filters are debounced text fields (see below), so their
  // committed state alone isn't quite "what the user is looking at" while mid-typing —
  // but for the active-filter-chip summary that's fine, since a chip only needs to
  // reflect the last-applied value, same as the results themselves.
  const [locationInputKey, setLocationInputKey] = useState(0);
  const [rateInputKey, setRateInputKey] = useState(0);
  const [page, setPage] = useState(0);
  const [results, setResults] = useState<CaretakerSearchResultDTO[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [favoriteBusyId, setFavoriteBusyId] = useState<number | null>(null);
  const hasActiveFilters = Boolean(category || minRating || minRate || maxRate || location);

  const debouncedSetMinRate = useDebounce((val: string) => { setPage(0); setMinRate(val); }, 400);
  const debouncedSetMaxRate = useDebounce((val: string) => { setPage(0); setMaxRate(val); }, 400);
  const debouncedSetLocation = useDebounce((val: string) => { setPage(0); setLocation(val); }, 400);

  useEffect(() => {
    favoriteService
      .listFavorites()
      .then((favs) => setFavoriteIds(new Set(favs.map((f) => f.id))))
      .catch(() => setFavoriteIds(new Set()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLoading(true);
    searchService
      .searchCaretakers({
        category: (category || undefined) as any,
        minRating: minRating ? Number(minRating) : undefined,
        verificationStatus: CaretakerVerificationStatusEnum.VERIFIED,
        minRate: minRate ? Number(minRate) : undefined,
        maxRate: maxRate ? Number(maxRate) : undefined,
        location: location.trim() || undefined,
        page,
        size: PAGE_SIZE,
      })
      .then((res) => {
        setResults(res.content);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, minRating, minRate, maxRate, location, page]);

  const toggleFavorite = async (e: React.MouseEvent, caretaker: CaretakerSearchResultDTO) => {
    e.stopPropagation();
    setFavoriteBusyId(caretaker.id);
    const isFavorited = favoriteIds.has(caretaker.id);
    try {
      if (isFavorited) {
        await favoriteService.removeFavorite(caretaker.id);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(caretaker.id);
          return next;
        });
        showSnackbar("success", `Removed ${caretaker.fullName} from favorites`);
      } else {
        await favoriteService.addFavorite(caretaker.id);
        setFavoriteIds((prev) => new Set(prev).add(caretaker.id));
        showSnackbar("success", `Added ${caretaker.fullName} to favorites`);
      }
    } catch (error) {
      showSnackbar("error", getErrorMessage(error, "Could not update favorites"));
    } finally {
      setFavoriteBusyId(null);
    }
  };

  return (
    <ListingShell
      title="Find a Caretaker"
      description="Browse verified caretakers by service type, rating, price, and location."
      icon={<SearchIcon color="primary" />}
      filterContent={
        <>
          <Select
            sx={{ minWidth: 200 }}
            placeholder="All Categories"
            value={category}
            options={enumToOptions(ServiceCategoryEnum, ServiceCategoryLabels)}
            onChange={(e) => {
              setPage(0);
              setCategory(e.target.value);
            }}
          />
          <Select
            sx={{ minWidth: 160 }}
            placeholder="Any Rating"
            value={minRating}
            options={[
              { value: "4", label: "4+ stars" },
              { value: "3", label: "3+ stars" },
              { value: "2", label: "2+ stars" },
            ]}
            onChange={(e) => {
              setPage(0);
              setMinRating(e.target.value as string);
            }}
          />
          <TextField
            key={`min-rate-${rateInputKey}`}
            sx={{ minWidth: 130 }}
            type="number"
            label="Min $/hr"
            defaultValue={minRate}
            onChange={(e) => debouncedSetMinRate(e.target.value)}
            slotProps={{ htmlInput: { min: 0 } }}
          />
          <TextField
            key={`max-rate-${rateInputKey}`}
            sx={{ minWidth: 130 }}
            type="number"
            label="Max $/hr"
            defaultValue={maxRate}
            onChange={(e) => debouncedSetMaxRate(e.target.value)}
            slotProps={{ htmlInput: { min: 0 } }}
          />
          <TextField
            key={`location-${locationInputKey}`}
            sx={{ minWidth: 180 }}
            label="Location"
            placeholder="e.g. Riverton"
            defaultValue={location}
            onChange={(e) => debouncedSetLocation(e.target.value)}
          />
        </>
      }
      activeFilters={[
        ...(category
          ? [{ key: "category", label: `Category: ${ServiceCategoryLabels[category as keyof typeof ServiceCategoryLabels] ?? category}`, onRemove: () => { setPage(0); setCategory(""); } }]
          : []),
        ...(minRating ? [{ key: "minRating", label: `${minRating}+ stars`, onRemove: () => { setPage(0); setMinRating(""); } }] : []),
        ...(minRate ? [{ key: "minRate", label: `Min ${formatCurrency(Number(minRate))}/hr`, onRemove: () => { setPage(0); setMinRate(""); setRateInputKey((k) => k + 1); } }] : []),
        ...(maxRate ? [{ key: "maxRate", label: `Max ${formatCurrency(Number(maxRate))}/hr`, onRemove: () => { setPage(0); setMaxRate(""); setRateInputKey((k) => k + 1); } }] : []),
        ...(location ? [{ key: "location", label: `Near "${location}"`, onRemove: () => { setPage(0); setLocation(""); setLocationInputKey((k) => k + 1); } }] : []),
      ]}
      onClearFilters={() => {
        setPage(0);
        setCategory("");
        setMinRating("");
        setMinRate("");
        setMaxRate("");
        setLocation("");
        setRateInputKey((k) => k + 1);
        setLocationInputKey((k) => k + 1);
      }}
    >
      <Box sx={{ p: 2.5 }}>
        {loading ? (
          <CardGridSkeleton count={PAGE_SIZE} />
        ) : results.length === 0 ? (
          <EmptyState
            illustration={<NoSearchResultsIllustration size={96} />}
            title={hasActiveFilters ? "No caretakers match your filters" : "No caretakers on the platform yet"}
            description={
              hasActiveFilters
                ? "Try widening your search — clear a filter or two and see who's available."
                : "Verified caretakers will appear here as soon as they join and complete verification. Check back soon."
            }
            actionLabel={hasActiveFilters ? "Clear Filters" : undefined}
            onAction={
              hasActiveFilters
                ? () => {
                    setPage(0);
                    setCategory("");
                    setMinRating("");
                    setMinRate("");
                    setMaxRate("");
                    setLocation("");
                    setRateInputKey((k) => k + 1);
                    setLocationInputKey((k) => k + 1);
                  }
                : undefined
            }
          />
        ) : (
          <>
            <Grid container spacing={2}>
              {results.map((c, idx) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={c.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(idx, 8) * 0.05, ease: "easeOut" }}
                    whileHover={{ y: -4 }}
                    style={{ height: "100%" }}
                  >
                    <Card sx={{ height: "100%", cursor: "pointer", position: "relative" }} onClick={() => navigate(`/family/caretakers/${c.id}`)}>
                      <IconButton
                        aria-label={favoriteIds.has(c.id) ? "Remove from favorites" : "Add to favorites"}
                        onClick={(e) => toggleFavorite(e, c)}
                        disabled={favoriteBusyId === c.id}
                        size="small"
                        sx={{ position: "absolute", top: 8, right: 8, zIndex: 1, bgcolor: "background.paper", "&:hover": { bgcolor: "background.paper" } }}
                      >
                        {favoriteIds.has(c.id) ? <FavoriteIcon fontSize="small" color="error" /> : <FavoriteBorderIcon fontSize="small" />}
                      </IconButton>
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
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, minHeight: 40 }}>
                          {c.bio || "No bio provided yet."}
                        </Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" mb={1.5}>
                          {(c.specialties ?? []).map((s) => (
                            <Chip key={s} label={ServiceCategoryLabels[s]} size="small" sx={{ mb: 0.5 }} />
                          ))}
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography fontWeight={700} color="primary.main">
                            {formatCurrency(c.hourlyRate)}/hr
                          </Typography>
                          <Button variant="outline" size="small">
                            View Profile
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
            {totalPages > 1 && (
              <Stack alignItems="center" mt={3}>
                <Pagination count={totalPages} page={page + 1} onChange={(_, p) => setPage(p - 1)} color="primary" />
              </Stack>
            )}
          </>
        )}
      </Box>
    </ListingShell>
  );
};

export default CaretakerSearchPage;
