/**
=========================================================
* F4cetPanel - Seller Dashboard Page (Placeholder)
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

function SellerDashboard() {
  const router = useRouter();
  const { walletId } = router.query;

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

export async function getServerSideProps(context) {
  const { walletId } = context.params;

  if (!walletId) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      walletId,
    },
  };
}

export default SellerDashboard;