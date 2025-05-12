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

import { useState } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Card from "@mui/material/Card";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
import DefaultStatisticsCard from "/examples/Cards/StatisticsCards/DefaultStatisticsCard";
import DefaultLineChart from "/examples/Charts/LineCharts/DefaultLineChart";
import DataTable from "/examples/Tables/DataTable";
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";
import MDBadgeDot from "/components/MDBadgeDot";
import MDButton from "/components/MDButton";
import Tooltip from "@mui/material/Tooltip";
import Icon from "@mui/material/Icon";

// Data
import defaultLineChartData from "/pagesComponents/dashboards/sales/data/defaultLineChartData";
import dataTableData from "/pagesComponents/dashboards/sales/data/dataTableData";

// Dummy Data for New Cards
const topSellingStoresData = {
  columns: [
    { Header: "Store Name", accessor: "storeName", width: "40%" },
    { Header: "Total Sales", accessor: "totalSales", width: "30%" },
    { Header: "Avg. Rating", accessor: "avgRating", width: "30%" },
  ],
  rows: [
    {
      storeName: "FashionHub",
      totalSales: "$8,500",
      avgRating: "4.8",
    },
    {
      storeName: "TechTrend",
      totalSales: "$6,200",
      avgRating: "4.5",
    },
    {
      storeName: "ArtisanCrafts",
      totalSales: "$4,800",
      avgRating: "4.7",
    },
    {
      storeName: "EcoGoods",
      totalSales: "$3,900",
      avgRating: "4.3",
    },
  ],
};

const flaggedStoresData = {
  columns: [
    { Header: "Store Name", accessor: "storeName", width: "30%" },
    { Header: "Flag Count", accessor: "flagCount", width: "20%" },
    { Header: "Reasons", accessor: "reasons", width: "50%" },
  ],
  rows: [
    {
      storeName: "FakeGoods",
      flagCount: "5",
      reasons: "Suspected counterfeit products, misleading descriptions",
    },
    {
      storeName: "ScamShop",
      flagCount: "3",
      reasons: "Non-delivery, poor customer service",
    },
  ],
};

const flaggedItemsData = {
  columns: [
    { Header: "Item Name", accessor: "itemName", width: "30%" },
    { Header: "Store Name", accessor: "storeName", width: "20%" },
    { Header: "Flag Count", accessor: "flagCount", width: "20%" },
    { Header: "Reasons", accessor: "reasons", width: "30%" },
  ],
  rows: [
    {
      itemName: "Luxury Watch Replica",
      storeName: "FakeGoods",
      flagCount: "4",
      reasons: "Counterfeit item",
    },
    {
      itemName: "Miracle Cure E-book",
      storeName: "ScamShop",
      flagCount: "3",
      reasons: "False health claims",
    },
  ],
};

function GodDashboard() {
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

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <DefaultStatisticsCard
                title="Sales"
                count="$14,227"
                percentage={{
                  color: "success",
                  value: "+17%",
                  label: "since last month",
                }}
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
                count="1,489"
                percentage={{
                  color: "success",
                  value: "+46%",
                  label: "since last month",
                }}
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
                count="217"
                percentage={{
                  color: "success",
                  value: "+21%",
                  label: "since last month",
                }}
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
                count="323"
                percentage={{
                  color: "success",
                  value: "+17",
                  label: "since last month",
                }}
                dropdown={{
                  action: openRevenueDropdown,
                  menu: renderMenu(revenueDropdown, closeRevenueDropdown),
                  value: revenueDropdownValue,
                }}
              />
            </Grid>
          </Grid>
        </MDBox>
        <MDBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <DefaultLineChart
                title="Growth"
                description={
                  <MDBox display="flex" justifyContent="space-between">
                    <MDBox display="flex" ml={-1}>
                      <MDBadgeDot
                        color="info"
                        size="sm"
                        badgeContent="Buyers"
                      />
                      <MDBadgeDot
                        color="dark"
                        size="sm"
                        badgeContent="Sellers"
                      />
                    </MDBox>
                    <MDBox mt={-4} mr={-1} position="absolute" right="1.5rem">
                      <Tooltip
                        title="See which ads perform better"
                        placement="left"
                        arrow
                      >
                        <MDButton
                          variant="outlined"
                          color="secondary"
                          size="small"
                          circular
                          iconOnly
                        >
                          <Icon>priority_high</Icon>
                        </MDButton>
                      </Tooltip>
                    </MDBox>
                  </MDBox>
                }
                chart={defaultLineChartData}
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
                  table={topSellingStoresData}
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
                  table={dataTableData}
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
                  table={flaggedStoresData}
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
                  table={flaggedItemsData}
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