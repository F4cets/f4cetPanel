/**
=========================================================
* F4cetPanel - Seller Escrow Page
=========================================================

* Copyright 2023 F4cets Team
*/

// React imports
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

// Firebase imports
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "/lib/firebase";

// User context
import { useUser } from "/contexts/UserContext";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import DataTable from "/examples/Tables/DataTable";

// @mui icons
import Icon from "@mui/material/Icon";

function SellerEscrow() {
  const { user } = useUser();
  const router = useRouter();
  const [pendingEscrowPayments, setPendingEscrowPayments] = useState([]);
  const [escrowNFTInventory, setEscrowNFTInventory] = useState([]);
  const [digitalGoodsInEscrow, setDigitalGoodsInEscrow] = useState(0);
  const [rwiGoodsInEscrow, setRwiGoodsInEscrow] = useState(0);
  const [totalPendingItems, setTotalPendingItems] = useState(0);
  const [totalPendingAmount, setTotalPendingAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect to home if no user, no walletId, or unauthorized role
  useEffect(() => {
    if (!user || !user.walletId || user.role !== "seller") {
      console.log("SellerEscrow: Unauthorized access, redirecting to home");
      router.replace("/");
    }
  }, [user, router]);

  // Fetch escrow data from Firestore
  useEffect(() => {
    const fetchEscrowData = async () => {
      if (!user || !user.walletId) return;

      try {
        console.log("SellerEscrow: Fetching data for seller:", user.walletId);

        // Fetch pending escrow payments (transactions with buyerConfirmed: false)
        const txQuery = query(
          collection(db, "transactions"),
          where("sellerId", "==", user.walletId),
          where("buyerConfirmed", "==", false)
        );
        const txSnapshot = await getDocs(txQuery);
        const transactions = [];

        for (const txDoc of txSnapshot.docs) {
          const txData = txDoc.data();
          const createdDate = txData.createdAt?.toDate ? txData.createdAt.toDate() : new Date(txData.createdAt);
          let productName = "Unknown Product";

          // Fetch product details
          if (txData.productIds?.[0]) {
            const productDoc = await getDoc(doc(db, "products", txData.productIds[0]));
            if (productDoc.exists()) {
              productName = productDoc.data().name || productName;
            }
          }

          // Check for flagged issues
          const notificationsQuery = query(
            collection(db, "notifications"),
            where("orderId", "==", txDoc.id),
            where("type", "==", "issue")
          );
          const notificationsSnapshot = await getDocs(notificationsQuery);
          const isFlagged = !notificationsSnapshot.empty;

          // Calculate net amount (minus 4% F4cet fee)
          const fee = txData.amount * 0.04;
          const netAmount = txData.amount - fee;

          // Check if within 7 days of deliveryConfirmedAt
          let status = "Pending";
          if (txData.deliveryConfirmedAt) {
            const deliveryDate = txData.deliveryConfirmedAt.toDate ? txData.deliveryConfirmedAt.toDate() : new Date(txData.deliveryConfirmedAt);
            const sevenDaysAfter = new Date(deliveryDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            const now = new Date();
            if (now > sevenDaysAfter && !isFlagged) {
              status = "Ready for Release";
            }
          }

          transactions.push({
            id: txDoc.id,
            date: createdDate.toISOString().split("T")[0],
            buyerId: txData.buyerId ? `${txData.buyerId.slice(0, 6)}...${txData.buyerId.slice(-4)}` : "N/A",
            product: productName,
            amount: netAmount,
            currency: txData.currency || "USDC",
            status,
            type: txData.type,
          });
        }

        // Fetch all products for NFT inventory (pre-minted NFTs)
        const productsQuery = query(
          collection(db, "products"),
          where("sellerId", "==", user.walletId)
        );
        const productsSnapshot = await getDocs(productsQuery);
        const products = [];

        for (const productDoc of productsSnapshot.docs) {
          const productData = productDoc.data();
          const createdDate = productData.createdAt?.toDate ? productData.createdAt.toDate() : new Date(productData.createdAt);

          // Determine quantity based on product type
          let quantity = 0;
          if (productData.type === "digital") {
            quantity = productData.quantity || 0;
          } else if (productData.type === "rwi" && Array.isArray(productData.variants) && productData.variants.length > 0) {
            // Sum quantities from variants for RWI products
            quantity = productData.variants.reduce((sum, variant) => {
              const variantQty = parseInt(variant.quantity, 10);
              return sum + (isNaN(variantQty) ? 0 : variantQty);
            }, 0);
          }

          console.log(`Product ${productDoc.id}: type=${productData.type}, quantity=${quantity}, nftMint=${productData.nftMint}`);

          if (quantity > 0 && productData.nftMint) {
            products.push({
              id: productData.nftMint,
              date: createdDate.toISOString().split("T")[0],
              product: productData.name || "Unknown Product",
              invId: productDoc.id,
              quantity,
              status: productData.isActive ? "Active" : "Removed",
            });
          }
        }

        // Calculate metrics
        const digitalCount = transactions.filter(tx => tx.type === "digital").length;
        const rwiCount = transactions.filter(tx => tx.type === "rwi").length;
        const totalItems = transactions.length;
        const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);

        console.log("Escrow NFT Inventory:", products);

        setPendingEscrowPayments(transactions);
        setEscrowNFTInventory(products);
        setDigitalGoodsInEscrow(digitalCount);
        setRwiGoodsInEscrow(rwiCount);
        setTotalPendingItems(totalItems);
        setTotalPendingAmount(totalAmount);
        setLoading(false);
      } catch (err) {
        console.error("SellerEscrow: Error fetching escrow data:", err);
        setError("Failed to load escrow data: " + err.message);
        setLoading(false);
      }
    };

    fetchEscrowData();
  }, [user, router]);

  // Ensure user is loaded and authorized before rendering
  if (!user || !user.walletId || user.role !== "seller") {
    return null; // Or a loading spinner
  }

  const walletId = user.walletId;

  // Pending Escrow Payments Table
  const pendingEscrowTableData = {
    columns: [
      { Header: "Escrow ID", accessor: "id", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Date", accessor: "date", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Buyer ID", accessor: "buyerId", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Product", accessor: "product", width: "20%", sx: { paddingRight: "20px" } },
      { Header: "Amount", accessor: "amount", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Status", accessor: "status", width: "10%", sx: { paddingRight: "20px" } },
    ],
    rows: pendingEscrowPayments.map(item => ({
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
          {item.amount.toFixed(2)} {item.currency}
        </MDTypography>
      ),
      status: (
        <MDBox display="flex" alignItems="center">
          <Icon
            fontSize="small"
            sx={{
              color: item.status === "Pending" ? "warning.main" : "success.main",
              mr: 1,
            }}
          >
            {item.status === "Pending" ? "hourglass_empty" : "check_circle"}
          </Icon>
          <MDTypography variant="button" color="text">
            {item.status}
          </MDTypography>
        </MDBox>
      ),
    })),
  };

  // Escrow NFT Inventory Table
  const escrowNFTTableData = {
    columns: [
      { Header: "NFT ID", accessor: "id", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Date", accessor: "date", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Product", accessor: "product", width: "20%", sx: { paddingRight: "20px" } },
      { Header: "Inventory ID", accessor: "invId", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Quantity", accessor: "quantity", width: "15%", sx: { paddingRight: "20px" } },
      { Header: "Status", accessor: "status", width: "10%", sx: { paddingRight: "20px" } },
    ],
    rows: escrowNFTInventory.map(item => ({
      ...item,
      invId: (
        <Link href={`/dashboards/seller/inventory/details/${item.invId}`}>
          <MDTypography variant="button" color="info" fontWeight="medium">
            {item.invId}
          </MDTypography>
        </Link>
      ),
      status: (
        <MDBox display="flex" alignItems="center">
          <Icon
            fontSize="small"
            sx={{
              color: item.status === "Active" ? "success.main" : "warning.main",
              mr: 1,
            }}
          >
            {item.status === "Active" ? "check_circle" : "removed"}
          </Icon>
          <MDTypography variant="button" color="text">
            {item.status}
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
          <MDBox
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            justifyContent={{ xs: "center", sm: "space-between" }}
            alignItems={{ xs: "center", sm: "center" }}
            gap={{ xs: 2, sm: 2 }}
          >
            <MDTypography variant="h4" color="dark">
              {walletId ? walletId.slice(0, 6) + "..." + walletId.slice(-4) : "Seller"} -- Escrow
            </MDTypography>
          </MDBox>
        </MDBox>

        {error && (
          <MDTypography variant="body2" color="error" mb={2}>
            {error}
          </MDTypography>
        )}
        {loading ? (
          <MDTypography variant="body2" color="text">
            Loading escrow data...
          </MDTypography>
        ) : (
          <>
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
                      <Icon fontSize="medium">cloud</Icon>
                    </MDBox>
                    <MDBox>
                      <MDTypography variant="h6" color="dark">
                        Digital Goods
                      </MDTypography>
                      <MDTypography variant="h4" color="info">
                        {digitalGoodsInEscrow}
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
                      <Icon fontSize="medium">local_shipping</Icon>
                    </MDBox>
                    <MDBox>
                      <MDTypography variant="h6" color="dark">
                        RWI Goods
                      </MDTypography>
                      <MDTypography variant="h4" color="info">
                        {rwiGoodsInEscrow}
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
                      <Icon fontSize="medium">lock</Icon>
                    </MDBox>
                    <MDBox>
                      <MDTypography variant="h6" color="dark">
                        Total Pending
                      </MDTypography>
                      <MDTypography variant="h4" color="info">
                        {totalPendingItems}
                      </MDTypography>
                      <MDTypography variant="caption" color="text">
                        Items
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
                      <Icon fontSize="medium">attach_money</Icon>
                    </MDBox>
                    <MDBox>
                      <MDTypography variant="h6" color="dark">
                        Total $ Pending
                      </MDTypography>
                      <MDTypography variant="h4" color="info">
                        ${totalPendingAmount.toFixed(2)}
                      </MDTypography>
                      <MDTypography variant="caption" color="text">
                        In Escrow
                      </MDTypography>
                    </MDBox>
                  </MDBox>
                </Card>
              </Grid>
            </Grid>

            {/* Escrow Tables Section */}
            <Grid container spacing={3}>
              {/* Pending Escrow Payments */}
              <Grid item xs={12}>
                <Card
                  sx={{
                    backgroundColor: "transparent",
                    boxShadow: "none",
                    overflow: "hidden",
                  }}
                >
                  <MDBox p={3}>
                    <MDTypography variant="h5" color="dark" mb={2}>
                      Pending Escrow Payments from Buyer Purchases
                    </MDTypography>
                    {pendingEscrowPayments.length === 0 ? (
                      <MDTypography variant="body2" color="text">
                        No pending escrow payments.
                      </MDTypography>
                    ) : (
                      <DataTable
                        table={pendingEscrowTableData}
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

              {/* Escrow NFT Inventory */}
              <Grid item xs={12}>
                <Card
                  sx={{
                    backgroundColor: "transparent",
                    boxShadow: "none",
                    overflow: "hidden",
                  }}
                >
                  <MDBox p={3}>
                    <MDTypography variant="h5" color="dark" mb={2}>
                      Current NFT Inventory Being Held in Escrow
                    </MDTypography>
                    {escrowNFTInventory.length === 0 ? (
                      <MDTypography variant="body2" color="text">
                        No NFT inventory in escrow.
                      </MDTypography>
                    ) : (
                      <DataTable
                        table={escrowNFTTableData}
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
          </>
        )}
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default SellerEscrow;