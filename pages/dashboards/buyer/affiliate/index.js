/**
=========================================================
* F4cetPanel - Affiliate Activity Page
=========================================================

* Copyright 2025 F4cets Team
*/

// React imports
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

// User context
import { useUser } from "/contexts/UserContext";

// Firestore imports
import { getFirestore, collection, getDocs, query } from "firebase/firestore";
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

function AffiliateActivity() {
  const { user } = useUser();
  const router = useRouter();
  const [menu, setMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [affiliateData, setAffiliateData] = useState([]);

  // Redirect to home if no user, no walletId, or unauthorized role
  useEffect(() => {
    if (!user || !user.walletId || (user.role !== "buyer" && user.role !== "seller")) {
      router.replace("/");
    }
  }, [user, router]);

  // Fetch affiliate click data from Firestore
  useEffect(() => {
    const fetchAffiliateData = async () => {
      if (!user || !user.walletId) return;

      const walletId = user.walletId;
      const affiliateActivity = [];

      try {
        // Fetch clicks from users/{walletId}/affiliateClicks
        const clicksQuery = query(collection(db, `users/${walletId}/affiliateClicks`));
        const clicksSnapshot = await getDocs(clicksQuery);

        clicksSnapshot.forEach(doc => {
          const clickData = doc.data();
          const clickDate = clickData.timestamp ? new Date(clickData.timestamp) : new Date();
          affiliateActivity.push({
            id: doc.id,
            affiliateName: clickData.affiliateName,
            clicks: 1,
            purchases: 0, // Placeholder
            pendingWndo: 0, // Placeholder
            status: "clicked", // Default, update with purchase linking later
            date: clickDate.toISOString().split('T')[0],
          });
        });

        setAffiliateData(affiliateActivity);
        console.log("Fetched affiliate activity:", affiliateActivity);
      } catch (error) {
        console.error("Error fetching affiliate data:", error);
      }
    };

    fetchAffiliateData();
  }, [user, router]);

  // Ensure user is loaded and authorized before rendering
  if (!user || !user.walletId || (user.role !== "buyer" && user.role !== "seller")) {
    return null;
  }

  const openMenu = (event) => setMenu(event.currentTarget);
  const closeMenu = () => setMenu(null);

  // Filter data based on search and status
  const filteredData = affiliateData.filter((item) => {
    const matchesSearch = searchQuery.trim()
      ? item.affiliateName.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
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

  const tableData = {
    columns: [
      { Header: "Affiliate Name", accessor: "affiliateName", width: "20%" },
      { Header: "Date", accessor: "date", width: "15%" },
      { Header: "Clicks", accessor: "clicks", width: "15%" },
      { Header: "Purchases", accessor: "purchases", width: "15%" },
      { Header: "Pending WNDO", accessor: "pendingWndo", width: "15%" },
      { Header: "Status", accessor: "status", width: "20%" },
    ],
    rows: filteredData.map((item) => ({
      ...item,
      affiliateName: (
        <Link href={`/dashboards/buyer/affiliate/details/${item.id}`}>
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
            Affiliate Activity
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
        <Card>
          <DataTable table={tableData} entriesPerPage={false} canSearch={false} />
        </Card>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default AffiliateActivity;