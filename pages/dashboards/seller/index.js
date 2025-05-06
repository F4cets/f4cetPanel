/**
=========================================================
* F4cetPanel - Seller Dashboard Page (Placeholder)
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

function SellerDashboard() {
  const { user } = useUser();
  const router = useRouter();

  // Redirect to home if no user or walletId
  useEffect(() => {
    if (!user || !user.walletId) {
      router.replace("/");
    }
  }, [user, router]);

  // Ensure user is loaded before rendering
  if (!user || !user.walletId) {
    return null; // Or a loading spinner
  }

  const walletId = user.walletId;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3} textAlign="center">
        <MDTypography variant="h4" color="dark" mb={2}>
          Seller Dashboard for {walletId ? walletId.slice(0, 6) + "..." + walletId.slice(-4) : "User"}
        </MDTypography>
        <MDTypography variant="h6" color="text">
          This page is under construction. Your seller admin panel will be available soon after subscribing to a plan.
        </MDTypography>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default SellerDashboard;