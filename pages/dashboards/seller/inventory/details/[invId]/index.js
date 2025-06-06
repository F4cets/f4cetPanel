/**
=========================================================
* F4cetPanel - Seller Inventory Details Page
=========================================================

* Copyright 2025 F4cets Team
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

  // Fetch inventory details
  useEffect(() => {
    const fetchInventory = async () => {
      if (!user || !user.walletId || !invId) return;

      try {
        console.log("InventoryDetails: Fetching product:", invId, "for seller:", user.walletId);
        const invDoc = doc(db, "products", invId);
        const invSnapshot = await getDoc(invDoc);
        if (invSnapshot.exists() && invSnapshot.data().sellerId === user.walletId) {
          const data = {
            id: invSnapshot.id,
            ...invSnapshot.data(),
            createdAt: invSnapshot.data().createdAt?.toDate().toISOString().split("T")[0] || "N/A",
            timeline: invSnapshot.data().timeline || [],
          };
          console.log("InventoryDetails: Fetched product:", data);
          setInventoryDetails(data);
          setPrice(data.price || "");
        } else {
          console.log("InventoryDetails: Product not found or unauthorized");
          setError("Inventory item not found or unauthorized.");
        }
      } catch (err) {
        console.error("InventoryDetails: Error fetching product:", err);
        setError("Failed to load inventory details: " + err.message);
      }
    };

    fetchInventory();
  }, [user, invId]);

  // Redirect to home if no user, no walletId, or unauthorized role
  useEffect(() => {
    if (!user || !user.walletId || user.role !== "seller") {
      console.log("InventoryDetails: Unauthorized access, redirecting to home");
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
      console.log("InventoryDetails: Updating price for product:", invId);
      const invDoc = doc(db, "products", invId);
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
      console.log("InventoryDetails: Price updated successfully");
      setSuccess("Price updated successfully!");
    } catch (err) {
      console.error("InventoryDetails: Error updating price:", err);
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
      console.log("InventoryDetails: Flagging product as inactive:", invId);
      const invDoc = doc(db, "products", invId);
      const updatedData = {
        isActive: false,
        timeline: [
          ...(inventoryDetails.timeline || []),
          {
            title: "Listing Removed",
            date: new Date().toISOString(),
            description: "Listing flagged as inactive, no longer visible on marketplace.",
          },
        ],
      };

      await updateDoc(invDoc, updatedData);
      setInventoryDetails({
        ...inventoryDetails,
        ...updatedData,
      });
      console.log("InventoryDetails: Product flagged as inactive successfully");
      setSuccess("Listing flagged as inactive successfully!");
    } catch (err) {
      console.error("InventoryDetails: Error flagging product as inactive:", err);
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
  if (!invId) {
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

  // Handle no inventoryDetails or error
  if (!inventoryDetails) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          {error ? (
            <MDTypography variant="body2" color="error">
              {error}
            </MDTypography>
          ) : (
            <MDTypography variant="body2" color="text">
              Loading inventory details...
            </MDTypography>
          )}
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
                      {/* CHANGED: Prevent negative values, enforce min 0.01 */}
                      <MDInput
                        type="number"
                        value={price}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || parseFloat(value) >= 0.01) {
                            setPrice(value);
                          } else {
                            setPrice("0.01");
                          }
                        }}
                        min="0.01"
                        fullWidth
                        sx={{
                          "& .MuiInputBase-input": {
                            padding: { xs: "10px", md: "12px" },
                            color: "white",
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
                        {inventoryDetails.imageUrls?.map((url, index) => (
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
                          disabled={isSaving}
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
                    disabled={isRemoving || !inventoryDetails.isActive}
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