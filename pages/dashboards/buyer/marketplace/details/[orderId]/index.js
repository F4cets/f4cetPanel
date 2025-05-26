/**
=========================================================
* F4cetPanel - Marketplace Order Details Page
=========================================================

* Copyright 2023 F4cets Team
*/

// React imports
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

// Firebase imports
import { doc, getDoc, updateDoc, addDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "/lib/firebase";

// User context
import { useUser } from "/contexts/UserContext";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Rating from "@mui/material/Rating";
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

function MarketplaceOrderDetails() {
  const { user } = useUser();
  const router = useRouter();
  const { orderId } = router.query;
  const [orderDetails, setOrderDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [rating, setRating] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isConfirmingDelivery, setIsConfirmingDelivery] = useState(false);
  const [isConfirmingReceipt, setIsConfirmingReceipt] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);
  const [isUnflagging, setIsUnflagging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [hasFlaggedIssue, setHasFlaggedIssue] = useState(false);

  // Fetch order details, messages, and check for flagged issues from Firestore
  useEffect(() => {
    if (!user || !user.walletId || !orderId) return;

    const fetchOrder = async () => {
      try {
        const orderDocRef = doc(db, "transactions", orderId);
        const unsubscribe = onSnapshot(orderDocRef, async (orderSnapshot) => {
          if (orderSnapshot.exists() && orderSnapshot.data().buyerId === user.walletId) {
            const orderData = orderSnapshot.data();

            // Fetch product names
            let productNames = [];
            if (Array.isArray(orderData.productIds)) {
              for (const productId of orderData.productIds) {
                const productDocRef = doc(db, "products", productId);
                const productDoc = await getDoc(productDocRef);
                if (productDoc.exists()) {
                  const productData = productDoc.data();
                  productNames.push(productData.name || productId);
                } else {
                  productNames.push(productId);
                }
              }
            }

            // Fetch seller name (if available)
            let sellerName = orderData.sellerId;
            const sellerDocRef = doc(db, "users", orderData.sellerId);
            const sellerDoc = await getDoc(sellerDocRef);
            if (sellerDoc.exists()) {
              const sellerData = sellerDoc.data();
              sellerName = sellerData.name || sellerName;
            }

            // Build timeline dynamically
            const timeline = [];
            if (orderData.createdAt) {
              const createdDate = orderData.createdAt.toDate ? orderData.createdAt.toDate() : new Date(orderData.createdAt);
              timeline.push({
                title: "Order Placed",
                date: `${createdDate.toISOString().split('T')[0]} ${createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                description: "Order placed successfully.",
              });
            }
            if (orderData.shippingConfirmedAt) {
              const shippedDate = orderData.shippingConfirmedAt.toDate ? orderData.shippingConfirmedAt.toDate() : new Date(orderData.shippingConfirmedAt);
              timeline.push({
                title: "Order Shipped",
                date: `${shippedDate.toISOString().split('T')[0]} ${shippedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                description: `Order shipped with tracking number ${orderData.trackingNumber || 'Not Available'}.`,
              });
            }
            if (orderData.deliveryConfirmedAt) {
              const deliveredDate = orderData.deliveryConfirmedAt.toDate ? orderData.deliveryConfirmedAt.toDate() : new Date(orderData.deliveryConfirmedAt);
              timeline.push({
                title: "Order Delivered",
                date: `${deliveredDate.toISOString().split('T')[0]} ${deliveredDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                description: "Buyer confirmed delivery of the item.",
              });
            }

            const createdDateForDisplay = orderData.createdAt.toDate ? orderData.createdAt.toDate() : new Date(orderData.createdAt);
            const data = {
              id: orderSnapshot.id,
              buyerId: orderData.buyerId,
              sellerId: orderData.sellerId,
              seller: sellerName,
              product: productNames.join(", ") || "Unknown Product",
              type: orderData.type || "rwi",
              amount: orderData.amount || 0,
              currency: orderData.currency || "USDC",
              status: orderData.shippingStatus || "Unknown",
              date: createdDateForDisplay.toISOString().split('T')[0],
              shippingAddress: orderData.shippingAddress || "N/A",
              trackingNumber: orderData.trackingNumber || "Not Available",
              buyerConfirmed: orderData.buyerConfirmed || false,
              sellerRating: orderData.sellerRating || null,
              deliveryConfirmedAt: orderData.deliveryConfirmedAt || null,
              timeline: timeline.length > 0 ? timeline : [],
            };
            setOrderDetails(data);
            setRating(data.sellerRating || null);
          } else {
            setError("Order not found or unauthorized.");
            setOrderDetails(null);
          }
        }, (err) => {
          console.error("OrderDetails: Error in order listener:", err);
          setError("Failed to load order details: " + err.message);
          setOrderDetails(null);
        });

        return () => {
          console.log("OrderDetails: Cleaning up order listener for order:", orderId);
          unsubscribe();
        };
      } catch (err) {
        console.error("OrderDetails: Error setting up order listener:", err);
        setError("Failed to load order details: " + err.message);
        setOrderDetails(null);
      }
    };

    const fetchMessages = () => {
      if (!user || !user.walletId || !orderId) return;

      try {
        console.log("OrderDetails: Setting up real-time listener for messages:", orderId);
        const q = query(
          collection(db, "messages"),
          where("orderId", "==", orderId)
        );
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          // Sort messages by timestamp in descending order (newest first)
          data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setMessages(data);
        }, (err) => {
          console.error("OrderDetails: Error in messages listener:", err);
          setError("Failed to load messages: " + err.message);
          setMessages([]);
        });
        return unsubscribe;
      } catch (err) {
        console.error("OrderDetails: Error setting up messages listener:", err);
        setError("Failed to load messages: " + err.message);
        setMessages([]);
      }
    };

    const checkFlaggedIssue = async () => {
      if (!user || !user.walletId || !orderId) return;

      try {
        const q = query(
          collection(db, "notifications"),
          where("orderId", "==", orderId),
          where("type", "==", "issue"),
          where("read", "==", false)
        );
        const querySnapshot = await getDocs(q);
        setHasFlaggedIssue(!querySnapshot.empty);
      } catch (err) {
        console.error("OrderDetails: Error checking flagged issue:", err);
        setError("Failed to check flagged issue: " + err.message);
      }
    };

    fetchOrder();
    checkFlaggedIssue();
    const unsubscribeMessages = fetchMessages();
    return () => {
      if (unsubscribeMessages) {
        console.log("OrderDetails: Cleaning up messages listener for order:", orderId);
        unsubscribeMessages();
      }
    };
  }, [user, orderId]);

  // Redirect to home if no user, no walletId, or unauthorized role
  useEffect(() => {
    if (!user || !user.walletId || (user.role !== "buyer" && user.role !== "seller")) {
      console.log("OrderDetails: Unauthorized access, redirecting to home");
      router.replace("/");
    }
  }, [user, router]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!orderDetails || !newMessage.trim() || isSending) return;

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const messageData = {
        orderId,
        senderId: user.walletId,
        receiverId: orderDetails.sellerId,
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, "messages"), messageData);
      setNewMessage("");
      setSuccess("Message sent successfully!");
    } catch (err) {
      console.error("OrderDetails: Error sending message:", err);
      setError("Failed to send message: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  // Handle confirming delivery (RWI only)
  const handleConfirmDelivery = async () => {
    if (!orderDetails || isConfirmingDelivery || orderDetails.deliveryConfirmedAt) return;

    setIsConfirmingDelivery(true);
    setError(null);
    setSuccess(null);

    try {
      const orderDocRef = doc(db, "transactions", orderId);
      const updatedData = {
        shippingStatus: "Delivered",
        deliveryConfirmedAt: new Date().toISOString(),
        timeline: [
          ...(orderDetails.timeline || []),
          {
            title: "Order Delivered",
            date: new Date().toISOString().split("T")[0] + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            description: "Buyer confirmed delivery of the item.",
          },
        ],
      };
      await updateDoc(orderDocRef, updatedData);
      setOrderDetails({
        ...orderDetails,
        ...updatedData,
      });
      setSuccess("Delivery confirmed! You can now confirm receipt or flag an issue.");
    } catch (err) {
      console.error("OrderDetails: Error confirming delivery:", err);
      setError("Failed to confirm delivery: " + err.message);
    } finally {
      setIsConfirmingDelivery(false);
    }
  };

  // CHANGED: Handle confirming receipt (RWI only) with releaseFunds call
  const handleConfirmReceipt = async () => {
    if (!orderDetails || isConfirmingReceipt || orderDetails.buyerConfirmed) return;

    setIsConfirmingReceipt(true);
    setError(null);
    setSuccess(null);

    try {
      const orderDocRef = doc(db, "transactions", orderId);
      const updatedData = {
        buyerConfirmed: true,
        shippingStatus: "Confirmed",
        timeline: [
          ...(orderDetails.timeline || []),
          {
            title: "Receipt Confirmed",
            date: new Date().toISOString().split("T")[0] + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            description: "Buyer confirmed receipt of the item.",
          },
        ],
      };
      await updateDoc(orderDocRef, updatedData);

      // Call releaseFunds Cloud Function
      const response = await fetch('https://releasefunds-232592911911.us-central1.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, buyerId: user.walletId })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to release funds');
      }
      console.log(`Funds released for order ${orderId}, signature: ${result.signature}`);

      setOrderDetails({
        ...orderDetails,
        ...updatedData,
      });
      setSuccess("Receipt confirmed! Funds have been released from escrow.");
    } catch (err) {
      console.error("OrderDetails: Error confirming receipt:", err);
      setError(`Failed to confirm receipt: ${err.message}`);
    } finally {
      setIsConfirmingReceipt(false);
    }
  };

  // CHANGED: Handle confirming receipt for digital items with releaseFunds call
  const handleConfirmDigitalReceipt = async () => {
    if (!orderDetails || isConfirmingReceipt || orderDetails.buyerConfirmed) return;

    setIsConfirmingReceipt(true);
    setError(null);
    setSuccess(null);

    try {
      const orderDocRef = doc(db, "transactions", orderId);
      const updatedData = {
        buyerConfirmed: true,
        shippingStatus: "Confirmed",
        timeline: [
          ...(orderDetails.timeline || []),
          {
            title: "Receipt Confirmed",
            date: new Date().toISOString().split("T")[0] + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            description: "Buyer confirmed receipt of the digital item.",
          },
        ],
      };
      await updateDoc(orderDocRef, updatedData);

      // Call releaseFunds Cloud Function
      const response = await fetch('https://releasefunds-232592911911.us-central1.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, buyerId: user.walletId })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to release funds');
      }
      console.log(`Funds released for order ${orderId}, signature: ${result.signature}`);

      setOrderDetails({
        ...orderDetails,
        ...updatedData,
      });
      setSuccess("Receipt confirmed! Funds have been released from escrow.");
    } catch (err) {
      console.error("OrderDetails: Error confirming digital receipt:", err);
      setError(`Failed to confirm receipt: ${err.message}`);
    } finally {
      setIsConfirmingReceipt(false);
    }
  };

  // Handle flagging an issue
  const handleFlagIssue = async () => {
    if (!orderDetails || !issueDescription.trim() || isFlagging) return;

    setIsFlagging(true);
    setError(null);
    setSuccess(null);

    try {
      const notificationData = {
        orderId,
        userId: orderDetails.sellerId,
        type: "issue",
        description: issueDescription.trim(),
        timestamp: new Date().toISOString(),
        read: false,
      };
      await addDoc(collection(db, "notifications"), notificationData);
      setIssueDescription("");
      setHasFlaggedIssue(true);
      setSuccess("Issue flagged successfully! Seller has been notified.");
    } catch (err) {
      console.error("OrderDetails: Error flagging issue:", err);
      setError("Failed to flag issue: " + err.message);
    } finally {
      setIsFlagging(false);
    }
  };

  // Handle unflagging an issue
  const handleUnflagIssue = async () => {
    if (!orderDetails || isUnflagging || !hasFlaggedIssue) return;

    setIsUnflagging(true);
    setError(null);
    setSuccess(null);

    try {
      const q = query(
        collection(db, "notifications"),
        where("orderId", "==", orderId),
        where("type", "==", "issue"),
        where("read", "==", false)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const notificationDoc = querySnapshot.docs[0];
        const notificationRef = doc(db, "notifications", notificationDoc.id);
        await updateDoc(notificationRef, {
          read: true,
          resolvedAt: new Date().toISOString(),
        });
        setHasFlaggedIssue(false);
        setSuccess("Issue unflagged successfully!");
      } else {
        setError("No active flagged issue found to unflag.");
      }
    } catch (err) {
      console.error("OrderDetails: Error unflagging issue:", err);
      setError("Failed to unflag issue: " + err.message);
    } finally {
      setIsUnflagging(false);
    }
  };

  // Handle rating the seller
  const handleRateSeller = async (newRating) => {
    if (!orderDetails || isSaving) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const orderDocRef = doc(db, "transactions", orderId);
      const updatedData = {
        sellerRating: newRating,
        timeline: [
          ...(orderDetails.timeline || []),
          {
            title: "Seller Rated",
            date: new Date().toISOString().split("T")[0] + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            description: `Buyer rated seller ${newRating} stars.`,
          },
        ],
      };
      await updateDoc(orderDocRef, updatedData);
      setOrderDetails({
        ...orderDetails,
        ...updatedData,
      });
      setRating(newRating);
      setSuccess("Seller rating submitted successfully!");
    } catch (err) {
      console.error("OrderDetails: Error rating seller:", err);
      setError("Failed to submit rating: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Ensure user is loaded and authorized before rendering
  if (!user || !user.walletId || (user.role !== "buyer" && user.role !== "seller")) {
    return null; // Or a loading spinner
  }

  // Handle invalid or missing orderId
  if (!orderId) {
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

  // Handle no orderDetails (e.g., still loading or error)
  if (!orderDetails) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          <MDTypography variant="h4" color="error">
            {error || "Loading order details..."}
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
                  Marketplace Order Details - {orderDetails.id}
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
                        Product
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {orderDetails.product || "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Seller
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {orderDetails.seller || orderDetails.sellerId || "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Shipping Address
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {orderDetails.shippingAddress || "N/A"}
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
                        href={`https://www.ship24.com/tracking/${orderDetails.trackingNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          textDecoration: "underline",
                          "&:hover": { color: "info.main" },
                        }}
                      >
                        {orderDetails.trackingNumber || "Not Available"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Amount
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {orderDetails.amount} {orderDetails.currency || "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Status
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {orderDetails.status || "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Date
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {orderDetails.date || "N/A"}
                      </MDTypography>
                    </MDBox>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <MDBox>
                      <MDTypography variant="h6" color="dark" mb={2}>
                        Order Timeline
                      </MDTypography>
                      {orderDetails.timeline?.length > 0 ? (
                        orderDetails.timeline.map((event, index) => (
                          <TimelineItem
                            key={index}
                            color={index === orderDetails.timeline.length - 1 ? "success" : "info"}
                            icon={index === orderDetails.timeline.length - 1 ? "check" : "pending"}
                            title={event.title}
                            dateTime={event.date}
                            description={event.description}
                            lastItem={index === orderDetails.timeline.length - 1}
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
                <MDBox mt={3}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <MDTypography variant="h6" color="dark" mb={2}>
                        Buyer Actions
                      </MDTypography>
                      {/* Confirm Delivery (RWI Only) */}
                      {orderDetails.type === "rwi" && orderDetails.status === "Shipped" && !orderDetails.deliveryConfirmedAt && (
                        <MDBox mb={2}>
                          <MDTypography variant="body1" color="dark" mb={1}>
                            Confirm Delivery
                          </MDTypography>
                          <MDButton
                            onClick={handleConfirmDelivery}
                            color="success"
                            variant="gradient"
                            disabled={isConfirmingDelivery}
                            sx={{ width: { xs: "100%", sm: "auto" } }}
                          >
                            {isConfirmingDelivery ? "Confirming..." : "Confirm Delivery"}
                          </MDButton>
                        </MDBox>
                      )}
                      {/* Confirm Receipt (RWI Only) */}
                      {orderDetails.type === "rwi" && orderDetails.status === "Delivered" && !orderDetails.buyerConfirmed && (
                        <MDBox mb={2}>
                          <MDTypography variant="body1" color="dark" mb={1}>
                            Confirm Receipt
                          </MDTypography>
                          <MDButton
                            onClick={handleConfirmReceipt}
                            color="success"
                            variant="gradient"
                            disabled={isConfirmingReceipt}
                            sx={{ width: { xs: "100%", sm: "auto" } }}
                          >
                            {isConfirmingReceipt ? "Confirming..." : "Confirm Receipt"}
                          </MDButton>
                        </MDBox>
                      )}
                      {/* Confirm Receipt (Digital Only) */}
                      {orderDetails.type === "digital" && !orderDetails.buyerConfirmed && (
                        <MDBox mb={2}>
                          <MDTypography variant="body1" color="dark" mb={1}>
                            Confirm Receipt
                          </MDTypography>
                          <MDButton
                            onClick={handleConfirmDigitalReceipt}
                            color="success"
                            variant="gradient"
                            disabled={isConfirmingReceipt}
                            sx={{ width: { xs: "100%", sm: "auto" } }}
                          >
                            {isConfirmingReceipt ? "Confirming..." : "Confirm Receipt"}
                          </MDButton>
                        </MDBox>
                      )}
                      {/* Rate Seller */}
                      <MDBox mb={2}>
                        <MDTypography variant="body1" color="dark" mb={1}>
                          Rate Seller
                        </MDTypography>
                        <Rating
                          value={rating}
                          onChange={(event, newValue) => handleRateSeller(newValue)}
                          disabled={isSaving || rating !== null}
                          sx={{
                            fontSize: "2rem",
                            "& .MuiRating-iconEmpty": { color: "#FFFFFF" },
                            "& .MuiRating-iconFilled": { color: "#FFD700" },
                          }}
                        />
                      </MDBox>
                      {/* Messaging */}
                      <MDBox mb={2}>
                        <MDTypography variant="body1" color="dark" mb={1}>
                          Message Seller
                        </MDTypography>
                        <MDInput
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          fullWidth
                          multiline
                          rows={3}
                          disabled={isSending}
                          sx={{
                            "& .MuiInputBase-input": { padding: { xs: "10px", md: "12px" }, color: "#FFFFFF" },
                          }}
                        />
                        <MDButton
                          onClick={handleSendMessage}
                          color="primary"
                          variant="gradient"
                          disabled={isSending || !newMessage.trim()}
                          sx={{ mt: 1, width: { xs: "100%", sm: "auto" } }}
                        >
                          {isSending ? "Sending..." : "Send Message"}
                        </MDButton>
                        <MDBox mt={2} maxHeight="200px" overflow="auto">
                          {messages.length > 0 ? (
                            messages.map((msg, index) => (
                              <MDBox key={index} mb={1} p={1} sx={{ borderBottom: "1px solid #e0e0e0" }}>
                                <MDTypography variant="body2" color={msg.senderId === user.walletId ? "primary" : "text"}>
                                  <strong>{msg.senderId === user.walletId ? "You" : "Seller"}:</strong> {msg.message}
                                </MDTypography>
                                <MDTypography variant="caption" color="text">
                                  {new Date(msg.timestamp).toLocaleString()}
                                </MDTypography>
                              </MDBox>
                            ))
                          ) : (
                            <MDTypography variant="body2" color="text">
                              No messages yet.
                            </MDTypography>
                          )}
                        </MDBox>
                      </MDBox>
                      {/* Flag Issue */}
                      <MDBox mb={2}>
                        <MDTypography variant="body1" color="dark" mb={1}>
                          Flag Issue
                        </MDTypography>
                        <MDInput
                          value={issueDescription}
                          onChange={(e) => setIssueDescription(e.target.value)}
                          placeholder="Describe the issue..."
                          fullWidth
                          multiline
                          rows={2}
                          disabled={isFlagging || hasFlaggedIssue}
                          sx={{
                            "& .MuiInputBase-input": { padding: { xs: "10px", md: "12px" }, color: "#FFFFFF" },
                          }}
                        />
                        <MDButton
                          onClick={handleFlagIssue}
                          color="error"
                          variant="gradient"
                          disabled={isFlagging || !issueDescription.trim() || hasFlaggedIssue}
                          sx={{ mt: 1, width: { xs: "100%", sm: "auto" }, mr: 1 }}
                        >
                          {isFlagging ? "Flagging..." : "Flag Issue"}
                        </MDButton>
                        {/* Unflag Issue */}
                        {hasFlaggedIssue && (
                          <MDButton
                            onClick={handleUnflagIssue}
                            color="success"
                            variant="gradient"
                            disabled={isUnflagging}
                            sx={{ mt: 1, width: { xs: "100%", sm: "auto" } }}
                          >
                            {isUnflagging ? "Unflagging..." : "Unflag Issue"}
                          </MDButton>
                        )}
                      </MDBox>
                    </Grid>
                  </Grid>
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

export default MarketplaceOrderDetails;