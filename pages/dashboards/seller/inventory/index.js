/**
=========================================================
* F4cetPanel - Inventory Page
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
const dummyInventoryData = [
  {
    id: "INV001",
    name: "Strong Hold Hoodie",
    type: "rwi",
    price: 50,
    currency: "USDC",
    shippingLocation: "New York, USA",
    categories: ["Clothing"],
    variants: [
      { size: "S", color: "black", quantity: 5 },
      { size: "M", color: "grey", quantity: 12 },
    ],
    status: "pending",
    createdAt: "2025-03-20",
  },
  {
    id: "INV002",
    name: "Ebook: The Future of Web3",
    type: "digital",
    price: 20,
    currency: "USDC",
    quantity: 100,
    categories: ["Ebooks", "Digital Goods"],
    status: "pending",
    createdAt: "2025-03-19",
  },
];

function Inventory() {
  const { user } = useUser();
  const router = useRouter();
  const [menu, setMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState(null); // Digital or RWI
  const [statusFilter, setStatusFilter] = useState(null); // Pending, Active, etc.
  const [inventoryData, setInventoryData] = useState([]);

  // Fetch inventory data from Firestore
  useEffect(() => {
    const fetchInventory = async () => {
      if (!user || !user.walletId) return;

      try {
        const q = query(
          collection(db, "listings"),
          where("sellerId", "==", user.walletId)
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.split("T")[0], // Format date
        }));
        setInventoryData(data);
      } catch (err) {
        console.error("Error fetching inventory:", err);
      }
    };

    fetchInventory();
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

  // Filter data based on search, type, and status
  const filteredData = inventoryData.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter ? item.type === typeFilter : true;
    const matchesStatus = statusFilter ? item.status === statusFilter : true;
    return matchesSearch && matchesType && matchesStatus;
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
      <MenuItem onClick={() => { setTypeFilter("digital"); closeMenu(); }}>Type: Digital</MenuItem>
      <MenuItem onClick={() => { setTypeFilter("rwi"); closeMenu(); }}>Type: RWI</MenuItem>
      <Divider sx={{ margin: "0.5rem 0" }} />
      <MenuItem onClick={() => { setStatusFilter("pending"); closeMenu(); }}>Status: Pending</MenuItem>
      <MenuItem onClick={() => { setStatusFilter("active"); closeMenu(); }}>Status: Active</MenuItem>
      <Divider sx={{ margin: "0.5rem 0" }} />
      <MenuItem onClick={() => { setTypeFilter(null); setStatusFilter(null); closeMenu(); }}>
        <MDTypography variant="button" color="error" fontWeight="regular">
          Remove Filters
        </MDTypography>
      </MenuItem>
    </Menu>
  );

  const tableData = {
    columns: [
      { Header: "Item ID", accessor: "id", width: "15%" },
      { Header: "Name", accessor: "name", width: "15%" },
      { Header: "Type", accessor: "type", width: "10%" },
      { Header: "Price (USDC)", accessor: "price", width: "10%" },
      { Header: "Quantity/Variants", accessor: "quantityVariants", width: "15%" },
      { Header: "Categories", accessor: "categories", width: "15%" },
      { Header: "Status", accessor: "status", width: "10%" },
      { Header: "Date", accessor: "createdAt", width: "10%" },
    ],
    rows: filteredData.map((item) => ({
      ...item,
      id: (
        <Link href={`/dashboards/inventory/details/${item.id}`}>
          <MDTypography variant="button" color="info" fontWeight="medium">
            {item.id}
          </MDTypography>
        </Link>
      ),
      type: (
        <MDTypography variant="button" color="text">
          {item.type === "digital" ? "Digital" : "RWI"}
        </MDTypography>
      ),
      price: (
        <MDTypography variant="button" color="text">
          {item.price} {item.currency}
        </MDTypography>
      ),
      quantityVariants: (
        <MDTypography variant="button" color="text">
          {item.type === "digital" ? item.quantity : item.variants.map(v => `${v.quantity} (${v.size}, ${v.color})`).join(", ")}
        </MDTypography>
      ),
      categories: (
        <MDTypography variant="button" color="text">
          {item.categories.join(", ")}
        </MDTypography>
      ),
      status: (
        <MDBox display="flex" alignItems="center">
          <Icon
            fontSize="small"
            sx={{
              color: item.status === "pending" ? "warning.main" : "success.main",
              mr: 1,
            }}
          >
            {item.status === "pending" ? "hourglass_empty" : "check_circle"}
          </Icon>
          <MDTypography variant="button" color="text">
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
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
          flexDirection={{ xs: "column", sm: "row" }}
          justifyContent={{ xs: "flex-start", sm: "space-between" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          mb={2}
          gap={{ xs: 2, sm: 0 }}
        >
          <MDTypography variant="h4" color="dark" mb={{ xs: 1, sm: 0 }}>
            Inventory
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
                placeholder="Search by Item Name..."
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

export default Inventory;