/**
=========================================================
* F4cetPanel - Inventory Details Page
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
const inventoryDetails = {
  id: "INV001",
  item: "Handmade Vase",
  quantity: 5,
  price: "10 SOL",
  status: "In Stock",
  dateListed: "2025-03-20",
  timeline: [
    { title: "Item Listed", date: "2025-03-20 09:00 AM", description: "Handmade Vase listed for sale." },
    { title: "Stock Updated", date: "2025-03-21 10:00 AM", description: "Quantity updated to 5 units." },
    { title: "Price Adjusted", date: "2025-03-22 11:00 AM", description: "Price set to 10 SOL." },
  ],
};

function InventoryDetails() {
  const { user } = useUser();
  const router = useRouter();
  const { invId } = router.query;

  // Redirect to home if no user, no walletId, or unauthorized role
  useEffect(() => {
    if (!user || !user.walletId || user.role !== "seller") {
      router.replace("/");
    }
  }, [user, router]);

  // Ensure user is loaded and authorized before rendering
  if (!user || !user.walletId || user.role !== "seller") {
    return null; // Or a loading spinner
  }

  // Validate invId (placeholder for future Firestore fetch)
  if (!invId || !invId.startsWith("INV")) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          <MDTypography variant="h4" color="error">
            Invalid Inventory Item ID
          </MDTypography>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  // Placeholder: Use dummy data (replace with Firestore fetch later)
  const details = inventoryDetails;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h4" color="dark" mb={2}>
                  Inventory Details - {details.id}
                </MDTypography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Item
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {details.item}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Quantity
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {details.quantity}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Price
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {details.price}
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
                        Date Listed
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {details.dateListed}
                      </MDTypography>
                    </MDBox>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <MDBox>
                      <MDTypography variant="h6" color="dark" mb={2}>
                        Inventory Timeline
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

export default InventoryDetails;