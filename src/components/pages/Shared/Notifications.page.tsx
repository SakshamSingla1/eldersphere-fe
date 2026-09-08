import React, { useCallback, useState } from "react";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import CrudModule from "../../templates/Shared/CrudModule.template";
import type { TableColumn } from "../../organisms/Table/TableV1";
import Button from "../../atoms/Button/Button";
import StatusChip from "../../atoms/Chip/StatusChip";
import { useNotificationService, type NotificationResponseDTO } from "../../../services/useNotificationService";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { formatDateTime, getErrorMessage } from "../../../utils/helper";

// Shared across the Family and Caretaker shells — notifications are user-scoped, not
// role-scoped, so both route groups render this same page rather than duplicating it.
const NotificationsPage: React.FC = () => {
  const notificationService = useNotificationService();
  const { showSnackbar } = useSnackbar();
  const [refreshKey, setRefreshKey] = useState(0);

  const columns: TableColumn<NotificationResponseDTO>[] = [
    { key: "title", label: "Title", render: (r) => <span style={{ fontWeight: r.isRead ? 400 : 700 }}>{r.title}</span> },
    { key: "message", label: "Message", render: (r) => r.message },
    { key: "type", label: "Type", render: (r) => r.type },
    { key: "status", label: "Status", render: (r) => (r.isRead ? <StatusChip label="Read" tone="default" /> : <StatusChip label="Unread" tone="info" />) },
    { key: "createdAt", label: "Received", render: (r) => formatDateTime(r.createdAt) },
  ];

  const fetchPage = useCallback(
    (page: number, size: number) => notificationService.list(page, size),
    [notificationService]
  );

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      showSnackbar("success", "All notifications marked as read");
      setRefreshKey((k) => k + 1);
    } catch (error) {
      showSnackbar("error", getErrorMessage(error));
    }
  };

  return (
    <CrudModule<NotificationResponseDTO>
      title="Notifications"
      icon={<NotificationsIcon color="primary" />}
      columns={columns}
      getRowId={(r) => r.id}
      fetchPage={fetchPage}
      searchable={false}
      refreshKey={refreshKey}
      entityLabel="notification"
      onDelete={async (row) => {
        await notificationService.remove(row.id);
      }}
      extraRowActions={(row, reload) =>
        !row.isRead ? (
          <Button
            variant="text"
            size="small"
            onClick={async (e) => {
              e.stopPropagation();
              await notificationService.markAsRead(row.id);
              reload();
            }}
          >
            Mark Read
          </Button>
        ) : null
      }
      extraToolbarContent={
        <Button variant="outline" startIcon={<DoneAllIcon />} onClick={handleMarkAllRead}>
          Mark All Read
        </Button>
      }
    />
  );
};

export default NotificationsPage;
