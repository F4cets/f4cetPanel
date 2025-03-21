/**
=========================================================
* F4cetPanel - Order Details Page
=========================================================

* Copyright 2023 F4cets Team
*/

import { useRouter } from "next/router";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";
import TimelineItem from "/examples/Timeline/TimelineItem";

// Dummy Data
const affiliateDetails = {
  id: "AFF001",
  link: "Amazon",
  clicks: 150,
  purchases: 10,
  pendingWndo: 50,
  rewardedWndo: 100,
  status: "Paid",
  date: "2025-03-20",
  timeline: [
    { title: "Link Clicked", date: "2025-03-20 10:00 AM", description: "User clicked affiliate link." },
    { title: "Purchase Made", date: "2025-03-20 10:15 AM", description: "User completed a purchase." },
    { title: "WNDO Rewarded", date: "2025-03-21 09:00 AM", description: "50 WNDO rewarded to user." },
  ],
};

const marketplaceDetails = {
  id: "MKT001",
  product: "Dog Bed",
  seller: "Seller123",
  amount: "150 SOL",
  status: "Paid",
  date: "2025-03-20",
  shippingAddress: "1234 Main St., Portland OR 97103, United States",
  trackingNumber: "TRK123456789",
  timeline: [
    { title: "Order Placed", date: "2025-03-20 10:00 AM", description: "Order placed successfully." },
    { title: "Order Shipped", date: "2025-03-21 08:00 AM", description: "Order shipped with tracking number TRK123456789." },
    { title: "Order Delivered", date: "2025-03-23 03:00 PM", description: "Order delivered to customer." },
  ],
};

function OrderDetails() {
  const router = useRouter();
  const { orderId } = router.query;

  // Determine if it's an affiliate or marketplace order based on ID prefix
  const isAffiliate = orderId && orderId.startsWith("AFF");
  const details = isAffiliate ? affiliateDetails : marketplaceDetails;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h4" color="dark" mb={2}>
                  Order Details - {details.id}
                </MDTypography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        {isAffiliate ? "Affiliate Link" : "Product"}
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {isAffiliate ? details.link : details.product}
                      </MDTypography>
                    </MDBox>
                    {!isAffiliate && (
                      <>
                        <MDBox mb={2}>
                          <MDTypography variant="h6" color="dark">
                            Seller
                          </MDTypography>
                          <MDTypography variant="body2" color="text">
                            {details.seller}
                          </MDTypography>
                        </MDBox>
                        <MDBox mb={2}>
                          <MDTypography variant="h6" color="dark">
                            Shipping Address
                          </MDTypography>
                          <MDTypography variant="body2" color="text">
                            {details.shippingAddress}
                          </MDTypography>
                        </MDBox>
                        <MDBox mb={2}>
                          <MDTypography variant="h6" color="dark">
                            Tracking Number
                          </MDTypography>
                          <MDTypography variant="body2" color="text">
                            {details.trackingNumber}
                          </MDTypography>
                        </MDBox>
                      </>
                    )}
                    {isAffiliate && (
                      <>
                        <MDBox mb={2}>
                          <MDTypography variant="h6" color="dark">
                            Clicks
                          </MDTypography>
                          <MDTypography variant="body2" color="text">
                            {details.clicks}
                          </MDTypography>
                        </MDBox>
                        <MDBox mb={2}>
                          <MDTypography variant="h6" color="dark">
                            Purchases
                          </MDTypography>
                          <MDTypography variant="body2" color="text">
                            {details.purchases}
                          </MDTypography>
                        </MDBox>
                        <MDBox mb={2}>
                          <MDTypography variant="h6" color="dark">
                            Pending WNDO
                          </MDTypography>
                          <MDTypography variant="body2" color="text">
                            {details.pendingWndo}
                          </MDTypography>
                        </MDBox>
                        <MDBox mb={2}>
                          <MDTypography variant="h6" color="dark">
                            Rewarded WNDO
                          </MDTypography>
                          <MDTypography variant="body2" color="text">
                            {details.rewardedWndo}
                          </MDTypography>
                        </MDBox>
                      </>
                    )}
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Amount
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {isAffiliate ? "N/A" : details.amount}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Status
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {details.status}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Date
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {details.date}
                      </MDTypography>
                    </MDBox>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <MDBox>
                      <MDTypography variant="h6" color="dark" mb={2}>
                        Order Timeline
                      </MDTypography>
                      {details.timeline.map((event, index) => (
                        <TimelineItem
                          key={index}
                          color={index === details.timeline.length - 1 ? "success" : "info"}
                          icon={index === details.timeline.length - 1 ? "check" : "pending"}
                          title={event.title}
                          dateTime={event.date}
                          description={event.description}
                          lastItem={index === details.timeline.length - 1}
                        />
                      ))}
                    </MDBox>
                  </Grid>
                </Grid>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default OrderDetails;