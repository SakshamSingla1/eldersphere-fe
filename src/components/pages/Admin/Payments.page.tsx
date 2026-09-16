import React, { useCallback, useState } from "react";
import PaymentIcon from "@mui/icons-material/Payment";
import { IconButton, Tooltip } from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";
import CrudModule from "../../templates/Shared/CrudModule.template";
import type { TableColumn } from "../../organisms/Table/TableV1";
import StatusChip from "../../atoms/Chip/StatusChip";
import { PAYMENT_STATUS_TONE } from "../../atoms/Chip/statusTones";
import ConfirmDialog from "../../molecules/ConfirmDialog/ConfirmDialog";
import { usePaymentService, type PaymentResponse } from "../../../services/usePaymentService";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { PaymentStatusEnum } from "../../../utils/enums";
import { formatCurrency, formatDateTime, getErrorMessage } from "../../../utils/helper";

const AdminPaymentsPage: React.FC = () => {
  const paymentService = usePaymentService();
  const { showSnackbar } = useSnackbar();
  const [refundTarget, setRefundTarget] = useState<PaymentResponse | null>(null);
  const [refunding, setRefunding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const columns: TableColumn<PaymentResponse>[] = [
    { key: "id", label: "ID", render: (r) => r.id },
    { key: "bookingId", label: "Booking", render: (r) => `#${r.bookingId}` },
    { key: "amount", label: "Amount", render: (r) => formatCurrency(r.amount) },
    { key: "currency", label: "Currency", render: (r) => r.currency },
    { key: "status", label: "Status", render: (r) => <StatusChip label={r.status} tone={PAYMENT_STATUS_TONE[r.status]} /> },
    { key: "paidAt", label: "Paid At", render: (r) => formatDateTime(r.paidAt) },
    { key: "createdAt", label: "Created At", render: (r) => formatDateTime(r.createdAt) },
  ];

  const fetchPage = useCallback(
    (page: number, size: number) => paymentService.search({ page, size, sort: "createdAt,desc" }),
    [paymentService]
  );

  const handleRefund = async () => {
    if (refunding || !refundTarget) return;
    setRefunding(true);
    try {
      await paymentService.refund(refundTarget.id);
      showSnackbar("success", "Payment refunded successfully");
      setRefundTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (error) {
      showSnackbar("error", getErrorMessage(error, "Failed to refund this payment"));
    } finally {
      setRefunding(false);
    }
  };

  return (
    <>
      <CrudModule<PaymentResponse>
        title="Payments"
        description="All payments processed across the platform."
        icon={<PaymentIcon color="primary" />}
        columns={columns}
        getRowId={(r) => r.id}
        fetchPage={fetchPage}
        searchable={false}
        entityLabel="payment"
        refreshKey={refreshKey}
        extraRowActions={(row) =>
          row.status === PaymentStatusEnum.SUCCEEDED ? (
            <Tooltip title="Refund payment">
              <IconButton size="small" color="error" aria-label="Refund payment" onClick={() => setRefundTarget(row)}>
                <ReplayIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null
        }
      />
      <ConfirmDialog
        open={Boolean(refundTarget)}
        title="Refund payment"
        message={
          refundTarget
            ? `This will refund ${formatCurrency(refundTarget.amount)} for payment #${refundTarget.id}. This action cannot be undone.`
            : ""
        }
        confirmLabel="Refund"
        danger
        loading={refunding}
        onConfirm={handleRefund}
        onCancel={() => setRefundTarget(null)}
      />
    </>
  );
};

export default AdminPaymentsPage;
