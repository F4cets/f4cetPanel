/**
=========================================================
* F4cetPanel - Seller Dashboard Page
=========================================================

* Copyright 2023 F4cets Team
*/

// React imports
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

// Framer Motion for animations
import { motion } from "framer-motion";

// User context
import { useUser } from "/contexts/UserContext";

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
const pendingSales = [
  { id: "SALE001", date: "2025-03-20", clicks: 150, purchases: 10, pendingAmount: 50, status: "Pending" },
  { id: "SALE002", date: "2025-03-19", clicks: 200, purchases: 15, pendingAmount: 30, status: "Pending" },
  { id: "SALE003", date: "2025-03-18", clicks: 120, purchases: 8, pendingAmount: 20, status: "Pending" },
  { id: "SALE004", date: "2025-03-17", clicks: 180, purchases: 12, pendingAmount: 40, status: "Pending" },
  { id: "SALE005", date: "2025-03-16", clicks: 90, purchases: 5, pendingAmount: 10, status: "Pending" },
  { id: "SALE006", date: "2025-03-15", clicks: 110, purchases: 7, pendingAmount: 15, status: "Pending" },
];

const itemsShipped = [
  { id: "SHIP001", date: "2025-03-20", product: "Product A", amount: 150, status: "Shipped" },
  { id: "SHIP002", date: "2025-03-19", product: "Product B", amount: 200, status: "Shipped" },
  { id: "SHIP003", date: "2025-03-18", product: "Product C", amount: 120, status: "Delivered" },
  { id: "SHIP004", date: "2025-03-17", product: "Product D", amount: 180, status: "Shipped" },
  { id: "SHIP005", date: "2025-03-16", product: "Product E", amount: 90, status: "Delivered" },
  { id: "SHIP006", date: "2025-03-15", product: "Product F", amount: 110, status: "Shipped" },
];

const pendingEscrow = [
  { id: "ESC001", date: "2025-03-20", product: "Product A", amount: 150, status: "Pending" },
  { id: "ESC002", date: "2025-03-19", product: "Product B", amount: 200, status: "Pending" },
  { id: "ESC003", date: "2025-03-18", product: "Product C", amount: 120, status: "Pending" },
  { id: "ESC004", date: "2025-03-17", product: "Product D", amount: 180, status: "Pending" },
  { id: "ESC005", date: "2025-03-16", product: "Product E", amount: 90, status: "Pending" },
];

const salesPaidOut = [
  { id: "PAY001", date: "2025-03-20", product: "Product A", amount: 150, status: "Paid" },
  { id: "PAY002", date: "2025-03-19", product: "Product B", amount: 200, status: "Paid" },
  { id: "PAY003", date: "2025-03-18", product: "Product C", amount: 120, status: "Paid" },
  { id: "PAY004", date: "2025-03-17", product: "Product D", amount: 180, status: "Paid" },
  { id: "PAY005", date: "2025-03-16", product: "Product E", amount: 90, status: "Paid" },
];

// Additional Metrics (Mock Data)
const pendingSalesLast30Days = 31;
const shippedNotDelivered = 5;
const pendingEscrowTransactions = 3;
const salesPaidOutAmount = 4500;

function SellerDashboard() {
  const { user } = useUser();
  const router = useRouter();

  // Redirect to home if no user or walletId
  useEffect(() => {
    if (!user || !user.walletId) {
      router.replace("/");
    }
  }, [user, router]);

  // Animation variants for buttons
  const buttonVariants = {
    rest: {
      scale: 1,
      rotate: 0,
      transition: { duration: 0.3 },
    },
    hover: {
      scale: 1.1,
      rotate: [0, 5, -5, 5, 0],
      transition: {
        scale: { duration: 0.2 },
        rotate: { repeat: 1, duration: 0.5 },
      },
    },
  };

  // Pending Sales Table (Recent 5)
  const pendingSalesTableData = {
    columns: [
      { Header: "Sale ID", accessor: "id", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Date", accessor: "date", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Clicks", accessor: "clicks", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Purchases", accessor: "purchases", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Pending Amount ($)", accessor: "pendingAmount", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Status", accessor: "status", width: "10%", sx: { paddingRight: "20px" } },
    ],
    rows: pendingSales.slice(0, 5).map(sale => ({
      ...sale,
      id: (
        <Link href={`/dashboards/seller/sales/details/${sale.id}`}>
          <MDTypography variant="button" color="info" fontWeight="medium">
            {sale.id}
          </MDTypography>
        </Link>
      ),
    })),
  };

  // Items Shipped Table (Recent 5)
  const itemsShippedTableData = {
    columns: [
      { Header: "Order ID", accessor: "id", width: "20%", sx: { paddingRight: "20px" } },
      { Header: "Date", accessor: "date", width: "20%", sx: { paddingRight: "20px" } },
      { Header: "Product", accessor: "product", width: "20%", sx: { paddingRight: "20px" } },
      { Header: "Amount ($)", accessor: "amount", width: "20%", sx: { paddingRight: "20px" } },
      { Header: "Status", accessor: "status", width: "20%", sx: { paddingRight: "20px" } },
    ],
    rows: itemsShipped.slice(0, 5).map(order => ({
      ...order,
      id: (
        <Link href={`/dashboards/seller/sales/details/${order.id}`}>
          <MDTypography variant="button" color="info" fontWeight="medium">
            {order.id}
          </MDTypography>
        </Link>
      ),
    })),
  };

  // Pending Escrow Table (Recent 5)
  const pendingEscrowTableData = {
    columns: [
      { Header: "Transaction ID", accessor: "id", width: "20%", sx: { paddingRight: "20px" } },
      { Header: "Date", accessor: "date", width: "20%", sx: { paddingRight: "20px" } },
      { Header: "Product", accessor: "product", width: "20%", sx: { paddingRight: "20px" } },
      { Header: "Amount ($)", accessor: "amount", width: "20%", sx: { paddingRight: "20px" } },
      { Header: "Status", accessor: "status", width: "20%", sx: { paddingRight: "20px" } },
    ],
    rows: pendingEscrow.slice(0, 5).map(transaction => ({
      ...transaction,
      id: (
        <Link href={`/dashboards/seller/sales/details/${transaction.id}`}>
          <MDTypography variant="button" color="info" fontWeight="medium">
            {transaction.id}
          </MDTypography>
        </Link>
      ),
    })),
  };

  // Sales Paid Out Table (Recent 5)
  const salesPaidOutTableData = {
    columns: [
      { Header: "Payment ID", accessor: "id", width: "20%", sx: { paddingRight: "20px" } },
      { Header: "Date", accessor: "date", width: "20%", sx: { paddingRight: "20px" } },
      { Header: "Product", accessor: "product", width: "20%", sx: { paddingRight: "20px" } },
      { Header: "Amount ($)", accessor: "amount", width: "20%", sx: { paddingRight: "20px" } },
      { Header: "Status", accessor: "status", width: "20%", sx: { paddingRight: "20px" } },
    ],
    rows: salesPaidOut.slice(0, 5).map(payment => ({
      ...payment,
      id: (
        <Link href={`/dashboards/seller/sales/details/${payment.id}`}>
          <MDTypography variant="button" color="info" fontWeight="medium">
            {payment.id}
          </MDTypography>
        </Link>
      ),
    })),
  };

  // Navigation Handlers
  const handleCreateInventory = () => {
    router.push("/dashboards/seller/createinv");
  };
  const handleEditInventory = () => {
    router.push("/dashboards/seller/editinv");
  };
  const handleViewEscrow = () => {
    router.push("/dashboards/seller/viewescrow");
  };
  const handleOnboarding = () => {
    router.push("/dashboards/onboarding");
  };

  // Ensure user is loaded before rendering
  if (!user || !user.walletId) {
    return null; // Or a loading spinner
  }

  const walletId = user.walletId;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox maxWidth="1200px" mx="auto" mb={3}>
          <MDBox
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            justifyContent={{ xs: "center", sm: "space-between" }}
            alignItems={{ xs: "center", sm: "center" }}
            gap={{ xs: 2, sm: 2 }}
          >
            <MDTypography variant="h4" color="dark">
              {walletId ? walletId.slice(0, 6) + "..." + walletId.slice(-4) : "Seller"} -- Seller Dashboard
            </MDTypography>
            <MDBox
              display="flex"
              flexDirection={{ xs: "column", sm: "row" }}
              gap={1}
              width={{ xs: "100%", sm: "auto" }}
              justifyContent={{ xs: "center", sm: "flex-end" }}
              alignItems={{ xs: "center", sm: "center" }}
              mx={{ xs: "auto", sm: 0 }}
              textAlign={{ xs: "center", sm: "inherit" }}
            >
              <Grid container spacing={1} justifyContent="center">
                {/* First Row: Create Inventory and Edit Inventory */}
                <Grid item xs={12} sm="auto">
                  <MDBox display="flex" gap={1} justifyContent="center">
                    <motion.div variants={buttonVariants} initial="rest" whileHover="hover">
                      <MDButton
                        onClick={handleCreateInventory}
                        variant="gradient"
                        color="info"
                        size="medium"
                        sx={{
                          px: 2,
                          py: 1,
                          fontSize: { xs: "0.75rem", sm: "0.85rem" },
                          fontWeight: "bold",
                          borderRadius: "8px",
                          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
                          background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                          "&:hover": {
                            background: "linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)",
                          },
                          width: { xs: "100%", sm: "auto" },
                          maxWidth: { xs: "300px", sm: "auto" },
                          whiteSpace: "nowrap",
                        }}
                      >
                        Create Inventory
                      </MDButton>
                    </motion.div>
                    <motion.div variants={buttonVariants} initial="rest" whileHover="hover">
                      <MDButton
                        onClick={handleEditInventory}
                        variant="gradient"
                        color="info"
                        size="medium"
                        sx={{
                          px: 2,
                          py: 1,
                          fontSize: { xs: "0.75rem", sm: "0.85rem" },
                          fontWeight: "bold",
                          borderRadius: "8px",
                          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
                          background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                          "&:hover": {
                            background: "linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)",
                          },
                          width: { xs: "100%", sm: "auto" },
                          maxWidth: { xs: "300px", sm: "auto" },
                          whiteSpace: "nowrap",
                        }}
                      >
                        Edit Inventory
                      </MDButton>
                    </motion.div>
                  </MDBox>
                </Grid>
                {/* Second Row: View Escrow and Onboarding/Settings */}
                <Grid item xs={12} sm="auto">
                  <MDBox display="flex" gap={1} justifyContent="center">
                    <motion.div variants={buttonVariants} initial="rest" whileHover="hover">
                      <MDButton
                        onClick={handleViewEscrow}
                        variant="gradient"
                        color="info"
                        size="medium"
                        sx={{
                          px: 2,
                          py: 1,
                          fontSize: { xs: "0.75rem", sm: "0.85rem" },
                          fontWeight: "bold",
                          borderRadius: "8px",
                          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
                          background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                          "&:hover": {
                            background: "linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)",
                          },
                          width: { xs: "100%", sm: "auto" },
                          maxWidth: { xs: "300px", sm: "auto" },
                          whiteSpace: "nowrap",
                        }}
                      >
                        View Escrow
                      </MDButton>
                    </motion.div>
                    <motion.div variants={buttonVariants} initial="rest" whileHover="hover">
                      <MDButton
                        onClick={handleOnboarding}
                        variant="gradient"
                        color="info"
                        size="medium"
                        sx={{
                          px: 2,
                          py: 1,
                          fontSize: { xs: "0.75rem", sm: "0.85rem" },
                          fontWeight: "bold",
                          borderRadius: "8px",
                          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
                          background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                          "&:hover": {
                            background: "linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)",
                          },
                          width: { xs: "100%", sm: "auto" },
                          maxWidth: { xs: "300px", sm: "auto" },
                          whiteSpace: "nowrap",
                        }}
                      >
                        Onboarding/Settings
                      </MDButton>
                    </motion.div>
                  </MDBox>
                </Grid>
              </Grid>
            </MDBox>
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
                    Pending Sales
                  </MDTypography>
                  <MDTypography variant="h4" color="info">
                    {pendingSalesLast30Days}
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
                  <Icon fontSize="medium">local_shipping</Icon>
                </MDBox>
                <MDBox>
                  <MDTypography variant="h6" color="dark">
                    Items Shipped
                  </MDTypography>
                  <MDTypography variant="h4" color="info">
                    {shippedNotDelivered}
                  </MDTypography>
                  <MDTypography variant="caption" color="text">
                    Not Delivered
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
                  <Icon fontSize="medium">lock</Icon>
                </MDBox>
                <MDBox>
                  <MDTypography variant="h6" color="dark">
                    Pending Escrow
                  </MDTypography>
                  <MDTypography variant="h4" color="info">
                    {pendingEscrowTransactions}
                  </MDTypography>
                  <MDTypography variant="caption" color="text">
                    Transactions
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
                    Sales Paid Out
                  </MDTypography>
                  <MDTypography variant="h4" color="info">
                    ${salesPaidOutAmount}
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
          {/* Pending Sales List */}
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h5" color="dark" mb={2}>
                  Pending Sales (Last 5)
                </MDTypography>
                <DataTable
                  table={pendingSalesTableData}
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
                  <Link href="/dashboards/seller/sales">
                    <MDTypography variant="button" color="info" fontWeight="medium">
                      View All Pending Sales
                    </MDTypography>
                  </Link>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>

          {/* Items Shipped List */}
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h5" color="dark" mb={2}>
                  Items Shipped (Last 5)
                </MDTypography>
                <DataTable
                  table={itemsShippedTableData}
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
                  <Link href="/dashboards/seller/sales">
                    <MDTypography variant="button" color="info" fontWeight="medium">
                      View All Pending Sales
                    </MDTypography>
                  </Link>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>

          {/* Pending Escrow List */}
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h5" color="dark" mb={2}>
                  Pending Escrow (Last 5)
                </MDTypography>
                <DataTable
                  table={pendingEscrowTableData}
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
                  <Link href="/dashboards/seller/sales">
                    <MDTypography variant="button" color="info" fontWeight="medium">
                      View All Pending Sales
                    </MDTypography>
                  </Link>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>

          {/* Sales Paid Out List */}
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h5" color="dark" mb={2}>
                  Sales Paid Out (Last 5)
                </MDTypography>
                <DataTable
                  table={salesPaidOutTableData}
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
                  <Link href="/dashboards/seller/sales">
                    <MDTypography variant="button" color="info" fontWeight="medium">
                      View All Pending Sales
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

export default SellerDashboard;