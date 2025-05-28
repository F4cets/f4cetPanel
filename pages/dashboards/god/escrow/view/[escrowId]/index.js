/**
=========================================================
* F4cetPanel - God Escrow View Page
=========================================================

* Copyright 2025 F4cets Team
*/

// React imports
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

// Firebase imports
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "/lib/firebase";

// Import fetchSolPrice
import { fetchSolPrice } from "/lib/getSolPrice";

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

// NextJS Material Dashboard 2 PRO Examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";

function EscrowView() {
  const { user } = useUser();
  const router = useRouter();
  const { escrowId } = router.query;
  const [escrowWallet, setEscrowWallet] = useState(null);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [inventoryCount, setInventoryCount] = useState(0);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [openReleaseModal, setOpenReleaseModal] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch all data in a single useEffect
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.walletId || !escrowId) return;

      setError(null); // Clear previous errors

      // Fetch SOL price once
      let solPrice = 200; // Fallback
      try {
        solPrice = await fetchSolPrice();
        console.log("Fetched SOL price:", solPrice);
      } catch (err) {
        console.error("Error fetching SOL price:", err.message);
      }

      // Fetch escrow wallet
      try {
        console.log("Querying users for escrowPublicKey:", escrowId);
        const usersQuery = query(
          collection(db, "users"),
          where("plan.escrowPublicKey", "==", escrowId)
        );
        const usersSnapshot = await getDocs(usersQuery);
        let escrowData = null;

        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          const userData = userDoc.data();
          const walletId = userDoc.id;
          const storeIds = userData.storeIds || [];
          let storeName = "Unnamed Store";
          let storeId = "";

          if (storeIds.length > 0) {
            storeId = storeIds[0];
            const storeDocRef = doc(db, "stores", storeId);
            const storeDoc = await getDoc(storeDocRef);
            storeName = storeDoc.exists() ? storeDoc.data().name || "Unnamed Store" : "Unnamed Store";
          }

          let solBalance = 0;
          let usdcBalance = 0;
          let pendingSol = 0;
          let pendingUsdc = 0;

          // Query transactions by escrowWallet or sellerEscrowWallet
          const transactionsQuery = query(
            collection(db, "transactions"),
            where("sellerEscrowWallet", "==", escrowId)
          );
          const transactionsSnapshot = await getDocs(transactionsQuery);
          console.log("Found transactions:", transactionsSnapshot.size, transactionsSnapshot.docs.map(d => ({
            id: d.id,
            amount: d.data().amount,
            currency: d.data().currency,
            buyerConfirmed: d.data().buyerConfirmed,
            escrowWallet: d.data().escrowWallet,
            sellerEscrowWallet: d.data().sellerEscrowWallet
          })));

          for (const txDoc of transactionsSnapshot.docs) {
            const txData = txDoc.data();
            const amount = txData.amount || 0;
            if (txData.currency === "SOL" && txData.buyerConfirmed === false) {
              solBalance += amount;
              pendingSol += amount;
              pendingUsdc += (amount * 0.96) * solPrice;
            } else if (txData.currency === "USDC" && txData.buyerConfirmed === false) {
              usdcBalance += amount;
              pendingUsdc += amount * 0.96;
            }
          }

          escrowData = {
            escrowId,
            publicKey: escrowId,
            walletId,
            storeId,
            storeName,
            solBalance,
            usdcBalance,
            pendingSol,
            pendingUsdc,
            status: solBalance > 0 || usdcBalance > 0 ? "Active" : "Released",
            createdAt: new Date().toISOString(),
          };
          console.log("Escrow data:", escrowData);
          setEscrowWallet(escrowData);
        } else {
          console.log("No user found with escrowPublicKey:", escrowId);
          setError("Escrow wallet not found.");
          setEscrowWallet(null);
        }
      } catch (err) {
        console.error("Error fetching escrow wallet:", err.message);
        setError("Failed to load escrow wallet: " + err.message);
        setEscrowWallet(null);
      }

      // Fetch pending payments
      try {
        console.log("Querying transactions for pending payments, escrowId:", escrowId);
        const transactionsQuery = query(
          collection(db, "transactions"),
          where("sellerEscrowWallet", "==", escrowId),
          where("buyerConfirmed", "==", false)
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const paymentsData = [];

        console.log("Pending payments transactions:", transactionsSnapshot.size, transactionsSnapshot.docs.map(d => ({
          id: d.id,
          amount: d.data().amount,
          currency: d.data().currency,
          buyerConfirmed: d.data().buyerConfirmed,
          sellerEscrowWallet: d.data().sellerEscrowWallet,
          productIds: d.data().productIds
        })));

        for (const txDoc of transactionsSnapshot.docs) {
          const txData = txDoc.data();
          const productIds = Array.isArray(txData.productIds) ? txData.productIds : [];
          const productNames = [];

          for (const product of productIds) {
            if (product?.productId) {
              const productDocRef = doc(db, "products", product.productId);
              const productDoc = await getDoc(productDocRef);
              productNames.push(productDoc.exists() ? productDoc.data().name || "Unknown" : "Unknown");
            } else {
              productNames.push("Unknown");
            }
          }

          let netAmount = txData.amount * 0.96; // Apply 4% F4cets fee
          const currency = txData.currency || "USDC";
          if (currency === "SOL") {
            netAmount = (netAmount * solPrice).toFixed(2);
          } else {
            netAmount = netAmount.toFixed(2);
          }

          paymentsData.push({
            id: txDoc.id,
            date: txData.createdAt ? new Date(txData.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            product: productNames.join(", ") || "Unknown",
            amount: netAmount,
            currency,
            status: "Pending",
          });
        }

        console.log("Pending payments:", paymentsData);
        setPendingPayments(paymentsData);
      } catch (err) {
        console.error("Error fetching pending payments:", err.message);
        setPendingPayments([]);
      }
    };

    // Fetch inventory
    const fetchInventory = async () => {
      if (!escrowWallet?.storeId) {
        console.log("No storeId, skipping inventory fetch");
        setInventoryData([]);
        return;
      }

      try {
        console.log("Querying products for storeId:", escrowWallet.storeId);
        const productsQuery = query(
          collection(db, "products"),
          where("storeId", "==", escrowWallet.storeId)
        );
        const querySnapshot = await getDocs(productsQuery);
        let totalCount = 0;
        const data = querySnapshot.docs.map(doc => {
          const productData = doc.data();
          let itemCount = 0;
          if (productData.type === "digital") {
            itemCount = parseInt(productData.quantity, 10) || 0;
          } else if (productData.type === "rwi") {
            itemCount = productData.variants?.reduce((sum, v) => {
              const qty = parseInt(v.quantity, 10) || 0;
              return sum + qty;
            }, 0) || 0;
          }
          totalCount += itemCount;
          return {
            id: doc.id,
            ...productData,
            createdAt: productData.createdAt?.toDate().toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
          };
        });

        console.log("Inventory products:", data, "Total count:", totalCount);
        setInventoryData(data);
        setInventoryCount(totalCount);
        if (data.length === 0) {
          setError("No products found in escrow for this store.");
        }
      } catch (err) {
        console.error("Error fetching inventory:", err.message);
        setError("Failed to load inventory: " + err.message);
        setInventoryData([]);
        setInventoryCount(0);
      }
    };

    // Fetch transaction history
    const fetchTransactionHistory = async () => {
      if (!escrowId || !escrowWallet?.storeId || !escrowWallet?.walletId) {
        console.log("Missing escrowId, storeId, or walletId, skipping transaction history");
        return;
      }

      try {
        console.log("Querying transactions for storeId:", escrowWallet.storeId);
        const transactionsQuery = query(
          collection(db, "transactions"),
          where("storeId", "==", escrowWallet.storeId)
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const transactionsData = [];

        for (const txDoc of transactionsSnapshot.docs) {
          const txData = txDoc.data();
          const productIds = Array.isArray(txData.productIds) ? txData.productIds : [];
          const transfers = Array.isArray(txData.transfers) ? txData.transfers : [];
          let isRelevant = txData.escrowWallet === escrowId ||
                           productIds.some(p => p && p.sellerEscrowWallet === escrowId) ||
                           txData.sellerId === escrowWallet.walletId;

          if (isRelevant) {
            const productNames = [];
            for (const product of productIds) {
              if (product?.productId) {
                const productDocRef = doc(db, "products", product.productId);
                const productDoc = await getDoc(productDocRef);
                productNames.push(productDoc.exists() ? productDoc.data().name || "Unknown" : "Unknown");
              } else {
                productNames.push("Unknown");
              }
            }

            const fundRelease = transfers.find(t => t?.type === "fund_release");
            if (fundRelease) {
              transactionsData.push({
                id: txDoc.id,
                type: "Fund Release",
                amount: fundRelease.amount || 0,
                currency: fundRelease.currency || "USDC",
                destinationWallet: fundRelease.to || txData.sellerId || "Unknown",
                sellerId: txData.sellerId || "Unknown",
                status: fundRelease.status || "Completed",
                createdAt: fundRelease.timestamp || txData.createdAt || new Date().toISOString(),
                product: productNames.join(", ") || "N/A",
              });
            } else {
              transactionsData.push({
                id: txDoc.id,
                type: txData.type || "Purchase",
                amount: txData.amount || 0,
                currency: txData.currency || "USDC",
                destinationWallet: txData.sellerId || "Unknown",
                sellerId: txData.sellerId || "Unknown",
                status: txData.status || "Pending",
                createdAt: txData.createdAt || new Date().toISOString(),
                product: productNames.join(", ") || "N/A",
              });
            }
          }
        }

        console.log("Transaction history:", transactionsData);
        setTransactionHistory(transactionsData);
      } catch (err) {
        console.error("Error fetching transaction history:", err.message);
        setError("Failed to load transaction history: " + err.message);
        setTransactionHistory([]);
      }
    };

    // Run all fetches if user and escrowId are available
    if (user && user.walletId && escrowId) {
      fetchData().then(() => {
        if (escrowWallet?.storeId) {
          fetchInventory();
          fetchTransactionHistory();
        }
      });
    }
  }, [user, escrowId, escrowWallet?.storeId, escrowWallet?.walletId]);

  // Redirect unauthorized users
  useEffect(() => {
    if (!user || !user.walletId || user.role !== "god") {
      router.replace("/");
    }
  }, [user, router]);

  // Handle fund release
  const handleReleaseFunds = async () => {
    if (!escrowWallet || isReleasing) return;

    setIsReleasing(true);
    setError(null);
    setSuccess(null);

    try {
      // TODO: Integrate Google Cloud Function for fund release
      // e.g., await fetch('https://release-funds-xxx.run.app', { method: 'POST', body: JSON.stringify({ escrowId: escrowWallet.publicKey, walletId: escrowWallet.walletId, sol: escrowWallet.pendingSol, usdc: escrowWallet.pendingUsdc }) });

      // Simulate Firestore update
      const userDocRef = doc(db, "users", escrowWallet.walletId);
      await updateDoc(userDocRef, {
        "plan.status": "Released",
        "plan.pendingSol": 0,
        "plan.pendingUsdc": 0,
      });

      const transaction = {
        type: "Fund Release",
        amount: escrowWallet.pendingUsdc,
        currency: "USDC",
        destinationWallet: escrowWallet.walletId,
        status: "Completed",
        createdAt: new Date().toISOString(),
      };

      setEscrowWallet({
        ...escrowWallet,
        status: "Released",
        pendingSol: 0,
        pendingUsdc: 0,
      });
      setTransactionHistory([
        ...transactionHistory,
        { id: `TX-${Date.now()}`, ...transaction },
      ]);
      setSuccess("Funds released successfully!");
      setOpenReleaseModal(false);
    } catch (err) {
      console.error("Error releasing funds:", err.message);
      setError("Failed to release funds: " + err.message);
    } finally {
      setIsReleasing(false);
    }
  };

  // Modal handlers
  const handleOpenReleaseModal = () => setOpenReleaseModal(true);
  const handleCloseReleaseModal = () => setOpenReleaseModal(false);

  // Guard clauses
  if (!user || !user.walletId || user.role !== "god") {
    return null; // Redirect handled by useEffect
  }

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

  if (!escrowWallet) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          <MDTypography variant="body2" color="text">
            {error || "Loading escrow details..."}
          </MDTypography>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  // Pending Payments Table
  const pendingPaymentsTableData = {
    columns: [
      { Header: "Transaction ID", accessor: "id", width: "20%" },
      { Header: "Date", accessor: "date", width: "20%" },
      { Header: "Product", accessor: "product", width: "20%" },
      { Header: "Amount ($)", accessor: "amount", width: "20%" },
      { Header: "Status", accessor: "status", width: "20%" },
    ],
    rows: pendingPayments.length > 0 ? pendingPayments.map(item => ({
      ...item,
      id: (
        <Link href={`/dashboards/seller/sales/details/${item.id}`}>
          <MDTypography variant="button" color="info" fontWeight="medium">
            {item.id}
          </MDTypography>
        </Link>
      ),
      amount: (
        <MDTypography variant="button" color="text">
          {item.amount}
        </MDTypography>
      ),
      status: (
        <MDBox display="flex" alignItems="center">
          <Icon fontSize="small" sx={{ color: "warning.main", mr: 1 }}>
            hourglass_empty
          </Icon>
          <MDTypography variant="button" color="text">
            {item.status}
          </MDTypography>
        </MDBox>
      ),
    })) : [],
  };

  // Inventory Table
  const inventoryTableData = {
    columns: [
      { Header: "Name", accessor: "name", width: "20%" },
      { Header: "Type", accessor: "type", width: "10%" },
      { Header: "Price (USDC)", accessor: "price", width: "10%" },
      { Header: "Quantity/Variants", accessor: "quantityVariants", width: "20%" },
      { Header: "Categories", accessor: "categories", width: "20%" },
      { Header: "Status", accessor: "status", width: "10%" },
      { Header: "Date", accessor: "createdAt", width: "10%" },
    ],
    rows: inventoryData.length > 0 ? inventoryData.map(item => ({
      ...item,
      name: item.id ? (
        <Link href={`/dashboards/god/products/edit/${item.id}`}>
          <MDTypography variant="button" color="info" fontWeight="medium">
            {item.name || "N/A"}
          </MDTypography>
        </Link>
      ) : (
        <MDTypography variant="button" color="error">Invalid Name</MDTypography>
      ),
      type: (
        <MDTypography variant="button" color="text">{item.type === "digital" ? "Digital" : item.type === "rwi" ? "RWI" : "N/A"}</MDTypography>
      ),
      price: (
        <MDTypography variant="button" color="text">{item.price ? `${item.price} USDC` : "N/A"}</MDTypography>
      ),
      quantityVariants: (
        <MDTypography variant="button" color="text">
          {item.type === "digital" ? item.quantity || "N/A" : 
            item.variants?.map(v => `${v.quantity} (${v.size}, ${v.color})`).join(", ") || "N/A"}
        </MDTypography>
      ),
      categories: (
        <MDTypography variant="button" color="text">{item.categories?.join(", ") || "N/A"}</MDTypography>
      ),
      status: (
        <MDBox display="flex" alignItems="center">
          <Icon fontSize="small" sx={{ color: item.isActive ? "success.main" : "error.main", mr: 1 }}>
            {item.isActive ? "check_circle" : "cancel"}
          </Icon>
          <MDTypography variant="button" color="text">{item.isActive ? "Active" : "Removed"}</MDTypography>
        </MDBox>
      ),
    })) : [],
  };

  // Transaction History Table
  const transactionHistoryTableData = {
    columns: [
      { Header: "Transaction ID", accessor: "id", width: "15%" },
      { Header: "Type", accessor: "type", width: "15%" },
      { Header: "Amount", accessor: "amount", width: "15%" },
      { Header: "Currency", accessor: "currency", width: "10%" },
      { Header: "Destination Wallet", accessor: "destinationWallet", width: "15%" },
      { Header: "Seller ID", accessor: "sellerId", width: "15%" },
      { Header: "Status", accessor: "status", width: "10%" },
      { Header: "Date", accessor: "createdAt", width: "15%" },
      { Header: "Product", accessor: "product", width: "20%" },
    ],
    rows: transactionHistory.length > 0 ? transactionHistory.map(tx => ({
      ...tx,
      id: (
        <Link href={`/dashboards/god/products/edit/${tx.id}`}>
          <MDTypography variant="button" color="info" fontWeight="medium">
            {tx.id}
          </MDTypography>
        </Link>
      ),
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
      sellerId: (
        <MDTypography variant="button" color="text">
          {tx.sellerId.slice(0, 6)}...{tx.sellerId.slice(-4)}
        </MDTypography>
      ),
      status: (
        <MDBox display="flex" alignItems="center">
          <Icon fontSize="small" sx={{ color: tx.status === "Completed" ? "success.main" : "warning.main", mr: 1 }}>
            {tx.status === "completed" ? "check_circle" : "hourglass_empty"}
          </Icon>
          <MDTypography variant="button" color="text">
            {tx.status}
          </MDTypography>
        </MDBox>
      ),
      product: (
        <MDTypography variant="button" color="text">
          {tx.product}
        </MDTypography>
      ),
    })) : [],
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
              disabled={isReleasing || escrowWallet.status === "Released"}
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
                    {escrowWallet.solBalance.toFixed(4)} SOL
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
                    ${escrowWallet.usdcBalance.toFixed(2)}
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
                    {inventoryCount}
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
                    ${escrowWallet.pendingUsdc.toFixed(2)}
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
                {pendingPayments.length === 0 ? (
                  <MDTypography variant="body2" color="text">
                    No pending payments found.
                  </MDTypography>
                ) : (
                  <DataTable
                    table={pendingPaymentsTableData}
                    entriesPerPage={false}
                    canSearch={false}
                    sx={{
                      "& th": { paddingRight: "20px !important", paddingLeft: "20px !important" },
                      "& .MuiTablePagination-root": { display: "none !important" },
                    }}
                  />
                )}
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
                {inventoryData.length === 0 ? (
                  <MDTypography variant="body2" color="text">
                    No inventory items found.
                  </MDTypography>
                ) : (
                  <DataTable
                    table={inventoryTableData}
                    entriesPerPage={false}
                    canSearch={false}
                    sx={{
                      "& th": { paddingRight: "20px !important", paddingLeft: "20px !important" },
                      "& .MuiTablePagination-root": { display: "none !important" },
                    }}
                  />
                )}
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
                {transactionHistory.length === 0 ? (
                  <MDTypography variant="body2" color="text">
                    No transaction history found.
                  </MDTypography>
                ) : (
                  <DataTable
                    table={transactionHistoryTableData}
                    entriesPerPage={false}
                    canSearch={false}
                    sx={{
                      "& th": { paddingRight: "20px !important", paddingLeft: "20px !important" },
                      "& .MuiTablePagination-root": { display: "none !important" },
                    }}
                  />
                )}
              </MDBox>
            </Card>
          </Grid>
        </Grid>

        {/* Release Funds Modal */}
        <Dialog open={openReleaseModal} onClose={handleCloseReleaseModal}>
          <DialogTitle>Confirm Fund Release</DialogTitle>
          <DialogContent>
            <MDTypography variant="body2" mb={2}>
              Release {escrowWallet.pendingSol.toFixed(4)} SOL and ${escrowWallet.pendingUsdc.toFixed(2)} USDC to {escrowWallet.walletId.slice(0, 6)}...{escrowWallet.walletId.slice(-4)}?
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