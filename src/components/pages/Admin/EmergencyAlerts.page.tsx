import React, { useCallback, useState } from "react";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CrudModule from "../../templates/Shared/CrudModule.template";
import type { TableColumn } from "../../organisms/Table/TableV1";
import Select from "../../atoms/Select/Select";
import StatusChip from "../../atoms/Chip/StatusChip";
import { EMERGENCY_ALERT_STATUS_TONE } from "../../atoms/Chip/statusTones";
import { useEmergencyAlertService, type EmergencyAlertResponse } from "../../../services/useEmergencyAlertService";
import { EmergencyAlertStatusEnum, enumToOptions } from "../../../utils/enums";
import { formatDateTime } from "../../../utils/helper";

// A live-ish queue: polls the same paginated search endpoint families use to trigger
// alerts, filterable by status, so ops staff can see and acknowledge/resolve every
// active alert platform-wide.
const AdminEmergencyAlertsPage: React.FC = () => {
  const emergencyAlertService = useEmergencyAlertService();
  const [statusFilter, setStatusFilter] = useState<string>(EmergencyAlertStatusEnum.TRIGGERED);

  const columns: TableColumn<EmergencyAlertResponse>[] = [
    { key: "elder", label: "Elder", render: (r) => r.elderName ?? `#${r.elderProfileId}` },
    { key: "status", label: "Status", render: (r) => <StatusChip label={r.status} tone={EMERGENCY_ALERT_STATUS_TONE[r.status]} /> },
    { key: "triggeredAt", label: "Triggered At", render: (r) => formatDateTime(r.triggeredAt) },
    { key: "respondingCaretaker", label: "Responder", render: (r) => (r.respondingCaretakerId ? `Caretaker #${r.respondingCaretakerId}` : "—") },
    { key: "resolvedAt", label: "Resolved At", render: (r) => formatDateTime(r.resolvedAt) },
    { key: "responseTime", label: "Response Time", render: (r) => (r.responseTimeSeconds ? `${r.responseTimeSeconds}s` : "—") },
  ];

  const fetchPage = useCallback(
    (page: number, size: number) =>
      emergencyAlertService.search({ status: (statusFilter || null) as any, page, size, sort: "triggeredAt,desc" }),
    [emergencyAlertService, statusFilter]
  );

  return (
    <CrudModule<EmergencyAlertResponse>
      title="Emergency Alerts"
      description="Live queue of triggered, acknowledged and resolved emergency alerts."
      icon={<WarningAmberIcon color="error" />}
      columns={columns}
      getRowId={(r) => r.id}
      fetchPage={fetchPage}
      searchable={false}
      entityLabel="alert"
      addLabel="Update"
      toFormValues={(r) => ({ status: r.status, respondingCaretakerId: r.respondingCaretakerId ?? "" })}
      fields={[
        { name: "status", label: "Status", type: "select", required: true, options: enumToOptions(EmergencyAlertStatusEnum) },
        { name: "respondingCaretakerId", label: "Responding Caretaker ID", type: "number" },
      ]}
      onUpdate={async (row, values) => {
        await emergencyAlertService.updateStatus(
          row.id,
          values.status,
          values.respondingCaretakerId ? Number(values.respondingCaretakerId) : undefined
        );
      }}
      extraToolbarContent={
        <Select
          label="Status"
          sx={{ minWidth: 180 }}
          placeholder="All statuses"
          value={statusFilter}
          options={enumToOptions(EmergencyAlertStatusEnum)}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
      }
    />
  );
};

export default AdminEmergencyAlertsPage;
