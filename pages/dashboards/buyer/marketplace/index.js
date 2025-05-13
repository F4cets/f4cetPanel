/**
=========================================================
* F4cetPanel - Marketplace Orders Page
=========================================================

* Copyright 2023 F4cets Team
*/

// React imports
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

// User context
import { useUser } from "/contexts/UserContext";

// Firestore imports
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "/lib/firebase";

// @mui material components
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
import MDButton from "/components/MDButton";
import MDInput from "/components/MDInput";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";
import DataTable from "/examples/Tables/DataTable";

function MarketplaceOrders() {
  const { user } = useUser();
  const router = useRouter();
  const [menu, setMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [marketplaceData, setMarketplaceData] = useState([]);

  // Redirect to home if no user, no walletId, or unauthorized role
  useEffect(() => {
    if (!user || !user.walletId || (user.role !== "buyer" && user.role !== "seller")) {
      router.replace("/");
    }
  }, [user, router]);

  // Fetch marketplace orders from Firestore
  useEffect(() => {
    const fetchMarketplaceData = async () => {
      if (!user || !user.walletId) return;

      const walletId = user.walletId;
      const orders = [];

      try {
        // Fetch user data to get their purchases
        const userDocRef = doc(db, "users", walletId);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) return;

        const userData = userDoc.data();
        const purchaseIds = userData.purchases || [];

        // Fetch each transaction
        for (const purchaseId of purchaseIds) {
          const transactionDocRef = doc(db, "transactions", purchaseId);
          const transactionDoc = await getDoc(transactionDocRef);
          if (transactionDoc.exists()) {
            const transactionData = transactionDoc.data();
            if (transactionData.type === "rwi" && transactionData.buyerId === walletId) {
              // Fetch product names
              let productNames = [];
              if (Array.isArray(transactionData.productIds)) {
                for (const productId of transactionData.productIds) {
                  const productDocRef = doc(db, "products", productId);
                  const productDoc = await getDoc(productDocRef);
                  if (productDoc.exists()) {
                    const productData = productDoc.data();
                    productNames.push(productData.name || productId);
                  } else {
                    productNames.push(productId);
                  }
                }
              }

              // Fetch seller name (if available)
              let sellerName = transactionData.sellerId;
              const sellerDocRef = doc(db, "users", transactionData.sellerId);
              const sellerDoc = await getDoc(sellerDocRef);
              if (sellerDoc.exists()) {
                const sellerData = sellerDoc.data();
                sellerName = sellerData.name || sellerName;
              }

              // Format date
              const transactionDate = transactionData.createdAt.toDate ? transactionData.createdAt.toDate() : new Date();
              const dateStr = transactionDate.toISOString().split('T')[0];

              orders.push({
                id: purchaseId,
                product: productNames.join(", ") || "Unknown Product",
                seller: sellerName,
                amount: `${transactionData.amount || 0} ${transactionData.currency || "USDC"}`,
                status: transactionData.shippingStatus || "Unknown",
                date: dateStr,
              });
            }
          }
        }

        setMarketplaceData(orders);
      } catch (error) {
        console.error("Error fetching marketplace orders:", error);
      }
    };

    fetchMarketplaceData();
  }, [user, router]);

  // Ensure user is loaded and authorized before rendering
  if (!user || !user.walletId || (user.role !== "buyer" && user.role !== "seller")) {
    return null; // Or a loading spinner
  }

  const openMenu = (event) => setMenu(event.currentTarget);
  const closeMenu = () => setMenu(null);

  // Filter data based on search and status
  const filteredData = marketplaceData.filter((item) => {
    const matchesSearch = (
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.seller.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesStatus = statusFilter ? item.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const renderMenu = (
    <Menu
      anchorEl={menu}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      open={Boolean(menu)}
      onClose={closeMenu}
      keepMounted
    >
      <MenuItem onClick={() => { setStatusFilter("Delivered"); closeMenu(); }}>Status: Delivered</MenuItem>
      <MenuItem onClick={() => { setStatusFilter("Shipped"); closeMenu(); }}>Status: Shipped</MenuItem>
      <MenuItem onClick={() => { setStatusFilter("pending"); closeMenu(); }}>Status: Pending</MenuItem>
      <Divider sx={{ margin: "0.5rem 0" }} />
      <MenuItem onClick={() => { setStatusFilter(null); closeMenu(); }}>
        <MDTypography variant="button" color="error" fontWeight="regular">
          Remove Filter
        </MDTypography>
      </MenuItem>
    </Menu>
  );

  const tableData = {
    columns: [
      { Header: "Order ID", accessor: "id", width: "15%" },
      { Header: "Product", accessor: "product", width: "20%" },
      { Header: "Seller", accessor: "seller", width: "20%" },
      { Header: "Amount", accessor: "amount", width: "15%" },
      { Header: "Status", accessor: "status", width: "15%" },
      { Header: "Date", accessor: "date", width: "15%" },
    ],
    rows: filteredData.map((item) => ({
      ...item,
      id: (
        <Link href={`/dashboards/buyer/marketplace/details/${item.id}`}>
          <MDTypography variant="button" color="info" fontWeight="medium">
            {item.id}
          </MDTypography>
        </Link>
      ),
      status: (
        <MDBox display="flex" alignItems="center">
          <Icon
            fontSize="small"
            sx={{
              color: item.status === "Delivered" ? "success.main" : item.status === "Shipped" ? "info.main" : "error.main",
              mr: 1,
            }}
          >
            {item.status === "Delivered" ? "check_circle" : item.status === "Shipped" ? "local_shipping" : "pending"}
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
      <MDBox my={3}>
        <MDBox
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }} // Stack on mobile, row on larger screens
          justifyContent={{ xs: "flex-start", sm: "space-between" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          mb={2}
          gap={{ xs: 2, sm: 0 }} // Add gap when stacked on mobile
        >
          <MDTypography variant="h4" color="dark" mb={{ xs: 1, sm: 0 }}>
            Marketplace Orders
          </MDTypography>
          <MDBox
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }} // Stack search and filter on mobile
            alignItems={{ xs: "flex-start", sm: "center" }}
            gap={{ xs: 1, sm: 2 }}
            width={{ xs: "100%", sm: "auto" }}
          >
            <MDBox width={{ xs: "100%", sm: "200px" }}>
              <MDInput
                placeholder="Search by ID, Product, or Seller..."
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
        <Card>
          <DataTable table={tableData} entriesPerPage={false} canSearch={false} />
        </Card>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default MarketplaceOrders;