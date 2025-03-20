/**
=========================================================
* F4cetPanel - Buyer Dashboard Page
=========================================================

* Copyright 2023 F4cets Team
*/

// Next.js imports
import { useRouter } from "next/router";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";

function BuyerDashboard() {
  const router = useRouter();
  const { walletId } = router.query; // Get walletId from URL

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDTypography variant="h4" color="dark">
          Welcome to the Buyer Dashboard, {walletId || "User"}
        </MDTypography>
        <MDBox mt={4}>
          {/* Add buyer-specific content here */}
          <MDTypography variant="body2" color="text">
            This is a placeholder for the buyer dashboard. Add your content here.
          </MDTypography>
        </MDBox>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default BuyerDashboard;