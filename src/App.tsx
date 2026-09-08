import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Loader from "./components/atoms/Loader/Loader";
import ProtectedRoute from "./routes/ProtectedRoute";
import RouteTransition from "./components/atoms/RouteTransition/RouteTransition";
import { UserTypeEnum } from "./utils/enums";

const Landing = lazy(() => import("./components/pages/Landing/Landing.page"));
const LoginPage = lazy(() => import("./components/pages/Authentication/Login.page"));
const AdminLoginPage = lazy(() => import("./components/pages/Authentication/AdminLogin.page"));
const SuperAdminLoginPage = lazy(() => import("./components/pages/Authentication/SuperAdminLogin.page"));
const ElderLoginPage = lazy(() => import("./components/pages/Authentication/ElderLogin.page"));
const CaretakerLoginPage = lazy(() => import("./components/pages/Authentication/CaretakerLogin.page"));
const FamilyLoginPage = lazy(() => import("./components/pages/Authentication/FamilyLogin.page"));
const RegisterPage = lazy(() => import("./components/pages/Authentication/Register.page"));
const ForgotPasswordPage = lazy(() => import("./components/pages/Authentication/ForgotPassword.page"));
const ResetPasswordPage = lazy(() => import("./components/pages/Authentication/ResetPassword.page"));
const NotFoundPage = lazy(() => import("./components/pages/NotFound/NotFound.page"));

const FamilyRoutes = lazy(() => import("./routes/FamilyRoutes/FamilyRoutes"));
const CaretakerRoutes = lazy(() => import("./routes/CaretakerRoutes/CaretakerRoutes"));
const AdminRoutes = lazy(() => import("./routes/AdminRoutes/AdminRoutes"));
const ElderRoutes = lazy(() => import("./routes/ElderRoutes/ElderRoutes"));

const App: React.FC = () => {
  return (
    <Suspense fallback={<Loader minHeight="100vh" />}>
      <Routes>
        {/* Public site — each mounts with a subtle fade+rise (RouteTransition). These are
            never siblings at once, so a plain entrance animation (no AnimatePresence/exit
            needed) is enough and avoids remounting the authenticated shells below. */}
        <Route path="/" element={<RouteTransition><Landing /></RouteTransition>} />
        <Route path="/login" element={<RouteTransition><LoginPage /></RouteTransition>} />
        <Route path="/login/super-admin" element={<RouteTransition><SuperAdminLoginPage /></RouteTransition>} />
        <Route path="/login/elder" element={<RouteTransition><ElderLoginPage /></RouteTransition>} />
        <Route path="/login/caretaker" element={<RouteTransition><CaretakerLoginPage /></RouteTransition>} />
        <Route path="/login/family" element={<RouteTransition><FamilyLoginPage /></RouteTransition>} />
        <Route path="/admin/login" element={<RouteTransition><AdminLoginPage /></RouteTransition>} />
        <Route path="/register" element={<RouteTransition><RegisterPage /></RouteTransition>} />
        <Route path="/forgot-password" element={<RouteTransition><ForgotPasswordPage /></RouteTransition>} />
        <Route path="/reset-password" element={<RouteTransition><ResetPasswordPage /></RouteTransition>} />

        {/* Authenticated shells — one route group per role, each behind ProtectedRoute */}
        <Route
          path="/family/*"
          element={
            <ProtectedRoute allowedUserTypes={[UserTypeEnum.FAMILY_MEMBER]}>
              <FamilyRoutes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/caretaker/*"
          element={
            <ProtectedRoute allowedUserTypes={[UserTypeEnum.CARETAKER]}>
              <CaretakerRoutes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/elder/*"
          element={
            <ProtectedRoute allowedUserTypes={[UserTypeEnum.ELDER]}>
              <ElderRoutes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedUserTypes={[UserTypeEnum.ADMIN, UserTypeEnum.SUPER_ADMIN]}>
              <AdminRoutes />
            </ProtectedRoute>
          }
        />

        {/* Catch-all — any URL that doesn't match a public route or an authenticated
            shell's own routes (those redirect unknown sub-paths to their dashboard
            internally, see routes/*Routes) lands here instead of a blank page. */}
        <Route path="*" element={<RouteTransition><NotFoundPage /></RouteTransition>} />
      </Routes>
    </Suspense>
  );
};

export default App;
