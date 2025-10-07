import { useState, useEffect } from "react";
import Dashboard from "./Dashboard";
import DashboardMobile from "./Dashboard_Mobile";

const DashboardResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return isMobile ? <DashboardMobile /> : <Dashboard />;
};

export default DashboardResponsive;