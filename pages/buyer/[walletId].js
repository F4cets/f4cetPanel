/**
=========================================================
* F4cetPanel - Buyer Dashboard Page
=========================================================

* Copyright 2023 F4cets Team
*/

// Next.js imports
import { useRouter } from "next/router";
import Link from "next/link";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import DataTable from "/examples/Tables/DataTable";

// @mui icons
import Icon from "@mui/material/Icon";

// Mock Data (Replace with Firestore data later)
const affiliateOrders = [
  { id: "AFF001", date: "2025-03-20", clicks: 150, purchases: 10, pendingWndo: 50, rewardedWndo: 100, status: "Active" },
  { id: "AFF002", date: "2025-03-19", clicks: 200, purchases: 15, pendingWndo: 30, rewardedWndo: 80, status: "Active" },
  { id: "AFF003", date: "2025-03-18", clicks: 120, purchases: 8, pendingWndo: 20, rewardedWndo: 60, status: "Completed" },
  { id: "AFF004", date: "2025-03-17", clicks: 180, purchases: 12, pendingWndo: 40, rewardedWndo: 90, status: "Active" },
  { id: "AFF005", date: "2025-03-16", clicks: 90, purchases: 5, pendingWndo: 10, rewardedWndo: 50, status: "Completed" },
  { id: "AFF006", date: "2025-03-15", clicks: 110, purchases: 7, pendingWndo: 15, rewardedWndo: 70, status: "Active" },
];

const marketplaceOrders = [
  { id: "MKT001", date: "2025-03-20", product: "Product A", amount: 150, status: "Delivered" },
  { id: "MKT002", date: "2025-03-19", product: "Product B", amount: 200, status: "Shipped" },
  { id: "MKT003", date: "2025-03-18", product: "Product C", amount: 120, status: "Received" },
  { id: "MKT004", date: "2025-03-17", product: "Product D", amount: 180, status: "Delivered" },
  { id: "MKT005", date: "2025-03-16", product: "Product E", amount: 90, status: "Shipped" },
  { id: "MKT006", date: "2025-03-15", product: "Product F", amount: 110, status: "Received" },
];

// Additional Metrics (Mock Data)
const affiliateClicksLast30Days = 1250;
const pendingWndoRewards = 150;
const marketplacePurchasesLast30Days = 5; // Number of purchases
const marketplacePurchaseAmountLast30Days = 2450; // Dollar amount

function BuyerDashboard() {
  const router = useRouter();
  const { walletId } = router.query; // Get walletId from URL

  // Affiliate Order List (Recent 5)
  const affiliateTableData = {
    columns: [
      { Header: "Order ID", accessor: "id", width: "15%" },
      { Header: "Date", accessor: "date", width: "15%" },
      { Header: "Clicks", accessor: "clicks", width: "15%" },
      { Header: "Purchases", accessor: "purchases", width: "15%" },
      { Header: "Pending WNDO", accessor: "pendingWndo", width: "15%" },
      { Header: "Rewarded WNDO", accessor: "rewardedWndo", width: "15%" },
      { Header: "Status", accessor: "status", width: "10%" },
    ],
    rows: affiliateOrders.slice(0, 5).map(order => ({
      ...order,
      id: (
        <Link href={`/affiliate-marketplace/details/${order.id}`}>
          <MDTypography variant="button" color="info" fontWeight="medium">
            {order.id}
          </MDTypography>
        </Link>
      ),
    })),
  };

  // Marketplace Order List (Recent 5)
  const marketplaceTableData = {
    columns: [
      { Header: "Order ID", accessor: "id", width: "20%" },
      { Header: "Date", accessor: "date", width: "20%" },
      { Header: "Product", accessor: "product", width: "20%" },
      { Header: "Amount ($)", accessor: "amount", width: "20%" },
      { Header: "Status", accessor: "status", width: "20%" },
    ],
    rows: marketplaceOrders.slice(0, 5).map(order => ({
      ...order,
      id: (
        <Link href={`/affiliate-marketplace/details/${order.id}`}>
          <MDTypography variant="button" color="info" fontWeight="medium">
            {order.id}
          </MDTypography>
        </Link>
      ),
    })),
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDTypography variant="h4" color="dark" mb={3}>
          {walletId ? walletId.slice(0, 6) + "..." + walletId.slice(-4) : "User"} -- User Dashboard
        </MDTypography>

        {/* Key Metrics Section */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <MDBox p={3} display="flex" alignItems="center">
                <MDBox
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  width="3rem"
                  height="3rem"
                  borderRadius="lg"
                  color="white"
                  bgColor="info"
                  mr={2}
                >
                  <Icon fontSize="medium">link</Icon>
                </MDBox>
                <MDBox>
                  <MDTypography variant="h6" color="dark">
                    Affiliate Clicks
                  </MDTypography>
                  <MDTypography variant="h4" color="info">
                    {affiliateClicksLast30Days}
                  </MDTypography>
                  <MDTypography variant="caption" color="text">
                    Last 30 Days
                  </MDTypography>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <MDBox p={3} display="flex" alignItems="center">
                <MDBox
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  width="3rem"
                  height="3rem"
                  borderRadius="lg"
                  color="white"
                  bgColor="warning"
                  mr={2}
                >
                  <Icon fontSize="medium">currency_exchange</Icon>
                </MDBox>
                <MDBox>
                  <MDTypography variant="h6" color="dark">
                    Pending WNDO Rewards
                  </MDTypography>
                  <MDTypography variant="h4" color="info">
                    {pendingWndoRewards}
                  </MDTypography>
                  <MDTypography variant="caption" color="text">
                    Just Updated
                  </MDTypography>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <MDBox p={3} display="flex" alignItems="center">
                <MDBox
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  width="3rem"
                  height="3rem"
                  borderRadius="lg"
                  color="white"
                  bgColor="success"
                  mr={2}
                >
                  <Icon fontSize="medium">shopping_cart</Icon>
                </MDBox>
                <MDBox>
                  <MDTypography variant="h6" color="dark">
                    Marketplace Purchases
                  </MDTypography>
                  <MDTypography variant="h4" color="info">
                    {marketplacePurchasesLast30Days}
                  </MDTypography>
                  <MDTypography variant="caption" color="text">
                    Last 30 Days
                  </MDTypography>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <MDBox p={3} display="flex" alignItems="center">
                <MDBox
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  width="3rem"
                  height="3rem"
                  borderRadius="lg"
                  color="white"
                  bgColor="error"
                  mr={2}
                >
                  <Icon fontSize="medium">attach_money</Icon>
                </MDBox>
                <MDBox>
                  <MDTypography variant="h6" color="dark">
                    Marketplace Spent
                  </MDTypography>
                  <MDTypography variant="h4" color="info">
                    ${marketplacePurchaseAmountLast30Days}
                  </MDTypography>
                  <MDTypography variant="caption" color="text">
                    Last 30 Days
                  </MDTypography>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
        </Grid>

        {/* Order Lists Section */}
        <Grid container spacing={3}>
          {/* Affiliate Order List */}
          <Grid item xs={12} lg={6}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h5" color="dark" mb={2}>
                  Recent Affiliate Activity (Last 5)
                </MDTypography>
                <DataTable table={affiliateTableData} canSearch={false} />
                <MDBox mt={2} textAlign="center">
                  <Link href="/affiliate-marketplace/affiliate">
                    <MDTypography variant="button" color="info" fontWeight="medium">
                      View All Affiliate Activity
                    </MDTypography>
                  </Link>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>

          {/* Marketplace Order List */}
          <Grid item xs={12} lg={6}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h5" color="dark" mb={2}>
                  Recent Marketplace Orders (Last 5)
                </MDTypography>
                <DataTable table={marketplaceTableData} canSearch={false} />
                <MDBox mt={2} textAlign="center">
                  <Link href="/affiliate-marketplace/marketplace">
                    <MDTypography variant="button" color="info" fontWeight="medium">
                      View All Marketplace Orders
                    </MDTypography>
                  </Link>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default BuyerDashboard;