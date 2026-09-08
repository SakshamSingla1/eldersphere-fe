import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, Stack, Typography, Divider, Chip } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import PrintIcon from "@mui/icons-material/Print";
import DescriptionIcon from "@mui/icons-material/Description";
import Button from "../../../atoms/Button/Button";
import Loader from "../../../atoms/Loader/Loader";
import ErrorMessage from "../../../atoms/ErrorMessage/ErrorMessage";
import PageHeader from "../../../molecules/PageHeader/PageHeader";
import KeyValueGrid from "../../../molecules/KeyValueGrid/KeyValueGrid";
import { useMedicalRecordService, type MedicalRecordResponse } from "../../../../services/useMedicalRecordService";
import { useElderProfileService } from "../../../../services/useElderProfileService";
import { formatDateTime, getErrorMessage } from "../../../../utils/helper";

const MedicalRecordDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const recordId = Number(id);
  const navigate = useNavigate();
  const medicalRecordService = useMedicalRecordService();
  const elderProfileService = useElderProfileService();

  const [record, setRecord] = useState<MedicalRecordResponse | null>(null);
  const [elderName, setElderName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recordId) return;
    setLoading(true);
    medicalRecordService
      .getById(recordId)
      .then(async (r) => {
        setRecord(r);
        try {
          const elder = await elderProfileService.getById(r.elderProfileId);
          setElderName(elder.name);
        } catch {
          setElderName(null);
        }
      })
      .catch((err) => setError(getErrorMessage(err, "Could not load this medical record")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  if (loading) return <Loader minHeight={400} />;
  if (!record) return <ErrorMessage message={error ?? "Medical record not found"} />;

  return (
    <div>
      <Button variant="text" className="no-print" startIcon={<ArrowBackIcon />} onClick={() => navigate("/family/medical-records")} sx={{ mb: 2 }}>
        Back to medical records
      </Button>

      <Card className="print-section" sx={{ p: { xs: 2, sm: 3 } }}>
        <CardContent>
          <PageHeader
            icon={<FolderSharedIcon color="primary" fontSize="large" />}
            title={record.title}
            subtitle={`Medical Record #${record.id}`}
            actions={<Chip label={record.type} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />}
          />

          <Divider sx={{ mb: 2 }} />

          <KeyValueGrid
            items={[
              { label: "Elder", value: elderName ?? "—" },
              { label: "Type", value: record.type },
              { label: "Added", value: formatDateTime(record.createdAt) },
              { label: "Shared with family", value: record.sharedWithFamily ? "Yes" : "No" },
            ]}
          />

          {record.notes && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary" display="block">
                Notes
              </Typography>
              <Typography>{record.notes}</Typography>
            </>
          )}

          {record.documentUrl && (
            <>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" spacing={1} alignItems="center" className="no-print">
                <DescriptionIcon fontSize="small" color="action" />
                <a href={record.documentUrl} target="_blank" rel="noreferrer">
                  View attached document
                </a>
              </Stack>
            </>
          )}
        </CardContent>
      </Card>

      <Stack direction="row" spacing={1.5} mt={2.5} className="no-print">
        <Button variant="outline" startIcon={<PrintIcon />} onClick={() => window.print()}>
          Print / Save as PDF
        </Button>
      </Stack>
    </div>
  );
};

export default MedicalRecordDetailPage;
