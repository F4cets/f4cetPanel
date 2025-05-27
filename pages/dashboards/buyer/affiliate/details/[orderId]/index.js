/**
=========================================================
* F4cetPanel - Affiliate Order Details Page
=========================================================

* Copyright 2025 F4cets Team
*/

// React imports
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

// User context
import { useUser } from "/contexts/UserContext";

// Firestore imports
import { doc, getDoc } from "firebase/firestore";
import { db } from "/lib/firebase";

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

function AffiliateOrderDetails() {
  const { user } = useUser();
  const router = useRouter();
  const { orderId } = router.query;
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);

  // Redirect to home if no user, no walletId, or unauthorized role
  useEffect(() => {
    if (!user || !user.walletId || (user.role !== "buyer" && user.role !== "seller")) {
      router.replace("/");
    }
  }, [user, router]);

  // Fetch affiliate click details from Firestore
  useEffect(() => {
    const fetchDetails = async () => {
      if (!orderId || !user || !user.walletId) return;

      try {
        // Fetch click from users/{walletId}/affiliateClicks/{orderId}
        const clickDocRef = doc(db, `users/${user.walletId}/affiliateClicks`, orderId);
        const clickDoc = await getDoc(clickDocRef);

        if (!clickDoc.exists()) {
          setError("Affiliate click not found or unauthorized");
          return;
        }

        const clickData = clickDoc.data();
        const clickDate = clickData.timestamp ? new Date(clickData.timestamp) : new Date();
        const clickDateStr = `${clickDate.toISOString().split('T')[0]} ${clickDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

        // Build timeline
        const timeline = [
          {
            title: "Link Clicked",
            date: clickDateStr,
            description: `User clicked affiliate link: ${clickData.affiliateName}`,
          },
        ];

        // Set details
        setDetails({
          affiliateName: clickData.affiliateName,
          clicks: 1,
          purchases: 0, // Placeholder
          pendingWndo: 0, // Placeholder
          status: "clicked", // Default
          date: clickDate.toISOString().split('T')[0],
          timeline,
        });
      } catch (error) {
        console.error("Error fetching affiliate details:", error);
        setError("Failed to fetch affiliate details");
      }
    };

    fetchDetails();
  }, [orderId, user, router]);

  // Ensure user is loaded and authorized before rendering
  if (!user || !user.walletId || (user.role !== "buyer" && user.role !== "seller")) {
    return null;
  }

  // Handle errors or invalid orderId
  if (error || !orderId) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          <MDTypography variant="h4" color="error">
            {error || "Invalid Affiliate Click ID"}
          </MDTypography>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  // Wait for details to load
  if (!details) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          <MDTypography variant="h4" color="text">
            Loading...
          </MDTypography>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h4" color="dark" mb={2}>
                  Affiliate Click Details
                </MDTypography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Affiliate Name
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {details.affiliateName}
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
                        Status
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {details.status}
                      </MDTypography>
                    </MDBox>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <MDBox>
                      <MDTypography variant="h6" color="dark" mb={2}>
                        Click Timeline
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