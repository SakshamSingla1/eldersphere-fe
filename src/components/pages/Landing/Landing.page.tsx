import React, { useEffect, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Divider,
  Link as MuiLink,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import MedicationIcon from "@mui/icons-material/Medication";
import GroupsIcon from "@mui/icons-material/Groups";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import DashboardIcon from "@mui/icons-material/Dashboard";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import CampaignIcon from "@mui/icons-material/Campaign";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import SearchIcon from "@mui/icons-material/Search";
import EventNoteIcon from "@mui/icons-material/EventNote";
import HandshakeIcon from "@mui/icons-material/Handshake";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import PlaceIcon from "@mui/icons-material/Place";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import StarIcon from "@mui/icons-material/Star";
import BarChartIcon from "@mui/icons-material/BarChart";
import HeroScene from "../../molecules/HeroScene/HeroScene";
import TestimonialsCarousel from "../../molecules/TestimonialsCarousel/TestimonialsCarousel";
import Button from "../../atoms/Button/Button";
import TextField from "../../atoms/TextField/TextField";
import ErrorMessage from "../../atoms/ErrorMessage/ErrorMessage";
import { useLandingService, type LandingPageResponse } from "../../../services/useLandingService";
import { useContactUsService } from "../../../services/useContactUsService";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { getErrorMessage } from "../../../utils/helper";

// Maps a CMS `iconName` string to a MUI icon. Covers both the seed data's icon vocabulary
// (kebab-case, e.g. "shield-check") and the original hardcoded copy's vocabulary (used by
// FALLBACK_FEATURES below), since either can legitimately come through this same lookup.
const FEATURE_ICONS: Record<string, React.ReactNode> = {
  // Seed/CMS icon names
  "shield-check": <VerifiedUserIcon fontSize="large" />,
  "message-circle": <ChatBubbleOutlineIcon fontSize="large" />,
  "calendar-clock": <EventAvailableIcon fontSize="large" />,
  "alert-triangle": <WarningAmberIcon fontSize="large" />,
  "file-heart": <FolderSharedIcon fontSize="large" />,
  star: <StarIcon fontSize="large" />,
  "bar-chart-3": <BarChartIcon fontSize="large" />,
  // Fallback-copy icon names
  discovery: <SearchIcon fontSize="large" />,
  booking: <EventAvailableIcon fontSize="large" />,
  dashboard: <DashboardIcon fontSize="large" />,
  family: <FamilyRestroomIcon fontSize="large" />,
  emergency: <NotificationsActiveIcon fontSize="large" />,
  records: <FolderSharedIcon fontSize="large" />,
  notifications: <CampaignIcon fontSize="large" />,
  verified: <VerifiedUserIcon fontSize="large" />,
};

const FALLBACK_FEATURES = [
  { id: -1, title: "Service Discovery", description: "Find caretakers by nursing, physiotherapy, medication assistance, companion care, and more.", iconName: "discovery", isActive: true },
  { id: -2, title: "Flexible Booking", description: "Book for a specific service, date, and time. Easy rescheduling and cancellation.", iconName: "booking", isActive: true },
  { id: -3, title: "Smart Dashboard", description: "Caretakers manage services, availability, and bookings through an intuitive dashboard.", iconName: "dashboard", isActive: true },
  { id: -4, title: "Family Access", description: "Family members can book services, monitor appointments, and view prescriptions for their loved ones.", iconName: "family", isActive: true },
  { id: -5, title: "Emergency Alerts", description: "One-tap emergency button notifies nearby verified caretakers for immediate help.", iconName: "emergency", isActive: true },
  { id: -6, title: "Medical Records", description: "Prescriptions and treatment details stored securely and accessible to family members.", iconName: "records", isActive: true },
  { id: -7, title: "Live Notifications", description: "Stay updated with booking confirmations, service reminders, and alerts.", iconName: "notifications", isActive: true },
  { id: -8, title: "Verified Pros", description: "All caretakers are background-checked and verified before joining the platform.", iconName: "verified", isActive: true },
];

// Shown only if the CMS call fails outright or returns an empty list, so the page never
// looks broken/empty for a visitor while still preferring real content the moment it's
// available.
const FALLBACK_TESTIMONIALS = [
  { id: -1, authorName: "Amit Verma", authorRole: "Family member", content: "ElderSphere helped us find a wonderful caretaker for my mother within a day.", avatarUrl: null, rating: 5, isActive: true },
  { id: -2, authorName: "Priya Nair", authorRole: "Family member", content: "The emergency alert feature is real peace of mind for our whole family.", avatarUrl: null, rating: 5, isActive: true },
  { id: -3, authorName: "Ravi Kumar", authorRole: "Caretaker", content: "Managing my bookings and schedule has never been easier.", avatarUrl: null, rating: 5, isActive: true },
];

const FALLBACK_FAQS = [
  { id: -1, question: "How are caretakers verified?", answer: "Every caretaker is background-checked and reviewed by our team before appearing in search.", isActive: true },
  { id: -2, question: "Can I reschedule a booking?", answer: "Yes — bookings can be rescheduled or cancelled from your dashboard up until the visit begins.", isActive: true },
  { id: -3, question: "Is there a mobile app?", answer: "ElderSphere is a responsive web app today, with native apps on our roadmap.", isActive: true },
];

// The CMS's boolean flag serializes over the wire as `active` (a Lombok/Jackson quirk on a
// `private boolean isActive` field), not `isActive` as our TS types name it. Accept either
// spelling — and default to visible when the flag is absent entirely, e.g. hardcoded
// fallback rows above — rather than only trusting one exact field name.
const isEntryActive = (item: { isActive?: boolean }): boolean => {
  const flag = item.isActive ?? (item as unknown as { active?: boolean }).active;
  return flag ?? true;
};

const HOW_IT_WORKS = [
  { icon: <PersonAddAltIcon fontSize="large" />, title: "Create Profile", description: "Sign up as a family member or a caretaker. Set your preferences." },
  { icon: <SearchIcon fontSize="large" />, title: "Find a Caretaker", description: "Browse verified caretakers by service type, ratings, and availability." },
  { icon: <EventNoteIcon fontSize="large" />, title: "Book a Service", description: "Pick your date, time, and service. Confirm in just a few taps." },
  { icon: <HandshakeIcon fontSize="large" />, title: "Receive Care", description: "Your caretaker arrives on time. Track visits and leave reviews." },
];

const STATS = [
  { label: "Families Served", value: "10,000+" },
  { label: "Verified Caretakers", value: "2,500+" },
  { label: "Cities Covered", value: "50+" },
  { label: "Average Rating", value: "4.9★" },
];

// Shared scroll-reveal building block: fade + gentle rise, staggered by index. Used for
// every below-the-fold grid on this page (features, how-it-works, testimonials, FAQ).
// `viewport={{ once: true }}` means each item animates in once, the first time it enters
// view, rather than replaying every time the user scrolls past it.
const fadeUpReveal = (idx: number) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.45, delay: idx * 0.07, ease: "easeOut" as const },
});

// Hero-only stagger: the headline, subheadline and CTA buttons reveal one after another
// instead of as one flat block, so the very first thing a visitor sees has a bit more
// choreography than the rest of the (whileInView-driven) page below the fold.
const heroStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const heroStaggerItem = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

const Landing: React.FC = () => {
  const theme = useTheme();
  const landingService = useLandingService();
  const contactUsService = useContactUsService();
  const { showSnackbar } = useSnackbar();
  const prefersReducedMotion = useReducedMotion();

  // Scroll-linked parallax, scoped to the hero only: as the visitor scrolls the hero out
  // of view, its content gently recedes (fades/shrinks slightly) while the two decorative
  // blobs and the hero illustration drift at slightly different speeds for a subtle sense
  // of depth. Collapses to a no-op range under prefers-reduced-motion rather than just
  // running at full strength.
  const heroRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: heroScrollProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroContentOpacity = useTransform(heroScrollProgress, [0, 1], [1, prefersReducedMotion ? 1 : 0.35]);
  const heroSceneParallaxY = useTransform(heroScrollProgress, [0, 1], [0, prefersReducedMotion ? 0 : 50]);
  const blobOneParallaxY = useTransform(heroScrollProgress, [0, 1], [0, prefersReducedMotion ? 0 : -70]);
  const blobTwoParallaxY = useTransform(heroScrollProgress, [0, 1], [0, prefersReducedMotion ? 0 : 70]);

  const [page, setPage] = useState<LandingPageResponse | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  useEffect(() => {
    landingService
      .getPublicPage()
      .then(setPage)
      .catch(() => setPage(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const config = page?.config;
  const features = page?.features?.length ? page.features.filter(isEntryActive) : FALLBACK_FEATURES;
  const testimonials = page?.testimonials?.length ? page.testimonials.filter(isEntryActive) : FALLBACK_TESTIMONIALS;
  const faqs = page?.faqs?.length ? page.faqs.filter(isEntryActive) : FALLBACK_FAQS;

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);
    setSubmitting(true);
    try {
      await contactUsService.submit(contactForm);
      showSnackbar("success", "Thanks for reaching out — we'll get back to you soon.");
      setContactForm({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      setContactError(getErrorMessage(error, "Could not submit your message. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      {/* Navbar */}
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
        <Toolbar component={Container} maxWidth="lg" sx={{ justifyContent: "space-between" }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <FavoriteIcon color="primary" />
            <Typography variant="h6" component="span" fontWeight={800}>
              ElderSphere
            </Typography>
          </Stack>
          <Stack direction="row" spacing={3} alignItems="center" sx={{ display: { xs: "none", md: "flex" } }}>
            {NAV_LINKS.map((link) => (
              <MuiLink key={link.href} href={link.href} underline="none" color="text.primary" fontWeight={600}>
                {link.label}
              </MuiLink>
            ))}
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <Button variant="text" component={RouterLink} to="/login">
              Log In
            </Button>
            <Button variant="primary" component={RouterLink} to="/register">
              Get Started
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Hero */}
      <Box
        ref={heroRef}
        sx={{
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, theme.palette.mode === "light" ? 0.07 : 0.16)} 0%, ${theme.palette.background.default} 60%, ${theme.palette.background.default} 100%)`,
          py: { xs: 8, md: 12 },
        }}
      >
        {/* Soft floating gradient blobs — pure CSS so they animate for free without any
            framer-motion runtime cost on a page that's mostly static text/cards. Disabled
            entirely for prefers-reduced-motion, per the media query below, rather than
            just slowed down — a slowly-breathing background is still motion some elder
            users may want off completely. Each is also wrapped in a motion.div driven by
            scroll progress for a subtle parallax drift as the hero scrolls out of view. */}
        <motion.div style={{ y: blobOneParallaxY }}>
          <Box
            sx={{
              position: "absolute",
              top: -120,
              right: -120,
              width: 420,
              height: 420,
              borderRadius: "50%",
              background: `radial-gradient(closest-side, ${alpha(theme.palette.secondary.main, 0.18)}, ${alpha(theme.palette.secondary.main, 0)})`,
              display: { xs: "none", md: "block" },
              animation: "eldersphere-blob-float-1 14s ease-in-out infinite",
              "@media (prefers-reduced-motion: reduce)": { animation: "none" },
              "@keyframes eldersphere-blob-float-1": {
                "0%, 100%": { transform: "translate(0, 0) scale(1)" },
                "50%": { transform: "translate(-24px, 28px) scale(1.08)" },
              },
            }}
          />
        </motion.div>
        <motion.div style={{ y: blobTwoParallaxY }}>
          <Box
            sx={{
              position: "absolute",
              bottom: -160,
              left: -160,
              width: 460,
              height: 460,
              borderRadius: "50%",
              background: `radial-gradient(closest-side, ${alpha(theme.palette.primary.main, 0.14)}, ${alpha(theme.palette.primary.main, 0)})`,
              display: { xs: "none", md: "block" },
              animation: "eldersphere-blob-float-2 18s ease-in-out infinite",
              "@media (prefers-reduced-motion: reduce)": { animation: "none" },
              "@keyframes eldersphere-blob-float-2": {
                "0%, 100%": { transform: "translate(0, 0) scale(1)" },
                "50%": { transform: "translate(30px, -22px) scale(1.06)" },
              },
            }}
          />
        </motion.div>
        <Container maxWidth="lg" sx={{ position: "relative" }}>
          <motion.div style={{ opacity: heroContentOpacity }}>
            <Grid container spacing={6} alignItems="center">
              <Grid size={{ xs: 12, md: 7 }}>
                <motion.div variants={heroStagger} initial="hidden" animate="show">
                  <motion.div variants={heroStaggerItem}>
                    <Typography variant="h2" component="h1" fontWeight={800} gutterBottom sx={{ fontSize: { xs: 34, md: 48 } }}>
                      {config?.heroHeadline || "Compassionate Care, Right at Home"}
                    </Typography>
                  </motion.div>
                  <motion.div variants={heroStaggerItem}>
                    <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ mb: 4 }}>
                      {config?.heroSubheadline ||
                        "Connect your loved ones with verified, professional caretakers. Book services, manage health records, and get emergency help — all in one place."}
                    </Typography>
                  </motion.div>
                  <motion.div variants={heroStaggerItem}>
                    <Stack direction="row" spacing={2}>
                      <Button variant="primary" size="large" component={RouterLink} to="/register">
                        Get Started Free
                      </Button>
                      <Button variant="outline" size="large" href="#how-it-works">
                        See How It Works
                      </Button>
                    </Stack>
                  </motion.div>
                </motion.div>
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <motion.div style={{ y: heroSceneParallaxY }}>
                  <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: "easeOut" }}>
                    <HeroScene />
                  </motion.div>
                </motion.div>
              </Grid>
            </Grid>

            {/* Stat strip — moved out from under the preview card into its own row so both
                the visual and the numbers get full width to breathe. */}
            <Grid container spacing={2} sx={{ mt: { xs: 5, md: 7 } }}>
              {STATS.map((s, idx) => (
                <Grid size={{ xs: 6, md: 3 }} key={s.label}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 + idx * 0.08, ease: "easeOut" }}
                    whileHover={{ y: -3 }}
                  >
                    <Card sx={{ textAlign: "center", py: 3 }}>
                      <Typography variant="h4" fontWeight={800} color="primary.main">
                        {s.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {s.label}
                      </Typography>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* Features */}
      <Container maxWidth="lg" id="features" sx={{ py: 10 }}>
        <motion.div {...fadeUpReveal(0)}>
          <Box textAlign="center" mb={6}>
            <Typography variant="h3" component="h2" fontWeight={800} sx={{ fontSize: { xs: 28, md: 36 } }}>
              Everything Families &amp; Caretakers Need
            </Typography>
            <Typography color="text.secondary" mt={1}>
              One platform for discovery, booking, medical records and emergency response.
            </Typography>
          </Box>
        </motion.div>
        <Grid container spacing={3}>
          {features.map((f, idx) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={f.id}>
              <motion.div {...fadeUpReveal(idx)} style={{ height: "100%" }} whileHover={{ y: -5 }}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: "primary.main",
                      mb: 2,
                    }}
                  >
                    {FEATURE_ICONS[f.iconName ?? ""] ?? <LocalHospitalIcon fontSize="large" />}
                  </Box>
                  <Typography variant="subtitle1" component="h3" fontWeight={700} gutterBottom>
                    {f.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {f.description}
                  </Typography>
                </CardContent>
              </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Service categories strip */}
      <Box sx={{ bgcolor: "background.default", py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={3} justifyContent="center">
            {[
              { icon: <LocalHospitalIcon />, label: "Nursing" },
              { icon: <AccessibilityNewIcon />, label: "Physiotherapy" },
              { icon: <MedicationIcon />, label: "Medication Assistance" },
              { icon: <GroupsIcon />, label: "Companion Care" },
            ].map((c, idx) => (
              <Grid key={c.label}>
                <motion.div {...fadeUpReveal(idx)}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 2.5, py: 1.25, bgcolor: "background.paper", borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                    <Box color="primary.main" display="flex">
                      {c.icon}
                    </Box>
                    <Typography fontWeight={600}>{c.label}</Typography>
                  </Stack>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* How it works */}
      <Container maxWidth="lg" id="how-it-works" sx={{ py: 10 }}>
        <motion.div {...fadeUpReveal(0)}>
          <Box textAlign="center" mb={6}>
            <Typography variant="h3" component="h2" fontWeight={800} sx={{ fontSize: { xs: 28, md: 36 } }}>
              How It Works
            </Typography>
          </Box>
        </motion.div>
        <Grid container spacing={4}>
          {HOW_IT_WORKS.map((step, idx) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={step.title}>
              <motion.div {...fadeUpReveal(idx)}>
                <Box textAlign="center">
                  <Box
                    sx={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      bgcolor: "primary.main",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 2,
                    }}
                  >
                    {step.icon}
                  </Box>
                  <Typography variant="overline" color="text.secondary">
                    Step {idx + 1}
                  </Typography>
                  <Typography variant="h6" component="h3" fontWeight={700} gutterBottom>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <Box sx={{ bgcolor: "background.default", py: 10 }} id="testimonials">
          <Container maxWidth="lg">
            <motion.div {...fadeUpReveal(0)}>
              <Box textAlign="center" mb={6}>
                <Typography variant="h3" component="h2" fontWeight={800} sx={{ fontSize: { xs: 28, md: 36 } }}>
                  Loved by Families &amp; Caretakers
                </Typography>
              </Box>
            </motion.div>
            <motion.div {...fadeUpReveal(1)}>
              <TestimonialsCarousel testimonials={testimonials} />
            </motion.div>
          </Container>
        </Box>
      )}

      {/* FAQ */}
      {faqs.length > 0 && (
        <Container maxWidth="md" id="faq" sx={{ py: 10 }}>
          <motion.div {...fadeUpReveal(0)}>
            <Box textAlign="center" mb={6}>
              <Typography variant="h3" component="h2" fontWeight={800} sx={{ fontSize: { xs: 28, md: 36 } }}>
                Frequently Asked Questions
              </Typography>
            </Box>
          </motion.div>
          {faqs.map((faq, idx) => (
            <motion.div {...fadeUpReveal(idx + 1)} key={faq.id}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={700}>{faq.question}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography color="text.secondary">{faq.answer}</Typography>
                </AccordionDetails>
              </Accordion>
            </motion.div>
          ))}
        </Container>
      )}

      {/* CTA */}
      <Box sx={{ bgcolor: "primary.main", color: "white", py: 8 }}>
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <motion.div {...fadeUpReveal(0)}>
            <Typography variant="h4" component="h2" fontWeight={800} gutterBottom>
              {config?.ctaHeadline || "Give Your Loved Ones the Care They Deserve"}
            </Typography>
            <Typography sx={{ mb: 4, opacity: 0.9 }}>
              {config?.ctaDescription ||
                "Join thousands of families who trust ElderSphere for professional, compassionate elderly care."}
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
              <Button
                variant="secondary"
                size="large"
                component={RouterLink}
                to="/register"
              >
                {config?.ctaButtonText || "Get Started Free"}
              </Button>
              <Button variant="outline" size="large" href="#contact" sx={{ color: "white", borderColor: "white" }}>
                Call Us Now
              </Button>
            </Stack>
          </motion.div>
        </Container>
      </Box>

      {/* Contact */}
      <Container maxWidth="sm" id="contact" sx={{ py: 10 }}>
        <motion.div {...fadeUpReveal(0)}>
          <Box textAlign="center" mb={4}>
            <Typography variant="h4" component="h2" fontWeight={800}>
              Get in Touch
            </Typography>
            <Typography color="text.secondary">Questions about ElderSphere? Send us a message.</Typography>
          </Box>
        </motion.div>
        <motion.div {...fadeUpReveal(1)}>
          <Card sx={{ p: 3 }}>
            <CardContent>
              <ErrorMessage message={contactError} />
              <Box component="form" onSubmit={handleContactSubmit}>
                <Stack spacing={2}>
                  <TextField
                    label="Full Name"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                  />
                  <TextField
                    label="Email"
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                  />
                  <TextField
                    label="Phone (optional)"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                  <TextField
                    label="Message"
                    required
                    multiline
                    minRows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                  />
                  <Button type="submit" variant="primary" loading={submitting}>
                    Send Message
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: "#241F1A", color: "white", py: 6, mt: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                <FavoriteIcon />
                <Typography variant="h6" component="span" fontWeight={800}>
                  ElderSphere
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ opacity: 0.75 }}>
                Compassionate, professional elderly care connecting families with verified caretakers.
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 2.5 }}>
              <Typography fontWeight={700} gutterBottom>
                Platform
              </Typography>
              <Stack spacing={1}>
                <MuiLink href="#features" color="inherit" underline="hover" sx={{ opacity: 0.8 }}>
                  Features
                </MuiLink>
                <MuiLink href="#how-it-works" color="inherit" underline="hover" sx={{ opacity: 0.8 }}>
                  How It Works
                </MuiLink>
                <MuiLink component={RouterLink} to="/register" color="inherit" underline="hover" sx={{ opacity: 0.8 }}>
                  Become a Caretaker
                </MuiLink>
              </Stack>
            </Grid>
            <Grid size={{ xs: 6, md: 2.5 }}>
              <Typography fontWeight={700} gutterBottom>
                Company
              </Typography>
              <Stack spacing={1}>
                <MuiLink href="#testimonials" color="inherit" underline="hover" sx={{ opacity: 0.8 }}>
                  Testimonials
                </MuiLink>
                <MuiLink href="#faq" color="inherit" underline="hover" sx={{ opacity: 0.8 }}>
                  FAQ
                </MuiLink>
                <MuiLink href="#contact" color="inherit" underline="hover" sx={{ opacity: 0.8 }}>
                  Contact
                </MuiLink>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography fontWeight={700} gutterBottom>
                Contact
              </Typography>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <EmailIcon fontSize="small" /> <Typography variant="body2">hello@eldersphere.com</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PhoneIcon fontSize="small" /> <Typography variant="body2">+91 98765 43210</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PlaceIcon fontSize="small" /> <Typography variant="body2">Mumbai, India</Typography>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
          <Divider sx={{ my: 4, borderColor: "rgba(255,255,255,0.15)" }} />
          <Typography variant="body2" textAlign="center" sx={{ opacity: 0.6 }}>
            © {new Date().getFullYear()} ElderSphere. All rights reserved. Made with ❤️ for better elderly care.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;
