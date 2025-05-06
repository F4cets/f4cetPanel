/**
 * Static Test Page for Seller Subroute
 */

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";

function SellerStaticTestPage() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3} textAlign="center">
        <MDTypography variant="h4" color="dark" mb={2}>
          Seller Static Test Page
        </MDTypography>
        <MDTypography variant="h6" color="text">
          This is a static test page to confirm subrouting works under /seller/static/.
        </MDTypography>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default SellerStaticTestPage;