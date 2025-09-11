import React, { useEffect, useState } from "react";
import ApplicantPage from "./pages/ApplicantPage";
import AdminPage from "./pages/AdminPage";
import PaymentPage from "./pages/PaymentPage";
import SchedulePage from "./pages/SchedulePage";
<<<<<<< HEAD
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import LoginPage from "./pages/LoginPage";
import { getCurrentUser, isAdmin } from "./lib/auth";
=======
>>>>>>> 9673f251c9d61005c16ab3bbebb483ba648375ff
// route-aware shell

export default function MyComponent() {
  const [route, setRoute] = useState(typeof window !== "undefined" ? window.location.pathname : "/");

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname);
    window.addEventListener("popstate", onPop);
<<<<<<< HEAD
    // Refresh current user from server (if cookie set)
    import('./lib/auth').then(({ refreshCurrentUser }) => { try { refreshCurrentUser(); } catch {} });
=======
>>>>>>> 9673f251c9d61005c16ab3bbebb483ba648375ff
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function navigate(to) {
    if (to === route) return;
    window.history.pushState({}, "", to);
    setRoute(to);
  }

<<<<<<< HEAD
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
=======
  if (route.startsWith("/admin")) return <AdminPage navigate={navigate} />;
  if (route.startsWith("/payment")) return <PaymentPage navigate={navigate} />;
  if (route.startsWith("/schedule")) return <SchedulePage navigate={navigate} />;
>>>>>>> 9673f251c9d61005c16ab3bbebb483ba648375ff
  return <ApplicantPage navigate={navigate} />;
}
