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
import { collection, query, where, getDocs } from "firebase/firestore";
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

// Dummy Data (for initial testing, will be replaced by Firestore data)
const dummySalesData = [
  {
    id: "SALE001",
    itemName: "Strong Hold Hoodie",
    salePrice: 50,
    currency: "USDC",
    buyerWallet: "buyer123...xyz",
    status: "pending",
    createdAt: "2025-03-20",
    shippingLocation: "New York, USA",
    trackingNumber: "",
  },
  {
    id: "SALE002",
    itemName: "Ebook: The Future of Web3",
    salePrice: 20,
    currency: "USDC",
    buyerWallet: "buyer456...abc",
    status: "shipped",
    createdAt: "2025-03-19",
    shippingLocation: "Digital",
    trackingNumber: "DIGITAL123",
  },
];

function SalesDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [menu, setMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(null); // Pending, Shipped, Delivered, Paid
  const [salesData, setSalesData] = useState([]);

  // Fetch sales data from Firestore
  useEffect(() => {
    const fetchSales = async () => {
      if (!user || !user.walletId) return;

      try {
        const q = query(
          collection(db, "sales"),
          where("sellerId", "==", user.walletId)
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.split("T")[0], // Format date
        }));
        setSalesData(data);
      } catch (err) {
        console.error("Error fetching sales:", err);
      }
    };

    fetchSales();
  }, [user]);

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

  const openMenu = (event) => setMenu(event.currentTarget);
  const closeMenu = () => setMenu(null);

  // Filter data based on search and status
  const filteredData = salesData.filter((sale) => {
    const matchesSearch = sale.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         sale.id.toLowerCase().includes(searchQuery.toLowerCase());
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
      id: (
        <Link href={`/dashboards/seller/sales/details/${sale.id}`}>
          <MDTypography variant="button" color="info" fontWeight="medium">
            {sale.id}
          </MDTypography>
        </Link>
      ),
      salePrice: (
        <MDTypography variant="button" color="text">
          {sale.salePrice} {sale.currency}
        </MDTypography>
      ),
      buyerWallet: (
        <MDTypography variant="button" color="text">
          {sale.buyerWallet.slice(0, 6)}...{sale.buyerWallet.slice(-4)}
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
                "success.main",
              mr: 1,
            }}
          >
            {sale.status === "pending" ? "hourglass_empty" :
             sale.status === "shipped" ? "local_shipping" :
             sale.status === "delivered" ? "check_circle" :
             "paid"}
          </Icon>
          <MDTypography variant="button" color="text">
            {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
          </MDTypography>
        </MDBox>
      ),
      shippingLocation: (
        <MDTypography variant="button" color="text">
          {sale.shippingLocation}
        </MDTypography>
      ),
      trackingNumber: (
        <MDTypography variant="button" color="text">
          {sale.trackingNumber || "N/A"}
        </MDTypography>
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
                  "& .MuiInputBase-input": {
                    padding: { xs: "10px", md: "12px" },
                    color: "#344767",
                  },
                  "& .MuiInputLabel-root": {
                    color: "#344767 !important",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#344767 !important",
                  },
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
        <Card
          sx={{
            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
          }}
        >
          <DataTable
            table={tableData}
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
        </Card>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default SalesDashboard;