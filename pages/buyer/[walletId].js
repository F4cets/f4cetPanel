/**
=========================================================
* F4cetPanel - Buyer Dashboard Page
=========================================================

* Copyright 2023 F4cets Team
*/

// Next.js imports
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

// Framer Motion for animations
import { motion } from "framer-motion";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
import MDButton from "/components/MDButton";
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

  // Animation variants for the button
  const buttonVariants = {
    rest: {
      scale: 1,
      rotate: 0,
      transition: { duration: 0.3 },
    },
    hover: {
      scale: 1.1, // Pop effect
      rotate: [0, 5, -5, 5, 0], // Shake effect
      transition: {
        scale: { duration: 0.2 },
        rotate: { repeat: 1, duration: 0.5 },
      },
    },
  };

  // Affiliate Order List (Recent 5)
  const affiliateTableData = {
    columns: [
      { Header: "Order ID", accessor: "id", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Date", accessor: "date", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Clicks", accessor: "clicks", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Purchases", accessor: "purchases", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Pending WNDO", accessor: "pendingWndo", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Rewarded WNDO", accessor: "rewardedWndo", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Status", accessor: "status", width: "10%", sx: { paddingRight: "20px" } },
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
      { Header: "Order ID", accessor: "id", width: "20%", sx: { paddingRight: "20px" } },
      { Header: "Date", accessor: "date", width: "20%", sx: { paddingRight: "20px" } },
      { Header: "Product", accessor: "product", width: "20%", sx: { paddingRight: "20px" } },
      { Header: "Amount ($)", accessor: "amount", width: "20%", sx: { paddingRight: "20px" } },
      { Header: "Status", accessor: "status", width: "20%", sx: { paddingRight: "20px" } },
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

  // Handle navigation to the sell-on-f4cet page
  const handleSellOnF4cet = () => {
    router.push("/buyer/sell-on-f4cet");
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox
          maxWidth="1200px"
          mx="auto"
          mb={3}
        >
          <MDBox
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            justifyContent={{ xs: "center", sm: "space-between" }}
            alignItems={{ xs: "center", sm: "center" }}
            gap={{ xs: 2, sm: 2 }}
          >
            <MDTypography variant="h4" color="dark">
              {walletId ? walletId.slice(0, 6) + "..." + walletId.slice(-4) : "User"} -- User Dashboard
            </MDTypography>
            <motion.div
              variants={buttonVariants}
              initial="rest"
              whileHover="hover"
            >
              <MDButton
                onClick={handleSellOnF4cet}
                variant="gradient"
                color="info"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                  fontWeight: "bold",
                  borderRadius: "12px",
                  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
                  background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                  "&:hover": {
                    background: "linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)",
                  },
                  width: { xs: "100%", sm: "auto" },
                  maxWidth: { xs: "300px", sm: "auto" },
                }}
              >
                Sell on F4cet
              </MDButton>
            </motion.div>
          </MDBox>
        </MDBox>

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
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h5" color="dark" mb={2}>
                  Recent Affiliate Activity (Last 5)
                </MDTypography>
                <DataTable
                  table={affiliateTableData}
                  entriesPerPage={false}
                  canSearch={false}
                  sx={{
                    "& th": {
                      paddingRight: "20px !important",
                      paddingLeft: "20px !important",
                    },
                    "& .MuiTablePagination-root": {
                      display: "none !important",
                    },
                  }}
                />
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
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h5" color="dark" mb={2}>
                  Recent Marketplace Orders (Last 5)
                </MDTypography>
                <DataTable
                  table={marketplaceTableData}
                  entriesPerPage={false}
                  canSearch={false}
                  sx={{
                    "& th": {
                      paddingRight: "20px !important",
                      paddingLeft: "20px !important",
                    },
                    "& .MuiTablePagination-root": {
                      display: "none !important",
                    },
                  }}
                />
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

// Add getServerSideProps to handle dynamic route on server-side
export async function getServerSideProps(context) {
  const { walletId } = context.params;

  // Validate walletId (optional, add your validation logic if needed)
  if (!walletId) {
    return {
      notFound: true, // Return 404 if walletId is not provided
    };
  }

  // Return props (can fetch data here if needed)
  return {
    props: {
      walletId,
    },
  };
}

export default BuyerDashboard;