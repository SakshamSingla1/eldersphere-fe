import React, { useCallback, useEffect, useState } from "react";
import { Card, CardContent, Typography, Stack, Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CrudModule from "../../../templates/Shared/CrudModule.template";
import type { TableColumn } from "../../../organisms/Table/TableV1";
import Select from "../../../atoms/Select/Select";
import StatusChip from "../../../atoms/Chip/StatusChip";
import { EMERGENCY_ALERT_STATUS_TONE } from "../../../atoms/Chip/statusTones";
import EmergencyAlertButton from "../../../molecules/EmergencyAlertButton/EmergencyAlertButton";
import { useEmergencyAlertService, type EmergencyAlertResponse } from "../../../../services/useEmergencyAlertService";
import { useElderProfileService, type ElderProfileResponse } from "../../../../services/useElderProfileService";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { formatDateTime, getErrorMessage } from "../../../../utils/helper";

const FamilyEmergencyPage: React.FC = () => {
  const theme = useTheme();
  const emergencyAlertService = useEmergencyAlertService();
  const elderProfileService = useElderProfileService();
  const { showSnackbar } = useSnackbar();

  const [elders, setElders] = useState<ElderProfileResponse[]>([]);
  const [selectedElder, setSelectedElder] = useState<number | "">("");
  const [triggering, setTriggering] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    elderProfileService.getMine().then((list) => {
      setElders(list);
      if (list.length > 0) setSelectedElder(list[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTrigger = async () => {
    if (!selectedElder) return;
    setTriggering(true);
    try {
      const trigger = (lat?: number, lng?: number) =>
        emergencyAlertService.trigger(Number(selectedElder), lat, lng);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            await trigger(pos.coords.latitude, pos.coords.longitude);
            showSnackbar("success", "Emergency alert triggered! Help is on the way.");
            setRefreshKey((k) => k + 1);
            setTriggering(false);
          },
          async () => {
            await trigger();
            showSnackbar("success", "Emergency alert triggered! Help is on the way.");
            setRefreshKey((k) => k + 1);
            setTriggering(false);
          },
          { timeout: 3000 }
        );
      } else {
        await trigger();
        showSnackbar("success", "Emergency alert triggered! Help is on the way.");
        setRefreshKey((k) => k + 1);
        setTriggering(false);
      }
    } catch (error) {
      showSnackbar("error", getErrorMessage(error, "Could not trigger the emergency alert"));
      setTriggering(false);
    }
  };

  const columns: TableColumn<EmergencyAlertResponse>[] = [
    { key: "status", label: "Status", render: (r) => <StatusChip label={r.status} tone={EMERGENCY_ALERT_STATUS_TONE[r.status]} /> },
    { key: "triggeredAt", label: "Triggered At", render: (r) => formatDateTime(r.triggeredAt) },
    { key: "resolvedAt", label: "Resolved At", render: (r) => formatDateTime(r.resolvedAt) },
    { key: "responseTime", label: "Response Time", render: (r) => (r.responseTimeSeconds ? `${r.responseTimeSeconds}s` : "—") },
  ];

  const fetchPage = useCallback(
    async (page: number, size: number) => {
      if (!selectedElder) return { content: [], totalElements: 0, totalPages: 0, number: 0, size, first: true, last: true, numberOfElements: 0, empty: true };
      return emergencyAlertService.search({ elderProfileId: Number(selectedElder), page, size, sort: "triggeredAt,desc" });
    },
    [emergencyAlertService, selectedElder]
  );

  return (
    <Box>
      <Card
        sx={{
          mb: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)}, ${alpha(theme.palette.error.main, 0.03)})`,
          border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`,
        }}
      >
        <CardContent sx={{ textAlign: "center", py: 5 }}>
          <WarningAmberIcon sx={{ fontSize: 48, color: "error.main", mb: 1 }} />
          <Typography variant="h5" fontWeight={800} gutterBottom>
            One-Tap Emergency Alert
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Instantly notify nearby verified caretakers if your loved one needs urgent help.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" flexWrap="wrap">
            <Select
              label="For"
              sx={{ minWidth: 220 }}
              value={selectedElder}
              options={elders.map((e) => ({ value: e.id, label: e.name }))}
              onChange={(e) => setSelectedElder(Number(e.target.value))}
            />
            <EmergencyAlertButton loading={triggering} disabled={!selectedElder} onClick={handleTrigger}>
              Trigger Emergency Alert
            </EmergencyAlertButton>
          </Stack>
        </CardContent>
      </Card>

      <CrudModule<EmergencyAlertResponse>
        key={selectedElder}
        title="Alert History"
        columns={columns}
        getRowId={(r) => r.id}
        fetchPage={fetchPage}
        searchable={false}
        entityLabel="alert"
        refreshKey={refreshKey}
      />
    </Box>
  );
};

export default FamilyEmergencyPage;
