import React, { useCallback } from "react";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CrudFormPage from "../../templates/Shared/CrudFormPage.template";
import { useEmergencyAlertService, type EmergencyAlertResponse } from "../../../services/useEmergencyAlertService";
import { EmergencyAlertStatusEnum, enumToOptions } from "../../../utils/enums";

// Status-update page for the Emergency Alerts queue (admins can only update an existing
// alert, not create one — see EmergencyAlerts.page.tsx for the listing this navigates
// back to).
const AdminEmergencyAlertFormPage: React.FC = () => {
  const emergencyAlertService = useEmergencyAlertService();

  const getById = useCallback((id: string) => emergencyAlertService.getById(Number(id)), [emergencyAlertService]);

  return (
    <CrudFormPage<EmergencyAlertResponse>
      entityLabel="alert"
      icon={<WarningAmberIcon color="error" />}
      backPath="/admin/emergency-alerts"
      getById={getById}
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
    />
  );
};

export default AdminEmergencyAlertFormPage;
