import React, { useCallback } from "react";
import { useParams } from "react-router-dom";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import CrudFormPage from "../../templates/Shared/CrudFormPage.template";
import CaretakerVerificationDocumentsPanel from "./CaretakerVerificationDocumentsPanel";
import { useCaretakerService, type CaretakerProfileResponse } from "../../../services/useCaretakerService";
import { CaretakerVerificationStatusEnum, enumToOptions } from "../../../utils/enums";

// Verification-status page for the Caretaker Verification queue (admins can only review
// an existing caretaker profile, not create one — see CaretakerVerification.page.tsx for
// the listing this navigates back to).
const AdminCaretakerVerificationFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const caretakerService = useCaretakerService();

  const getById = useCallback((id: string) => caretakerService.getById(Number(id)), [caretakerService]);

  return (
    <>
      <CrudFormPage<CaretakerProfileResponse>
        entityLabel="caretaker"
        icon={<VerifiedUserIcon color="primary" />}
        backPath="/admin/caretaker-verification"
        getById={getById}
        toFormValues={(r) => ({ verificationStatus: r.verificationStatus })}
        fields={[{ name: "verificationStatus", label: "Verification Status", type: "select", required: true, options: enumToOptions(CaretakerVerificationStatusEnum) }]}
        onUpdate={async (row, values) => {
          await caretakerService.updateVerification(row.id, values.verificationStatus);
        }}
      />
      {id && <CaretakerVerificationDocumentsPanel caretakerId={Number(id)} />}
    </>
  );
};

export default AdminCaretakerVerificationFormPage;
