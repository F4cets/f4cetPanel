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

// Dummy Data (Replace with Firestore data later)
const marketplaceData = [
  { id: "MKT001", product: "Dog Bed", seller: "Seller123", amount: "150 SOL", status: "Paid", date: "2025-03-20" },
  { id: "MKT002", product: "Vase", seller: "Seller456", amount: "200 SOL", status: "Paid", date: "2025-03-19" },
  { id: "MKT003", product: "Painting", seller: "Seller789", amount: "120 SOL", status: "Refunded", date: "2025-03-18" },
  { id: "MKT004", product: "Necklace", seller: "Seller101", amount: "180 SOL", status: "Paid", date: "2025-03-17" },
  { id: "MKT005", product: "Sculpture", seller: "Seller202", amount: "90 SOL", status: "Canceled", date: "2025-03-16" },
  { id: "MKT006", product: "Lamp", seller: "Seller303", amount: "110 SOL", status: "Paid", date: "2025-03-15" },
  { id: "MKT007", product: "Chair", seller: "Seller404", amount: "130 SOL", status: "Paid", date: "2025-03-14" },
  { id: "MKT008", product: "Table", seller: "Seller505", amount: "160 SOL", status: "Refunded", date: "2025-03-13" },
  { id: "MKT009", product: "Mirror", seller: "Seller606", amount: "140 SOL", status: "Paid", date: "2025-03-12" },
  { id: "MKT010", product: "Rug", seller: "Seller707", amount: "100 SOL", status: "Canceled", date: "2025-03-11" },
  { id: "MKT011", product: "Bookshelf", seller: "Seller808", amount: "170 SOL", status: "Paid", date: "2025-03-10" },
  { id: "MKT012", product: "Couch", seller: "Seller909", amount: "190 SOL", status: "Paid", date: "2025-03-09" },
];

function MarketplaceOrders() {
  const { user } = useUser();
  const router = useRouter();
  const [menu, setMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);

  // Redirect to home if no user, no walletId, or unauthorized role
  useEffect(() => {
    if (!user || !user.walletId || (user.role !== "buyer" && user.role !== "seller")) {
      router.replace("/");
    }
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
      <MenuItem onClick={() => { setStatusFilter("Paid"); closeMenu(); }}>Status: Paid</MenuItem>
      <MenuItem onClick={() => { setStatusFilter("Refunded"); closeMenu(); }}>Status: Refunded</MenuItem>
      <MenuItem onClick={() => { setStatusFilter("Canceled"); closeMenu(); }}>Status: Canceled</MenuItem>
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
              color: item.status === "Paid" ? "success.main" : item.status === "Refunded" ? "info.main" : "error.main",
              mr: 1,
            }}
          >
            {item.status === "Paid" ? "check_circle" : item.status === "Refunded" ? "refresh" : "cancel"}
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