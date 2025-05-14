/**
=========================================================
* F4cetPanel - Seller Sales Dashboard Page
=========================================================

* Copyright 2023 F4cets Team
*/

// React imports
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

// Firebase imports
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"; // Ensure doc is imported
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

function SalesDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [menu, setMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(null); // Pending, Shipped, Delivered, Paid
  const [salesData, setSalesData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch sales data from Firestore
  useEffect(() => {
    const fetchSales = async () => {
      if (!user || !user.walletId) {
        console.log("SalesDashboard: No user or walletId, skipping fetch");
        setLoading(false);
        return;
      }

      try {
        console.log("SalesDashboard: Fetching transactions for seller:", user.walletId);
        const q = query(
          collection(db, "transactions"),
          where("sellerId", "==", user.walletId)
        );
        const querySnapshot = await getDocs(q);
        const data = await Promise.all(querySnapshot.docs.map(async (txDoc) => {
          const txData = txDoc.data();
          // Fetch product name from products collection
          let itemName = "Unknown Product";
          if (txData.productIds?.[0]) {
            try {
              const productDoc = await getDoc(doc(db, "products", txData.productIds[0]));
              if (productDoc.exists()) {
                itemName = productDoc.data().name || itemName;
              } else {
                console.warn(`SalesDashboard: Product ${txData.productIds[0]} not found`);
              }
            } catch (productErr) {
              console.warn(`SalesDashboard: Error fetching product ${txData.productIds[0]}:`, productErr);
            }
          }
          // Map status: use shippingStatus, map Delivered + buyerConfirmed to Paid
          const displayStatus = txData.shippingStatus?.toLowerCase() === "delivered" && txData.buyerConfirmed
            ? "paid"
            : txData.shippingStatus?.toLowerCase() || "pending";
          return {
            id: txDoc.id,
            itemName,
            salePrice: txData.amount || 0,
            currency: txData.currency || "USDC",
            buyerWallet: txData.buyerId || "N/A",
            status: displayStatus,
            createdAt: txData.createdAt?.toDate().toISOString().split("T")[0] || "N/A",
            shippingLocation: txData.type === "digital" ? "Digital" : txData.shippingAddress || "N/A",
            trackingNumber: txData.trackingNumber || "N/A",
          };
        }));
        console.log("SalesDashboard: Fetched transactions:", data);
        setSalesData(data);
        setLoading(false);
      } catch (err) {
        console.error("SalesDashboard: Error fetching transactions:", err);
        setError("Failed to load sales data. Please try again.");
        setSalesData([]);
        setLoading(false);
      }
    };

    fetchSales();
  }, [user]);

  // Redirect to home if no user, no walletId, or unauthorized role
  useEffect(() => {
    if (!user || !user.walletId || user.role !== "seller") {
      console.log("SalesDashboard: Unauthorized access, redirecting to home");
      router.replace("/");
    }
  }, [user, router]);

  // Ensure user is loaded and authorized before rendering
  if (!user || !user.walletId || user.role !== "seller") {
    return null; // Or a loading spinner
  }

  const openMenu = (event) => setMenu(event.currentTarget);
  const closeMenu = () => setMenu(null);

  // Filter data based on search and status
  const filteredData = salesData.filter((sale) => {
    const matchesSearch = (sale.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          sale.id?.toLowerCase().includes(searchQuery.toLowerCase())) ?? false;
    const matchesStatus = statusFilter ? sale.status === statusFilter : true;
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
      { Header: "Sale ID", accessor: "id", width: "15%" },
      { Header: "Item Name", accessor: "itemName", width: "15%" },
      { Header: "Sale Price", accessor: "salePrice", width: "10%" },
      { Header: "Buyer Wallet", accessor: "buyerWallet", width: "15%" },
      { Header: "Status", accessor: "status", width: "10%" },
      { Header: "Date", accessor: "createdAt", width: "10%" },
      { Header: "Shipping Location", accessor: "shippingLocation", width: "15%" },
      { Header: "Tracking Number", accessor: "trackingNumber", width: "10%" },
    ],
    rows: filteredData.map((sale) => ({
      ...sale,
      id: sale.id ? (
        <Link href={`/dashboards/seller/sales/details/${sale.id}`}>
          <MDTypography variant="button" color="info" fontWeight="medium">
            {sale.id}
          </MDTypography>
        </Link>
      ) : (
        <MDTypography variant="button" color="error">Invalid ID</MDTypography>
      ),
      itemName: (
        <MDTypography variant="button" color="text">{sale.itemName || "N/A"}</MDTypography>
      ),
      salePrice: (
        <MDTypography variant="button" color="text">{sale.salePrice} {sale.currency || "N/A"}</MDTypography>
      ),
      buyerWallet: (
        <MDTypography variant="button" color="text">
          {sale.buyerWallet ? `${sale.buyerWallet.slice(0, 6)}...${sale.buyerWallet.slice(-4)}` : "N/A"}
        </MDTypography>
      ),
      status: (
        <MDBox display="flex" alignItems="center">
          <Icon
            fontSize="small"
            sx={{
              color: 
                sale.status === "pending" ? "warning.main" :
                sale.status === "shipped" ? "info.main" :
                sale.status === "delivered" ? "success.main" :
                sale.status === "paid" ? "success.main" : "error.main",
              mr: 1,
            }}
          >
            {sale.status === "pending" ? "hourglass_empty" :
             sale.status === "shipped" ? "local_shipping" :
             sale.status === "delivered" ? "check_circle" :
             sale.status === "paid" ? "paid" : "error"}
          </Icon>
          <MDTypography variant="button" color="text">
            {sale.status ? (sale.status.charAt(0).toUpperCase() + sale.status.slice(1)) : "N/A"}
          </MDTypography>
        </MDBox>
      ),
      shippingLocation: (
        <MDTypography variant="button" color="text">{sale.shippingLocation || "N/A"}</MDTypography>
      ),
      trackingNumber: (
        <MDTypography variant="button" color="text">{sale.trackingNumber || "N/A"}</MDTypography>
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
            Sales Dashboard
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
                placeholder="Search by Item Name or Sale ID..."
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
        {loading ? (
          <MDTypography variant="body2" color="text">
            Loading sales...
          </MDTypography>
        ) : filteredData.length === 0 ? (
          <MDTypography variant="body2" color="text">
            No sales found. Try adjusting your filters.
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
          </Card>
        )}
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default SalesDashboard;