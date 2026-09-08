import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Stack, Link as MuiLink, Typography, ToggleButtonGroup, ToggleButton, Box } from "@mui/material";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import ElderlyIcon from "@mui/icons-material/Elderly";
import AuthCard from "./AuthCard";
import TextField from "../../atoms/TextField/TextField";
import Button from "../../atoms/Button/Button";
import ErrorMessage from "../../atoms/ErrorMessage/ErrorMessage";
import { useAuthService } from "../../../services/useAuthService";
import { UserTypeEnum } from "../../../utils/enums";
import { REGEX } from "../../../utils/constant";
import { getErrorMessage } from "../../../utils/helper";
import { loginPathForUserType } from "../../../routes/ProtectedRoute";

const RegisterPage: React.FC = () => {
  const authService = useAuthService();
  const navigate = useNavigate();

  const [userType, setUserType] = useState<
    typeof UserTypeEnum.FAMILY_MEMBER | typeof UserTypeEnum.CARETAKER | typeof UserTypeEnum.ELDER
  >(UserTypeEnum.FAMILY_MEMBER);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!REGEX.PASSWORD.test(password)) {
      setError("Password must be at least 8 characters and include an uppercase letter and a digit.");
      return;
    }

    setLoading(true);
    try {
      await authService.register({ fullName, email, phone, password, userType });
      // Register already collects the role, so send them straight to that role's own
      // dedicated login page (rather than the generic /login picker) for a smoother flow.
      navigate(loginPathForUserType(userType), { state: { registered: true } });
    } catch (err) {
      setError(getErrorMessage(err, "Could not create your account. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Create your account" subtitle="Join ElderSphere as a family member, caretaker, or elder.">
      <ErrorMessage message={error} />
      <Box mb={2}>
        <Typography variant="body2" fontWeight={600} mb={1}>
          I am signing up as a...
        </Typography>
        <ToggleButtonGroup
          exclusive
          fullWidth
          value={userType}
          onChange={(_, value) => value && setUserType(value)}
          color="primary"
        >
          <ToggleButton value={UserTypeEnum.FAMILY_MEMBER} sx={{ py: 1.5, gap: 1 }}>
            <FamilyRestroomIcon fontSize="small" /> Family Member
          </ToggleButton>
          <ToggleButton value={UserTypeEnum.CARETAKER} sx={{ py: 1.5, gap: 1 }}>
            <VolunteerActivismIcon fontSize="small" /> Caretaker
          </ToggleButton>
          <ToggleButton value={UserTypeEnum.ELDER} sx={{ py: 1.5, gap: 1 }}>
            <ElderlyIcon fontSize="small" /> Elder
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Stack component="form" spacing={2} onSubmit={handleSubmit}>
        <TextField label="Full Name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <TextField label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <TextField
          label="Password"
          type="password"
          required
          helperText="At least 8 characters, one uppercase letter and one digit."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="primary" size="large" loading={loading}>
          Create Account
        </Button>
      </Stack>
      <Typography variant="body2" textAlign="center" mt={3}>
        Already have an account?{" "}
        <MuiLink component={RouterLink} to={loginPathForUserType(userType)} fontWeight={700}>
          Log in
        </MuiLink>
      </Typography>
    </AuthCard>
  );
};

export default RegisterPage;
