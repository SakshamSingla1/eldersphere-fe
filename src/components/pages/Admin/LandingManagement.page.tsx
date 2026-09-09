import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Tabs, Tab, Card, CardContent, Stack, Typography, Grid } from "@mui/material";
import WebIcon from "@mui/icons-material/Web";
import PageHeader from "../../molecules/PageHeader/PageHeader";
import CrudModule from "../../templates/Shared/CrudModule.template";
import type { TableColumn } from "../../organisms/Table/TableV1";
import TextField from "../../atoms/TextField/TextField";
import Button from "../../atoms/Button/Button";
import ErrorMessage from "../../atoms/ErrorMessage/ErrorMessage";
import Loader from "../../atoms/Loader/Loader";
import RatingDisplay from "../../atoms/RatingDisplay/RatingDisplay";
import {
  useLandingService,
  type LandingPageConfigResponse,
  type LandingFeatureResponse,
  type LandingFaqResponse,
  type LandingTestimonialResponse,
} from "../../../services/useLandingService";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { paginateClientSide, getErrorMessage } from "../../../utils/helper";

// A brand-new environment (or one whose DB was just reset) has no landing_page_config row
// at all — GET /landing/page comes back with config: null rather than 404ing, since it's a
// single, always-fetchable row rather than a per-user resource. The public Landing page
// already handles this (falls back to hardcoded hero/CTA copy), but this editor used to
// just bail out to a blank pane (`if (!config) return null`) with no way to ever create
// the row. It now starts from an empty, fillable form instead — PUT /landing/config
// upserts, so submitting it creates the row the same way updating an existing one would.
const BLANK_CONFIG: LandingPageConfigResponse = {
  id: 0,
  heroHeadline: "",
  heroSubheadline: "",
  heroImageUrl: "",
  ctaHeadline: "",
  ctaDescription: "",
  ctaButtonText: "",
};

const ConfigTab: React.FC = () => {
  const landingService = useLandingService();
  const { showSnackbar } = useSnackbar();
  const [config, setConfig] = useState<LandingPageConfigResponse | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    landingService
      .getPublicPage()
      .then((page) => {
        setConfig(page.config ?? BLANK_CONFIG);
        setIsNew(!page.config);
      })
      .catch(() => {
        setConfig(BLANK_CONFIG);
        setIsNew(true);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setError(null);
    setSaving(true);
    try {
      const updated = await landingService.updateConfig(config);
      setConfig(updated);
      setIsNew(false);
      showSnackbar("success", isNew ? "Landing page content created" : "Landing page config updated");
    } catch (err) {
      setError(getErrorMessage(err, "Could not update landing page config"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader minHeight={300} />;
  if (!config) return null;

  return (
    <Card sx={{ maxWidth: 720 }}>
      <CardContent>
        {isNew && (
          <Typography variant="body2" color="text.secondary" mb={2}>
            No hero/CTA content has been set yet — the public landing page is showing its built-in
            default copy in the meantime. Fill in the fields below and save to publish your own.
          </Typography>
        )}
        <ErrorMessage message={error} />
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          {/* Headline + image URL paired in a row (rather than each stacked full-width) so
              this section's grid rhythm matches the CTA row just below instead of looking
              ad hoc — two single-line fields have no reason to each claim the full card width. */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 7 }}>
              <TextField
                label="Hero Headline"
                value={config.heroHeadline ?? ""}
                onChange={(e) => setConfig((c) => ({ ...(c as LandingPageConfigResponse), heroHeadline: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                label="Hero Image URL"
                value={config.heroImageUrl ?? ""}
                onChange={(e) => setConfig((c) => ({ ...(c as LandingPageConfigResponse), heroImageUrl: e.target.value }))}
              />
            </Grid>
          </Grid>
          <TextField
            label="Hero Subheadline"
            multiline
            minRows={2}
            value={config.heroSubheadline ?? ""}
            onChange={(e) => setConfig((c) => ({ ...(c as LandingPageConfigResponse), heroSubheadline: e.target.value }))}
          />
          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField
                label="CTA Headline"
                value={config.ctaHeadline ?? ""}
                onChange={(e) => setConfig((c) => ({ ...(c as LandingPageConfigResponse), ctaHeadline: e.target.value }))}
              />
            </Grid>
            <Grid size={8}>
              <TextField
                label="CTA Description"
                value={config.ctaDescription ?? ""}
                onChange={(e) => setConfig((c) => ({ ...(c as LandingPageConfigResponse), ctaDescription: e.target.value }))}
              />
            </Grid>
            <Grid size={4}>
              <TextField
                label="CTA Button Text"
                value={config.ctaButtonText ?? ""}
                onChange={(e) => setConfig((c) => ({ ...(c as LandingPageConfigResponse), ctaButtonText: e.target.value }))}
              />
            </Grid>
          </Grid>
          <Button type="submit" variant="primary" loading={saving} sx={{ alignSelf: "flex-start" }}>
            {isNew ? "Create" : "Save"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

const FeaturesTab: React.FC = () => {
  const landingService = useLandingService();

  const columns: TableColumn<LandingFeatureResponse>[] = [
    { key: "title", label: "Title", render: (r) => r.title },
    { key: "description", label: "Description", render: (r) => r.description || "—" },
    { key: "sortOrder", label: "Order", render: (r) => r.sortOrder ?? "—" },
    { key: "isActive", label: "Active", render: (r) => (r.isActive ? "Yes" : "No") },
  ];

  const fetchPage = useCallback(
    async (page: number, size: number, search: string) => {
      const all = await landingService.getAllFeatures();
      return paginateClientSide(all, page, size, search, (item, s) => item.title.toLowerCase().includes(s));
    },
    [landingService]
  );

  return (
    <CrudModule<LandingFeatureResponse>
      title="Features"
      columns={columns}
      getRowId={(r) => r.id}
      fetchPage={fetchPage}
      entityLabel="feature"
      basePath="/admin/landing-management/features"
      extraQuery="tab=features"
      onCreate={async (values) => {
        await landingService.createFeature(values as any);
      }}
      onUpdate={async (row, values) => {
        await landingService.updateFeature(row.id, values as any);
      }}
      onDelete={async (row) => {
        await landingService.deleteFeature(row.id);
      }}
    />
  );
};

const FaqsTab: React.FC = () => {
  const landingService = useLandingService();

  const columns: TableColumn<LandingFaqResponse>[] = [
    { key: "question", label: "Question", render: (r) => r.question },
    { key: "answer", label: "Answer", render: (r) => r.answer },
    { key: "sortOrder", label: "Order", render: (r) => r.sortOrder ?? "—" },
    { key: "isActive", label: "Active", render: (r) => (r.isActive ? "Yes" : "No") },
  ];

  const fetchPage = useCallback(
    async (page: number, size: number, search: string) => {
      const all = await landingService.getAllFaqs();
      return paginateClientSide(all, page, size, search, (item, s) => item.question.toLowerCase().includes(s));
    },
    [landingService]
  );

  return (
    <CrudModule<LandingFaqResponse>
      title="FAQs"
      columns={columns}
      getRowId={(r) => r.id}
      fetchPage={fetchPage}
      entityLabel="FAQ"
      basePath="/admin/landing-management/faqs"
      extraQuery="tab=faqs"
      onCreate={async (values) => {
        await landingService.createFaq(values as any);
      }}
      onUpdate={async (row, values) => {
        await landingService.updateFaq(row.id, values as any);
      }}
      onDelete={async (row) => {
        await landingService.deleteFaq(row.id);
      }}
    />
  );
};

const TestimonialsTab: React.FC = () => {
  const landingService = useLandingService();

  const columns: TableColumn<LandingTestimonialResponse>[] = [
    { key: "authorName", label: "Author", render: (r) => r.authorName },
    { key: "authorRole", label: "Role", render: (r) => r.authorRole || "—" },
    { key: "rating", label: "Rating", render: (r) => <RatingDisplay value={r.rating} /> },
    { key: "content", label: "Content", render: (r) => r.content },
    { key: "isActive", label: "Active", render: (r) => (r.isActive ? "Yes" : "No") },
  ];

  const fetchPage = useCallback(
    async (page: number, size: number, search: string) => {
      const all = await landingService.getAllTestimonials();
      return paginateClientSide(all, page, size, search, (item, s) => item.authorName.toLowerCase().includes(s));
    },
    [landingService]
  );

  return (
    <CrudModule<LandingTestimonialResponse>
      title="Testimonials"
      columns={columns}
      getRowId={(r) => r.id}
      fetchPage={fetchPage}
      entityLabel="testimonial"
      basePath="/admin/landing-management/testimonials"
      extraQuery="tab=testimonials"
      onCreate={async (values) => {
        await landingService.createTestimonial(values as any);
      }}
      onUpdate={async (row, values) => {
        await landingService.updateTestimonial(row.id, values as any);
      }}
      onDelete={async (row) => {
        await landingService.deleteTestimonial(row.id);
      }}
    />
  );
};

const LANDING_TAB_KEYS = ["config", "features", "faqs", "testimonials"] as const;

const AdminLandingManagementPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  // Add/Edit navigates away to its own page (see LandingFeatureForm/FaqForm/TestimonialForm
  // .page.tsx) and back here via `?tab=features` etc. (set as CrudModule's `extraQuery`) —
  // read it once on mount so returning from Save/Cancel lands back on the tab the user was
  // actually on, not always the default "Hero & CTA" tab.
  const [tab, setTab] = useState(() => {
    const fromUrl = LANDING_TAB_KEYS.indexOf(searchParams.get("tab") as (typeof LANDING_TAB_KEYS)[number]);
    return fromUrl >= 0 ? fromUrl : 0;
  });

  return (
    <Box>
      <PageHeader icon={<WebIcon color="primary" />} title="Landing Page Management" />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Hero & CTA" />
        <Tab label="Features" />
        <Tab label="FAQs" />
        <Tab label="Testimonials" />
      </Tabs>
      {tab === 0 && <ConfigTab />}
      {tab === 1 && <FeaturesTab />}
      {tab === 2 && <FaqsTab />}
      {tab === 3 && <TestimonialsTab />}
    </Box>
  );
};

export default AdminLandingManagementPage;
