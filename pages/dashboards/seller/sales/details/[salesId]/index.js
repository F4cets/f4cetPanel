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

function SalesDetails() {
  const { user } = useUser();
  const router = useRouter();
  const { salesId } = router.query;
  const [saleDetails, setSaleDetails] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [messageInput, setMessageInput] = useState(""); // Renamed newMessage to messageInput for clarity
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isShipping, setIsShipping] = useState(false);
  const [isConfirmingDelivery, setIsConfirmingDelivery] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [hasFlaggedIssue, setHasFlaggedIssue] = useState(false);
  const [timeUntilRelease, setTimeUntilRelease] = useState(null);

  // Fetch sale details, messages, and notifications from Firestore
  useEffect(() => {
    if (!user || !user.walletId || !salesId) return;

    const fetchSale = async () => {
      try {
        const saleDocRef = doc(db, "transactions", salesId);
        const unsubscribe = onSnapshot(saleDocRef, async (saleSnapshot) => {
          if (saleSnapshot.exists() && saleSnapshot.data().sellerId === user.walletId) {
            const saleData = saleSnapshot.data();

            // Fetch product names
            let productNames = [];
            if (Array.isArray(saleData.productIds)) {
              for (const productId of saleData.productIds) {
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

            // Fetch buyer name (if available)
            let buyerName = saleData.buyerId;
            const buyerDocRef = doc(db, "users", saleData.buyerId);
            const buyerDoc = await getDoc(buyerDocRef);
            if (buyerDoc.exists()) {
              const buyerData = buyerDoc.data();
              buyerName = buyerData.name || buyerName;
            }

            // Build timeline dynamically
            const timeline = [];
            if (saleData.createdAt) {
              const createdDate = saleData.createdAt.toDate ? saleData.createdAt.toDate() : new Date(saleData.createdAt);
              timeline.push({
                title: "Order Placed",
                date: `${createdDate.toISOString().split('T')[0]} ${createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                description: "Order placed successfully.",
              });
            }
            if (saleData.shippingConfirmedAt) {
              const shippedDate = saleData.shippingConfirmedAt.toDate ? saleData.shippingConfirmedAt.toDate() : new Date(saleData.shippingConfirmedAt);
              timeline.push({
                title: "Order Shipped",
                date: `${shippedDate.toISOString().split('T')[0]} ${shippedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                description: `Order shipped with tracking number ${saleData.trackingNumber || 'Not Available'}.`,
              });
            }
            if (saleData.deliveryConfirmedAt) {
              const deliveredDate = saleData.deliveryConfirmedAt.toDate ? saleData.deliveryConfirmedAt.toDate() : new Date(saleData.deliveryConfirmedAt);
              timeline.push({
                title: "Order Delivered",
                date: `${deliveredDate.toISOString().split('T')[0]} ${deliveredDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                description: "Order delivered to customer.",
              });
            }
            if (saleData.buyerConfirmed) {
              // CHANGED: Safely handle updatedAt as Timestamp or string
              const confirmedDate = saleData.updatedAt
                ? (typeof saleData.updatedAt.toDate === 'function'
                  ? saleData.updatedAt.toDate()
                  : new Date(saleData.updatedAt))
                : new Date();
              timeline.push({
                title: "Receipt Confirmed",
                date: `${confirmedDate.toISOString().split('T')[0]} ${confirmedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                description: "Buyer confirmed receipt of the item.",
              });
            }

            const createdDateForDisplay = saleData.createdAt.toDate ? saleData.createdAt.toDate() : new Date(saleData.createdAt);
            const data = {
              id: saleSnapshot.id,
              sellerId: saleData.sellerId,
              buyerId: saleData.buyerId,
              buyer: buyerName,
              itemName: productNames.join(", ") || "Unknown Product",
              type: saleData.type || "rwi",
              salePrice: saleData.amount || 0,
              currency: saleData.currency || "USDC",
              status: saleData.shippingStatus || "Pending",
              date: createdDateForDisplay.toISOString().split('T')[0],
              shippingAddress: saleData.shippingAddress || "N/A",
              trackingNumber: saleData.trackingNumber || "Not Available",
              buyerConfirmed: saleData.buyerConfirmed || false,
              sellerRating: saleData.sellerRating || null,
              deliveryConfirmedAt: saleData.deliveryConfirmedAt || null,
              timeline: timeline.length > 0 ? timeline : [],
            };
            setSaleDetails(data);
            setTrackingNumber(data.trackingNumber || "");
          } else {
            setError("Sale not found or unauthorized.");
            setSaleDetails(null);
          }
        }, (err) => {
          console.error("SalesDetails: Error in sale listener:", err);
          setError("Failed to load sale details: " + err.message);
          setSaleDetails(null);
        });

        return () => {
          console.log("SalesDetails: Cleaning up sale listener for sale:", salesId);
          unsubscribe();
        };
      } catch (err) {
        console.error("SalesDetails: Error setting up sale listener:", err);
        setError("Failed to load sale details: " + err.message);
        setSaleDetails(null);
      }
    };

    const fetchMessages = () => {
      if (!user || !user.walletId || !salesId) return;

      try {
        console.log("SalesDetails: Setting up real-time listener for messages:", salesId);
        const q = query(
          collection(db, "messages"),
          where("orderId", "==", salesId)
        );
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setMessages(data);
        }, (err) => {
          console.error("SalesDetails: Error in messages listener:", err);
          setError("Failed to load messages: " + err.message);
          setMessages([]);
        });
        return unsubscribe;
      } catch (err) {
        console.error("SalesDetails: Error setting up messages listener:", err);
        setError("Failed to load messages: " + err.message);
        setMessages([]);
      }
    };

    const fetchNotifications = () => {
      if (!user || !user.walletId || !salesId) return;

      try {
        console.log("SalesDetails: Setting up real-time listener for notifications:", salesId);
        const q = query(
          collection(db, "notifications"),
          where("orderId", "==", salesId),
          where("userId", "==", user.walletId),
          where("type", "==", "issue")
        );
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setNotifications(data);
          setHasFlaggedIssue(data.some(note => !note.read));
        }, (err) => {
          console.error("SalesDetails: Error in notifications listener:", err);
          setError("Failed to load notifications: " + err.message);
          setNotifications([]);
        });
        return unsubscribe;
      } catch (err) {
        console.error("SalesDetails: Error setting up notifications listener:", err);
        setError("Failed to load notifications: " + err.message);
        setNotifications([]);
      }
    };

    fetchSale();
    const unsubscribeMessages = fetchMessages();
    const unsubscribeNotifications = fetchNotifications();

    return () => {
      if (unsubscribeMessages) {
        console.log("SalesDetails: Cleaning up messages listener for sale:", salesId);
        unsubscribeMessages();
      }
      if (unsubscribeNotifications) {
        console.log("SalesDetails: Cleaning up notifications listener for sale:", salesId);
        unsubscribeNotifications();
      }
    };
  }, [user, salesId]);

  // Escrow release countdown timer
  useEffect(() => {
    if (!saleDetails || !saleDetails.deliveryConfirmedAt || saleDetails.buyerConfirmed || hasFlaggedIssue) {
      setTimeUntilRelease(null);
      return;
    }

    const calculateTimeUntilRelease = () => {
      const deliveryDate = new Date(saleDetails.deliveryConfirmedAt);
      const releaseDate = new Date(deliveryDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from delivery
      const now = new Date();
      const timeDiff = releaseDate - now;

      if (timeDiff <= 0) {
        setTimeUntilRelease(null);
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      setTimeUntilRelease({ days, hours, minutes, seconds });
    };

    calculateTimeUntilRelease();
    const timer = setInterval(calculateTimeUntilRelease, 1000);

    return () => clearInterval(timer);
  }, [saleDetails, hasFlaggedIssue]);

  // Redirect to home if no user, no walletId, or unauthorized role
  useEffect(() => {
    if (!user || !user.walletId || user.role !== "seller") {
      console.log("SalesDetails: Unauthorized access, redirecting to home");
      router.replace("/");
    }
  }, [user, router]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!saleDetails || !messageInput.trim() || isSending) return;

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const messageData = {
        orderId: salesId,
        senderId: user.walletId,
        receiverId: saleDetails.buyerId,
        message: messageInput.trim(),
        timestamp: new Date().toISOString(),
      };
      await addDoc(collection(db, "messages"), messageData);
      setMessageInput("");
      setSuccess("Message sent successfully!");
    } catch (err) {
      console.error("SalesDetails: Error sending message:", err);
      setError("Failed to send message: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  // Handle updating tracking number
  const handleSaveTracking = async () => {
    if (!saleDetails || isSaving || trackingNumber === saleDetails.trackingNumber) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const saleDocRef = doc(db, "transactions", salesId);
      const updatedData = {
        trackingNumber,
        updatedAt: new Date().toISOString(),
        timeline: [
          ...(saleDetails.timeline || []),
          {
            title: trackingNumber ? "Tracking Number Updated" : "Tracking Number Removed",
            date: new Date().toISOString().split("T")[0] + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            description: trackingNumber ? `Tracking number set to ${trackingNumber}.` : "Tracking number cleared.",
          },
        ],
      };
      await updateDoc(saleDocRef, updatedData);
      setSaleDetails({
        ...saleDetails,
        ...updatedData,
      });
      setSuccess("Tracking number updated successfully!");
    } catch (err) {
      console.error("SalesDetails: Error updating tracking number:", err);
      setError("Failed to save tracking number: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle marking as shipped
  const handleMarkAsShipped = async () => {
    if (!saleDetails || isShipping || saleDetails.status !== "Pending") return;

    setIsShipping(true);
    setError(null);
    setSuccess(null);

    try {
      const saleDocRef = doc(db, "transactions", salesId);
      const updatedData = {
        shippingStatus: "Shipped",
        shippingConfirmedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeline: [
          ...(saleDetails.timeline || []),
          {
            title: "Order Shipped",
            date: new Date().toISOString().split("T")[0] + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            description: `Order shipped with tracking number ${trackingNumber || 'Not Available'}.`,
          },
        ],
      };
      await updateDoc(saleDocRef, updatedData);
      setSaleDetails({
        ...saleDetails,
        ...updatedData,
      });
      setSuccess("Order marked as shipped successfully!");
    } catch (err) {
      console.error("SalesDetails: Error marking as shipped:", err);
      setError("Failed to mark order as shipped: " + err.message);
    } finally {
      setIsShipping(false);
    }
  };

  // Handle confirming delivery (RWI only)
  const handleConfirmDelivery = async () => {
    if (!saleDetails || isConfirmingDelivery || saleDetails.deliveryConfirmedAt) return;

    setIsConfirmingDelivery(true);
    setError(null);
    setSuccess(null);

    try {
      const saleDocRef = doc(db, "transactions", salesId);
      const updatedData = {
        shippingStatus: "Delivered",
        deliveryConfirmedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeline: [
          ...(saleDetails.timeline || []),
          {
            title: "Order Delivered",
            date: new Date().toISOString().split("T")[0] + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            description: "Seller confirmed delivery of the item.",
          },
        ],
      };
      await updateDoc(saleDocRef, updatedData);
      setSaleDetails({
        ...saleDetails,
        ...updatedData,
      });
      setSuccess("Delivery confirmed successfully!");
    } catch (err) {
      console.error("SalesDetails: Error confirming delivery:", err);
      setError("Failed to confirm delivery: " + err.message);
    } finally {
      setIsConfirmingDelivery(false);
    }
  };

  // Ensure user is loaded and authorized before rendering
  if (!user || !user.walletId || user.role !== "seller") {
    return null; // Or a loading spinner
  }

  // Handle invalid or missing salesId
  if (!salesId) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          <MDTypography variant="h4" color="error">
            Invalid Sale ID
          </MDTypography>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  // Handle no saleDetails (e.g., still loading or error)
  if (!saleDetails) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          <MDTypography variant="h4" color="error">
            {error || "Loading sale details..."}
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
                        {saleDetails.itemName || "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Buyer
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {saleDetails.buyer || saleDetails.buyerId || "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Shipping Address
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {saleDetails.shippingAddress || "N/A"}
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
                          "& .MuiInputBase-input": { padding: { xs: "10px", md: "12px" }, color: "#FFFFFF" },
                        }}
                      />
                      <MDButton
                        onClick={handleSaveTracking}
                        color="dark"
                        variant="gradient"
                        disabled={isSaving || trackingNumber === saleDetails.trackingNumber}
                        sx={{ mt: 1, width: { xs: "100%", sm: "auto" } }}
                      >
                        {isSaving ? "Saving..." : "Save Tracking"}
                      </MDButton>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Amount
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {saleDetails.salePrice} {saleDetails.currency || "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Status
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {saleDetails.status || "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Date
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {saleDetails.date || "N/A"}
                      </MDTypography>
                    </MDBox>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <MDBox>
                      <MDTypography variant="h6" color="dark" mb={2}>
                        Sale Timeline
                      </MDTypography>
                      {saleDetails.timeline?.length > 0 ? (
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
                <MDBox mt={3}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <MDTypography variant="h6" color="dark" mb={2}>
                        Seller Actions
                      </MDTypography>
                      {/* Mark as Shipped (RWI Only) */}
                      {saleDetails.type === "rwi" && saleDetails.status === "Pending" && (
                        <MDBox mb={2}>
                          <MDTypography variant="body1" color="dark" mb={1}>
                            Mark as Shipped
                          </MDTypography>
                          <MDButton
                            onClick={handleMarkAsShipped}
                            color="success"
                            variant="gradient"
                            disabled={isShipping}
                            sx={{ width: { xs: "100%", sm: "auto" } }}
                          >
                            {isShipping ? "Marking..." : "Mark as Shipped"}
                          </MDButton>
                        </MDBox>
                      )}
                      {/* Confirm Delivery (RWI Only) */}
                      {saleDetails.type === "rwi" && saleDetails.status === "Shipped" && !saleDetails.deliveryConfirmedAt && (
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
                      {/* Escrow Release Timer */}
                      {saleDetails.deliveryConfirmedAt && !saleDetails.buyerConfirmed && (
                        <MDBox mb={2}>
                          <MDTypography variant="body1" color="dark" mb={1}>
                            Escrow Release Timer
                          </MDTypography>
                          <MDTypography variant="body2" color={hasFlaggedIssue ? "error" : "info"}>
                            {hasFlaggedIssue
                              ? "Timer paused due to active flagged issue."
                              : timeUntilRelease
                              ? `Funds release in: ${timeUntilRelease.days}d ${timeUntilRelease.hours}h ${timeUntilRelease.minutes}m ${timeUntilRelease.seconds}s`
                              : "Funds release pending."}
                          </MDTypography>
                        </MDBox>
                      )}
                      {/* Buyer Confirmation (RWI Only) */}
                      {saleDetails.type === "rwi" && (
                        <MDBox mb={2}>
                          <MDTypography variant="body1" color="dark" mb={1}>
                            Buyer Confirmation
                          </MDTypography>
                          <MDTypography variant="body2" color={saleDetails.buyerConfirmed ? "success" : "warning"}>
                            {saleDetails.buyerConfirmed
                              ? "Confirmed: Funds released from escrow."
                              : "Pending: Awaiting buyer confirmation of receipt."}
                          </MDTypography>
                        </MDBox>
                      )}
                      {/* Buyer Rating */}
                      <MDBox mb={2}>
                        <MDTypography variant="body1" color="dark" mb={1}>
                          Buyer Rating
                        </MDTypography>
                        <Rating
                          value={saleDetails.sellerRating || 0}
                          readOnly
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
                          Message Buyer
                        </MDTypography>
                        <MDInput
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
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
                          disabled={isSending || !messageInput.trim()}
                          sx={{ mt: 1, width: { xs: "100%", sm: "auto" } }}
                        >
                          {isSending ? "Sending..." : "Send Message"}
                        </MDButton>
                        <MDBox mt={2} maxHeight="200px" overflow="auto">
                          {messages.length > 0 ? (
                            messages.map((msg, index) => (
                              <MDBox key={index} mb={1} p={1} sx={{ borderBottom: "1px solid #e0e0e0" }}>
                                <MDTypography variant="body2" color={msg.senderId === user.walletId ? "primary" : "text"}>
                                  <strong>{msg.senderId === user.walletId ? "You" : "Buyer"}:</strong> {msg.message}
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
                      {/* Flagged Issues */}
                      <MDBox mb={2}>
                        <MDTypography variant="body1" color="dark" mb={1}>
                          Flagged Issues
                        </MDTypography>
                        {notifications.length > 0 ? (
                          notifications.map((note, index) => (
                            <MDBox key={index} mb={1} p={1} sx={{ border: "1px solid #e0e0e0", borderRadius: "8px" }}>
                              <MDTypography variant="body2" color="error">
                                Issue: {note.description}
                              </MDTypography>
                              <MDTypography variant="caption" color="text">
                                Reported: {new Date(note.timestamp).toLocaleString()}
                              </MDTypography>
                            </MDBox>
                          ))
                        ) : (
                          <MDTypography variant="body2" color="text">
                            No issues flagged by the buyer.
                          </MDTypography>
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

export default SalesDetails;