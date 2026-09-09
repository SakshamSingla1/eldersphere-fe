import React, { useCallback, useState } from "react";
import { Stack, Typography } from "@mui/material";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import CrudModule from "../../templates/Shared/CrudModule.template";
import type { TableColumn } from "../../organisms/Table/TableV1";
import Select from "../../atoms/Select/Select";
import StatusChip from "../../atoms/Chip/StatusChip";
import { CARETAKER_VERIFICATION_STATUS_TONE } from "../../atoms/Chip/statusTones";
import Avatar from "../../atoms/Avatar/Avatar";
import { useSearchService, type CaretakerSearchResultDTO } from "../../../services/useSearchService";
import { useCaretakerService } from "../../../services/useCaretakerService";
import { CaretakerVerificationStatusEnum, ServiceCategoryLabels, enumToOptions } from "../../../utils/enums";
import { formatCurrency } from "../../../utils/helper";

// Note: CaretakerController has no admin "list all caretakers" endpoint — the public
// /search/caretakers endpoint (filterable by verificationStatus) doubles as the admin
// verification queue here, which is the only backend-supported way to enumerate caretakers.
const AdminCaretakerVerificationPage: React.FC = () => {
  const searchService = useSearchService();
  const caretakerService = useCaretakerService();
  const [statusFilter, setStatusFilter] = useState<string>(CaretakerVerificationStatusEnum.PENDING);

  const columns: TableColumn<CaretakerSearchResultDTO>[] = [
    {
      key: "fullName",
      label: "Caretaker",
      render: (r) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar name={r.fullName} seed={r.id} src={r.profilePhotoUrl} sx={{ width: 34, height: 34, fontSize: 13 }} />
          <Typography fontWeight={600}>{r.fullName}</Typography>
        </Stack>
      ),
    },
    {
      key: "specialties",
      label: "Specialties",
      render: (r) => (r.specialties ?? []).map((s) => ServiceCategoryLabels[s]).join(", ") || "—",
    },
    { key: "experience", label: "Experience", render: (r) => (r.yearsOfExperience != null ? `${r.yearsOfExperience} yrs` : "—") },
    { key: "rate", label: "Rate", render: (r) => formatCurrency(r.hourlyRate) },
    { key: "rating", label: "Rating", render: (r) => r.ratingAverage?.toFixed(1) ?? "—" },
    { key: "status", label: "Verification", render: (r) => <StatusChip label={r.verificationStatus} tone={CARETAKER_VERIFICATION_STATUS_TONE[r.verificationStatus]} /> },
  ];

  const fetchPage = useCallback(
    (page: number, size: number) =>
      searchService.searchCaretakers({ verificationStatus: (statusFilter || null) as any, page, size }),
    [searchService, statusFilter]
  );

  return (
    <CrudModule<CaretakerSearchResultDTO>
      title="Caretaker Verification"
      description="Review and approve caretaker profiles before they can be booked."
      icon={<VerifiedUserIcon color="primary" />}
      columns={columns}
      getRowId={(r) => r.id}
      fetchPage={fetchPage}
      searchable={false}
      entityLabel="caretaker"
      addLabel="Review"
      basePath="/admin/caretaker-verification"
      onUpdate={async (row, values) => {
        await caretakerService.updateVerification(row.id, values.verificationStatus);
      }}
      extraToolbarContent={
        <Select
          label="Status"
          sx={{ minWidth: 180 }}
          placeholder="All statuses"
          value={statusFilter}
          options={enumToOptions(CaretakerVerificationStatusEnum)}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
      }
    />
  );
};

export default AdminCaretakerVerificationPage;
