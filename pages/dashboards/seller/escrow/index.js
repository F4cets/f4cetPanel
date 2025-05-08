/**
=========================================================
* F4cetPanel - Seller Escrow Page
=========================================================

* Copyright 2023 F4cets Team
*/

// React imports
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

// User context
import { useUser } from "/contexts/UserContext";

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

// Dummy Data (Replace with Firestore/Solana data later)
const pendingEscrowPayments = [
  { id: "ESC001", date: "2025-03-20", buyerId: "0x123...456", product: "Ebook: Web3 Guide", amount: 20, currency: "USDC", status: "Pending" },
  { id: "ESC002", date: "2025-03-19", buyerId: "0x789...012", product: "Strong Hold Hoodie", amount: 50, currency: "USDC", status: "Pending" },
];

const escrowNFTInventory = [
  { id: "NFT001", date: "2025-03-20", product: "Ebook: Web3 Guide", invId: "INV002", quantity: 100, status: "Held" },
  { id: "NFT002", date: "2025-03-19", product: "Strong Hold Hoodie", invId: "INV001", quantity: 17, status: "Held" },
];

// Additional Metrics (Mock Data)
const digitalGoodsInEscrow = 1; // Number of digital items
const rwiGoodsInEscrow = 1; // Number of RWI items
const totalPendingItems = 2; // Total items in escrow
const totalPendingAmount = 70; // Total USDC pending

function SellerEscrow() {
  const { user } = useUser();
  const router = useRouter();

  // Redirect to home if no user, no walletId, or unauthorized role
  useEffect(() => {
    if (!user || !user.walletId || user.role !== "seller") {
      router.replace("/");
    }
  }, [user, router]);

  // Ensure user is loaded and authorized before rendering
  if (!user || !user.walletId || user.role !== "seller") {
    return null; // Or a loading spinner
  }

  const walletId = user.walletId;

  // Pending Escrow Payments Table
  const pendingEscrowTableData = {
    columns: [
      { Header: "Escrow ID", accessor: "id", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Date", accessor: "date", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Buyer ID", accessor: "buyerId", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Product", accessor: "product", width: "20%", sx: { paddingRight: "20px" } },
      { Header: "Amount", accessor: "amount", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Status", accessor: "status", width: "10%", sx: { paddingRight: "20px" } },
    ],
    rows: pendingEscrowPayments.map(item => ({
      ...item,
      amount: (
        <MDTypography variant="button" color="text">
          {item.amount} {item.currency}
        </MDTypography>
      ),
      status: (
        <MDBox display="flex" alignItems="center">
          <Icon
            fontSize="small"
            sx={{
              color: "warning.main",
              mr: 1,
            }}
          >
            hourglass_empty
          </Icon>
          <MDTypography variant="button" color="text">
            {item.status}
          </MDTypography>
        </MDBox>
      ),
    })),
  };

  // Escrow NFT Inventory Table
  const escrowNFTTableData = {
    columns: [
      { Header: "NFT ID", accessor: "id", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Date", accessor: "date", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Product", accessor: "product", width: "20%", sx: { paddingRight: "20px" } },
      { Header: "Inventory ID", accessor: "invId", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Quantity", accessor: "quantity", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Status", accessor: "status", width: "10%", sx: { paddingRight: "20px" } },
    ],
    rows: escrowNFTInventory.map(item => ({
      ...item,
      invId: (
        <Link href={`/dashboards/seller/inventory/details/${item.invId}`}>
          <MDTypography variant="button" color="info" fontWeight="medium">
            {item.invId}
          </MDTypography>
        </Link>
      ),
      status: (
        <MDBox display="flex" alignItems="center">
          <Icon
            fontSize="small"
            sx={{
              color: "info.main",
              mr: 1,
            }}
          >
            lock
          </Icon>
          <MDTypography variant="button" color="text">
            {item.status}
          </MDTypography>
        </MDBox>
      ),
    })),
  };

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
              {walletId ? walletId.slice(0, 6) + "..." + walletId.slice(-4) : "Seller"} -- Escrow
            </MDTypography>
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
                  <Icon fontSize="medium">cloud</Icon>
                </MDBox>
                <MDBox>
                  <MDTypography variant="h6" color="dark">
                    Digital Goods
                  </MDTypography>
                  <MDTypography variant="h4" color="info">
                    {digitalGoodsInEscrow}
                  </MDTypography>
                  <MDTypography variant="caption" color="text">
                    In Escrow
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
                    RWI Goods
                  </MDTypography>
                  <MDTypography variant="h4" color="info">
                    {rwiGoodsInEscrow}
                  </MDTypography>
                  <MDTypography variant="caption" color="text">
                    In Escrow
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
                    Total Pending
                  </MDTypography>
                  <MDTypography variant="h4" color="info">
                    {totalPendingItems}
                  </MDTypography>
                  <MDTypography variant="caption" color="text">
                    Items
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
                    Total $ Pending
                  </MDTypography>
                  <MDTypography variant="h4" color="info">
                    ${totalPendingAmount}
                  </MDTypography>
                  <MDTypography variant="caption" color="text">
                    In Escrow
                  </MDTypography>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
        </Grid>

        {/* Escrow Tables Section */}
        <Grid container spacing={3}>
          {/* Pending Escrow Payments */}
          <Grid item xs={12}>
            <Card
              sx={{
                backgroundColor: "transparent",
                boxShadow: "none",
                overflow: "hidden",
              }}
            >
              <MDBox p={3}>
                <MDTypography variant="h5" color="dark" mb={2}>
                  Pending Escrow Payments from Buyer Purchases
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
              </MDBox>
            </Card>
          </Grid>

          {/* Escrow NFT Inventory */}
          <Grid item xs={12}>
            <Card
              sx={{
                backgroundColor: "transparent",
                boxShadow: "none",
                overflow: "hidden",
              }}
            >
              <MDBox p={3}>
                <MDTypography variant="h5" color="dark" mb={2}>
                  Current NFT Inventory Being Held in Escrow
                </MDTypography>
                <DataTable
                  table={escrowNFTTableData}
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
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default SellerEscrow;