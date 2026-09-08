import React from "react";
import { Card, CardContent, Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import useCountUp from "../../../hooks/useCountUp";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accentColor?: string;
}

const MotionCard = motion.create(Card);

// Renders a plain numeric value as a count-up-from-0 animation on mount; anything else
// (a formatted currency string, a rating string, "—", a status label) passes through
// unchanged so this stays safe to use for every StatCard on every dashboard.
const StatValue: React.FC<{ value: string | number }> = ({ value }) => {
  const isPlainNumber = typeof value === "number" && Number.isFinite(value);
  const animated = useCountUp(isPlainNumber ? (value as number) : 0);
  if (!isPlainNumber) return <>{value}</>;
  return <>{Math.round(animated).toLocaleString()}</>;
};

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, accentColor = "#2F6F5E" }) => (
  <MotionCard
    whileHover={{ y: -4 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
    sx={{ height: "100%", transition: "box-shadow 0.2s ease", "&:hover": { boxShadow: 6 } }}
  >
    <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      {icon && (
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${accentColor}1f`,
            color: accentColor,
            flexShrink: 0,
            "& svg": { fontSize: 26 },
          }}
        >
          {icon}
        </Box>
      )}
      <Box minWidth={0}>
        <Typography variant="h5" fontWeight={800} noWrap lineHeight={1.2}>
          <StatValue value={value} />
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {label}
        </Typography>
      </Box>
    </CardContent>
  </MotionCard>
);

export default StatCard;
