import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Grid, Card, CardContent, Stack, Typography, Chip, Divider, List, ListItem, ListItemText, Box, FormControlLabel, Alert, Collapse } from "@mui/material";
import dayjs from "dayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickersDay, type PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import RoomIcon from "@mui/icons-material/Room";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import Button from "../../../atoms/Button/Button";
import Select from "../../../atoms/Select/Select";
import TextField from "../../../atoms/TextField/TextField";
import Checkbox from "../../../atoms/Checkbox/Checkbox";
import ErrorMessage from "../../../atoms/ErrorMessage/ErrorMessage";
import FieldError from "../../../atoms/FieldError/FieldError";
import Avatar from "../../../atoms/Avatar/Avatar";
import RatingDisplay from "../../../atoms/RatingDisplay/RatingDisplay";
import Loader from "../../../atoms/Loader/Loader";
import WeeklyAvailabilityView from "../../../molecules/WeeklyAvailability/WeeklyAvailabilityView";
import AvailableSlotPicker from "../../../molecules/AvailableSlotPicker/AvailableSlotPicker";
import { useCaretakerService, type CaretakerProfileResponse, type AvailabilitySlot } from "../../../../services/useCaretakerService";
import { useReviewService, type ReviewResponse } from "../../../../services/useReviewService";
import { useElderProfileService, type ElderProfileResponse } from "../../../../services/useElderProfileService";
import { useServiceOfferingService, type ServiceOfferingResponse } from "../../../../services/useServiceOfferingService";
import { useBookingService } from "../../../../services/useBookingService";
import { useMessagingService } from "../../../../services/useMessagingService";
import { useFavoriteCaretakerService } from "../../../../services/useFavoriteCaretakerService";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { useAuthenticatedUser } from "../../../../hooks/useAuthenticatedUser";
import { useCelebration } from "../../../../hooks/useCelebration";
import { consumeFirstBookingMilestone } from "../../../../utils/celebrations";
import { ServiceCategoryLabels, DayOfWeekEnum } from "../../../../utils/enums";
import { formatCurrency, getErrorMessage, getErrorCode } from "../../../../utils/helper";

// dayjs' Date#day() is 0 (Sunday) - 6 (Saturday); this maps that index straight onto the
// backend's DayOfWeekEnum so a calendar day can be checked against the caretaker's
// declared weekly availability without any date-library gymnastics.
const DAY_INDEX_TO_ENUM: DayOfWeekEnum[] = [
  DayOfWeekEnum.SUNDAY,
  DayOfWeekEnum.MONDAY,
  DayOfWeekEnum.TUESDAY,
  DayOfWeekEnum.WEDNESDAY,
  DayOfWeekEnum.THURSDAY,
  DayOfWeekEnum.FRIDAY,
  DayOfWeekEnum.SATURDAY,
];

interface AvailabilityPickersDayProps extends PickersDayProps {
  availableDaySet?: Set<DayOfWeekEnum>;
}

const AvailabilityDay: React.FC<AvailabilityPickersDayProps> = (props) => {
  const { availableDaySet, day, outsideCurrentMonth, ...other } = props;
  const isAvailableDay = !outsideCurrentMonth && Boolean(availableDaySet?.has(DAY_INDEX_TO_ENUM[dayjs(day).day()]));
  return (
    <PickersDay
      {...other}
      day={day}
      outsideCurrentMonth={outsideCurrentMonth}
      sx={isAvailableDay ? { bgcolor: "action.selected", fontWeight: 700 } : undefined}
    />
  );
};

const MIN_OCCURRENCES = 2;
const MAX_OCCURRENCES = 12;

const CaretakerProfileViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const caretakerId = Number(id);
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { user } = useAuthenticatedUser();
  const celebrate = useCelebration();

  const caretakerService = useCaretakerService();
  const reviewService = useReviewService();
  const elderProfileService = useElderProfileService();
  const serviceOfferingService = useServiceOfferingService();
  const bookingService = useBookingService();
  const messagingService = useMessagingService();
  const favoriteService = useFavoriteCaretakerService();

  const [caretaker, setCaretaker] = useState<CaretakerProfileResponse | null>(null);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [elders, setElders] = useState<ElderProfileResponse[]>([]);
  const [services, setServices] = useState<ServiceOfferingResponse[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const availableDaySet = useMemo(() => new Set(availability.map((s) => s.dayOfWeek)), [availability]);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  const [form, setForm] = useState({
    elderProfileId: "",
    serviceId: "",
    scheduledDate: "",
    scheduledTime: "",
    notes: "",
    repeatWeekly: false,
    occurrences: 4,
  });
  const [error, setError] = useState<string | null>(null);
  const [unavailableHint, setUnavailableHint] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Notes + repeat-weekly are optional/secondary to the booking, so they start collapsed
  // behind a disclosure toggle instead of sitting flat in the form alongside the required
  // Elder/Service/Date/Time fields — keeps the required path obvious at a glance.
  const [showAdvanced, setShowAdvanced] = useState(false);
  // Same inline "required field left empty" convention used by the admin CRUD forms
  // (icon + error-colored message directly under the field) — kept local to this bespoke
  // form since it doesn't go through CrudModule/FormShell.
  const [fieldErrors, setFieldErrors] = useState<{ elderProfileId?: string; serviceId?: string; occurrences?: string }>({});

  useEffect(() => {
    if (!caretakerId) return;
    setLoading(true);
    Promise.all([
      caretakerService.getById(caretakerId),
      reviewService.getByCaretaker(caretakerId, 0, 10),
      elderProfileService.getMine(),
      serviceOfferingService.list({ size: 100 }),
      caretakerService.getAvailability(caretakerId).catch(() => ({ caretakerId, slots: [] })),
      favoriteService.listFavorites().catch(() => []),
    ])
      .then(([c, r, e, s, a, favs]) => {
        setCaretaker(c);
        setReviews(r.content);
        setElders(e);
        setServices(s.content);
        setAvailability(a.slots ?? []);
        setIsFavorited(favs.some((f) => f.id === caretakerId));
      })
      .catch((err) => setError(getErrorMessage(err, "Could not load this caretaker's profile")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caretakerId]);

  const toggleFavorite = async () => {
    if (!caretaker) return;
    setFavoriteBusy(true);
    try {
      if (isFavorited) {
        await favoriteService.removeFavorite(caretaker.id);
        setIsFavorited(false);
        // Cheaply reversible via addFavorite — give a few seconds to undo.
        showSnackbar("success", `Removed ${caretaker.fullName} from favorites`, 6000, {
          label: "Undo",
          onClick: async () => {
            try {
              await favoriteService.addFavorite(caretaker.id);
              setIsFavorited(true);
            } catch (err) {
              showSnackbar("error", getErrorMessage(err, "Could not restore this favorite"));
            }
          },
        });
      } else {
        await favoriteService.addFavorite(caretaker.id);
        setIsFavorited(true);
        showSnackbar("success", `Added ${caretaker.fullName} to favorites`);
      }
    } catch (err) {
      showSnackbar("error", getErrorMessage(err, "Could not update favorites"));
    } finally {
      setFavoriteBusy(false);
    }
  };

  const handleMessage = async () => {
    if (!caretaker) return;
    setMessaging(true);
    try {
      const conversation = await messagingService.getOrCreateConversation(caretaker.userId);
      navigate(`/family/messages?conversationId=${conversation.id}`);
    } catch (err) {
      showSnackbar("error", getErrorMessage(err, "Could not start a conversation"));
    } finally {
      setMessaging(false);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // guards against a double-click firing a duplicate booking request
    setError(null);
    setUnavailableHint(false);

    const errs: { elderProfileId?: string; serviceId?: string; occurrences?: string } = {};
    if (!form.elderProfileId) errs.elderProfileId = "Please select an elder";
    if (!form.serviceId) errs.serviceId = "Please select a service";
    if (form.repeatWeekly && (form.occurrences < MIN_OCCURRENCES || form.occurrences > MAX_OCCURRENCES)) {
      errs.occurrences = `Must be between ${MIN_OCCURRENCES} and ${MAX_OCCURRENCES}`;
    }
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!form.scheduledDate || !form.scheduledTime) {
      setError("Please choose a date and time.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await bookingService.create({
        elderProfileId: Number(form.elderProfileId),
        caretakerId,
        serviceId: Number(form.serviceId),
        scheduledDate: form.scheduledDate,
        scheduledTime: form.scheduledTime,
        notes: form.notes,
        repeatWeekly: form.repeatWeekly || undefined,
        occurrences: form.repeatWeekly ? form.occurrences : undefined,
      });
      // A family's very first successful booking ever is a genuine milestone worth
      // celebrating — checked (and immediately marked done) via a per-user localStorage
      // flag so it can only ever fire once for this account, regardless of how many
      // bookings follow. Every booking after the first still just gets the plain
      // snackbar below.
      if (user && consumeFirstBookingMilestone(user.id)) {
        celebrate("Your first booking is confirmed! Welcome to ElderSphere.");
      } else {
        showSnackbar("success", form.repeatWeekly ? "Recurring booking series created!" : "Booking request sent!");
      }
      navigate(`/family/bookings/${created.id}`);
    } catch (err) {
      const code = getErrorCode(err);
      if (code === "CARETAKER_UNAVAILABLE") {
        setError("This caretaker isn't available at that time.");
        setUnavailableHint(true);
      } else if (code === "BOOKING_CONFLICT") {
        setError("This time slot is already booked. Please choose a different date or time.");
      } else {
        setError(getErrorMessage(err, "Could not create this booking"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader minHeight={400} />;
  if (!caretaker) return <ErrorMessage message={error ?? "Caretaker not found"} />;

  return (
    <div>
      <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Back to search
      </Button>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ mb: 3, p: 2 }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                <Avatar
                  src={caretaker.profilePhotoUrl ?? undefined}
                  name={caretaker.fullName}
                  seed={caretaker.id}
                  sx={{ width: 72, height: 72, fontSize: 24 }}
                />
                <div>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Typography variant="h5" fontWeight={800}>
                      {caretaker.fullName}
                    </Typography>
                    {caretaker.verificationStatus === "VERIFIED" && (
                      <Chip
                        icon={<VerifiedUserIcon sx={{ fontSize: "16px !important" }} />}
                        label="Verified"
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                  <RatingDisplay value={caretaker.ratingAverage} />
                  <Typography variant="body2" color="text.secondary">
                    {caretaker.yearsOfExperience ?? 0} years of experience · {formatCurrency(caretaker.hourlyRate)}/hr
                  </Typography>
                  {caretaker.serviceArea && (
                    <Stack direction="row" spacing={0.5} alignItems="center" mt={0.25}>
                      <RoomIcon sx={{ fontSize: 15, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.secondary">
                        {caretaker.serviceArea}
                      </Typography>
                    </Stack>
                  )}
                </div>
                <Stack direction="row" spacing={1} sx={{ ml: "auto !important", alignSelf: "flex-start" }}>
                  <Button
                    variant="outline"
                    startIcon={isFavorited ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                    loading={favoriteBusy}
                    onClick={toggleFavorite}
                  >
                    {isFavorited ? "Favorited" : "Favorite"}
                  </Button>
                  <Button variant="outline" startIcon={<ChatBubbleOutlineIcon />} loading={messaging} onClick={handleMessage}>
                    Message
                  </Button>
                </Stack>
              </Stack>
              <Typography sx={{ mb: 2 }}>{caretaker.bio || "This caretaker hasn't added a bio yet."}</Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                {(caretaker.specialties ?? []).map((s) => (
                  <Chip key={s} label={ServiceCategoryLabels[s]} size="small" sx={{ mb: 0.5 }} />
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card id="weekly-availability" sx={{ mb: 3, p: 2, ...(unavailableHint && { outline: "2px solid", outlineColor: "warning.main" }) }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                <EventAvailableIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Weekly Availability
                </Typography>
              </Stack>
              {unavailableHint && (
                <Alert severity="warning" sx={{ mb: 1.5 }}>
                  Pick a date/time that falls within one of the windows below.
                </Alert>
              )}
              <WeeklyAvailabilityView slots={availability} />
            </CardContent>
          </Card>

          <Card sx={{ p: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Reviews
              </Typography>
              {reviews.length === 0 ? (
                <Typography color="text.secondary">No reviews yet.</Typography>
              ) : (
                <List>
                  {reviews.map((r) => (
                    <React.Fragment key={r.id}>
                      <ListItem disableGutters alignItems="flex-start">
                        <Avatar
                          name={r.reviewerName ?? "Family member"}
                          seed={r.reviewerId}
                          sx={{ width: 36, height: 36, fontSize: 14, mr: 1.5, mt: 0.5 }}
                        />
                        <ListItemText
                          disableTypography
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center" mb={0.25}>
                              <Typography fontWeight={700}>{r.reviewerName ?? "Family member"}</Typography>
                              <RatingDisplay value={r.rating} />
                            </Stack>
                          }
                          secondary={
                            <>
                              {r.comment && (
                                <Typography variant="body2" color="text.secondary" mb={r.reply ? 1 : 0}>
                                  {r.comment}
                                </Typography>
                              )}
                              {r.reply && (
                                <Box
                                  sx={{
                                    mt: 1,
                                    p: 1.25,
                                    borderRadius: "10px",
                                    bgcolor: "action.hover",
                                    borderLeft: "3px solid",
                                    borderColor: "primary.main",
                                  }}
                                >
                                  <Typography variant="caption" fontWeight={700} color="primary.main" display="block">
                                    Caretaker's reply
                                  </Typography>
                                  <Typography variant="body2">{r.reply.content}</Typography>
                                </Box>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ p: 2, position: "sticky", top: 90 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Book This Caretaker
              </Typography>
              {unavailableHint ? (
                <Alert
                  severity="warning"
                  sx={{ mb: 2 }}
                  action={
                    <Button
                      variant="text"
                      size="small"
                      color="warning"
                      onClick={() => document.getElementById("weekly-availability")?.scrollIntoView({ behavior: "smooth", block: "center" })}
                    >
                      See availability
                    </Button>
                  }
                >
                  {error}
                </Alert>
              ) : (
                <ErrorMessage message={error} />
              )}
              {/*
                noValidate: without it, the browser's own "Please fill out this field"
                bubble fires on the native-required Elder/Service selects and blocks
                onSubmit entirely, so our styled inline FieldError never gets a chance to
                render — routing all validation through handleBook keeps one consistent
                error convention instead of two competing ones.
              */}
              {/*
                Progressive disclosure: the form is visually staged into "who/what" (Elder +
                Service), "when" (Date + Time) — both required and always visible — and a
                collapsed "Notes & repeat" section for the optional/secondary fields, so the
                required path reads clearly instead of one flat six-field form. Submit
                logic/API call below is unchanged.
              */}
              <Stack component="form" spacing={2.5} onSubmit={handleBook} noValidate>
                <Stack spacing={2}>
                  <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.6 }}>
                    Who &amp; what
                  </Typography>
                  <Select
                    label="Elder"
                    required
                    value={form.elderProfileId}
                    options={elders.map((e) => ({ value: e.id, label: e.name }))}
                    error={Boolean(fieldErrors.elderProfileId)}
                    helperText={fieldErrors.elderProfileId ? <FieldError message={fieldErrors.elderProfileId} /> : null}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, elderProfileId: e.target.value as string }));
                      setFieldErrors((prev) => ({ ...prev, elderProfileId: undefined }));
                    }}
                  />
                  <Select
                    label="Service"
                    required
                    value={form.serviceId}
                    options={services.map((s) => ({ value: s.id, label: `${s.name} (${ServiceCategoryLabels[s.category]})` }))}
                    error={Boolean(fieldErrors.serviceId)}
                    helperText={fieldErrors.serviceId ? <FieldError message={fieldErrors.serviceId} /> : null}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, serviceId: e.target.value as string }));
                      setFieldErrors((prev) => ({ ...prev, serviceId: undefined }));
                    }}
                  />
                </Stack>

                <Divider />

                <Stack spacing={2}>
                  <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.6 }}>
                    When
                  </Typography>
                  {!form.serviceId ? (
                    <Typography variant="body2" color="text.secondary">
                      Pick a service above to see this caretaker's availability.
                    </Typography>
                  ) : (
                    <>
                      <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: "10px" }}>
                        <DateCalendar
                          value={form.scheduledDate ? dayjs(form.scheduledDate, "YYYY-MM-DD") : null}
                          onChange={(newValue) =>
                            setForm((f) => ({
                              ...f,
                              scheduledDate: newValue && newValue.isValid() ? newValue.format("YYYY-MM-DD") : "",
                              scheduledTime: "",
                            }))
                          }
                          disablePast
                          slots={{ day: AvailabilityDay }}
                          slotProps={{ day: { availableDaySet } as any }}
                        />
                      </Box>
                      {availableDaySet.size === 0 && (
                        <Typography variant="caption" color="text.secondary">
                          This caretaker hasn't set specific hours yet — showing default full-day availability.
                        </Typography>
                      )}
                      {form.scheduledDate && (
                        <AvailableSlotPicker
                          caretakerId={caretakerId}
                          serviceId={form.serviceId}
                          date={form.scheduledDate}
                          selectedTime={form.scheduledTime}
                          onSelect={(startTime) => setForm((f) => ({ ...f, scheduledTime: startTime }))}
                        />
                      )}
                    </>
                  )}
                </Stack>

                <Divider />

                <Button
                  type="button"
                  variant="text"
                  onClick={() => setShowAdvanced((v) => !v)}
                  startIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{ alignSelf: "flex-start", px: 0.5 }}
                  aria-expanded={showAdvanced}
                >
                  {form.repeatWeekly || form.notes ? "Notes & repeat" : "Add notes or make this recurring (optional)"}
                </Button>
                <Collapse in={showAdvanced}>
                  <Stack spacing={2} sx={{ pt: 0.5 }}>
                    <TextField
                      label="Notes (optional)"
                      multiline
                      minRows={2}
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={form.repeatWeekly}
                          onChange={(e) => setForm((f) => ({ ...f, repeatWeekly: e.target.checked }))}
                        />
                      }
                      label="Repeat weekly"
                    />
                    {form.repeatWeekly && (
                      <TextField
                        label="Number of occurrences"
                        type="number"
                        required
                        error={Boolean(fieldErrors.occurrences)}
                        helperText={
                          fieldErrors.occurrences ? (
                            <FieldError message={fieldErrors.occurrences} />
                          ) : (
                            `Between ${MIN_OCCURRENCES} and ${MAX_OCCURRENCES} weekly bookings, starting on the date above`
                          )
                        }
                        value={form.occurrences}
                        slotProps={{ htmlInput: { min: MIN_OCCURRENCES, max: MAX_OCCURRENCES } }}
                        onChange={(e) => {
                          setForm((f) => ({ ...f, occurrences: Number(e.target.value) }));
                          setFieldErrors((prev) => ({ ...prev, occurrences: undefined }));
                        }}
                      />
                    )}
                  </Stack>
                </Collapse>

                <Button type="submit" variant="primary" size="large" loading={submitting}>
                  {form.repeatWeekly ? "Confirm Recurring Booking" : "Confirm Booking"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default CaretakerProfileViewPage;
