/**
=========================================================
* F4cetPanel - God Transaction Details Page
=========================================================

* Copyright 2025 F4cets Team
*/

// React imports
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

// Firebase imports
import { doc, getDoc } from "firebase/firestore";
import { db } from "/lib/firebase";

// User context
import { useUser } from "/contexts/UserContext";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
import MDButton from "/components/MDButton";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";
import TimelineItem from "/examples/Timeline/TimelineItem";

function TransactionDetails() {
  const { user } = useUser();
  const router = useRouter();
  const { txId } = router.query;
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [isRefunding, setIsRefunding] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch transaction details from Firestore
  useEffect(() => {
    const fetchTransaction = async () => {
      if (!user || !user.walletId || !txId) return;

      try {
        console.log("TransactionDetails: Fetching transaction:", txId);
        const txDoc = doc(db, "transactions", txId);
        const txSnapshot = await getDoc(txDoc);
        if (txSnapshot.exists()) {
          const txData = txSnapshot.data();
          // Fetch product name from products collection
          let itemName = "Unknown Product";
          if (txData.productIds?.[0]?.productId) {
            try {
              const productDoc = await getDoc(doc(db, "products", txData.productIds[0].productId));
              if (productDoc.exists()) {
                itemName = productDoc.data().name || itemName;
              } else {
                console.warn(`TransactionDetails: Product ${txData.productIds[0].productId} not found`);
              }
            } catch (productErr) {
              console.warn(`TransactionDetails: Error fetching product ${txData.productIds[0].productId}:`, productErr);
            }
          }
          const data = {
            id: txSnapshot.id,
            ...txData,
            itemName,
            createdAt: txData.createdAt ? new Date(txData.createdAt).toISOString().split("T")[0] : "N/A",
            timeline: txData.timeline || [],
            status: txData.status?.toLowerCase() || "pending", // Use status field directly
          };
          console.log("TransactionDetails: Fetched transaction:", {
            id: data.id,
            status: data.status,
            type: data.type,
            isRefundable: data.status === "pending" && (data.type === "rwi" || data.type === "digital")
          });
          setTransactionDetails(data);
        } else {
          console.log("TransactionDetails: Transaction not found");
          setError("Transaction not found.");
        }
      } catch (err) {
        console.error("TransactionDetails: Error fetching transaction:", err);
        setError("Failed to load transaction details: " + err.message);
      }
    };

    fetchTransaction();
  }, [user, txId]);

  // Redirect to home if no user, no walletId, or unauthorized role
  useEffect(() => {
    if (!user || !user.walletId || user.role !== "god") {
      console.log("TransactionDetails: Unauthorized access, redirecting to home");
      router.replace("/");
    }
  }, [user, router]);

  // Handle refund (placeholder for Cloud Function)
  const handleRefund = async () => {
    if (!transactionDetails || isRefunding) return;

    setIsRefunding(true);
    setError(null);
    setSuccess(null);

    try {
      console.log("TransactionDetails: Initiating refund for transaction:", txId);
      // TODO: Integrate Google Cloud Function for refund
      // e.g., await fetch('https://refund-transaction-xxx.run.app', { method: 'POST', body: JSON.stringify({ txId, buyerId: transactionDetails.buyerId, amount: transactionDetails.amount }) });

      // Simulate refund (update Firestore as placeholder)
      const txDoc = doc(db, "transactions", txId);
      const updatedData = {
        status: "refunded",
        timeline: [
          ...(transactionDetails.timeline || []),
          {
            title: "Refunded",
            date: new Date().toISOString(),
            description: `Transaction refunded to buyer ${transactionDetails.buyerId.slice(0, 6)}...${transactionDetails.buyerId.slice(-4)}.`,
          },
        ],
      };

      await updateDoc(txDoc, updatedData);
      setTransactionDetails({
        ...transactionDetails,
        ...updatedData,
      });
      console.log("TransactionDetails: Refund processed successfully");
      setSuccess("Refund processed successfully!");
    } catch (err) {
      console.error("TransactionDetails: Error processing refund:", err);
      setError("Failed to process refund: " + err.message);
    } finally {
      setIsRefunding(false);
    }
  };

  // Handle cancel (navigate back to transactions dashboard)
  const handleCancel = () => {
    router.push("/dashboards/god/transactions");
  };

  // Ensure user is loaded and authorized before rendering
  if (!user || !user.walletId || user.role !== "god") {
    return null; // Or a loading spinner
  }

  // Handle invalid or missing txId
  if (!txId) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          <MDTypography variant="h4" color="error">
            Invalid Transaction ID
          </MDTypography>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  // Handle no transactionDetails or error
  if (!transactionDetails) {
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
              Loading transaction details...
            </MDTypography>
          )}
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  const isRefundable = transactionDetails.status === "pending" && (transactionDetails.type === "rwi" || transactionDetails.type === "digital");

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h4" color="dark" mb={2}>
                  Transaction Details - {transactionDetails.id || "N/A"}
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
                        Transaction ID
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {transactionDetails.id || "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Item Name
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {transactionDetails.itemName || "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Amount
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {transactionDetails.amount ? `${transactionDetails.amount} ${transactionDetails.currency || "USDC"}` : "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Buyer Wallet
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {transactionDetails.buyerId ? `${transactionDetails.buyerId.slice(0, 6)}...${transactionDetails.buyerId.slice(-4)}` : "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Seller ID
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {transactionDetails.sellerId ? `${transactionDetails.sellerId.slice(0, 6)}...${transactionDetails.sellerId.slice(-4)}` : "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Status
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {transactionDetails.status ? transactionDetails.status.charAt(0).toUpperCase() + transactionDetails.status.slice(1) : "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Type
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {transactionDetails.type === "rwi" ? "RWI" : transactionDetails.type === "digital" ? "Digital" : "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Shipping Address
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {transactionDetails.shippingAddress || "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Tracking Number
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {transactionDetails.trackingNumber || "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Created At
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {transactionDetails.createdAt || "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox display="flex" gap={2} mt={2}>
                      <MDButton
                        onClick={handleCancel}
                        color="dark"
                        variant="outlined"
                        sx={{ padding: { xs: "8px 24px", md: "10px 32px" } }}
                      >
                        Back to Transactions
                      </MDButton>
                    </MDBox>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <MDBox>
                      <MDTypography variant="h6" color="dark" mb={2}>
                        Transaction Timeline
                      </MDTypography>
                      {transactionDetails.timeline && transactionDetails.timeline.length > 0 ? (
                        transactionDetails.timeline.map((event, index) => (
                          <TimelineItem
                            key={index}
                            color={index === transactionDetails.timeline.length - 1 ? "success" : "info"}
                            icon={index === transactionDetails.timeline.length - 1 ? "check" : "pending"}
                            title={event.title}
                            dateTime={event.date}
                            description={event.description}
                            lastItem={index === transactionDetails.timeline.length - 1}
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
                {isRefundable && (
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
                      onClick={handleRefund}
                      color="warning"
                      variant="gradient"
                      disabled={isRefunding}
                      sx={{ padding: { xs: "8px 24px", md: "10px 32px" } }}
                    >
                      {isRefunding ? "Refunding..." : "Issue Refund"}
                    </MDButton>
                  </MDBox>
                )}
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default TransactionDetails;