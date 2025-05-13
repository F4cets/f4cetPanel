/**
=========================================================
* F4cetPanel - Affiliate Order Details Page
=========================================================

* Copyright 2023 F4cets Team
*/

// React imports
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

// User context
import { useUser } from "/contexts/UserContext";

// Firestore imports
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
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
        // Find the affiliate containing this click
        let clickData = null;
        let affiliateData = null;
        const affiliatesSnapshot = await getDocs(collection(db, "affiliates"));
        for (const affiliateDoc of affiliatesSnapshot.docs) {
          const affiliateId = affiliateDoc.id;
          const clickDocRef = doc(db, `affiliates/${affiliateId}/clicks`, orderId);
          const clickDoc = await getDoc(clickDocRef);
          if (clickDoc.exists() && clickDoc.data().walletId === user.walletId) {
            clickData = clickDoc.data();
            affiliateData = affiliateDoc.data();
            break;
          }
        }

        if (!clickData || !affiliateData) {
          setError("Affiliate click not found or unauthorized");
          return;
        }

        // Calculate clicks, purchases, and WNDO
        const clicks = 1; // Single click
        const purchases = clickData.status === "purchased" ? 1 : 0;
        let pendingWndo = purchases * 10; // 10 WNDO per purchase
        let rewardedWndo = 0;

        // Build timeline
        const timeline = [];
        const clickDate = clickData.timestamp instanceof Date ? clickData.timestamp : new Date();
        const clickDateStr = `${clickDate.toISOString().split('T')[0]} ${clickDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

        // Add click event
        timeline.push({
          title: "Link Clicked",
          date: clickDateStr,
          description: "User clicked affiliate link.",
        });

        // Add purchase and reward events if applicable
        if (clickData.status === "purchased" && clickData.purchaseId) {
          const transactionDocRef = doc(db, "transactions", clickData.purchaseId);
          const transactionDoc = await getDoc(transactionDocRef);
          if (transactionDoc.exists()) {
            const transactionData = transactionDoc.data();
            const purchaseDate = transactionData.createdAt instanceof Date ? transactionData.createdAt : new Date();
            const purchaseDateStr = `${purchaseDate.toISOString().split('T')[0]} ${purchaseDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            timeline.push({
              title: "Purchase Made",
              date: purchaseDateStr,
              description: "User completed a purchase.",
            });

            // Add rewarded event (scheduled 120 days later)
            const rewardDate = new Date(purchaseDate);
            rewardDate.setDate(rewardDate.getDate() + 120); // 120 days after purchase
            const rewardDateStr = `${rewardDate.getMonth() + 1}/${rewardDate.getDate()}/${rewardDate.getFullYear()}`; // Format as MM/DD/YYYY

            // Determine if reward has occurred based on current date
            const currentDate = new Date(); // Current date: May 13, 2025 at 07:07 AM PDT
            const hasRewardOccurred = currentDate >= rewardDate;

            // Update pendingWndo and rewardedWndo based on reward occurrence
            if (hasRewardOccurred) {
              rewardedWndo = pendingWndo;
              pendingWndo = 0;
            }

            timeline.push({
              title: hasRewardOccurred ? "WNDO Rewarded" : "WNDO Scheduled to be Rewarded",
              date: rewardDateStr,
              description: hasRewardOccurred ? "10 WNDO rewarded to user." : `10 WNDO reward estimated scheduled.`,
            });
          }
        }

        // Set details
        setDetails({
          id: orderId,
          link: affiliateData.name || "Unknown Affiliate",
          clicks,
          purchases,
          pendingWndo,
          rewardedWndo,
          status: clickData.status,
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
    return null; // Or a loading spinner
  }

  // Handle errors or invalid orderId
  if (error || !orderId) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          <MDTypography variant="h4" color="error">
            {error || "Invalid Affiliate Order ID"}
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