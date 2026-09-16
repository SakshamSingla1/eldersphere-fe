import React, { useEffect, useState } from "react";
import { Box, Grid } from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PageHeader from "../../../molecules/PageHeader/PageHeader";
import StatCard from "../../../molecules/StatCard/StatCard";
import { StatCardsSkeleton } from "../../../molecules/Skeletons/Skeletons";
import { usePaymentService, type EarningsResponse } from "../../../../services/usePaymentService";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { formatCurrency, getErrorMessage } from "../../../../utils/helper";

// Only totals are exposed by GET /payments/me/earnings (no time-bucketed data), so this
// stays two StatCards rather than a fabricated client-side trend chart.
const CaretakerEarningsPage: React.FC = () => {
  const paymentService = usePaymentService();
  const { showSnackbar } = useSnackbar();
  const [earnings, setEarnings] = useState<EarningsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentService
      .getMyEarnings()
      .then(setEarnings)
      .catch((err) => showSnackbar("error", getErrorMessage(err, "Could not load your earnings")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <PageHeader icon={<AccountBalanceWalletIcon color="primary" />} title="Earnings" subtitle="Your payouts from completed bookings." />

      {loading ? (
        <StatCardsSkeleton count={2} />
      ) : (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <StatCard label="Total Earned" value={formatCurrency(earnings?.totalEarned ?? 0)} icon={<AccountBalanceWalletIcon />} accentColor="#2F6F5E" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <StatCard label="Successful Payments" value={earnings?.succeededPaymentCount ?? 0} icon={<ReceiptLongIcon />} accentColor="#3178C6" />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default CaretakerEarningsPage;
