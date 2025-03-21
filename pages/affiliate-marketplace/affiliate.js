/**
=========================================================
* F4cetPanel - Affiliate Activity Page
=========================================================

* Copyright 2023 F4cets Team
*/

import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

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

// Dummy Data
const affiliateData = [
  { id: "AFF001", link: "Amazon", clicks: 150, purchases: 10, pendingWndo: 50, rewardedWndo: 100, status: "Paid", date: "2025-03-20" },
  { id: "AFF002", link: "Walmart", clicks: 200, purchases: 15, pendingWndo: 30, rewardedWndo: 80, status: "Paid", date: "2025-03-19" },
  { id: "AFF003", link: "eBay", clicks: 120, purchases: 8, pendingWndo: 20, rewardedWndo: 60, status: "Refunded", date: "2025-03-18" },
  { id: "AFF004", link: "Target", clicks: 180, purchases: 12, pendingWndo: 40, rewardedWndo: 90, status: "Paid", date: "2025-03-17" },
  { id: "AFF005", link: "Best Buy", clicks: 90, purchases: 5, pendingWndo: 10, rewardedWndo: 50, status: "Canceled", date: "2025-03-16" },
  { id: "AFF006", link: "Amazon", clicks: 110, purchases: 7, pendingWndo: 15, rewardedWndo: 70, status: "Paid", date: "2025-03-15" },
  { id: "AFF007", link: "Walmart", clicks: 130, purchases: 9, pendingWndo: 25, rewardedWndo: 65, status: "Paid", date: "2025-03-14" },
  { id: "AFF008", link: "eBay", clicks: 160, purchases: 11, pendingWndo: 35, rewardedWndo: 85, status: "Refunded", date: "2025-03-13" },
  { id: "AFF009", link: "Target", clicks: 140, purchases: 10, pendingWndo: 30, rewardedWndo: 75, status: "Paid", date: "2025-03-12" },
  { id: "AFF010", link: "Best Buy", clicks: 100, purchases: 6, pendingWndo: 20, rewardedWndo: 55, status: "Canceled", date: "2025-03-11" },
  { id: "AFF011", link: "Amazon", clicks: 170, purchases: 13, pendingWndo: 45, rewardedWndo: 95, status: "Paid", date: "2025-03-10" },
  { id: "AFF012", link: "Walmart", clicks: 190, purchases: 14, pendingWndo: 50, rewardedWndo: 100, status: "Paid", date: "2025-03-09" },
];

function AffiliateActivity() {
  const [menu, setMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);

  const openMenu = (event) => setMenu(event.currentTarget);
  const closeMenu = () => setMenu(null);

  // Filter data based on search and status
  const filteredData = affiliateData.filter((item) => {
    const matchesSearch = (
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.link.toLowerCase().includes(searchQuery.toLowerCase())
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
      { Header: "Link", accessor: "link", width: "15%" },
      { Header: "Clicks", accessor: "clicks", width: "10%" },
      { Header: "Purchases", accessor: "purchases", width: "10%" },
      { Header: "Pending WNDO", accessor: "pendingWndo", width: "15%" },
      { Header: "Rewarded WNDO", accessor: "rewardedWndo", width: "15%" },
      { Header: "Status", accessor: "status", width: "10%" },
      { Header: "Date", accessor: "date", width: "10%" },
    ],
    rows: filteredData.map((item) => ({
      ...item,
      id: (
        <Link href={`/affiliate-marketplace/details/${item.id}`}>
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
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <MDTypography variant="h4" color="dark">
            Affiliate Activity
          </MDTypography>
          <MDBox display="flex" alignItems="center">
            <MDBox mr={2}>
              <MDInput
                placeholder="Search by ID or Link..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ width: "200px" }}
              />
            </MDBox>
            <MDButton
              variant={menu ? "contained" : "outlined"}
              color="dark"
              onClick={openMenu}
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

export default AffiliateActivity;