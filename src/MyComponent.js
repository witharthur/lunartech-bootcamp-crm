import React, { useEffect, useState } from "react";
import ApplicantPage from "./pages/ApplicantPage";
import AdminPage from "./pages/AdminPage";
import PaymentPage from "./pages/PaymentPage";
import SchedulePage from "./pages/SchedulePage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import LoginPage from "./pages/LoginPage";
import { getCurrentUser, isAdmin } from "./lib/auth";
// route-aware shell

export default function MyComponent() {
  const [route, setRoute] = useState(typeof window !== "undefined" ? window.location.pathname : "/");

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname);
    window.addEventListener("popstate", onPop);
    // Refresh current user from server (if cookie set)
    import('./lib/auth').then(({ refreshCurrentUser }) => { try { refreshCurrentUser(); } catch {} });
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function navigate(to) {
    if (to === route) return;
    window.history.pushState({}, "", to);
    setRoute(to);
  }

  // Admin route guard
  if (route.startsWith("/admin")) {
    const user = getCurrentUser();
    if (!user || !isAdmin()) {
      return <LoginPage navigate={navigate} redirectTo={route} />;
    }
    return <AdminPage navigate={navigate} />;
  }

  if (route === "/payment/success") return <PaymentSuccess navigate={navigate} />;
  if (route === "/payment/cancel") return <PaymentCancel navigate={navigate} />;
  if (route.startsWith("/payment")) return <PaymentPage navigate={navigate} />;
  if (route.startsWith("/schedule")) return <SchedulePage navigate={navigate} />;
  if (route === "/login") return <LoginPage navigate={navigate} />;
  return <ApplicantPage navigate={navigate} />;
}
