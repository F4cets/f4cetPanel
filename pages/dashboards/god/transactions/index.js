/**
=========================================================
* F4cetPanel - God Transactions Dashboard Page
=========================================================

* Copyright 2025 F4cets Team
*/

// React imports
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

// Firebase imports
import { collection, query, getDocs, doc, getDoc, orderBy, startAfter, limit } from "firebase/firestore";
import { db } from "/lib/firebase";

// User context
import { useUser } from "/contexts/UserContext";

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

// Throttle utility
const throttle = (func, wait) => {
  let timeout = null;
  return (...args) => {
    if (!timeout) {
      timeout = setTimeout(() => {
        timeout = null;
        func(...args);
      }, wait);
    }
  };
};

function TransactionsDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [menu, setMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(null); // Pending, Shipped, Delivered, Paid
  const [transactions, setTransactions] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const PAGE_SIZE = 20;

  // Fetch transactions
  const fetchTransactions = useCallback(async (isLoadMore = false) => {
    if (!user || !user.walletId || (isLoadMore && !hasMore) || loading) {
      console.log("TransactionsDashboard: Skipping fetch", { user: !!user, walletId: !!user?.walletId, isLoadMore, hasMore, loading });
      return;
    }

    try {
      setLoading(true);
      console.log("TransactionsDashboard: Fetching transactions, isLoadMore:", isLoadMore);

      let q = query(
        collection(db, "transactions"),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      if (isLoadMore && lastDoc) {
        q = query(
          collection(db, "transactions"),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      }

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        console.log("TransactionsDashboard: No more transactions found");
        setHasMore(false);
        setLoading(false);
        if (!isLoadMore) {
          setTransactions([]);
        }
        setInitialLoad(false);
        return;
      }

      const newData = await Promise.all(querySnapshot.docs.map(async (txDoc) => {
        const txData = txDoc.data();
        console.log("TransactionsDashboard: Transaction data:", { id: txDoc.id, ...txData });

        // Fetch product name
        let itemName = "Unknown Product";
        if (txData.productIds?.[0]?.productId) {
          try {
            const productDoc = await getDoc(doc(db, "products", txData.productIds[0].productId));
            if (productDoc.exists()) {
              itemName = productDoc.data().name || itemName;
            } else {
              console.warn(`TransactionsDashboard: Product ${txData.productIds[0].productId} not found`);
            }
          } catch (productErr) {
            console.warn(`TransactionsDashboard: Error fetching product ${txData.productIds[0].productId}:`, productErr);
          }
        }

        // Parse createdAt
        let createdAtDate;
        try {
          createdAtDate = txData.createdAt
            ? new Date(txData.createdAt).toISOString().split("T")[0]
            : "N/A";
        } catch (dateErr) {
          console.warn(`TransactionsDashboard: Error parsing createdAt for tx ${txDoc.id}:`, dateErr);
          createdAtDate = "N/A";
        }

        // Map status
        const displayStatus = ((txData.shippingStatus?.toLowerCase() === "delivered" && txData.buyerConfirmed) ||
                             (txData.shippingStatus?.toLowerCase() === "confirmed" && txData.buyerConfirmed))
          ? "paid"
          : txData.shippingStatus?.toLowerCase() || "pending";

        return {
          id: txDoc.id,
          itemName,
          salePrice: txData.amount || 0,
          currency: txData.currency || "USDC",
          buyerWallet: txData.buyerId || "N/A",
          sellerId: txData.sellerId || "N/A",
          status: displayStatus,
          createdAt: createdAtDate,
          shippingLocation: txData.type === "digital" ? "Digital" : txData.shippingAddress || "N/A",
          trackingNumber: txData.trackingNumber || "N/A",
        };
      }));

      console.log("TransactionsDashboard: Fetched transactions:", newData.length);
      setTransactions(prev => isLoadMore ? [...prev, ...newData] : newData);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.size === PAGE_SIZE);
      setLoading(false);
      setInitialLoad(false);
    } catch (err) {
      console.error("TransactionsDashboard: Error fetching transactions:", err.message);
      setError("Failed to load transactions. Please try again.");
      setLoading(false);
      setInitialLoad(false);
    }
  }, [user, hasMore, lastDoc, loading]);

  // Initial fetch
  useEffect(() => {
    if (user && user.walletId) {
      console.log("TransactionsDashboard: Initial fetch");
      fetchTransactions();
    }
  }, [user]); // Depend only on user

  // Infinite scroll
  useEffect(() => {
    const handleScroll = throttle(() => {
      if (
        window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100 &&
        !loading &&
        hasMore
      ) {
        console.log("TransactionsDashboard: Scroll trigger, fetching more");
        fetchTransactions(true);
      }
    }, 500); // Throttle to 500ms

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore, fetchTransactions]);

  // Redirect unauthorized users
  useEffect(() => {
    if (!user || !user.walletId || user.role !== "god") {
      console.log("TransactionsDashboard: Unauthorized access, redirecting to home");
      router.replace("/");
    }
  }, [user, router]);

  // Guard clause
  if (!user || !user.walletId || user.role !== "god") {
    return null; // Redirect handled by useEffect
  }

  const openMenu = (event) => setMenu(event.currentTarget);
  const closeMenu = () => setMenu(null);

  // Filter data
  const filteredData = transactions.filter((tx) => {
    const matchesSearch = (
      tx.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.buyerWallet?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.sellerId?.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? false;
    const matchesStatus = statusFilter ? tx.status === statusFilter : true;
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
      <MenuItem onClick={() => { setStatusFilter("pending"); closeMenu(); }}>Status: Pending</MenuItem>
      <MenuItem onClick={() => { setStatusFilter("shipped"); closeMenu(); }}>Status: Shipped</MenuItem>
      <MenuItem onClick={() => { setStatusFilter("delivered"); closeMenu(); }}>Status: Delivered</MenuItem>
      <MenuItem onClick={() => { setStatusFilter("paid"); closeMenu(); }}>Status: Paid</MenuItem>
      <Divider sx={{ margin: "0.5rem 0" }} />
      <MenuItem onClick={() => { setStatusFilter(null); closeMenu(); }}>
        <MDTypography variant="button" color="error" fontWeight="regular">
          Remove Filters
        </MDTypography>
      </MenuItem>
    </Menu>
  );

  const tableData = {
    columns: [
      { Header: "Transaction ID", accessor: "id", width: "15%" },
      { Header: "Item Name", accessor: "itemName", width: "15%" },
      { Header: "Sale Price", accessor: "salePrice", width: "10%" },
      { Header: "Buyer Wallet", accessor: "buyerWallet", width: "15%" },
      { Header: "Seller ID", accessor: "sellerId", width: "15%" },
      { Header: "Status", accessor: "status", width: "10%" },
      { Header: "Date", accessor: "createdAt", width: "10%" },
      { Header: "Shipping Location", accessor: "shippingLocation", width: "15%" },
      { Header: "Tracking Number", accessor: "trackingNumber", width: "10%" },
    ],
    rows: filteredData.map((tx) => ({
      ...tx,
      id: tx.id ? (
        <Link href={`/dashboards/god/transactions/details/${tx.id}`}>
          <MDTypography variant="button" color="info" fontWeight="medium">
            {tx.id}
          </MDTypography>
        </Link>
      ) : (
        <MDTypography variant="button" color="error">Invalid ID</MDTypography>
      ),
      itemName: (
        <MDTypography variant="button" color="text">{tx.itemName || "N/A"}</MDTypography>
      ),
      salePrice: (
        <MDTypography variant="button" color="text">{tx.salePrice} {tx.currency || "N/A"}</MDTypography>
      ),
      buyerWallet: (
        <MDTypography variant="button" color="text">
          {tx.buyerWallet ? `${tx.buyerWallet.slice(0, 6)}...${tx.buyerWallet.slice(-4)}` : "N/A"}
        </MDTypography>
      ),
      sellerId: (
        <MDTypography variant="button" color="text">
          {tx.sellerId ? `${tx.sellerId.slice(0, 6)}...${tx.sellerId.slice(-4)}` : "N/A"}
        </MDTypography>
      ),
      status: (
        <MDBox display="flex" alignItems="center">
          <Icon
            fontSize="small"
            sx={{
              color: 
                tx.status === "pending" ? "warning.main" :
                tx.status === "shipped" ? "info.main" :
                tx.status === "delivered" ? "success.main" :
                tx.status === "paid" ? "success.main" : "error.main",
              mr: 1,
            }}
          >
            {tx.status === "pending" ? "hourglass_empty" :
             tx.status === "shipped" ? "local_shipping" :
             tx.status === "delivered" ? "check_circle" :
             tx.status === "paid" ? "paid" : "error"}
          </Icon>
          <MDTypography variant="button" color="text">
            {tx.status ? (tx.status.charAt(0).toUpperCase() + tx.status.slice(1)) : "N/A"}
          </MDTypography>
        </MDBox>
      ),
      shippingLocation: (
        <MDTypography variant="button" color="text">{tx.shippingLocation || "N/A"}</MDTypography>
      ),
      trackingNumber: (
        <MDTypography variant="button" color="text">{tx.trackingNumber || "N/A"}</MDTypography>
      ),
    })),
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox my={3}>
        <MDBox
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          justifyContent={{ xs: "flex-start", sm: "space-between" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          mb={2}
          gap={{ xs: 2, sm: 0 }}
        >
          <MDTypography variant="h4" color="dark" mb={{ xs: 1, sm: 0 }}>
            Transactions Dashboard
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
                placeholder="Search by Item Name, Tx ID, Buyer, Seller..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
                sx={{
                  "& .MuiInputBase-input": { padding: { xs: "10px", md: "12px" }, color: "#344767" },
                  "& .MuiInputLabel-root": { color: "#344767 !important" },
                  "& .MuiInputLabel-root.Mui-focused": { color: "#344767 !important" },
                }}
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
        {error && (
          <MDTypography variant="body2" color="error" mb={2}>
            {error}
          </MDTypography>
        )}
        {initialLoad ? (
          <MDTypography variant="body2" color="text">
            Loading transactions...
          </MDTypography>
        ) : filteredData.length === 0 ? (
          <MDTypography variant="body2" color="text">
            No transactions found. Try adjusting your filters.
          </MDTypography>
        ) : (
          <Card sx={{
            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
          }}>
            <DataTable
              table={tableData}
              entriesPerPage={false}
              canSearch={false}
              sx={{
                "& th": { paddingRight: "20px !important", paddingLeft: "20px !important" },
                "& .MuiTablePagination-root": { display: "none !important" },
              }}
            />
            {loading && (
              <MDBox p={2} textAlign="center">
                <MDTypography variant="body2" color="text">
                  Loading more transactions...
                </MDTypography>
              </MDBox>
            )}
            {!hasMore && filteredData.length > 0 && (
              <MDBox p={2} textAlign="center">
                <MDTypography variant="body2" color="text">
                  No more transactions to load.
                </MDTypography>
              </MDBox>
            )}
          </Card>
        )}
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default TransactionsDashboard;