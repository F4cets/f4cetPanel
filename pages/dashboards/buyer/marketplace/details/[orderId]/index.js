/**
=========================================================
* F4cetPanel - Marketplace Order Details Page
=========================================================

* Copyright 2023 F4cets Team
*/

// React imports
import { useEffect } from "react";
import { useRouter } from "next/router";

// User context
import { useUser } from "/contexts/UserContext";

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

// Dummy Data (Replace with Firestore data later)
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

function MarketplaceOrderDetails() {
  const { user } = useUser();
  const router = useRouter();
  const { orderId } = router.query;

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

  // Validate orderId (placeholder for future Firestore fetch)
  if (!orderId || !orderId.startsWith("MKT")) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          <MDTypography variant="h4" color="error">
            Invalid Marketplace Order ID
          </MDTypography>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  // Placeholder: Use dummy data (replace with Firestore fetch later)
  const details = marketplaceDetails;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h4" color="dark" mb={2}>
                  Marketplace Order Details - {details.id}
                </MDTypography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Product
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {details.product}
                      </MDTypography>
                    </MDBox>
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
                      <MDTypography
                        variant="body2"
                        color="info"
                        component="a"
                        href={`https://www.ship24.com/tracking/${details.trackingNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          textDecoration: "underline",
                          "&:hover": { color: "info.main" },
                        }}
                      >
                        {details.trackingNumber || "Not Available"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Amount
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {details.amount}
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

export default MarketplaceOrderDetails;