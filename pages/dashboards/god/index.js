/**
=========================================================
* F4cetPanel - God Dashboard
=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useState, useEffect, useRef } from "react";
import { db } from "/lib/firebase";
import { getFirestore, doc, collection, getDocs, getDoc, query, where } from "firebase/firestore";
import Link from "next/link";
import { fetchSolPrice } from "/lib/getSolPrice";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
import MDButton from "/components/MDButton";
import DataTable from "/examples/Tables/DataTable";
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";

function GodDashboard() {
  // State for Firestore data
  const [sales, setSales] = useState(0);
  const [buyers, setBuyers] = useState(0);
  const [sellers, setSellers] = useState(0);
  const [affiliates, setAffiliates] = useState(0);
  const [topStores, setTopStores] = useState({ columns: [], rows: [] });
  const [topItems, setTopItems] = useState({ columns: [], rows: [] });
  const [flaggedStores, setFlaggedStores] = useState({ columns: [], rows: [] });
  const [flaggedItems, setFlaggedItems] = useState({ columns: [], rows: [] });
  // State for Create Bubblegum Tree button
  const [isLoading, setIsLoading] = useState(false);
  const [treeResponse, setTreeResponse] = useState(null);
  const [error, setError] = useState(null);
  // Track fetchData execution
  const hasFetched = useRef(false);

  // Handle Create Bubblegum Tree
  const handleCreateTree = async () => {
    setIsLoading(true);
    setError(null);
    setTreeResponse(null);
    try {
      const response = await fetch('https://createbubblegumtree-232592911911.us-central1.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (response.ok) {
        setTreeResponse(data);
      } else {
        throw new Error(data.error || 'Failed to create Bubblegum tree');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Firestore data
  useEffect(() => {
    const fetchData = async () => {
      if (hasFetched.current) return;
      hasFetched.current = true;

      try {
        // Fetch SOL price
        const solPrice = await fetchSolPrice();

        // Calculate date 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

        // Sales: Sum of transaction amounts in USD for last 30 days
        const transactionsQuery = query(collection(db, "transactions"));
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const totalSales = transactionsSnapshot.docs.reduce((sum, doc) => {
          const data = doc.data();
          if (data.createdAt && new Date(data.createdAt) >= thirtyDaysAgo) {
            const amount = data.amount || 0;
            return sum + (data.currency === "SOL" ? amount * solPrice : amount);
          }
          return sum;
        }, 0);
        setSales(totalSales.toFixed(2));

        // Buyers: Count users with role "buyer"
        const buyersQuery = query(collection(db, "users"), where("role", "==", "buyer"));
        const buyersSnapshot = await getDocs(buyersQuery);
        setBuyers(buyersSnapshot.size);

        // Sellers: Count users with role "seller"
        const sellersQuery = query(collection(db, "users"), where("role", "==", "seller"));
        const sellersSnapshot = await getDocs(sellersQuery);
        setSellers(sellersSnapshot.size);

        // Affiliates: Count documents in affiliates collection
        const affiliatesQuery = query(collection(db, "affiliates"));
        const affiliatesSnapshot = await getDocs(affiliatesQuery);
        setAffiliates(affiliatesSnapshot.size);

        // Fetch stores for reference
        const storesQuery = query(collection(db, "stores"));
        const storesSnapshot = await getDocs(storesQuery);

        // Top Selling Stores
        const storeRevenue = {};
        const storeRatings = {};
        transactionsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.createdAt && new Date(data.createdAt) >= thirtyDaysAgo) {
            const storeId = data.storeId;
            if (storeId) {
              const amount = data.currency === "SOL" ? (data.amount || 0) * solPrice : (data.amount || 0);
              storeRevenue[storeId] = (storeRevenue[storeId] || 0) + amount;
              if (data.sellerRating) {
                storeRatings[storeId] = storeRatings[storeId] || { sum: 0, count: 0 };
                storeRatings[storeId].sum += data.sellerRating;
                storeRatings[storeId].count += 1;
              }
            }
          }
        });

        const storeRows = [];
        storesSnapshot.forEach((doc) => {
          const data = doc.data();
          const storeId = data.storeId || doc.id;
          const revenue = storeRevenue[storeId] || 0;
          const avgRating = storeRatings[storeId]
            ? (storeRatings[storeId].sum / storeRatings[storeId].count).toFixed(1)
            : "N/A";
          if (revenue > 0) {
            storeRows.push({
              storeName: (
                <Link href={`/dashboards/god/stores/edit/${storeId}`}>
                  <MDTypography variant="button" color="info" fontWeight="medium">
                    {data.name || storeId}
                  </MDTypography>
                </Link>
              ),
              totalSales: `$${revenue.toLocaleString()}`,
              avgRating,
            });
          }
        });

        storeRows.sort((a, b) => parseFloat(b.totalSales.replace(/[$,]/g, '')) - parseFloat(a.totalSales.replace(/[$,]/g, '')));
        setTopStores({
          columns: [
            { Header: "Store Name", accessor: "storeName", width: "40%" },
            { Header: "Total Sales", accessor: "totalSales", width: "30%" },
            { Header: "Avg. Rating", accessor: "avgRating", width: "30%" },
          ],
          rows: storeRows.slice(0, 10),
        });

        // Top Selling Items
        const productRevenue = {};
        transactionsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.createdAt && new Date(data.createdAt) >= thirtyDaysAgo) {
            if (Array.isArray(data.productIds)) {
              const amountPerProduct = (data.amount || 0) / data.productIds.length;
              data.productIds.forEach((productId) => {
                if (!productRevenue[productId]) {
                  productRevenue[productId] = { amount: 0, currency: data.currency || "USDC" };
                }
                productRevenue[productId].amount += amountPerProduct;
              });
            }
          }
        });

        const productsQuery = query(collection(db, "products"));
        const productsSnapshot = await getDocs(productsQuery);
        const productRows = [];
        productsSnapshot.forEach((doc) => {
          const data = doc.data();
          const productId = doc.id;
          const revenueData = productRevenue[productId];
          if (revenueData && revenueData.amount > 0) {
            const storeDoc = storesSnapshot.docs.find(s => s.id === data.storeId);
            const revenueDisplay = revenueData.currency === "SOL"
              ? `${revenueData.amount.toFixed(8)} SOL`
              : `$${revenueData.amount.toLocaleString()}`;
            productRows.push({
              itemName: (
                <Link href={`/dashboards/god/products/edit/${productId}`}>
                  <MDTypography variant="button" color="info" fontWeight="medium">
                    {data.name || productId}
                  </MDTypography>
                </Link>
              ),
              storeName: storeDoc ? storeDoc.data().name : "Unknown",
              revenue: revenueDisplay,
              revenueUSD: revenueData.currency === "SOL" ? revenueData.amount * solPrice : revenueData.amount,
            });
          }
        });

        productRows.sort((a, b) => b.revenueUSD - a.revenueUSD);
        setTopItems({
          columns: [
            { Header: "Item Name", accessor: "itemName", width: "40%" },
            { Header: "Store Name", accessor: "storeName", width: "30%" },
            { Header: "Revenue", accessor: "revenue", width: "30%" },
          ],
          rows: productRows.slice(0, 10),
        });

        // Flagged Stores and Items
        const notificationsQuery = query(collection(db, "notifications"), where("type", "==", "issue"));
        const notificationsSnapshot = await getDocs(notificationsQuery);
        const flaggedStoreIssues = {};
        const flaggedItemIssues = {};

        for (const notifDoc of notificationsSnapshot.docs) {
          const notifData = notifDoc.data();
          const flaggedBy = notifData.flaggedBy || "unknown";
          const txDocRef = doc(db, "transactions", notifData.orderId);
          const txDoc = await getDoc(txDocRef);
          if (txDoc.exists()) {
            const txData = txDoc.data();
            const storeId = txData.storeId;
            const storeDoc = storesSnapshot.docs.find(s => s.id === storeId);
            if (storeDoc && storeDoc.data().isActive !== false) {
              const storeName = storeDoc.data().name;
              flaggedStoreIssues[storeId] = flaggedStoreIssues[storeId] || { count: 0, uniqueUsers: new Set(), reasons: [], firstFlagged: null };
              flaggedStoreIssues[storeId].uniqueUsers.add(flaggedBy);
              flaggedStoreIssues[storeId].count += 1;
              flaggedStoreIssues[storeId].reasons.push(notifData.description);
              const notifDate = new Date(notifData.timestamp);
              if (!flaggedStoreIssues[storeId].firstFlagged || notifDate < flaggedStoreIssues[storeId].firstFlagged) {
                flaggedStoreIssues[storeId].firstFlagged = notifDate;
              }
            }
            if (Array.isArray(txData.productIds)) {
              txData.productIds.forEach((productId) => {
                const productDoc = productsSnapshot.docs.find(p => p.id === productId);
                if (productDoc && productDoc.data().isActive !== false) {
                  const productName = productDoc.data().name;
                  flaggedItemIssues[productId] = flaggedItemIssues[productId] || { count: 0, uniqueUsers: new Set(), reasons: [], firstFlagged: null, storeName };
                  flaggedItemIssues[productId].uniqueUsers.add(flaggedBy);
                  flaggedItemIssues[productId].count += 1;
                  flaggedItemIssues[productId].reasons.push(notifData.description);
                  const notifDate = new Date(notifData.timestamp);
                  if (!flaggedItemIssues[productId].firstFlagged || notifDate < flaggedItemIssues[productId].firstFlagged) {
                    flaggedItemIssues[productId].firstFlagged = notifDate;
                  }
                }
              });
            }
          }
        }

        const flaggedStoreRows = Object.entries(flaggedStoreIssues)
          .filter(([_, issue]) => issue.uniqueUsers.size >= 3)
          .map(([storeId, issue]) => ({
            storeName: (
              <Link href={`/dashboards/god/stores/edit/${storeId}`}>
                <MDTypography variant="button" color="info" fontWeight="medium">
                  {storesSnapshot.docs.find(s => s.id === storeId)?.data().name || storeId}
                </MDTypography>
              </Link>
            ),
            flagCount: issue.count,
            uniqueUsers: issue.uniqueUsers.size,
            reasons: issue.reasons.join("; "),
            date: issue.firstFlagged ? issue.firstFlagged.toISOString().split('T')[0] : "N/A",
          }));

        setFlaggedStores({
          columns: [
            { Header: "Store Name", accessor: "storeName", width: "30%" },
            { Header: "Flag Count", accessor: "flagCount", width: "15%" },
            { Header: "Unique Users", accessor: "uniqueUsers", width: "15%" },
            { Header: "Reasons", accessor: "reasons", width: "25%" },
            { Header: "First Flagged", accessor: "date", width: "15%" },
          ],
          rows: flaggedStoreRows,
        });

        const flaggedItemRows = Object.entries(flaggedItemIssues)
          .filter(([_, issue]) => issue.uniqueUsers.size >= 3)
          .map(([productId, issue]) => ({
            itemName: (
              <Link href={`/dashboards/god/products/edit/${productId}`}>
                <MDTypography variant="button" color="info" fontWeight="medium">
                  {productsSnapshot.docs.find(p => p.id === productId)?.data().name || productId}
                </MDTypography>
              </Link>
            ),
            storeName: issue.storeName,
            flagCount: issue.count,
            uniqueUsers: issue.uniqueUsers.size,
            reasons: issue.reasons.join("; "),
            date: issue.firstFlagged ? issue.firstFlagged.toISOString().split('T')[0] : "N/A",
          }));

        setFlaggedItems({
          columns: [
            { Header: "Item Name", accessor: "itemName", width: "30%" },
            { Header: "Store Name", accessor: "storeName", width: "15%" },
            { Header: "Flag Count", accessor: "flagCount", width: "15%" },
            { Header: "Unique Users", accessor: "uniqueUsers", width: "15%" },
            { Header: "Reasons", accessor: "reasons", width: "20%" },
            { Header: "First Flagged", accessor: "date", width: "15%" },
          ],
          rows: flaggedItemRows,
        });
      } catch (error) {
        console.error("GodDashboard: Error fetching Firestore data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {/* Create Bubblegum Tree Button */}
        {/* TODO: Remove this button after tree creation */}
        <MDBox mb={3} display="flex" justifyContent="center">
          <MDButton
            variant="gradient"
            color="info"
            onClick={handleCreateTree}
            disabled={isLoading}
          >
            {isLoading ? "Creating Tree..." : "Create Bubblegum Tree"}
          </MDButton>
        </MDBox>
        {/* Success/Error Messages */}
        {treeResponse && (
          <MDBox mb={3} p={2} bgColor="success" borderRadius="md">
            <MDTypography variant="body2" color="white">
              Bubblegum Tree Created Successfully! Tree ID: {treeResponse.treeId}, Public Key: {treeResponse.publicKey}
            </MDTypography>
          </MDBox>
        )}
        {error && (
          <MDBox mb={3} p={2} bgColor="error" borderRadius="md">
            <MDTypography variant="body2" color="white">
              Error: {error}
            </MDTypography>
          </MDBox>
        )}
        <MDBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
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
                    <MDTypography variant="h6" color="dark">Sales</MDTypography>
                    <MDTypography variant="h4" color="info">${sales}</MDTypography>
                    <MDTypography variant="caption" color="text">Total Sales (Last 30 Days)</MDTypography>
                  </MDBox>
                </MDBox>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
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
                    <Icon fontSize="medium">people</Icon>
                  </MDBox>
                  <MDBox>
                    <MDTypography variant="h6" color="dark">Buyers</MDTypography>
                    <MDTypography variant="h4" color="info">{buyers.toLocaleString()}</MDTypography>
                    <MDTypography variant="caption" color="text">Total Buyers</MDTypography>
                  </MDBox>
                </MDBox>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
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
                    <Icon fontSize="medium">person_add</Icon>
                  </MDBox>
                  <MDBox>
                    <MDTypography variant="h6" color="dark">Sellers</MDTypography>
                    <MDTypography variant="h4" color="info">{sellers.toLocaleString()}</MDTypography>
                    <MDTypography variant="caption" color="text">Total Sellers</MDTypography>
                  </MDBox>
                </MDBox>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
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
                    <Icon fontSize="medium">handshake</Icon>
                  </MDBox>
                  <MDBox>
                    <MDTypography variant="h6" color="dark">Affiliates</MDTypography>
                    <MDTypography variant="h4" color="info">{affiliates.toLocaleString()}</MDTypography>
                    <MDTypography variant="caption" color="text">Total Affiliates</MDTypography>
                  </MDBox>
                </MDBox>
              </Card>
            </Grid>
          </Grid>
        </MDBox>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox pt={3} px={3}>
                <MDTypography variant="h6" fontWeight="medium">
                  Top 10 Selling Stores
                </MDTypography>
              </MDBox>
              <MDBox py={1}>
                <DataTable
                  table={topStores}
                  entriesPerPage={false}
                  showTotalEntries={false}
                  isSorted={false}
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <MDBox pt={3} px={3}>
                <MDTypography variant="h6" fontWeight="medium">
                  Top 10 Selling Items
                </MDTypography>
              </MDBox>
              <MDBox py={1}>
                <DataTable
                  table={topItems}
                  entriesPerPage={false}
                  showTotalEntries={false}
                  isSorted={false}
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <MDBox pt={3} px={3}>
                <MDTypography variant="h6" fontWeight="medium">
                  Flagged Stores
                </MDTypography>
              </MDBox>
              <MDBox py={1}>
                <DataTable
                  table={flaggedStores}
                  entriesPerPage={false}
                  showTotalEntries={false}
                  isSorted={false}
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <MDBox pt={3} px={3}>
                <MDTypography variant="h6" fontWeight="medium">
                  Flagged Items
                </MDTypography>
              </MDBox>
              <MDBox py={1}>
                <DataTable
                  table={flaggedItems}
                  entriesPerPage={false}
                  showTotalEntries={false}
                  isSorted={false}
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default GodDashboard;