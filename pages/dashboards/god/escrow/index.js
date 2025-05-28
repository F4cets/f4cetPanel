/**
=========================================================
* F4cetPanel - God Escrow Search Page
=========================================================

* Copyright 2025 F4cets Team
*/

// React imports
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

// Firebase imports
import { collection, getDocs, doc, getDoc } from "firebase/firestore"; // CHANGED: Added doc, getDoc
import { db } from "/lib/firebase";

// User context
import { useUser } from "/contexts/UserContext";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
import MDInput from "/components/MDInput";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";

function EscrowSearch() {
  const { user } = useUser();
  const router = useRouter();
  const [escrowWallets, setEscrowWallets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);

  // Fetch escrow wallets from Firestore
  useEffect(() => {
    const fetchEscrowWallets = async () => {
      if (!user || !user.walletId) return;

      try {
        // CHANGED: Query users with escrowPublicKey
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const escrowWalletsData = [];

        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          const walletId = userDoc.id;
          const escrowPublicKey = userData.plan?.escrowPublicKey;

          // Skip users without escrowPublicKey
          if (!escrowPublicKey) continue;

          // Get storeIds
          const storeIds = userData.storeIds || [];

          // Fetch store names for each storeId
          for (const storeId of storeIds) {
            const storeDocRef = doc(db, "stores", storeId);
            const storeDoc = await getDoc(storeDocRef);
            const storeName = storeDoc.exists() ? storeDoc.data().name || "Unnamed Store" : "Unnamed Store";

            escrowWalletsData.push({
              escrowId: escrowPublicKey,
              publicKey: escrowPublicKey,
              walletId: walletId,
              storeId: storeId,
              storeName: storeName,
              solBalance: 0, // Placeholder
              usdcBalance: 0, // Placeholder
              nftInventory: [], // Placeholder
              status: "Active", // Placeholder
              pendingSol: 0, // Placeholder
              pendingUsdc: 0, // Placeholder
              createdAt: new Date().toISOString(), // Placeholder
            });
          }
        }

        setEscrowWallets(escrowWalletsData);
        if (escrowWalletsData.length === 0) {
          setError("No escrow wallets found.");
        }
      } catch (err) {
        console.error("Error fetching escrow wallets:", err);
        setError("Failed to load escrow wallets.");
        setEscrowWallets([]);
      }
    };

    fetchEscrowWallets();
  }, [user]);

  // Redirect to home if no user, no walletId, or unauthorized role
  useEffect(() => {
    if (!user || !user.walletId || user.role !== "god") {
      router.replace("/");
    }
  }, [user, router]);

  // Filter escrow wallets by search term
  const filteredEscrowWallets = escrowWallets.filter(wallet =>
    (wallet.storeName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (wallet.publicKey?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (wallet.walletId?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  // Ensure user is loaded and authorized before rendering
  if (!user || !user.walletId || user.role !== "god") {
    return null; // Or a loading spinner
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <MDTypography variant="h4" color="dark">
            Escrow Management
          </MDTypography>
        </MDBox>
        <MDBox mb={3} mx="auto" maxWidth="600px">
          <Card
            sx={{
              background: 'transparent',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
              p: 2,
            }}
          >
            <MDInput
              label="Search by Store Name, Escrow ID, or Wallet ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              sx={{
                "& .MuiInputBase-root": {
                  transition: "all 0.3s ease",
                },
                "& .MuiInputBase-input": {
                  padding: { xs: "8px", md: "10px" },
                },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: '#bdbdbd',
                  },
                  "&:hover fieldset": {
                    borderColor: '#3f51b5',
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: '#3f51b5',
                  },
                },
              }}
            />
          </Card>
        </MDBox>
        {error && (
          <MDTypography variant="body2" color="error" mb={2}>
            {error}
          </MDTypography>
        )}
        <Grid container spacing={3}>
          {filteredEscrowWallets.length > 0 ? (
            filteredEscrowWallets.map(wallet => (
              <Grid item xs={12} sm={6} md={4} lg={2} key={wallet.escrowId}>
                <Link href={`/dashboards/god/escrow/view/${wallet.escrowId}`}>
                  <Card
                    sx={{
                      background: 'transparent',
                      border: '1px solid rgba(0, 0, 0, 0.12)',
                      borderRadius: "12px",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      "&:hover": {
                        transform: "scale(1.05)",
                        boxShadow: "0 6px 30px rgba(0, 0, 0, 0.15)",
                      },
                      p: { xs: 2, md: 3 },
                      height: "100%",
                      cursor: "pointer",
                    }}
                  >
                    <MDTypography
                      variant="h6"
                      color="dark"
                      mb={1}
                      sx={{ fontSize: { xs: "0.9rem", md: "1rem" } }}
                    >
                      {wallet.storeName || 'Unnamed Store'}
                    </MDTypography>
                    <MDTypography
                      variant="body2"
                      color="text"
                      mb={1}
                      sx={{ fontSize: { xs: "0.8rem", md: "0.875rem" } }}
                    >
                      Escrow ID: {wallet.publicKey.slice(0, 6)}...{wallet.publicKey.slice(-4)}
                    </MDTypography>
                    <MDTypography
                      variant="body2"
                      color="text"
                      sx={{ fontSize: { xs: "0.8rem", md: "0.875rem" } }}
                    >
                      Status: {wallet.status}
                    </MDTypography>
                  </Card>
                </Link>
              </Grid>
            ))
          ) : (
            <MDBox width="100%" textAlign="center">
              <MDTypography variant="body2" color="text">
                No escrow wallets found.
              </MDTypography>
            </MDBox>
          )}
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default EscrowSearch;