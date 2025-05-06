/**
=========================================================
* F4cetPanel - Affiliate Order Details Page
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

function AffiliateOrderDetails() {
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
  if (!orderId || !orderId.startsWith("AFF")) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          <MDTypography variant="h4" color="error">
            Invalid Affiliate Order ID
          </MDTypography>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  // Placeholder: Use dummy data (replace with Firestore fetch later)
  const details = affiliateDetails;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h4" color="dark" mb={2}>
                  Affiliate Order Details - {details.id}
                </MDTypography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Affiliate Link
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {details.link}
                      </MDTypography>
                    </MDBox>
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

export default AffiliateOrderDetails;