/**
=========================================================
* F4cetPanel - Buyer Dashboard Page
=========================================================

* Copyright 2025 F4cets Team
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
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
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
import MDInput from "/components/MDInput";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import DataTable from "/examples/Tables/DataTable";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";

// @mui icons
import Icon from "@mui/material/Icon";

function BuyerDashboard() {
  const { user, setUser } = useUser();
  const router = useRouter();
  const [affiliateClicksLast30Days, setAffiliateClicksLast30Days] = useState(0);
  const [pendingWndoRewards, setPendingWndoRewards] = useState(0);
  const [marketplacePurchasesLast30Days, setMarketplacePurchasesLast30Days] = useState(0);
  const [marketplacePurchaseAmountLast30Days, setMarketplacePurchaseAmountLast30Days] = useState(0);
  const [affiliateActivity, setAffiliateActivity] = useState([]);
  const [marketplaceOrders, setMarketplaceOrders] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [menu, setMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);

  // Debug user.profile.nfts
  useEffect(() => {
    console.log('User Data:', user);
    console.log('Profile:', user?.profile);
    console.log('NFTs:', user?.profile?.nfts);
  }, [user]);

  // Fetch user profile from Firestore on wallet connection
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user || !user.walletId) {
        setIsLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", user.walletId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const profile = userDoc.data().profile || {};
          setUser({
            ...user,
            profile: {
              ...user.profile,
              nfts: profile.nfts || [],
              name: profile.name || "",
              email: profile.email || "",
              avatar: profile.avatar || "/assets/images/default-avatar.png",
            },
          });
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.walletId) {
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, [user?.walletId, setUser]);

  // Handle navigation to the sell-on-f4cet page
  const handleSellOnF4cet = () => {
    router.push("/dashboards/buyer/sell-on-f4cet");
  };

  // Handle navigation to the lease page
  const handleLease = () => {
    router.push("/dashboards/buyer/lease");
  };

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
        // Fetch current SOL price
        const solPrice = await fetchSolPrice();

        // Fetch affiliate clicks from subcollection
        const clicksQuery = query(collection(db, `users/${walletId}/affiliateClicks`));
        const clicksSnapshot = await getDocs(clicksQuery);
        const clicks = clicksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp ? new Date(doc.data().timestamp) : new Date(),
        }));
        console.log("Affiliate clicks:", clicks);

        // Affiliate Clicks (Last 30 Days)
        const recentClicks = clicks.filter(click => click.timestamp >= thirtyDaysAgo);
        setAffiliateClicksLast30Days(recentClicks.length);

        // Affiliate Activity
        recentClicks.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        const affiliateActivityData = recentClicks.map(click => ({
          id: click.id,
          affiliateName: click.affiliateName || "Unknown",
          sortAffiliateName: click.affiliateName || "Unknown",
          date: click.timestamp.toISOString().split("T")[0],
          clicks: 1,
          purchases: 0,
          pendingWndo: 0,
          status: "clicked",
        }));
        console.log("Affiliate activity before sorting:", affiliateActivityData);
        setAffiliateActivity(affiliateActivityData);
        setPendingWndoRewards(0);

        // Marketplace Purchases
        const transactionsQuery = query(
          collection(db, "transactions"),
          where("buyerId", "==", walletId)
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const transactions = transactionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt
            ? new Date(doc.data().createdAt)
            : new Date(),
        }));
        console.log("Marketplace transactions:", transactions);

        let purchaseCount = 0;
        let purchaseAmount = 0;
        const marketplaceOrdersData = [];
        for (const transaction of transactions.filter(t => t.createdAt >= thirtyDaysAgo)) {
          // CHANGED: Exclude transactions with type "inventory_fee"
          if (transaction.type === "rwi" || transaction.type === "digital") {
            purchaseCount += 1;
            if (transaction.currency === "SOL") {
              purchaseAmount += (transaction.amount || 0) * solPrice;
            } else if (transaction.currency === "USDC") {
              purchaseAmount += transaction.amount || 0;
            }
            const productNames = await Promise.all(
              (transaction.productIds || []).map(async (productId) => {
                const productDocRef = doc(db, "products", productId);
                const productDoc = await getDoc(productDocRef);
                return productDoc.exists() ? productDoc.data().name || "Unknown" : "Unknown";
              })
            );
            marketplaceOrdersData.push({
              id: transaction.id,
              date: transaction.createdAt.toISOString().split("T")[0],
              product: productNames.length > 0 ? productNames.join(", ") : "Unknown",
              amount: transaction.amount || 0,
              status: transaction.shippingStatus || "Pending",
            });
          }
        }

        setMarketplacePurchasesLast30Days(purchaseCount);
        setMarketplacePurchaseAmountLast30Days(purchaseAmount);
        setMarketplaceOrders(marketplaceOrdersData);
        console.log("Marketplace orders:", marketplaceOrdersData);
      } catch (error) {
        console.error("Error fetching buyer data:", error);
      } finally {
        setIsFetching(false);
      }
    };

    if (user?.walletId && !isLoading) {
      fetchBuyerData();
    }
  }, [user, router, isLoading]);

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

  // Filter data based on search and status
  const filteredAffiliateData = affiliateActivity.filter((item) => {
    const matchesSearch = searchQuery.trim()
      ? item.affiliateName.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesStatus = statusFilter ? item.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });
  console.log("Filtered affiliate data:", filteredAffiliateData);

  // Affiliate Activity Table
  const affiliateTableData = {
    columns: [
      { Header: "Agent Name", accessor: "affiliateName", width: "20%", disableSortBy: true },
      { Header: "Date", accessor: "date", width: "15%" },
      { Header: "Clicks", accessor: "clicks", width: "15%" },
      { Header: "Purchases", accessor: "purchases", width: "15%" },
      { Header: "Pending WNDO", accessor: "pendingWndo", width: "15%" },
      { Header: "Status", accessor: "status", width: "20%" },
    ],
    rows: filteredAffiliateData.slice(0, 5).map((item) => {
      console.log("Row data:", { id: item.id, affiliateName: item.affiliateName, href: `/dashboards/buyer/affiliate/details/${item.id}` });
      return {
        ...item,
        affiliateName: (
          <Link
            href={`/dashboards/buyer/affiliate/details/${item.id}`}
            key={item.id}
            onClick={(e) => {
              console.log("Affiliate link clicked:", item.id);
              e.stopPropagation();
            }}
          >
            <MDTypography variant="button" color="info" fontWeight="medium">
              {item.affiliateName}
            </MDTypography>
          </Link>
        ),
        status: (
          <MDBox display="flex" alignItems="center">
            <Icon
              fontSize="small"
              sx={{
                color: item.status === "purchased" ? "success.main" : "info.main",
                mr: 1,
              }}
            >
              {item.status === "purchased" ? "check_circle" : "touch_app"}
            </Icon>
            <MDTypography variant="button" color="text">
              {item.status}
            </MDTypography>
          </MDBox>
        ),
      };
    }),
  };

  const openMenu = (event) => setMenu(event.currentTarget);
  const closeMenu = () => setMenu(null);

  const renderMenu = (
    <Menu
      anchorEl={menu}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      open={Boolean(menu)}
      onClose={closeMenu}
      keepMounted
    >
      <MenuItem onClick={() => { setStatusFilter("purchased"); closeMenu(); }}>Status: Purchased</MenuItem>
      <MenuItem onClick={() => { setStatusFilter("clicked"); closeMenu(); }}>Status: Clicked</MenuItem>
      <Divider sx={{ margin: "0.5rem 0" }} />
      <MenuItem onClick={() => { setStatusFilter(null); closeMenu(); }}>
        <MDTypography variant="button" color="error" fontWeight="regular">
          Remove Filter
        </MDTypography>
      </MenuItem>
    </Menu>
  );

  // Marketplace Orders Table
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
        <Link href={`/dashboards/buyer/marketplace/details/${order.id}`} key={order.id}>
          <MDTypography variant="button" color="info" fontWeight="medium">
            {order.id}
          </MDTypography>
        </Link>
      ),
    })),
  };

  // Check for verified V1 and V2 NFTs
  const hasV1Verified = user?.profile?.nfts?.some(nft => nft.type === "V1" && nft.verified);
  const hasV2Verified = user?.profile?.nfts?.some(nft => nft.type === "V2" && nft.verified);

  if (isLoading) {
    return null; // Or add a loading spinner
  }

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
              {user?.walletId ? user.walletId.slice(0, 6) + "..." + user.walletId.slice(-4) : "User"} -- User Dashboard
            </MDTypography>
            <MDBox display="flex" alignItems="center" gap={2}>
              {(hasV1Verified || hasV2Verified) && (
                <MDBox display="flex" alignItems="center" gap={2}>
                  {hasV1Verified && (
                    <MDBox display="flex" flexDirection="column" alignItems="center">
                      <Avatar
                        src="/assets/images/v1.png"
                        sx={{
                          width: { xs: 40, sm: 48 },
                          height: { xs: 40, sm: 48 },
                          border: "2px solid #fff",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <MDTypography variant="caption" color="text" fontWeight="medium" mt={0.5}>
                        V1 Verified
                      </MDTypography>
                    </MDBox>
                  )}
                  {hasV2Verified && (
                    <MDBox display="flex" flexDirection="column" alignItems="center">
                      <Avatar
                        src="/assets/images/v2.png"
                        sx={{
                          width: { xs: 40, sm: 48 },
                          height: { xs: 40, sm: 48 },
                          border: "2px solid #fff",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <MDTypography variant="caption" color="text" fontWeight="medium" mt={0.5}>
                        V2 Verified
                      </MDTypography>
                    </MDBox>
                  )}
                  <motion.div variants={buttonVariants} initial="rest" whileHover="hover">
                    <MDButton
                      onClick={handleLease}
                      variant="gradient"
                      color="info"
                      size="large"
                      sx={{
                        px: 4,
                        py: 1.5,
                        fontWeight: "bold",
                        borderRadius: "12px",
                        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
                        background: "linear-gradient(45deg, #6FCB9F 30%, #8FD3B2 90%)",
                        "&:hover": {
                          background: "linear-gradient(45deg, #5DBA8F 30%, #7AC4A2 90%)",
                        },
                        width: { xs: "100%", sm: "auto" },
                        maxWidth: { xs: "300px", sm: "auto" },
                      }}
                    >
                      Lease NFTs
                    </MDButton>
                  </motion.div>
                </MDBox>
              )}
              {user?.role !== "seller" && (
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
              )}
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
                    ${marketplacePurchaseAmountLast30Days.toFixed(2)}
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
                <MDBox
                  display="flex"
                  flexDirection={{ xs: "column", sm: "row" }}
                  justifyContent={{ xs: "flex-start", sm: "space-between" }}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  mb={2}
                  gap={{ xs: 1, sm: 2 }}
                >
                  <MDTypography variant="h5" color="dark">
                    Affiliate Activity (Last 5)
                  </MDTypography>
                  <MDBox
                    display="flex"
                    flexDirection={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    gap={{ xs: 1, sm: 2 }}
                    width={{ xs: "100%", sm: "auto" }}
                  >
                    <MDBox width={{ xs: "100%", sm: "200px" }}>
                      <MDInput
                        placeholder="Search by Affiliate Name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        fullWidth
                      />
                    </MDBox>
                    <MDButton
                      variant={menu ? "contained" : "outlined"}
                      color="dark"
                      onClick={openMenu}
                      sx={{ width: { xs: "100%", sm: "auto" } }}
                    >
                      Filters <Icon>keyboard_arrow_down</Icon>
                    </MDButton>
                    {renderMenu}
                  </MDBox>
                </MDBox>
                <DataTable
                  table={affiliateTableData}
                  entriesPerPage={false}
                  canSearch={false}
                  canSort={true}
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
                  canSort={true}
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