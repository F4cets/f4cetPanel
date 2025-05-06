/**
=========================================================
* F4cetPanel - God Dashboard Page (Admin)
=========================================================

* Copyright 2023 F4cets Team
*/

// React imports
import { useEffect } from "react";
import { useRouter } from "next/router";

// User context
import { useUser } from "/contexts/UserContext";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";

function GodDashboard() {
  const { user } = useUser();
  const router = useRouter();

  // Redirect to home if no user, no walletId, or not god role
  useEffect(() => {
    if (!user || !user.walletId || user.role !== "god") {
      router.replace("/");
    }
  }, [user, router]);

  // Ensure user is loaded and has god role before rendering
  if (!user || !user.walletId || user.role !== "god") {
    return null; // Or a loading spinner
  }

  const walletId = user.walletId;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3} textAlign="center">
        <MDTypography variant="h4" color="dark" mb={2}>
          God Dashboard for {walletId ? walletId.slice(0, 6) + "..." + walletId.slice(-4) : "Admin"}
        </MDTypography>
        <MDTypography variant="h6" color="text">
          Admin panel under construction. Analytics, user management, and platform controls will be available soon.
        </MDTypography>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default GodDashboard;