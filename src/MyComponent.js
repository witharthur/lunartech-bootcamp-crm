import React, { useEffect, useState } from "react";
import ApplicantPage from "./pages/ApplicantPage";
import AdminPage from "./pages/AdminPage";
import PaymentPage from "./pages/PaymentPage";
import SchedulePage from "./pages/SchedulePage";
// route-aware shell

export default function MyComponent() {
  const [route, setRoute] = useState(typeof window !== "undefined" ? window.location.pathname : "/");

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function navigate(to) {
    if (to === route) return;
    window.history.pushState({}, "", to);
    setRoute(to);
  }

  if (route.startsWith("/admin")) return <AdminPage navigate={navigate} />;
  if (route.startsWith("/payment")) return <PaymentPage navigate={navigate} />;
  if (route.startsWith("/schedule")) return <SchedulePage navigate={navigate} />;
  return <ApplicantPage navigate={navigate} />;
}
