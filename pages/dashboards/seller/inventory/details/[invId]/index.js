/**
=========================================================
* F4cetPanel - Inventory Details Page
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

// Dummy Data (for initial testing, used as fallback if Firestore fails)
const dummyInventoryDetails = {
  id: "INV001",
  type: "rwi",
  name: "Handmade Vase",
  description: "A beautifully crafted ceramic vase.",
  price: 10,
  currency: "USDC",
  quantity: 0, // For digital
  shippingLocation: "New York, USA", // For RWI
  categories: ["Art & Collectibles"],
  variants: [{ size: "Medium", color: "Blue", quantity: 5 }], // For RWI
  images: ["https://images.kirklands.com/is/image/Kirklands/299950?$tProduct$"],
  status: "pending",
  removed: false,
  createdAt: "2025-03-20",
  timeline: [
    { title: "Item Listed", date: "2025-03-20 09:00 AM", description: "Handmade Vase listed for sale." },
    { title: "Stock Updated", date: "2025-03-21 10:00 AM", description: "Quantity updated to 5 units." },
  ],
};

function InventoryDetails() {
  const { user } = useUser();
  const router = useRouter();
  const { invId } = router.query;
  const [inventoryDetails, setInventoryDetails] = useState(null);
  const [price, setPrice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch inventory details from Firestore
  useEffect(() => {
    const fetchInventory = async () => {
      if (!user || !user.walletId || !invId) return;

      try {
        const invDoc = doc(db, "listings", invId);
        const invSnapshot = await getDoc(invDoc);
        if (invSnapshot.exists() && invSnapshot.data().sellerId === user.walletId) {
          const data = {
            id: invSnapshot.id,
            ...invSnapshot.data(),
            createdAt: invSnapshot.data().createdAt?.split("T")[0] || "N/A",
          };
          setInventoryDetails(data);
          setPrice(data.price || "");
        } else {
          setError("Inventory item not found or unauthorized. Using sample data.");
          setInventoryDetails(dummyInventoryDetails);
          setPrice(dummyInventoryDetails.price);
        }
      } catch (err) {
        console.error("Error fetching inventory:", err);
        setError("Failed to load inventory details. Using sample data.");
        setInventoryDetails(dummyInventoryDetails);
        setPrice(dummyInventoryDetails.price);
      }
    };

    fetchInventory();
  }, [user, invId]);

  // Redirect to home if no user, no walletId, or unauthorized role
  useEffect(() => {
    if (!user || !user.walletId || user.role !== "seller") {
      router.replace("/");
    }
  }, [user, router]);

  // Handle price save
  const handleSave = async () => {
    if (!inventoryDetails || isSaving) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    if (!price || isNaN(price) || parseFloat(price) <= 0) {
      setError("Please enter a valid price.");
      setIsSaving(false);
      return;
    }

    try {
      const invDoc = doc(db, "listings", invId);
      const updatedData = {
        price: parseFloat(price),
        timeline: [
          ...(inventoryDetails.timeline || []),
          {
            title: "Price Updated",
            date: new Date().toISOString(),
            description: `Price updated to ${price} USDC.`,
          },
        ],
      };

      await updateDoc(invDoc, updatedData);
      setInventoryDetails({
        ...inventoryDetails,
        ...updatedData,
      });
      setSuccess("Price updated successfully!");
    } catch (err) {
      console.error("Error updating price:", err);
      setError("Failed to save price: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle remove listing
  const handleRemove = async () => {
    if (!inventoryDetails || isRemoving) return;

    setIsRemoving(true);
    setError(null);
    setSuccess(null);

    try {
      const invDoc = doc(db, "listings", invId);
      const updatedData = {
        removed: true,
        timeline: [
          ...(inventoryDetails.timeline || []),
          {
            title: "Listing Removed",
            date: new Date().toISOString(),
            description: "Listing flagged as removed, no longer visible on marketplace.",
          },
        ],
      };

      await updateDoc(invDoc, updatedData);
      setInventoryDetails({
        ...inventoryDetails,
        ...updatedData,
      });
      setSuccess("Listing flagged as removed successfully!");
    } catch (err) {
      console.error("Error removing listing:", err);
      setError("Failed to remove listing: " + err.message);
    } finally {
      setIsRemoving(false);
    }
  };

  // Handle cancel (navigate back to inventory dashboard)
  const handleCancel = () => {
    router.push("/dashboards/seller/inventory");
  };

  // Handle create new listing (navigate to createinv)
  const handleCreateNew = () => {
    router.push("/dashboards/seller/createinv");
  };

  // Ensure user is loaded and authorized before rendering
  if (!user || !user.walletId || user.role !== "seller") {
    return null; // Or a loading spinner
  }

  // Handle invalid or missing invId
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

  // Handle no inventoryDetails (e.g., still loading)
  if (!inventoryDetails) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          <MDTypography variant="body2" color="text">
            Loading inventory details...
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
                  Inventory Details - {inventoryDetails.id || "N/A"}
                </MDTypography>
                {error && (
                  <MDTypography variant="body2" color="error" mb={2}>
                    {error}
                  </MDTypography>
                )}
                {success && (
                  <MDTypography variant="body2" color="success" mb={2}>
                    {success}
                  </MDTypography>
                )}
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Item Name
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {inventoryDetails.name || "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Description
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {inventoryDetails.description || "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Price (USDC)
                      </MDTypography>
                      <MDInput
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        fullWidth
                        disabled={inventoryDetails.id === dummyInventoryDetails.id}
                        sx={{
                          "& .MuiInputBase-input": {
                            padding: { xs: "10px", md: "12px" },
                            color: "#344767",
                          },
                        }}
                      />
                    </MDBox>
                    {inventoryDetails.type === "digital" && (
                      <MDBox mb={2}>
                        <MDTypography variant="h6" color="dark">
                          Quantity
                        </MDTypography>
                        <MDTypography variant="body2" color="text">
                          {inventoryDetails.quantity || "N/A"}
                        </MDTypography>
                      </MDBox>
                    )}
                    {inventoryDetails.type === "rwi" && (
                      <>
                        <MDBox mb={2}>
                          <MDTypography variant="h6" color="dark">
                            Shipping Location
                          </MDTypography>
                          <MDTypography variant="body2" color="text">
                            {inventoryDetails.shippingLocation || "N/A"}
                          </MDTypography>
                        </MDBox>
                        <MDBox mb={2}>
                          <MDTypography variant="h6" color="dark">
                            Variants
                          </MDTypography>
                          {inventoryDetails.variants?.length > 0 ? (
                            inventoryDetails.variants.map((variant, index) => (
                              <MDTypography key={index} variant="body2" color="text">
                                Size: {variant.size}, Color: {variant.color}, Quantity: {variant.quantity}
                              </MDTypography>
                            ))
                          ) : (
                            <MDTypography variant="body2" color="text">
                              No variants available.
                            </MDTypography>
                          )}
                        </MDBox>
                      </>
                    )}
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Categories
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {inventoryDetails.categories?.join(", ") || "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Images (Non-Editable)
                      </MDTypography>
                      <MDBox display="flex" flexWrap="wrap" gap={1}>
                        {inventoryDetails.images?.map((url, index) => (
                          <MDBox
                            key={index}
                            component="img"
                            src={url}
                            alt={`Image ${index}`}
                            sx={{
                              width: { xs: "80px", md: "100px" },
                              height: { xs: "80px", md: "100px" },
                              borderRadius: "8px",
                              objectFit: "cover",
                            }}
                          />
                        )) || (
                          <MDTypography variant="body2" color="text">
                            No images available.
                          </MDTypography>
                        )}
                      </MDBox>
                      <MDBox display="flex" gap={2} mt={2}>
                        <MDButton
                          onClick={handleSave}
                          color="primary"
                          variant="gradient"
                          disabled={isSaving || inventoryDetails.id === dummyInventoryDetails.id}
                          sx={{ padding: { xs: "8px 24px", md: "10px 32px" } }}
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </MDButton>
                        <MDButton
                          onClick={handleCancel}
                          color="dark"
                          variant="outlined"
                          sx={{ padding: { xs: "8px 24px", md: "10px 32px" } }}
                        >
                          Cancel
                        </MDButton>
                      </MDBox>
                    </MDBox>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <MDBox>
                      <MDTypography variant="h6" color="dark" mb={2}>
                        Inventory Timeline
                      </MDTypography>
                      {inventoryDetails.timeline && inventoryDetails.timeline.length > 0 ? (
                        inventoryDetails.timeline.map((event, index) => (
                          <TimelineItem
                            key={index}
                            color={index === inventoryDetails.timeline.length - 1 ? "success" : "info"}
                            icon={index === inventoryDetails.timeline.length - 1 ? "check" : "pending"}
                            title={event.title}
                            dateTime={event.date}
                            description={event.description}
                            lastItem={index === inventoryDetails.timeline.length - 1}
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
                <MDBox
                  display="flex"
                  justifyContent="center"
                  gap={2}
                  mt={3}
                  sx={{
                    flexDirection: { xs: "column", md: "row" },
                    alignItems: { xs: "center", md: "center" },
                  }}
                >
                  <MDButton
                    onClick={handleRemove}
                    color="error"
                    variant="gradient"
                    disabled={isRemoving || inventoryDetails.id === dummyInventoryDetails.id || inventoryDetails.removed}
                    sx={{ padding: { xs: "8px 24px", md: "10px 32px" } }}
                  >
                    {isRemoving ? "Removing..." : "Remove Listing"}
                  </MDButton>
                  <MDButton
                    onClick={handleCreateNew}
                    color="info"
                    variant="gradient"
                    sx={{ padding: { xs: "8px 24px", md: "10px 32px" } }}
                  >
                    Create New Listing
                  </MDButton>
                </MDBox>
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