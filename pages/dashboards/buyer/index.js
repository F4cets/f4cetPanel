/**
=========================================================
* F4cetPanel - Buyer Dashboard Page
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

// Firestore imports
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "/lib/firebase";

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

function BuyerDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [affiliateClicksLast30Days, setAffiliateClicksLast30Days] = useState(0);
  const [pendingWndoRewards, setPendingWndoRewards] = useState(0);
  const [marketplacePurchasesLast30Days, setMarketplacePurchasesLast30Days] = useState(0);
  const [marketplacePurchaseAmountLast30Days, setMarketplacePurchaseAmountLast30Days] = useState(0);
  const [affiliateActivity, setAffiliateActivity] = useState([]);
  const [marketplaceOrders, setMarketplaceOrders] = useState([]);
  const [isFetching, setIsFetching] = useState(false);

  // Redirect to home if no user or walletId
  useEffect(() => {
    if (!user || !user.walletId) {
      router.replace("/");
    }
  }, [user, router]);

  // Fetch dynamic data from Firestore
  useEffect(() => {
    const fetchBuyerData = async () => {
      if (!user || !user.walletId || isFetching) return;

      setIsFetching(true);
      const walletId = user.walletId;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      try {
        // Fetch user data
        const userDocRef = doc(db, "users", walletId);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) return;

        const userData = userDoc.data();

        // Fetch affiliate clicks from subcollection
        const clicksQuery = query(collection(db, `users/${walletId}/affiliateClicks`));
        const clicksSnapshot = await getDocs(clicksQuery);
        const clicks = clicksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp ? new Date(doc.data().timestamp) : new Date(),
        }));

        // Affiliate Clicks (Last 30 Days)
        const recentClicks = clicks.filter(click => click.timestamp >= thirtyDaysAgo);
        setAffiliateClicksLast30Days(recentClicks.length);

        // Affiliate Activity
        const affiliateActivityData = [];
        for (const click of clicks) {
          const clickDate = click.timestamp;
          if (clickDate >= thirtyDaysAgo) {
            const existingActivity = affiliateActivityData.find(activity => activity.affiliateName === click.affiliateName);
            if (existingActivity) {
              existingActivity.clicks += 1;
              existingActivity.purchases = 0; // Placeholder
              existingActivity.pendingWndo = 0; // Placeholder
            } else {
              affiliateActivityData.push({
                id: click.id,
                affiliateName: click.affiliateName,
                date: clickDate.toISOString().split('T')[0],
                clicks: 1,
                purchases: 0, // Placeholder
                pendingWndo: 0, // Placeholder
                status: "clicked",
              });
            }
          }
        }
        setAffiliateActivity(affiliateActivityData);
        setPendingWndoRewards(0); // Placeholder until purchase linking

        // Marketplace Purchases
        const purchaseIds = userData.purchases || [];
        const transactions = [];
        let purchaseCount = 0;
        let purchaseAmount = 0;

        console.log("Purchase IDs:", purchaseIds);

        for (const purchaseId of purchaseIds) {
          const transactionDocRef = doc(db, "transactions", purchaseId);
          const transactionDoc = await getDoc(transactionDocRef);
          if (transactionDoc.exists()) {
            const transactionData = transactionDoc.data();
            console.log(`Transaction ${purchaseId} data:`, transactionData);

            if (transactionData.type === "rwi" && transactionData.buyerId === walletId) {
              const purchaseDate = transactionData.createdAt.toDate ? transactionData.createdAt.toDate() : new Date();
              if (purchaseDate >= thirtyDaysAgo) {
                purchaseCount += 1;
                purchaseAmount += transactionData.amount || 0;
              }
              transactions.push({
                id: purchaseId,
                date: purchaseDate.toISOString().split('T')[0],
                product: transactionData.productIds.join(", "),
                amount: transactionData.amount,
                status: transactionData.shippingStatus,
              });
            }
          }
        }
        setMarketplacePurchasesLast30Days(purchaseCount);
        setMarketplacePurchaseAmountLast30Days(purchaseAmount);
        setMarketplaceOrders(transactions);
        console.log("Final marketplace orders:", transactions);
      } catch (error) {
        console.error("Error fetching buyer data:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchBuyerData();
  }, [user, router]);

  // Animation variants for the button
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

  // Affiliate Activity Table
  const affiliateTableData = {
    columns: [
      { Header: "Affiliate Name", accessor: "affiliateName", width: "20%", sx: { paddingRight: "20px" } },
      { Header: "Date", accessor: "date", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Clicks", accessor: "clicks", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Purchases", accessor: "purchases", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Pending WNDO", accessor: "pendingWndo", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Status", accessor: "status", width: "20%", sx: { paddingRight: "20px" } },
    ],
    rows: affiliateActivity.slice(0, 5).map(activity => ({
      ...activity,
      affiliateName: (
        <Link href={`/dashboards/buyer/affiliate/details/${activity.id}`}>
          <MDTypography variant="button" color="info" fontWeight="medium">
            {activity.affiliateName}
          </MDTypography>
        </Link>
      ),
    })),
  };

  // Marketplace Orders Table
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
        <Link href={`/dashboards/buyer/marketplace/details/${order.id}`}>
          <MDTypography variant="button" color="info" fontWeight="medium">
            {order.id}
          </MDTypography>
        </Link>
      ),
    })),
  };

  // Handle navigation to the sell-on-f4cet page
  const handleSellOnF4cet = () => {
    router.push("/dashboards/buyer/sell-on-f4cet");
  };

  // Ensure user is loaded before rendering
  if (!user || !user.walletId) {
    return null;
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
              {walletId ? walletId.slice(0, 6) + "..." + walletId.slice(-4) : "User"} -- User Dashboard
            </MDTypography>
            <motion.div variants={buttonVariants} initial="rest" whileHover="hover">
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
          {/* Affiliate Activity List */}
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h5" color="dark" mb={2}>
                  Affiliate Activity (Last 5)
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
                  <Link href="/dashboards/buyer/affiliate">
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
                  Marketplace Orders (Last 5)
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
                  <Link href="/dashboards/buyer/marketplace">
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