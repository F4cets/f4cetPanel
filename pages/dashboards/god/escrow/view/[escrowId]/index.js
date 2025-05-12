/**
=========================================================
* F4cetPanel - God Escrow View Page
=========================================================

* Copyright 2023 F4cets Team
*/

// React imports
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

// Firebase imports
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "/lib/firebase";

// User context
import { useUser } from "/contexts/UserContext";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
import MDButton from "/components/MDButton";
import DataTable from "/examples/Tables/DataTable";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";

// Dummy Data
const dummyEscrowWallet = {
  escrowId: "escrow123",
  publicKey: "SolanaPublicKey123",
  walletId: "sellerWallet456",
  storeId: "store123",
  storeName: "FashionHub",
  solBalance: 5.0,
  usdcBalance: 100.0,
  nftInventory: ["NFT001", "NFT002"],
  status: "Active",
  pendingSol: 1.0,
  pendingUsdc: 50.0,
  createdAt: new Date("2025-03-20").toISOString(),
};

const dummyPendingPayments = [
  { id: "ESC001", date: "2025-03-20", buyerId: "0x123...456", product: "Ebook: Web3 Guide", amount: 20, currency: "USDC", status: "Pending" },
  { id: "ESC002", date: "2025-03-19", buyerId: "0x789...012", product: "Strong Hold Hoodie", amount: 30, currency: "USDC", status: "Pending" },
];

const dummyNFTInventory = [
  { id: "NFT001", date: "2025-03-20", product: "Ebook: Web3 Guide", invId: "INV002", quantity: 100, status: "Held" },
  { id: "NFT002", date: "2025-03-19", product: "Strong Hold Hoodie", invId: "INV001", quantity: 17, status: "Held" },
];

const dummyTransactionHistory = [
  { id: "TX001", type: "Fund Release", amount: 50, currency: "USDC", destinationWallet: "sellerWallet456", status: "Completed", createdAt: "2025-03-18" },
];

function EscrowView() {
  const { user } = useUser();
  const router = useRouter();
  const { escrowId } = router.query;
  const [escrowWallet, setEscrowWallet] = useState(null);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [nftInventory, setNftInventory] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [openReleaseModal, setOpenReleaseModal] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch escrow wallet and related data from Firestore
  useEffect(() => {
    const fetchEscrowWallet = async () => {
      if (!user || !user.walletId || !escrowId) return;

      try {
        // Find the user with the escrow wallet
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        let escrowData = null;
        for (const userDoc of usersSnapshot.docs) {
          const escrowDoc = doc(db, `users/${userDoc.id}/escrowWallets`, escrowId);
          const escrowSnapshot = await getDoc(escrowDoc);
          if (escrowSnapshot.exists()) {
            escrowData = {
              escrowId: escrowSnapshot.id,
              walletId: userDoc.id,
              ...escrowSnapshot.data(),
            };
            break;
          }
        }

        if (escrowData) {
          setEscrowWallet(escrowData);
        } else {
          setError("Escrow wallet not found. Using sample data.");
          setEscrowWallet(dummyEscrowWallet);
        }
      } catch (err) {
        console.error("Error fetching escrow wallet:", err);
        setError("Failed to load escrow wallet. Using sample data.");
        setEscrowWallet(dummyEscrowWallet);
      }
    };

    const fetchPendingPayments = async () => {
      // Placeholder: Fetch pending payments (to be implemented with Solana integration)
      setPendingPayments(dummyPendingPayments);
    };

    const fetchNFTInventory = async () => {
      // Placeholder: Fetch NFT inventory (to be implemented with Solana integration)
      setNftInventory(dummyNFTInventory);
    };

    const fetchTransactionHistory = async () => {
      if (!escrowWallet) return;

      try {
        const transactionsCollection = collection(db, `users/${escrowWallet.walletId}/escrowWallets/${escrowId}/transactions`);
        const transactionsSnapshot = await getDocs(transactionsCollection);
        const transactionsData = transactionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTransactionHistory(transactionsData.length > 0 ? transactionsData : dummyTransactionHistory);
      } catch (err) {
        console.error("Error fetching transaction history:", err);
        setTransactionHistory(dummyTransactionHistory);
      }
    };

    fetchEscrowWallet();
    fetchPendingPayments();
    fetchNFTInventory();
    fetchTransactionHistory();
  }, [user, escrowId, escrowWallet]);

  // Redirect to home if no user, no walletId, or unauthorized role
  useEffect(() => {
    if (!user || !user.walletId || user.role !== "god") {
      router.replace("/");
    }
  }, [user, router]);

  // Handle fund release (placeholder for Google Cloud Function)
  const handleReleaseFunds = async () => {
    if (!escrowWallet || isReleasing || escrowWallet.id === dummyEscrowWallet.escrowId) return;

    setIsReleasing(true);
    setError(null);
    setSuccess(null);

    try {
      // Placeholder: Call Google Cloud Function to release funds
      // e.g., await releaseFunds(escrowWallet.publicKey, escrowWallet.walletId, escrowWallet.pendingSol, escrowWallet.pendingUsdc);

      // Update Firestore (simulate fund release)
      const escrowDoc = doc(db, `users/${escrowWallet.walletId}/escrowWallets`, escrowId);
      await updateDoc(escrowDoc, {
        status: "Released",
        pendingSol: 0,
        pendingUsdc: 0,
      });

      // Log transaction
      const transactionsCollection = collection(db, `users/${escrowWallet.walletId}/escrowWallets/${escrowId}/transactions`);
      const transaction = {
        type: "Fund Release",
        amount: escrowWallet.pendingUsdc,
        currency: "USDC",
        destinationWallet: escrowWallet.walletId,
        status: "Completed",
        createdAt: new Date().toISOString(),
      };
      const docRef = await addDoc(transactionsCollection, transaction);

      setEscrowWallet({
        ...escrowWallet,
        status: "Released",
        pendingSol: 0,
        pendingUsdc: 0,
      });
      setTransactionHistory([
        ...transactionHistory,
        { id: docRef.id, ...transaction },
      ]);
      setSuccess("Funds released successfully!");
      setOpenReleaseModal(false);
    } catch (err) {
      console.error("Error releasing funds:", err);
      setError("Failed to release funds: " + err.message);
    } finally {
      setIsReleasing(false);
    }
  };

  // Handle modal
  const handleOpenReleaseModal = () => setOpenReleaseModal(true);
  const handleCloseReleaseModal = () => setOpenReleaseModal(false);

  // Ensure user is loaded and authorized before rendering
  if (!user || !user.walletId || user.role !== "god") {
    return null; // Or a loading spinner
  }

  // Handle invalid or missing escrowId
  if (!escrowId) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          <MDTypography variant="h4" color="error">
            Invalid Escrow ID
          </MDTypography>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  // Handle no escrow wallet (e.g., still loading)
  if (!escrowWallet) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          <MDTypography variant="body2" color="text">
            Loading escrow details...
          </MDTypography>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  // Pending Payments Table
  const pendingPaymentsTableData = {
    columns: [
      { Header: "Escrow ID", accessor: "id", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Date", accessor: "date", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Buyer ID", accessor: "buyerId", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Product", accessor: "product", width: "20%", sx: { paddingRight: "20px" } },
      { Header: "Amount", accessor: "amount", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Status", accessor: "status", width: "10%", sx: { paddingRight: "20px" } },
    ],
    rows: pendingPayments.map(item => ({
      ...item,
      amount: (
        <MDTypography variant="button" color="text">
          {item.amount} {item.currency}
        </MDTypography>
      ),
      status: (
        <MDBox display="flex" alignItems="center">
          <Icon
            fontSize="small"
            sx={{
              color: "warning.main",
              mr: 1,
            }}
          >
            hourglass_empty
          </Icon>
          <MDTypography variant="button" color="text">
            {item.status}
          </MDTypography>
        </MDBox>
      ),
    })),
  };

  // NFT Inventory Table
  const nftInventoryTableData = {
    columns: [
      { Header: "NFT ID", accessor: "id", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Date", accessor: "date", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Product", accessor: "product", width: "20%", sx: { paddingRight: "20px" } },
      { Header: "Inventory ID", accessor: "invId", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Quantity", accessor: "quantity", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Status", accessor: "status", width: "10%", sx: { paddingRight: "20px" } },
    ],
    rows: nftInventory.map(item => ({
      ...item,
      invId: (
        <MDTypography variant="button" color="info" fontWeight="medium">
          {item.invId}
        </MDTypography>
      ),
      status: (
        <MDBox display="flex" alignItems="center">
          <Icon
            fontSize="small"
            sx={{
              color: "info.main",
              mr: 1,
            }}
          >
            lock
          </Icon>
          <MDTypography variant="button" color="text">
            {item.status}
          </MDTypography>
        </MDBox>
      ),
    })),
  };

  // Transaction History Table
  const transactionHistoryTableData = {
    columns: [
      { Header: "Transaction ID", accessor: "id", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Type", accessor: "type", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Amount", accessor: "amount", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Currency", accessor: "currency", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Destination Wallet", accessor: "destinationWallet", width: "20%", sx: { paddingRight: "20px" } },
      { Header: "Status", accessor: "status", width: "10%", sx: { paddingRight: "20px" } },
      { Header: "Date", accessor: "createdAt", width: "15%", sx: { paddingRight: "20px" } },
    ],
    rows: transactionHistory.map(tx => ({
      ...tx,
      amount: (
        <MDTypography variant="button" color="text">
          {tx.amount} {tx.currency}
        </MDTypography>
      ),
      destinationWallet: (
        <MDTypography variant="button" color="text">
          {tx.destinationWallet.slice(0, 6)}...{tx.destinationWallet.slice(-4)}
        </MDTypography>
      ),
      status: (
        <MDBox display="flex" alignItems="center">
          <Icon
            fontSize="small"
            sx={{
              color: tx.status === "Completed" ? "success.main" : "warning.main",
              mr: 1,
            }}
          >
            {tx.status === "Completed" ? "check_circle" : "hourglass_empty"}
          </Icon>
          <MDTypography variant="button" color="text">
            {tx.status}
          </MDTypography>
        </MDBox>
      ),
    })),
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox maxWidth="1200px" mx="auto" mb={3}>
          <MDTypography variant="h4" color="dark" mb={2}>
            Escrow Wallet - {escrowWallet.publicKey.slice(0, 6)}...{escrowWallet.publicKey.slice(-4)}
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
          <MDBox display="flex" justifyContent="space-between" alignItems="center">
            <MDTypography variant="h6" color="dark">
              Store: {escrowWallet.storeName || 'Unnamed Store'}
            </MDTypography>
            <MDButton
              variant="gradient"
              color="info"
              onClick={handleOpenReleaseModal}
              disabled={isReleasing || escrowWallet.status === "Released" || escrowWallet.id === dummyEscrowWallet.escrowId}
            >
              Release Funds
            </MDButton>
          </MDBox>
        </MDBox>

        {/* Key Metrics Section */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <MDBox p={3} display="flex" alignItems="center">
                <MDBox
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  width="3rem"
                  height="3rem"
                  borderRadius="lg"
                  color="white"
                  bgColor="info"
                  mr={2}
                >
                  <Icon fontSize="medium">money</Icon>
                </MDBox>
                <MDBox>
                  <MDTypography variant="h6" color="dark">
                    SOL Balance
                  </MDTypography>
                  <MDTypography variant="h4" color="info">
                    {escrowWallet.solBalance} SOL
                  </MDTypography>
                  <MDTypography variant="caption" color="text">
                    In Escrow
                  </MDTypography>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <MDBox p={3} display="flex" alignItems="center">
                <MDBox
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  width="3rem"
                  height="3rem"
                  borderRadius="lg"
                  color="white"
                  bgColor="warning"
                  mr={2}
                >
                  <Icon fontSize="medium">attach_money</Icon>
                </MDBox>
                <MDBox>
                  <MDTypography variant="h6" color="dark">
                    USDC Balance
                  </MDTypography>
                  <MDTypography variant="h4" color="info">
                    ${escrowWallet.usdcBalance}
                  </MDTypography>
                  <MDTypography variant="caption" color="text">
                    In Escrow
                  </MDTypography>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <MDBox p={3} display="flex" alignItems="center">
                <MDBox
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  width="3rem"
                  height="3rem"
                  borderRadius="lg"
                  color="white"
                  bgColor="success"
                  mr={2}
                >
                  <Icon fontSize="medium">inventory</Icon>
                </MDBox>
                <MDBox>
                  <MDTypography variant="h6" color="dark">
                    NFT Inventory
                  </MDTypography>
                  <MDTypography variant="h4" color="info">
                    {escrowWallet.nftInventory.length}
                  </MDTypography>
                  <MDTypography variant="caption" color="text">
                    Items Held
                  </MDTypography>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <MDBox p={3} display="flex" alignItems="center">
                <MDBox
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  width="3rem"
                  height="3rem"
                  borderRadius="lg"
                  color="white"
                  bgColor="error"
                  mr={2}
                >
                  <Icon fontSize="medium">pending</Icon>
                </MDBox>
                <MDBox>
                  <MDTypography variant="h6" color="dark">
                    Pending Release
                  </MDTypography>
                  <MDTypography variant="h4" color="info">
                    ${escrowWallet.pendingUsdc}
                  </MDTypography>
                  <MDTypography variant="caption" color="text">
                    USDC
                  </MDTypography>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
        </Grid>

        {/* Escrow Details Section */}
        <Grid container spacing={3}>
          {/* Pending Payments */}
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h5" color="dark" mb={2}>
                  Pending Escrow Payments
                </MDTypography>
                <DataTable
                  table={pendingPaymentsTableData}
                  entriesPerPage={false}
                  canSearch={false}
                  sx={{
                    "& th": {
                      paddingRight: "20px !important",
                      paddingLeft: "20px !important",
                    },
                    "& .MuiTablePagination-root": {
                      display: "none !important",
                    },
                  }}
                />
              </MDBox>
            </Card>
          </Grid>

          {/* NFT Inventory */}
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h5" color="dark" mb={2}>
                  NFT Inventory in Escrow
                </MDTypography>
                <DataTable
                  table={nftInventoryTableData}
                  entriesPerPage={false}
                  canSearch={false}
                  sx={{
                    "& th": {
                      paddingRight: "20px !important",
                      paddingLeft: "20px !important",
                    },
                    "& .MuiTablePagination-root": {
                      display: "none !important",
                    },
                  }}
                />
              </MDBox>
            </Card>
          </Grid>

          {/* Transaction History */}
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h5" color="dark" mb={2}>
                  Transaction History
                </MDTypography>
                <DataTable
                  table={transactionHistoryTableData}
                  entriesPerPage={false}
                  canSearch={false}
                  sx={{
                    "& th": {
                      paddingRight: "20px !important",
                      paddingLeft: "20px !important",
                    },
                    "& .MuiTablePagination-root": {
                      display: "none !important",
                    },
                  }}
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>

        {/* Release Funds Modal */}
        <Dialog open={openReleaseModal} onClose={handleCloseReleaseModal}>
          <DialogTitle>Confirm Fund Release</DialogTitle>
          <DialogContent>
            <MDTypography variant="body2" mb={2}>
              Release {escrowWallet.pendingSol} SOL and ${escrowWallet.pendingUsdc} USDC to {escrowWallet.walletId.slice(0, 6)}...{escrowWallet.walletId.slice(-4)}?
            </MDTypography>
            {error && (
              <MDTypography variant="body2" color="error" mb={2}>
                {error}
              </MDTypography>
            )}
          </DialogContent>
          <DialogActions>
            <MDButton onClick={handleCloseReleaseModal} color="secondary">
              Cancel
            </MDButton>
            <MDButton
              onClick={handleReleaseFunds}
              color="primary"
              disabled={isReleasing}
            >
              {isReleasing ? "Releasing..." : "Confirm Release"}
            </MDButton>
          </DialogActions>
        </Dialog>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default EscrowView;