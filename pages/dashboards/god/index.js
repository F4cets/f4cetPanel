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
import Tooltip from "@mui/material/Tooltip";
import Icon from "@mui/material/Icon";
import Card from "@mui/material/Card";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDBadgeDot from "/components/MDBadgeDot";
import MDButton from "/components/MDButton";
import MDTypography from "/components/MDTypography";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";
import DefaultStatisticsCard from "/examples/Cards/StatisticsCards/DefaultStatisticsCard";
import DefaultLineChart from "/examples/Charts/LineCharts/DefaultLineChart";
import HorizontalBarChart from "/examples/Charts/BarCharts/HorizontalBarChart";
import SalesTable from "/examples/Tables/SalesTable";
import DataTable from "/examples/Tables/DataTable";

// Sales dashboard components
import ChannelsChart from "/pagesComponents/dashboards/sales/components/ChannelsChart";

// Data
import defaultLineChartData from "/pagesComponents/dashboards/sales/data/defaultLineChartData";
import horizontalBarChartData from "/pagesComponents/dashboards/sales/data/horizontalBarChartData";
import salesTableData from "/pagesComponents/dashboards/sales/data/salesTableData";
import dataTableData from "/pagesComponents/dashboards/sales/data/dataTableData";

function Sales() {
  // DefaultStatisticsCard state for the dropdown value
  const [salesDropdownValue, setSalesDropdownValue] = useState("6 May - 7 May");
  const [buyersDropdownValue, setBuyersDropdownValue] = useState("6 May - 7 May");
  const [sellersDropdownValue, setSellersDropdownValue] = useState("6 May - 7 May"); // New state for Sellers
  const [revenueDropdownValue, setRevenueDropdownValue] = useState("6 May - 7 May");

  // DefaultStatisticsCard state for the dropdown action
  const [salesDropdown, setSalesDropdown] = useState(null);
  const [buyersDropdown, setBuyersDropdown] = useState(null);
  const [sellersDropdown, setSellersDropdown] = useState(null); // New state for Sellers
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
  const openSellersDropdown = ({ currentTarget }) => setSellersDropdown(currentTarget); // New handler for Sellers
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
                title="Avg. Revenue"
                count="$5.23"
                percentage={{
                  color: "success",
                  value: "+1.31",
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
            <Grid item xs={12} sm={6} lg={4}>
              <ChannelsChart />
            </Grid>
            <Grid item xs={12} sm={6} lg={8}>
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
        <MDBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <HorizontalBarChart
                title="Sales by age"
                chart={horizontalBarChartData}
              />
            </Grid>
            <Grid item xs={12} lg={4}>
              <SalesTable title="Sales by Country" rows={salesTableData} />
            </Grid>
          </Grid>
        </MDBox>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox pt={3} px={3}>
                <MDTypography variant="h6" fontWeight="medium">
                  Top Selling Products
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
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Sales;