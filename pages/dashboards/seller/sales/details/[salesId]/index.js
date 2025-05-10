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
import { doc, getDoc, updateDoc, addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "/lib/firebase";

// User context
import { useUser } from "/contexts/UserContext";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Rating from "@mui/material/Rating";

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
const dummySaleDetails = {
  id: "SALE001",
  sellerId: "testSellerWallet456",
  buyerId: "testBuyerWallet123",
  itemName: "Strong Hold Hoodie",
  type: "rwi",
  salePrice: 50,
  currency: "USDC",
  buyerWallet: "buyer123...xyz",
  status: "Delivered",
  createdAt: "2025-03-20",
  shippingLocation: "New York, USA",
  trackingNumber: "123ABC",
  buyerConfirmed: false,
  sellerRating: null,
  timeline: [
    { title: "Sale Created", date: "2025-03-20 10:00 AM", description: "Sale initiated for Strong Hold Hoodie." },
    { title: "Shipped", date: "2025-03-21 12:00 PM", description: "Item shipped with tracking 123ABC." },
  ],
};

const dummyMessages = [
  {
    orderId: "SALE001",
    senderId: "testBuyerWallet123",
    receiverId: "testSellerWallet456",
    message: "Is the item still in stock?",
    timestamp: "2025-03-20T10:05:00Z",
  },
];

const dummyNotifications = [
  {
    orderId: "SALE001",
    userId: "testSellerWallet456",
    type: "issue",
    description: "No issues flagged.",
    timestamp: "2025-03-23T16:00:00Z",
    read: false,
  },
];

function SalesDetails() {
  const { user } = useUser();
  const router = useRouter();
  const { salesId } = router.query;
  const [saleDetails, setSaleDetails] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch sale details, messages, and notifications from Firestore
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
            createdAt: saleSnapshot.data().createdAt?.split("T")[0] || "N/A",
          };
          setSaleDetails(data);
          setTrackingNumber(data.trackingNumber || "");
        } else {
          setError("Sale not found or unauthorized. Using sample data.");
          setSaleDetails(dummySaleDetails);
          setTrackingNumber(dummySaleDetails.trackingNumber || "");
        }
      } catch (err) {
        console.error("Error fetching sale:", err);
        setError("Failed to load sale details. Using sample data.");
        setSaleDetails(dummySaleDetails);
        setTrackingNumber(dummySaleDetails.trackingNumber || "");
      }
    };

    const fetchMessages = async () => {
      if (!user || !user.walletId || !salesId) return;

      try {
        const q = query(
          collection(db, "messages"),
          where("orderId", "==", salesId)
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(data.length > 0 ? data : dummyMessages);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError("Failed to load messages. Using sample messages.");
        setMessages(dummyMessages);
      }
    };

    const fetchNotifications = async () => {
      if (!user || !user.walletId || !salesId) return;

      try {
        const q = query(
          collection(db, "notifications"),
          where("orderId", "==", salesId),
          where("userId", "==", user.walletId),
          where("type", "==", "issue")
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(data.length > 0 ? data : dummyNotifications);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications. Using sample notifications.");
        setNotifications(dummyNotifications);
      }
    };

    fetchSale();
    fetchMessages();
    fetchNotifications();
  }, [user, salesId]);

  // Redirect to home if no user, no walletId, or unauthorized role
  useEffect(() => {
    if (!user || !user.walletId || user.role !== "seller") {
      router.replace("/");
    }
  }, [user, router]);

  // Handle tracking number save
  const handleSaveTracking = async () => {
    if (!saleDetails || isSaving || saleDetails.id === dummySaleDetails.id) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

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
      setSuccess("Tracking number updated successfully!");
    } catch (err) {
      console.error("Error updating tracking number:", err);
      setError("Failed to save tracking number: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!saleDetails || !newMessage.trim() || isSending || saleDetails.id === dummySaleDetails.id) return;

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const messageData = {
        orderId: salesId,
        senderId: user.walletId,
        receiverId: saleDetails.buyerId,
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

  // Ensure user is loaded and authorized before rendering
  if (!user || !user.walletId || user.role !== "seller") {
    return null; // Or a loading spinner
  }

  // Handle invalid or missing salesId
  if (!salesId || !salesId.startsWith("SALE")) {
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

  // Handle no saleDetails (e.g., still loading)
  if (!saleDetails) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          <MDTypography variant="body2" color="text">
            Loading sale details...
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
                  Sale Details - {saleDetails.id || "N/A"}
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
                        {saleDetails.itemName || "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Sale Price
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {saleDetails.salePrice ? `${saleDetails.salePrice} ${saleDetails.currency || "N/A"}` : "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Buyer Wallet
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {saleDetails.buyerWallet ? `${saleDetails.buyerWallet.slice(0, 6)}...${saleDetails.buyerWallet.slice(-4)}` : "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Status
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {saleDetails.status ? (saleDetails.status.charAt(0).toUpperCase() + saleDetails.status.slice(1)) : "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Date
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {saleDetails.createdAt || "N/A"}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Shipping Location
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {saleDetails.shippingLocation || "N/A"}
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
                        disabled={saleDetails.id === dummySaleDetails.id}
                      />
                      <MDButton
                        variant="contained"
                        color="dark"
                        onClick={handleSaveTracking}
                        disabled={isSaving || trackingNumber === saleDetails.trackingNumber || saleDetails.id === dummySaleDetails.id}
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
                <MDBox mt={3}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <MDTypography variant="h6" color="dark" mb={2}>
                        Seller Actions
                      </MDTypography>
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
                      {/* Seller Rating */}
                      <MDBox mb={2}>
                        <MDTypography variant="body1" color="dark" mb={1}>
                          Buyer Rating
                        </MDTypography>
                        <Rating
                          value={saleDetails.sellerRating || 0}
                          readOnly
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
                          Message Buyer
                        </MDTypography>
                        <MDInput
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          fullWidth
                          multiline
                          rows={3}
                          disabled={isSending || saleDetails.id === dummySaleDetails.id}
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
                          disabled={isSending || !newMessage.trim() || saleDetails.id === dummySaleDetails.id}
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