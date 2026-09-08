import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import App from "./App";
import { ThemeModeProvider } from "./contexts/ThemeModeContext";
import { AuthenticatedUserProvider } from "./contexts/AuthenticatedUserContext";
import { SnackbarProvider } from "./contexts/SnackbarContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import ErrorBoundary from "./components/atoms/ErrorBoundary/ErrorBoundary";

// Registers the vite-plugin-pwa-generated service worker (app-shell precache + the
// offline-fallback runtime route, see vite.config.ts). `registerType: "autoUpdate"` means
// a new SW takes over automatically on the next load once it finishes installing — no "a
// new version is available" prompt UI needed for this app's scope. In dev this only
// registers when Vite's PWA dev support is enabled; harmless no-op import in tests (jsdom
// has no real `navigator.serviceWorker`, and this module guards accordingly).
registerSW({ immediate: true });

// Dismisses the branded splash markup that lives in index.html (see comment there) —
// double rAF so this only runs after the browser has actually painted the app's first
// real frame (the Suspense fallback spinner, or a route, whichever mounts first), not
// merely after `.render()` returns. Fades briefly, then removes the node entirely so it
// can never intercept a click. No-ops harmlessly if the splash markup isn't present
// (e.g. in tests, which render straight into jsdom without index.html).
const dismissSplash = () => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const splash = document.getElementById("app-splash");
      if (!splash) return;
      splash.classList.add("app-splash--hide");
      window.setTimeout(() => splash.remove(), 300);
    });
  });
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {/* Inside ThemeModeProvider (so the fallback screen still gets the right light/dark
        palette + warm design tokens) but outside everything else, so a crash anywhere in
        routing/auth/websocket/snackbar state is still caught instead of producing a blank
        white screen. */}
    <ThemeModeProvider>
      {/* Wraps the whole app once so every DatePicker/TimePicker atom instance (booking
          date/time, elder DOB, weekly availability, admin analytics range, ...) shares one
          Dayjs adapter — MUI X's picker popups still read the app's MUI theme (forest
          green/terracotta, dark mode, 16px radii) directly from ThemeModeProvider's
          ThemeProvider above, LocalizationProvider only supplies date-library plumbing. */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <ErrorBoundary>
          <BrowserRouter>
            <AuthenticatedUserProvider>
              <WebSocketProvider>
                <SnackbarProvider>
                  {/* reducedMotion="user" makes every framer-motion animation in the app (page
                      transitions, hover/tap lifts, the sidebar's sliding active pill, ...)
                      automatically collapse to an instant opacity-only fade for anyone with
                      prefers-reduced-motion set at the OS level — no per-component checks needed. */}
                  <MotionConfig reducedMotion="user">
                    <App />
                  </MotionConfig>
                </SnackbarProvider>
              </WebSocketProvider>
            </AuthenticatedUserProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </LocalizationProvider>
    </ThemeModeProvider>
  </React.StrictMode>
);

dismissSplash();
