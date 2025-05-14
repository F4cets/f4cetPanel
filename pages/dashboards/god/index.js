/**
=========================================================
* NextJS Material Dashboard 2 PRO - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/nextjs-material-dashboard-pro
* Copyright 2023 Creative Tim (https://www.creative-tim.com)
* Coded by Creative Tim and F4cets Team
=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useState, useEffect } from "react";
import { db } from "/lib/firebase"; // Adjust path to your Firebase config
import { collection, getDocs, query, where } from "firebase/firestore";

// @mui material components
import Grid from "@mui/material/Grid";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Card from "@mui/material/Card";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
import DefaultStatisticsCard from "/examples/Cards/StatisticsCards/DefaultStatisticsCard";
import DataTable from "/examples/Tables/DataTable";
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";

// Dummy Data for Tables
const topSellingStoresData = {
  columns: [
    { Header: "Store Name", accessor: "storeName", width: "40%" },
    { Header: "Total Sales", accessor: "totalSales", width: "30%" },
    { Header: "Avg. Rating", accessor: "avgRating", width: "30%" },
  ],
  rows: [
    { storeName: "FashionHub", totalSales: "$8,500", avgRating: "4.8" },
    { storeName: "TechTrend", totalSales: "$6,200", avgRating: "4.5" },
    { storeName: "ArtisanCrafts", totalSales: "$4,800", avgRating: "4.7" },
    { storeName: "EcoGoods", totalSales: "$3,900", avgRating: "4.3" },
  ],
};

const topSellingItemsData = {
  columns: [
    { Header: "Item Name", accessor: "itemName", width: "40%" },
    { Header: "Store Name", accessor: "storeName", width: "30%" },
    { Header: "Revenue", accessor: "revenue", width: "30%" },
  ],
  rows: [
    { itemName: "Smartphone X", storeName: "TechTrend", revenue: "$3,200" },
    { itemName: "Leather Jacket", storeName: "FashionHub", revenue: "$2,500" },
    { itemName: "Handmade Vase", storeName: "ArtisanCrafts", revenue: "$1,800" },
    { itemName: "Eco Tote Bag", storeName: "EcoGoods", revenue: "$1,200" },
  ],
};

const flaggedStoresData = {
  columns: [
    { Header: "Store Name", accessor: "storeName", width: "30%" },
    { Header: "Flag Count", accessor: "flagCount", width: "20%" },
    { Header: "Reasons", accessor: "reasons", width: "30%" },
    { Header: "First Flagged", accessor: "date", width: "20%" },
  ],
  rows: [],
};

const flaggedItemsData = {
  columns: [
    { Header: "Item Name", accessor: "itemName", width: "30%" },
    { Header: "Store Name", accessor: "storeName", width: "20%" },
    { Header: "Flag Count", accessor: "flagCount", width: "20%" },
    { Header: "Reasons", accessor: "reasons", width: "20%" },
    { Header: "First Flagged", accessor: "date", width: "20%" },
  ],
  rows: [],
};

function GodDashboard() {
  // State for Firestore data
  const [sales, setSales] = useState(0);
  const [buyers, setBuyers] = useState(0);
  const [sellers, setSellers] = useState(0);
  const [affiliates, setAffiliates] = useState(0);
  const [topStores, setTopStores] = useState({ columns: [], rows: [] });
  const [topItems, setTopItems] = useState({ columns: [], rows: [] });
  const [flaggedStores, setFlaggedStores] = useState({ columns: [], rows: [] });
  const [flaggedItems, setFlaggedItems] = useState({ columns: [], rows: [] });

  // DefaultStatisticsCard state for the dropdown value
  const [salesDropdownValue, setSalesDropdownValue] = useState("6 May - 7 May");
  const [buyersDropdownValue, setBuyersDropdownValue] = useState("6 May - 7 May");
  const [sellersDropdownValue, setSellersDropdownValue] = useState("6 May - 7 May");
  const [revenueDropdownValue, setRevenueDropdownValue] = useState("6 May - 7 May");

  // DefaultStatisticsCard state for the dropdown action
  const [salesDropdown, setSalesDropdown] = useState(null);
  const [buyersDropdown, setBuyersDropdown] = useState(null);
  const [sellersDropdown, setSellersDropdown] = useState(null);
  const [revenueDropdown, setRevenueDropdown] = useState(null);

  // DefaultStatisticsCard handler for the dropdown action
  const openSalesDropdown = ({ currentTarget }) => setSalesDropdown(currentTarget);
  const closeSalesDropdown = ({ currentTarget }) => {
    setSalesDropdown(null);
    setSalesDropdownValue(currentTarget.innerText || salesDropdownValue);
  };
  const openBuyersDropdown = ({ currentTarget }) => setBuyersDropdown(currentTarget);
  const closeBuyersDropdown = ({ currentTarget }) => {
    setBuyersDropdown(null);
    setBuyersDropdownValue(currentTarget.innerText || buyersDropdownValue);
  };
  const openSellersDropdown = ({ currentTarget }) => setSellersDropdown(currentTarget);
  const closeSellersDropdown = ({ currentTarget }) => {
    setSellersDropdown(null);
    setSellersDropdownValue(currentTarget.innerText || sellersDropdownValue);
  };
  const openRevenueDropdown = ({ currentTarget }) => setRevenueDropdown(currentTarget);
  const closeRevenueDropdown = ({ currentTarget }) => {
    setRevenueDropdown(null);
    setRevenueDropdownValue(currentTarget.innerText || revenueDropdownValue);
  };

  // Dropdown menu template for the DefaultStatisticsCard
  const renderMenu = (state, close) => (
    <Menu
      anchorEl={state}
      transformOrigin={{ vertical: "top", horizontal: "center" }}
      open={Boolean(state)}
      onClose={close}
      keepMounted
      disableAutoFocusItem
    >
      <MenuItem onClick={close}>Last 7 days</MenuItem>
      <MenuItem onClick={close}>Last week</MenuItem>
      <MenuItem onClick={close}>Last 30 days</MenuItem>
    </Menu>
  );

  // Fetch Firestore data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Sales: Sum of transaction amounts
        const transactionsQuery = query(collection(db, "transactions"));
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const totalSales = transactionsSnapshot.docs.reduce((sum, doc) => {
          const data = doc.data();
          return sum + (data.amount || 0);
        }, 0);
        setSales(totalSales);

        // Buyers: Count users with role "buyer"
        const buyersQuery = query(collection(db, "users"), where("role", "==", "buyer"));
        const buyersSnapshot = await getDocs(buyersQuery);
        setBuyers(buyersSnapshot.size);

        // Sellers: Count users with role "seller"
        const sellersQuery = query(collection(db, "users"), where("role", "==", "seller"));
        const sellersSnapshot = await getDocs(sellersQuery);
        setSellers(sellersSnapshot.size);

        // Affiliates: Count documents in affiliates collection
        const affiliatesQuery = query(collection(db, "affiliates"));
        const affiliatesSnapshot = await getDocs(affiliatesQuery);
        setAffiliates(affiliatesSnapshot.size);

        // Top Selling Stores
        const storeRevenue = {};
        transactionsSnapshot.forEach((doc) => {
          const data = doc.data();
          const storeId = data.storeId;
          if (storeId) {
            storeRevenue[storeId] = (storeRevenue[storeId] || 0) + data.amount;
          }
        });

        const storesQuery = query(collection(db, "stores"));
        const storesSnapshot = await getDocs(storesQuery);
        const storeRows = [];
        storesSnapshot.forEach((doc) => {
          const data = doc.data();
          const revenue = storeRevenue[data.storeId] || 0;
          if (revenue > 0) {
            storeRows.push({
              storeName: data.name,
              totalSales: `$${revenue.toLocaleString()}`,
              avgRating: data.avgRating || "N/A", // Placeholder, update if ratings added
            });
          }
        });

        storeRows.sort((a, b) => parseFloat(b.totalSales.replace(/[$,]/g, '')) - parseFloat(a.totalSales.replace(/[$,]/g, '')));
        setTopStores({
          columns: [
            { Header: "Store Name", accessor: "storeName", width: "40%" },
            { Header: "Total Sales", accessor: "totalSales", width: "30%" },
            { Header: "Avg. Rating", accessor: "avgRating", width: "30%" },
          ],
          rows: storeRows.slice(0, 5),
        });

        // Top Selling Items
        const productRevenue = {};
        transactionsSnapshot.forEach((doc) => {
          const data = doc.data();
          data.productIds.forEach((productId) => {
            productRevenue[productId] = (productRevenue[productId] || 0) + (data.amount / data.productIds.length); // Approximate split
          });
        });

        const productsQuery = query(collection(db, "products"));
        const productsSnapshot = await getDocs(productsQuery);
        const productRows = [];
        productsSnapshot.forEach((doc) => {
          const data = doc.data();
          const revenue = productRevenue[doc.id] || 0;
          if (revenue > 0) {
            productRows.push({
              itemName: data.name,
              storeName: storesSnapshot.docs.find(s => s.id === data.storeId)?.data().name || "Unknown",
              revenue: `$${revenue.toLocaleString()}`,
            });
          }
        });

        productRows.sort((a, b) => parseFloat(b.revenue.replace(/[$,]/g, '')) - parseFloat(a.revenue.replace(/[$,]/g, '')));
        setTopItems({
          columns: [
            { Header: "Item Name", accessor: "itemName", width: "40%" },
            { Header: "Store Name", accessor: "storeName", width: "30%" },
            { Header: "Revenue", accessor: "revenue", width: "30%" },
          ],
          rows: productRows.slice(0, 5),
        });

        // Flagged Stores (Placeholder)
        setFlaggedStores(flaggedStoresData);

        // Flagged Items (Placeholder)
        setFlaggedItems(flaggedItemsData);
      } catch (error) {
        console.error("Error fetching Firestore data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <DefaultStatisticsCard
                title="Sales"
                count={`$${sales.toLocaleString()}`}
                dropdown={{
                  action: openSalesDropdown,
                  menu: renderMenu(salesDropdown, closeSalesDropdown),
                  value: salesDropdownValue,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <DefaultStatisticsCard
                title="Buyers"
                count={buyers.toLocaleString()}
                dropdown={{
                  action: openBuyersDropdown,
                  menu: renderMenu(buyersDropdown, closeBuyersDropdown),
                  value: buyersDropdownValue,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <DefaultStatisticsCard
                title="Sellers"
                count={sellers.toLocaleString()}
                dropdown={{
                  action: openSellersDropdown,
                  menu: renderMenu(sellersDropdown, closeSellersDropdown),
                  value: sellersDropdownValue,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <DefaultStatisticsCard
                title="Affiliates"
                count={affiliates.toLocaleString()}
                dropdown={{
                  action: openRevenueDropdown,
                  menu: renderMenu(revenueDropdown, closeRevenueDropdown),
                  value: revenueDropdownValue,
                }}
              />
            </Grid>
          </Grid>
        </MDBox>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox pt={3} px={3}>
                <MDTypography variant="h6" fontWeight="medium">
                  Top Selling Stores
                </MDTypography>
              </MDBox>
              <MDBox py={1}>
                <DataTable
                  table={topStores}
                  entriesPerPage={false}
                  showTotalEntries={false}
                  isSorted={false}
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <MDBox pt={3} px={3}>
                <MDTypography variant="h6" fontWeight="medium">
                  Top Selling Items
                </MDTypography>
              </MDBox>
              <MDBox py={1}>
                <DataTable
                  table={topItems}
                  entriesPerPage={false}
                  showTotalEntries={false}
                  isSorted={false}
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <MDBox pt={3} px={3}>
                <MDTypography variant="h6" fontWeight="medium">
                  Flagged Stores
                </MDTypography>
              </MDBox>
              <MDBox py={1}>
                <DataTable
                  table={flaggedStores}
                  entriesPerPage={false}
                  showTotalEntries={false}
                  isSorted={false}
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <MDBox pt={3} px={3}>
                <MDTypography variant="h6" fontWeight="medium">
                  Flagged Items
                </MDTypography>
              </MDBox>
              <MDBox py={1}>
                <DataTable
                  table={flaggedItems}
                  entriesPerPage={false}
                  showTotalEntries={false}
                  isSorted={false}
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default GodDashboard;