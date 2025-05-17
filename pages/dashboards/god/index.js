/**
=========================================================
* F4cetPanel - God Dashboard
=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useState, useEffect } from "react";
import { db } from "/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
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

  // Fetch Firestore data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Sales: Sum of transaction amounts
        const transactionsQuery = query(collection(db, "transactions"));
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const totalSales = transactionsSnapshot.docs.reduce((sum, doc) => {
          const data = doc.data();
          return sum + (data.amount || 0);
        }, 0);
        setSales(totalSales);

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

        // Top Selling Stores
        const storeRevenue = {};
        const storeRatings = {};
        transactionsSnapshot.forEach((doc) => {
          const data = doc.data();
          const storeId = data.storeId;
          if (storeId) {
            storeRevenue[storeId] = (storeRevenue[storeId] || 0) + data.amount;
            if (data.sellerRating) {
              storeRatings[storeId] = storeRatings[storeId] || { sum: 0, count: 0 };
              storeRatings[storeId].sum += data.sellerRating;
              storeRatings[storeId].count += 1;
            }
          }
        });

        const storesQuery = query(collection(db, "stores"));
        const storesSnapshot = await getDocs(storesQuery);
        const storeRows = [];
        storesSnapshot.forEach((doc) => {
          const data = doc.data();
          const revenue = storeRevenue[data.storeId] || 0;
          const avgRating = storeRatings[data.storeId]
            ? (storeRatings[data.storeId].sum / storeRatings[data.storeId].count).toFixed(1)
            : "N/A";
          if (revenue > 0) {
            storeRows.push({
              storeName: data.name,
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
          rows: storeRows.slice(0, 5),
        });

        // Top Selling Items
        const productRevenue = {};
        transactionsSnapshot.forEach((doc) => {
          const data = doc.data();
          data.productIds.forEach((productId) => {
            productRevenue[productId] = (productRevenue[productId] || 0) + (data.amount / data.productIds.length);
          });
        });

        const productsQuery = query(collection(db, "products"));
        const productsSnapshot = await getDocs(productsQuery);
        const productRows = [];
        productsSnapshot.forEach((doc) => {
          const data = doc.data();
          const revenue = productRevenue[doc.id] || 0;
          if (revenue > 0) {
            const storeDoc = storesSnapshot.docs.find(s => s.id === data.storeId);
            productRows.push({
              itemName: data.name,
              storeName: storeDoc ? storeDoc.data().name : "Unknown",
              revenue: `$${revenue.toLocaleString()}`,
            });
          }
        });

        productRows.sort((a, b) => parseFloat(b.revenue.replace(/[$,]/g, '')) - parseFloat(a.revenue.replace(/[$,]/g, '')));
        setTopItems({
          columns: [
            { Header: "Item Name", accessor: "itemName", width: "40%" },
            { Header: "Store Name", accessor: "storeName", width: "30%" },
            { Header: "Revenue", accessor: "revenue", width: "30%" },
          ],
          rows: productRows.slice(0, 5),
        });

        // Flagged Stores
        const notificationsQuery = query(collection(db, "notifications"), where("type", "==", "issue"));
        const notificationsSnapshot = await getDocs(notificationsQuery);
        const flaggedStoreIssues = {};
        const flaggedItemIssues = {};

        for (const notifDoc of notificationsSnapshot.docs) {
          const notifData = notifDoc.data();
          const txDocRef = doc(db, "transactions", notifData.orderId);
          const txDoc = await getDoc(txDocRef);
          if (txDoc.exists()) {
            const txData = txDoc.data();
            const storeId = txData.storeId;
            const storeDoc = storesSnapshot.docs.find(s => s.id === storeId);
            if (storeDoc) {
              const storeName = storeDoc.data().name;
              flaggedStoreIssues[storeId] = flaggedStoreIssues[storeId] || { count: 0, reasons: [], firstFlagged: null };
              flaggedStoreIssues[storeId].count += 1;
              flaggedStoreIssues[storeId].reasons.push(notifData.description);
              const notifDate = new Date(notifData.timestamp);
              if (!flaggedStoreIssues[storeId].firstFlagged || notifDate < flaggedStoreIssues[storeId].firstFlagged) {
                flaggedStoreIssues[storeId].firstFlagged = notifDate;
              }
            }
            txData.productIds.forEach((productId) => {
              const productDoc = productsSnapshot.docs.find(p => p.id === productId);
              if (productDoc) {
                const productName = productDoc.data().name;
                flaggedItemIssues[productId] = flaggedItemIssues[productId] || { count: 0, reasons: [], firstFlagged: null, storeName };
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

        const flaggedStoreRows = Object.entries(flaggedStoreIssues).map(([storeId, issue]) => ({
          storeName: storesSnapshot.docs.find(s => s.id === storeId)?.data().name || storeId,
          flagCount: issue.count,
          reasons: issue.reasons.join("; "),
          date: issue.firstFlagged ? issue.firstFlagged.toISOString().split('T')[0] : "N/A",
        }));

        setFlaggedStores({
          columns: [
            { Header: "Store Name", accessor: "storeName", width: "30%" },
            { Header: "Flag Count", accessor: "flagCount", width: "20%" },
            { Header: "Reasons", accessor: "reasons", width: "30%" },
            { Header: "First Flagged", accessor: "date", width: "20%" },
          ],
          rows: flaggedStoreRows,
        });

        const flaggedItemRows = Object.entries(flaggedItemIssues).map(([productId, issue]) => ({
          itemName: productsSnapshot.docs.find(p => p.id === productId)?.data().name || productId,
          storeName: issue.storeName,
          flagCount: issue.count,
          reasons: issue.reasons.join("; "),
          date: issue.firstFlagged ? issue.firstFlagged.toISOString().split('T')[0] : "N/A",
        }));

        setFlaggedItems({
          columns: [
            { Header: "Item Name", accessor: "itemName", width: "30%" },
            { Header: "Store Name", accessor: "storeName", width: "20%" },
            { Header: "Flag Count", accessor: "flagCount", width: "20%" },
            { Header: "Reasons", accessor: "reasons", width: "20%" },
            { Header: "First Flagged", accessor: "date", width: "20%" },
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
                    <MDTypography variant="h4" color="info">${sales.toLocaleString()}</MDTypography>
                    <MDTypography variant="caption" color="text">Total Sales</MDTypography>
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
                  Top Selling Stores
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
                  Top Selling Items
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