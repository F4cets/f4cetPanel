/**
=========================================================
* F4cetPanel - Seller Dashboard Page
=========================================================

* Copyright 2025 F4cets Team
*/

// React imports
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

// Framer Motion for animations
import { motion } from "framer-motion";

// User context
import { useUser } from "/contexts/UserContext";

// Firestore imports
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "/lib/firebase";

// Import fetchSolPrice for SOL-to-USD conversion
import { fetchSolPrice } from "/lib/getSolPrice";

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

// CHANGED: Add CSS keyframes for flashing animation
const flashingStyle = `
  @keyframes flash {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

function SellerDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [pendingSalesLast30Days, setPendingSalesLast30Days] = useState(0);
  const [shippedNotDelivered, setShippedNotDelivered] = useState(0);
  const [pendingEscrowTransactions, setPendingEscrowTransactions] = useState(0);
  const [pendingEscrowAmount, setPendingEscrowAmount] = useState(0);
  const [salesPaidOutAmount, setSalesPaidOutAmount] = useState(0);
  const [pendingSales, setPendingSales] = useState([]);
  const [itemsShipped, setItemsShipped] = useState([]);
  const [pendingEscrow, setPendingEscrow] = useState([]);
  const [salesPaidOut, setSalesPaidOut] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [expiryTime, setExpiryTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const hasFetched = useRef(false);
  // CHANGED: Add loading state for user check
  const [isCheckingPlan, setIsCheckingPlan] = useState(true);

  // CHANGED: Enhanced redirect to subscription page if plan expired
  useEffect(() => {
    if (!user || !user.walletId) {
      router.replace("/");
      setIsCheckingPlan(false);
      return;
    }
    if (user.plan?.expiry) {
      const expiryDate = new Date(user.plan.expiry);
      const now = new Date();
      if (expiryDate < now) {
        router.replace("/dashboards/seller/subscription");
      }
    }
    setIsCheckingPlan(false); // CHANGED: Mark check complete
  }, [user, router]);

  // Calculate and update countdown timer
  useEffect(() => {
    const calculateExpiryTime = () => {
      if (!user?.plan?.expiry) return;

      const expiryDate = new Date(user.plan.expiry);
      const now = new Date();
      const diffMs = expiryDate - now;

      if (diffMs <= 0) {
        setExpiryTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setExpiryTime({ days, hours, minutes, seconds });
    };

    calculateExpiryTime(); // Initial calculation
    const interval = setInterval(calculateExpiryTime, 1000); // Update every second

    return () => clearInterval(interval);
  }, [user?.plan?.expiry]);

  // Fetch dynamic data from Firestore
  useEffect(() => {
    const fetchSellerData = async () => {
      if (!user || !user.walletId || isFetching || hasFetched.current) return;
      setIsFetching(true);
      hasFetched.current = true;
      const walletId = user.walletId;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      try {
        // Fetch current SOL price once
        const solPrice = await fetchSolPrice();

        // Fetch user data
        const userDocRef = doc(db, "users", walletId);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) return;

        const userData = userDoc.data();
        const storeIds = userData.storeIds || [];

        // Update user context with plan.expiry
        if (userData.plan?.expiry) {
          user.plan = userData.plan; // Ensure user.plan.expiry is available for countdown
        }

        // Fetch transactions for the seller's stores
        let pendingSalesData = [];
        let itemsShippedData = [];
        let pendingEscrowData = [];
        let salesPaidOutData = [];
        let pendingSalesCount = 0;
        let shippedNotDeliveredCount = 0;
        let pendingEscrowCount = 0;
        let pendingEscrowNetAmount = 0;
        let paidOutAmount = 0;

        for (const storeId of storeIds) {
          const transactionsQuery = query(
            collection(db, "transactions"),
            where("sellerId", "==", walletId),
            where("storeId", "==", storeId)
          );
          const transactionsSnapshot = await getDocs(transactionsQuery);

          for (const txDoc of transactionsSnapshot.docs) {
            const txData = txDoc.data();
            const txDate = txData.createdAt.toDate ? txData.createdAt.toDate() : new Date();
            const productIds = txData.productIds || [];

            // Fetch product names
            const productNames = [];
            for (const productId of productIds) {
              const productDocRef = doc(db, "products", productId);
              const productDoc = await getDoc(productDocRef);
              if (productDoc.exists()) {
                productNames.push(productDoc.data().name);
              }
            }

            // Calculate net amount (minus 4% F4cet fee)
            const netAmount = txData.amount * 0.96;

            const txEntry = {
              id: txDoc.id,
              date: txDate.toISOString().split('T')[0],
              product: productNames.join(", ") || "Unknown",
              amount: txData.amount || 0,
              netAmount: netAmount || 0,
              status: txData.shippingStatus || "Unknown",
              clicks: 0,
              purchases: 1,
              pendingAmount: txData.amount || 0,
              currency: txData.currency || "USDC",
            };

            // Categorize transactions
            if (txData.shippingStatus === "Pending") {
              pendingSalesData.push(txEntry);
              if (txDate >= thirtyDaysAgo) {
                pendingSalesCount += 1;
              }
            } else if (txData.shippingStatus === "Shipped" || txData.shippingStatus === "Delivered") {
              itemsShippedData.push(txEntry);
              if (txData.shippingStatus === "Shipped" && txDate >= thirtyDaysAgo) {
                shippedNotDeliveredCount += 1;
              }
              if (txDate >= thirtyDaysAgo) {
                shippedNotDeliveredCount += txData.shippingStatus === "Delivered" ? 1 : 0;
              }
            }
            if (!txData.buyerConfirmed) {
              pendingEscrowData.push({ ...txEntry, amount: netAmount });
              if (txDate >= thirtyDaysAgo) {
                pendingEscrowCount += 1;
                if (txData.currency === "SOL") {
                  pendingEscrowNetAmount += (txData.amount * 0.96) * solPrice;
                } else if (txData.currency === "USDC") {
                  pendingEscrowNetAmount += txData.amount * 0.96;
                }
              }
            } else if (txData.buyerConfirmed) {
              salesPaidOutData.push(txEntry);
              if (txDate >= thirtyDaysAgo) {
                if (txData.currency === "SOL") {
                  paidOutAmount += (txData.amount || 0) * solPrice;
                } else if (txData.currency === "USDC") {
                  paidOutAmount += txData.amount || 0;
                }
              }
            }
          }
        }

        // Update state
        setPendingSales(pendingSalesData);
        setItemsShipped(itemsShippedData);
        setPendingEscrow(pendingEscrowData);
        setSalesPaidOut(salesPaidOutData);
        setPendingSalesLast30Days(pendingSalesCount);
        setShippedNotDelivered(shippedNotDeliveredCount);
        setPendingEscrowTransactions(pendingEscrowCount);
        setPendingEscrowAmount(pendingEscrowNetAmount);
        setSalesPaidOutAmount(paidOutAmount);
      } catch (error) {
        console.error("Error fetching seller data:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchSellerData();
  }, [user]);

  // Animation variants for buttons
  const buttonVariants = {
    rest: { scale: 1, rotate: 0, transition: { duration: 0.3 } },
    hover: {
      scale: 1.1,
      rotate: [0, 5, -5, 5, 0],
      transition: { scale: { duration: 0.2 }, rotate: { repeat: 1, duration: 0.5 } },
    },
  };

  // Pending Shipment Table (Recent 5)
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
      amount: (
        <MDTypography variant="button" color="text">
          {order.netAmount.toFixed(2)}
        </MDTypography>
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
      amount: (
        <MDTypography variant="button" color="text">
          {transaction.netAmount.toFixed(2)}
        </MDTypography>
      ),
      status: "Pending",
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
      status: "Paid",
    })),
  };

  // Navigation Handlers
  const handleCreateInventory = () => router.push("/dashboards/seller/createinv");

  // CHANGED: Prevent rendering until plan check completes
  if (isCheckingPlan || !user || !user.walletId) {
    return null; // Or a loading spinner
  }

  const walletId = user.walletId;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <style>{flashingStyle}</style>
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
              gap={2}
              width={{ xs: "100%", sm: "auto" }}
              justifyContent={{ xs: "center", sm: "flex-end" }}
              alignItems={{ xs: "center", sm: "center" }}
              mx={{ xs: "auto", sm: 0 }}
              textAlign={{ xs: "center", sm: "inherit" }}
            >
              <MDBox
                display="flex"
                alignItems="center"
                sx={{
                  bgcolor: expiryTime.days < 7 ? "error.light" : "info.light",
                  borderRadius: "8px",
                  p: 1,
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                }}
              >
                <Icon sx={{ mr: 1, color: expiryTime.days < 7 ? "error.main" : "info.main" }}>
                  timer
                </Icon>
                <MDTypography
                  variant="button"
                  color={expiryTime.days < 7 ? "error" : "dark"}
                  fontWeight="medium"
                  sx={{
                    fontSize: { xs: "0.75rem", sm: "0.85rem" },
                    whiteSpace: "nowrap",
                    animation: expiryTime.days <= 7 ? "flash 1.5s infinite" : "none",
                  }}
                >
                  Plan Expires in: {expiryTime.days}d {expiryTime.hours}h {expiryTime.minutes}m {expiryTime.seconds}s
                </MDTypography>
              </MDBox>
              {expiryTime.days <= 7 && (
                <motion.div variants={buttonVariants} initial="rest" whileHover="hover">
                  <MDButton
                    onClick={() => router.push("/dashboards/seller/subscription")}
                    variant="gradient"
                    color="error"
                    size="medium"
                    sx={{
                      px: 2,
                      py: 1,
                      fontSize: { xs: "0.75rem", sm: "0.85rem" },
                      fontWeight: "bold",
                      borderRadius: "8px",
                      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
                      width: { xs: "100%", sm: "auto" },
                      maxWidth: { xs: "300px", sm: "auto" },
                      whiteSpace: "nowrap",
                    }}
                  >
                    Renew Subscription
                  </MDButton>
                </motion.div>
              )}
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
                    "&:hover": { background: "linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)" },
                    width: { xs: "100%", sm: "auto" },
                    maxWidth: { xs: "300px", sm: "auto" },
                    whiteSpace: "nowrap",
                  }}
                >
                  Create Inventory
                </MDButton>
              </motion.div>
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
                  <MDTypography variant="h6" color="dark">Pending Shipment</MDTypography>
                  <MDTypography variant="h4" color="info">{pendingSalesLast30Days}</MDTypography>
                  <MDTypography variant="caption" color="text">Last 30 Days</MDTypography>
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
                  <MDTypography variant="h6" color="dark">Items Shipped</MDTypography>
                  <MDTypography variant="h4" color="info">{shippedNotDelivered}</MDTypography>
                  <MDTypography variant="caption" color="text">Not Delivered</MDTypography>
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
                  <MDTypography variant="h6" color="dark">Pending Escrow</MDTypography>
                  <MDTypography variant="h4" color="info">${pendingEscrowAmount.toFixed(2)}</MDTypography>
                  <MDTypography variant="caption" color="text">Net of 4% Fee</MDTypography>
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
                  <MDTypography variant="h6" color="dark">Sales Paid Out</MDTypography>
                  <MDTypography variant="h4" color="info">${salesPaidOutAmount.toFixed(2)}</MDTypography>
                  <MDTypography variant="caption" color="text">Last 30 Days</MDTypography>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
        </Grid>

        {/* Order Lists Section */}
        <Grid container spacing={3}>
          {/* Pending Shipment List */}
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h5" color="dark" mb={2}>Pending Shipment (Last 5)</MDTypography>
                <DataTable
                  table={pendingSalesTableData}
                  entriesPerPage={false}
                  canSearch={false}
                  sx={{
                    "& th": { paddingRight: "20px !important", paddingLeft: "20px !important" },
                    "& .MuiTablePagination-root": { display: "none !important" },
                  }}
                />
                <MDBox mt={2} textAlign="center">
                  <Link href="/dashboards/seller/sales/dashboard">
                    <MDTypography variant="button" color="info" fontWeight="medium">
                      View All Sales
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
                <MDTypography variant="h5" color="dark" mb={2}>Items Shipped (Last 5)</MDTypography>
                <DataTable
                  table={itemsShippedTableData}
                  entriesPerPage={false}
                  canSearch={false}
                  sx={{
                    "& th": { paddingRight: "20px !important", paddingLeft: "20px !important" },
                    "& .MuiTablePagination-root": { display: "none !important" },
                  }}
                />
                <MDBox mt={2} textAlign="center">
                  <Link href="/dashboards/seller/sales/dashboard">
                    <MDTypography variant="button" color="info" fontWeight="medium">
                      View All Sales
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
                <MDTypography variant="h5" color="dark" mb={2}>Pending Escrow (Last 5)</MDTypography>
                <DataTable
                  table={pendingEscrowTableData}
                  entriesPerPage={false}
                  canSearch={false}
                  sx={{
                    "& th": { paddingRight: "20px !important", paddingLeft: "20px !important" },
                    "& .MuiTablePagination-root": { display: "none !important" },
                  }}
                />
                <MDBox mt={2} textAlign="center">
                  <Link href="/dashboards/seller/sales/dashboard">
                    <MDTypography variant="button" color="info" fontWeight="medium">
                      View All Sales
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
                <MDTypography variant="h5" color="dark" mb={2}>Sales Paid Out (Last 5)</MDTypography>
                <DataTable
                  table={salesPaidOutTableData}
                  entriesPerPage={false}
                  canSearch={false}
                  sx={{
                    "& th": { paddingRight: "20px !important", paddingLeft: "20px !important" },
                    "& .MuiTablePagination-root": { display: "none !important" },
                  }}
                />
                <MDBox mt={2} textAlign="center">
                  <Link href="/dashboards/seller/sales/dashboard">
                    <MDTypography variant="button" color="info" fontWeight="medium">
                      View All Sales
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