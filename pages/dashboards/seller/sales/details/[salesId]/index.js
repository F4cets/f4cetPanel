/**
=========================================================
* F4cetPanel - Seller Sales Details Page
=========================================================

* Copyright 2023 F4cets Team
*/

// React imports
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

// Firebase imports
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "/lib/firebase";

// User context
import { useUser } from "/contexts/UserContext";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
import MDInput from "/components/MDInput";
import MDButton from "/components/MDButton";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";
import TimelineItem from "/examples/Timeline/TimelineItem";

// Dummy Data (for initial testing, replaced by Firestore data)
const dummySaleDetails = {
  id: "SALE001",
  itemName: "Strong Hold Hoodie",
  salePrice: 50,
  currency: "USDC",
  buyerWallet: "buyer123...xyz",
  status: "shipped",
  createdAt: "2025-03-20",
  shippingLocation: "New York, USA",
  trackingNumber: "123ABC",
  timeline: [
    { title: "Sale Created", date: "2025-03-20 10:00 AM", description: "Sale initiated for Strong Hold Hoodie." },
    { title: "Shipped", date: "2025-03-21 12:00 PM", description: "Item shipped with tracking 123ABC." },
  ],
};

function SalesDetails() {
  const { user } = useUser();
  const router = useRouter();
  const { salesId } = router.query;
  const [saleDetails, setSaleDetails] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch sale details from Firestore
  useEffect(() => {
    const fetchSale = async () => {
      if (!user || !user.walletId || !salesId) return;

      try {
        const saleDoc = doc(db, "sales", salesId);
        const saleSnapshot = await getDoc(saleDoc);
        if (saleSnapshot.exists() && saleSnapshot.data().sellerId === user.walletId) {
          const data = {
            id: saleSnapshot.id,
            ...saleSnapshot.data(),
            createdAt: saleSnapshot.data().createdAt.split("T")[0], // Format date
          };
          setSaleDetails(data);
          setTrackingNumber(data.trackingNumber || "");
        } else {
          setError("Sale not found or unauthorized.");
        }
      } catch (err) {
        console.error("Error fetching sale:", err);
        setError("Failed to load sale details.");
      }
    };

    fetchSale();
  }, [user, salesId]);

  // Redirect to home if no user, no walletId, or unauthorized role
  useEffect(() => {
    if (!user || !user.walletId || user.role !== "seller") {
      router.replace("/");
    }
  }, [user, router]);

  // Handle tracking number save
  const handleSaveTracking = async () => {
    if (!saleDetails || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      const saleDoc = doc(db, "sales", salesId);
      await updateDoc(saleDoc, {
        trackingNumber,
        timeline: [
          ...(saleDetails.timeline || []),
          {
            title: trackingNumber ? "Tracking Number Updated" : "Tracking Number Removed",
            date: new Date().toISOString(),
            description: trackingNumber ? `Tracking number set to ${trackingNumber}.` : "Tracking number cleared.",
          },
        ],
      });
      setSaleDetails({
        ...saleDetails,
        trackingNumber,
        timeline: [
          ...saleDetails.timeline,
          {
            title: trackingNumber ? "Tracking Number Updated" : "Tracking Number Removed",
            date: new Date().toISOString().split("T")[0] + " " + new Date().toLocaleTimeString(),
            description: trackingNumber ? `Tracking number set to ${trackingNumber}.` : "Tracking number cleared.",
          },
        ],
      });
    } catch (err) {
      console.error("Error updating tracking number:", err);
      setError("Failed to save tracking number.");
    } finally {
      setIsSaving(false);
    }
  };

  // Ensure user is loaded and authorized before rendering
  if (!user || !user.walletId || user.role !== "seller") {
    return null; // Or a loading spinner
  }

  // Handle invalid or missing salesId
  if (!salesId || !salesId.startsWith("SALE") || !saleDetails) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          <MDTypography variant="h4" color="error">
            {error || "Invalid Sale ID"}
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
                  Sale Details - {saleDetails.id}
                </MDTypography>
                {error && (
                  <MDTypography variant="body2" color="error" mb={2}>
                    {error}
                  </MDTypography>
                )}
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Item Name
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {saleDetails.itemName}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Sale Price
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {saleDetails.salePrice} {saleDetails.currency}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Buyer Wallet
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {saleDetails.buyerWallet.slice(0, 6)}...{saleDetails.buyerWallet.slice(-4)}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Status
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {saleDetails.status.charAt(0).toUpperCase() + saleDetails.status.slice(1)}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Date
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {saleDetails.createdAt}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Shipping Location
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {saleDetails.shippingLocation}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Tracking Number
                      </MDTypography>
                      <MDInput
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter tracking number"
                        fullWidth
                        sx={{
                          "& .MuiInputBase-input": {
                            padding: { xs: "10px", md: "12px" },
                            color: "#344767",
                          },
                        }}
                      />
                      <MDButton
                        variant="contained"
                        color="dark"
                        onClick={handleSaveTracking}
                        disabled={isSaving || trackingNumber === saleDetails.trackingNumber}
                        sx={{ mt: 1, width: { xs: "100%", sm: "auto" } }}
                      >
                        {isSaving ? "Saving..." : "Save Tracking"}
                      </MDButton>
                    </MDBox>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <MDBox>
                      <MDTypography variant="h6" color="dark" mb={2}>
                        Sale Timeline
                      </MDTypography>
                      {saleDetails.timeline && saleDetails.timeline.length > 0 ? (
                        saleDetails.timeline.map((event, index) => (
                          <TimelineItem
                            key={index}
                            color={index === saleDetails.timeline.length - 1 ? "success" : "info"}
                            icon={index === saleDetails.timeline.length - 1 ? "check" : "pending"}
                            title={event.title}
                            dateTime={event.date}
                            description={event.description}
                            lastItem={index === saleDetails.timeline.length - 1}
                          />
                        ))
                      ) : (
                        <MDTypography variant="body2" color="text">
                          No timeline events available.
                        </MDTypography>
                      )}
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

export default SalesDetails;