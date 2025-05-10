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
import { doc, getDoc, updateDoc, addDoc, collection, query, where, getDocs } from "firebase/firestore";
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

// Dummy Data (for initial testing, used as fallback if Firestore fails)
const dummyMarketplaceDetails = {
  id: "MKT001",
  buyerId: "testBuyerWallet123",
  sellerId: "testSellerWallet456",
  product: "Dog Bed",
  type: "rwi",
  amount: 150,
  currency: "SOL",
  status: "Delivered",
  date: "2025-03-20",
  shippingAddress: "1234 Main St., Portland OR 97103, United States",
  trackingNumber: "TRK123456789",
  buyerConfirmed: false,
  sellerRating: null,
  timeline: [
    { title: "Order Placed", date: "2025-03-20 10:00 AM", description: "Order placed successfully." },
    { title: "Order Shipped", date: "2025-03-21 08:00 AM", description: "Order shipped with tracking number TRK123456789." },
    { title: "Order Delivered", date: "2025-03-23 03:00 PM", description: "Order delivered to customer." },
  ],
};

const dummyMessages = [
  {
    orderId: "MKT001",
    senderId: "testBuyerWallet123",
    receiverId: "testSellerWallet456",
    message: "did you receive the item?",
    timestamp: "2025-03-20T10:05:00Z",
  },
];

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
  const [isConfirming, setIsConfirming] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch order details and messages from Firestore
  useEffect(() => {
    const fetchOrder = async () => {
      if (!user || !user.walletId || !orderId) return;

      try {
        const orderDoc = doc(db, "orders", orderId);
        const orderSnapshot = await getDoc(orderDoc);
        if (orderSnapshot.exists() && orderSnapshot.data().buyerId === user.walletId) {
          const data = {
            id: orderSnapshot.id,
            ...orderSnapshot.data(),
            date: orderSnapshot.data().date?.split("T")[0] || "N/A",
          };
          setOrderDetails(data);
          setRating(data.sellerRating || null);
        } else {
          setError("Order not found or unauthorized. Using sample data.");
          setOrderDetails(dummyMarketplaceDetails);
          setRating(dummyMarketplaceDetails.sellerRating);
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details due to permissions or missing data. Using sample data.");
        setOrderDetails(dummyMarketplaceDetails);
        setRating(dummyMarketplaceDetails.sellerRating);
      }
    };

    const fetchMessages = async () => {
      if (!user || !user.walletId || !orderId) return;

      try {
        const q = query(
          collection(db, "messages"),
          where("orderId", "==", orderId)
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(data.length > 0 ? data : dummyMessages);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError("Failed to load messages due to permissions or missing data. Using sample messages.");
        setMessages(dummyMessages);
      }
    };

    fetchOrder();
    fetchMessages();
  }, [user, orderId]);

  // Redirect to home if no user, no walletId, or unauthorized role
  useEffect(() => {
    if (!user || !user.walletId || (user.role !== "buyer" && user.role !== "seller")) {
      router.replace("/");
    }
  }, [user, router]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!orderDetails || !newMessage.trim() || isSending || orderDetails.id === dummyMarketplaceDetails.id) return;

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
      await addDoc(collection(db, "messages"), messageData);
      setMessages([...messages, messageData]);
      setNewMessage("");
      setSuccess("Message sent successfully!");
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  // Handle confirming receipt (RWI only)
  const handleConfirmReceipt = async () => {
    if (!orderDetails || isConfirming || orderDetails.buyerConfirmed || orderDetails.id === dummyMarketplaceDetails.id) return;

    setIsConfirming(true);
    setError(null);
    setSuccess(null);

    try {
      const orderDoc = doc(db, "orders", orderId);
      const updatedData = {
        buyerConfirmed: true,
        status: "Confirmed",
        timeline: [
          ...(orderDetails.timeline || []),
          {
            title: "Receipt Confirmed",
            date: new Date().toISOString().split("T")[0] + " " + new Date().toLocaleTimeString(),
            description: "Buyer confirmed receipt of the item.",
          },
        ],
      };
      await updateDoc(orderDoc, updatedData);
      setOrderDetails({
        ...orderDetails,
        ...updatedData,
      });
      setSuccess("Receipt confirmed! Funds will be released from escrow.");
    } catch (err) {
      console.error("Error confirming receipt:", err);
      setError("Failed to confirm receipt: " + err.message);
    } finally {
      setIsConfirming(false);
    }
  };

  // Handle flagging an issue
  const handleFlagIssue = async () => {
    if (!orderDetails || !issueDescription.trim() || isFlagging || orderDetails.id === dummyMarketplaceDetails.id) return;

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
      setSuccess("Issue flagged successfully! Seller has been notified.");
    } catch (err) {
      console.error("Error flagging issue:", err);
      setError("Failed to flag issue: " + err.message);
    } finally {
      setIsFlagging(false);
    }
  };

  // Handle rating the seller
  const handleRateSeller = async (newRating) => {
    if (!orderDetails || isSaving || orderDetails.id === dummyMarketplaceDetails.id) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const orderDoc = doc(db, "orders", orderId);
      const updatedData = {
        sellerRating: newRating,
        timeline: [
          ...(orderDetails.timeline || []),
          {
            title: "Seller Rated",
            date: new Date().toISOString().split("T")[0] + " " + new Date().toLocaleTimeString(),
            description: `Buyer rated seller ${newRating} stars.`,
          },
        ],
      };
      await updateDoc(orderDoc, updatedData);
      setOrderDetails({
        ...orderDetails,
        ...updatedData,
      });
      setRating(newRating);
      setSuccess("Seller rating submitted successfully!");
    } catch (err) {
      console.error("Error rating seller:", err);
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

  // Handle no orderDetails (e.g., still loading)
  if (!orderDetails) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          <MDTypography variant="body2" color="text">
            Loading order details...
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
                            disabled={isConfirming || orderDetails.id === dummyMarketplaceDetails.id}
                            sx={{ width: { xs: "100%", sm: "auto" } }}
                          >
                            {isConfirming ? "Confirming..." : "Confirm Receipt"}
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
                          disabled={isSaving || orderDetails.id === dummyMarketplaceDetails.id || rating !== null}
                          sx={{
                            fontSize: "2rem", // Larger stars
                            "& .MuiRating-iconEmpty": {
                              color: "#FFFFFF", // White fill for unselected stars
                            },
                            "& .MuiRating-iconFilled": {
                              color: "#FFD700", // Gold fill for selected stars
                            },
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
                          disabled={isSending || orderDetails.id === dummyMarketplaceDetails.id}
                          sx={{
                            "& .MuiInputBase-input": {
                              padding: { xs: "10px", md: "12px" },
                              color: "#344767",
                            },
                          }}
                        />
                        <MDButton
                          onClick={handleSendMessage}
                          color="primary"
                          variant="gradient"
                          disabled={isSending || !newMessage.trim() || orderDetails.id === dummyMarketplaceDetails.id}
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
                          disabled={isFlagging || orderDetails.id === dummyMarketplaceDetails.id}
                          sx={{
                            "& .MuiInputBase-input": {
                              padding: { xs: "10px", md: "12px" },
                              color: "#344767",
                            },
                          }}
                        />
                        <MDButton
                          onClick={handleFlagIssue}
                          color="error"
                          variant="gradient"
                          disabled={isFlagging || !issueDescription.trim() || orderDetails.id === dummyMarketplaceDetails.id}
                          sx={{ mt: 1, width: { xs: "100%", sm: "auto" } }}
                        >
                          {isFlagging ? "Flagging..." : "Flag Issue"}
                        </MDButton>
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