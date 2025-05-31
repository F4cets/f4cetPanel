/**
=========================================================
* F4cetPanel - Seller NFT Leasing Page
=========================================================

* Copyright 2025 F4cets Team
*/

// React imports
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

// Firebase imports
import { collection, query, where, getDocs, doc, setDoc, getDoc, orderBy } from "firebase/firestore";
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
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
import MDButton from "/components/MDButton";
import MDInput from "/components/MDInput";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";
import DataTable from "/examples/Tables/DataTable";

function SellerLeaseNFTs() {
  const { user } = useUser();
  const router = useRouter();
  const [verifiedNFTs, setVerifiedNFTs] = useState(0);
  const [leasedNFTs, setLeasedNFTs] = useState(0);
  const [term, setTerm] = useState("N/A");
  const [totalPayments, setTotalPayments] = useState(0);
  const [leasedAgreement, setLeasedAgreement] = useState(null);
  const [allLeases, setAllLeases] = useState([]);
  const [filteredLeases, setFilteredLeases] = useState([]);
  const [displayedLeases, setDisplayedLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openLeaseModal, setOpenLeaseModal] = useState(false);
  const [selectedLease, setSelectedLease] = useState(null);
  const [filters, setFilters] = useState({ term: "", type: "", currency: "", search: "" });
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [menu, setMenu] = useState(null);

  // Wait for auth to be ready
  useEffect(() => {
    if (user && user.walletId) {
      console.log("SellerLeaseNFTs: Auth ready, walletId:", user.walletId);
      setIsAuthReady(true);
    } else {
      console.log("SellerLeaseNFTs: Waiting for auth, user:", !!user);
    }
  }, [user]);

  // Redirect to home if no user, walletId, or not a seller
  useEffect(() => {
    if (!user || !user.walletId || user.role !== "seller") {
      console.log("SellerLeaseNFTs: Unauthorized access, redirecting to home");
      router.replace("/");
      setLoading(false);
    }
  }, [user, router]);

  // Fetch seller’s leased NFT and available leases
  useEffect(() => {
    const fetchLeaseData = async () => {
      if (!isAuthReady || !user || !user.walletId) return;

      setLoading(true);
      try {
        // Fetch user’s NFTs for verified count
        const userDocRef = doc(db, "users", user.walletId);
        const userDoc = await getDoc(userDocRef);
        let nfts = [];
        if (userDoc.exists()) {
          const profile = userDoc.data().profile || {};
          nfts = profile.nfts || [];
        }
        const verifiedCount = nfts.filter(nft => nft.verified && (nft.type === "V1" || nft.type === "V2")).length;
        setVerifiedNFTs(verifiedCount);

        // Fetch seller’s leased NFT
        const leasesQuery = query(
          collection(db, `users/${user.walletId}/nftLeases`),
          where("sellerWalletId", "==", user.walletId),
          where("status", "==", "Leased")
        );
        const leasesSnapshot = await getDocs(leasesQuery);
        let leased = null;
        let totalPayment = 0;
        let leaseTerm = "N/A";

        if (leasesSnapshot.size > 0) {
          const leaseDoc = leasesSnapshot.docs[0];
          const leaseData = leaseDoc.data();
          const createdDate = leaseData.createdAt?.toDate ? leaseData.createdAt.toDate() : new Date(leaseData.createdAt);
          leased = {
            id: leaseDoc.id,
            nftMintAddress: leaseData.nftMintAddress || "",
            nftType: leaseData.nftType || "Unknown",
            paymentSchedule: leaseData.paymentSchedule || "",
            price: leaseData.price || 0,
            currency: leaseData.currency || "",
            status: leaseData.status || "",
            createdAt: createdDate.toISOString().split("T")[0],
            buyerWalletId: leaseData.buyerWalletId || "",
            buyerId: leaseData.buyerWalletId ? `${leaseData.buyerWalletId.slice(0, 6)}...${leaseData.buyerWalletId.slice(-4)}` : "N/A",
          };
          totalPayment = leaseData.price || 0;
          leaseTerm = leaseData.paymentSchedule || "N/A";
        }

        setLeasedAgreement(leased);
        setLeasedNFTs(leased ? 1 : 0);
        setTotalPayments(totalPayment);
        setTerm(leaseTerm);

        setLoading(false);
        // Fetch available leases
        await fetchAvailableLeases();
      } catch (err) {
        console.error("SellerLeaseNFTs: Error fetching lease data:", err);
        setError("Failed to load lease data: " + err.message);
        setLoading(false);
      }
    };

    if (isAuthReady && user?.walletId) {
      fetchLeaseData();
    }
  }, [isAuthReady, user?.walletId]);

  // Fetch all available leases
  const fetchAvailableLeases = async () => {
    setTableLoading(true);
    try {
      // Query all users/*/nftLeases for available leases
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      let allLeases = [];

      for (const userDoc of usersSnapshot.docs) {
        const leasesQuery = query(
          collection(db, `users/${userDoc.id}/nftLeases`),
          where("status", "==", "Available"),
          orderBy("createdAt", "desc")
        );
        const leasesSnapshot = await getDocs(leasesQuery);
        leasesSnapshot.forEach(leaseDoc => {
          const leaseData = leaseDoc.data();
          const createdDate = leaseData.createdAt?.toDate ? leaseData.createdAt.toDate() : new Date(leaseData.createdAt);
          allLeases.push({
            id: leaseDoc.id,
            userId: userDoc.id,
            nftMintAddress: leaseData.nftMintAddress || "",
            nftType: leaseData.nftType || "Unknown",
            paymentSchedule: leaseData.paymentSchedule || "",
            price: leaseData.price || 0,
            currency: leaseData.currency || "",
            status: leaseData.status || "Available",
            createdAt: createdDate.toISOString().split("T")[0],
            buyerWalletId: leaseData.buyerWalletId || "",
            buyerId: leaseData.buyerWalletId ? `${leaseData.buyerWalletId.slice(0, 6)}...${leaseData.buyerWalletId.slice(-4)}` : "N/A",
            feeDiscount: leaseData.nftType === "V1" ? 50 : leaseData.nftType === "V2" ? 20 : 0,
          });
        });
      }

      // Store all leases
      setAllLeases(allLeases);
      // Apply filters
      applyFilters(allLeases);
    } catch (err) {
      console.error("SellerLeaseNFTs: Error fetching available leases:", err);
      setError("Failed to load available leases: " + err.message);
      setAllLeases([]);
      setFilteredLeases([]);
      setDisplayedLeases([]);
    } finally {
      setTableLoading(false);
    }
  };

  // Apply filters when filters change
  useEffect(() => {
    applyFilters(allLeases);
  }, [filters, allLeases]);

  // Apply filters to local data
  const applyFilters = (leases, resetPage = true) => {
    let filteredLeases = leases;

    // Apply filters
    filteredLeases = filteredLeases.filter(lease => {
      const matchesSearch = lease.id.toLowerCase().includes(filters.search.toLowerCase());
      const matchesTerm = filters.term ? lease.paymentSchedule === filters.term : true;
      const matchesType = filters.type ? lease.nftType === filters.type : true;
      const matchesCurrency = filters.currency ? lease.currency === filters.currency : true;
      return matchesSearch && matchesTerm && matchesType && matchesCurrency;
    });

    setFilteredLeases(filteredLeases);

    // Paginate
    const total = Math.ceil(filteredLeases.length / pageSize);
    setTotalPages(total || 1);

    // Ensure page is valid
    const currentPage = resetPage ? 1 : Math.min(page, total || 1);
    setPage(currentPage);

    // Slice for current page
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedLeases = filteredLeases.slice(startIndex, startIndex + pageSize);

    setDisplayedLeases(paginatedLeases);
  };

  // Handle page navigation
  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
      const startIndex = page * pageSize;
      setDisplayedLeases(filteredLeases.slice(startIndex, startIndex + pageSize));
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(prev => prev - 1);
      const startIndex = (page - 2) * pageSize;
      setDisplayedLeases(filteredLeases.slice(startIndex, startIndex + pageSize));
    }
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Menu Handlers
  const openMenu = (event) => setMenu(event.currentTarget);
  const closeMenu = () => setMenu(null);

  // Handle lease modal open/close
  const handleOpenLeaseModal = (lease) => {
    console.log("Opening modal for lease:", lease); // Debug log
    setSelectedLease(lease);
    setOpenLeaseModal(true);
  };

  const handleCloseLeaseModal = () => {
    setOpenLeaseModal(false);
    setSelectedLease(null);
    setError(null);
  };

  // Handle lease confirmation (placeholder for cloud function)
  const handleConfirmLease = async () => {
    setError(null);
    try {
      // Placeholder for cloud function call
      console.log("SellerLeaseNFTs: Triggering payment for lease:", selectedLease.id);
      // Example: await axios.post("https://payment-function-url", { leaseId: selectedLease.id, sellerWalletId: user.walletId });

      // Update lease in Firestore
      const leaseRef = doc(db, `users/${selectedLease.buyerWalletId}/nftLeases`, selectedLease.id);
      const leaseStartDate = new Date();
      let leaseEndDate = new Date();
      switch (selectedLease.paymentSchedule) {
        case "Monthly":
          leaseEndDate.setMonth(leaseEndDate.getMonth() + 1);
          break;
        case "Quarterly":
          leaseEndDate.setMonth(leaseEndDate.getMonth() + 3);
          break;
        case "Yearly":
          leaseEndDate.setFullYear(leaseEndDate.getFullYear() + 1);
          break;
      }

      await setDoc(leaseRef, {
        sellerWalletId: user.walletId,
        status: "Leased",
        leaseStartDate,
        leaseEndDate,
        updatedAt: new Date(),
      }, { merge: true });

      // Update local state
      const updatedLeases = allLeases.filter(lease => lease.id !== selectedLease.id);
      setAllLeases(updatedLeases);
      applyFilters(updatedLeases);
      setLeasedAgreement({
        ...selectedLease,
        status: "Leased",
        leaseStartDate,
        leaseEndDate,
      });
      setLeasedNFTs(1);
      setTotalPayments(selectedLease.price);
      setTerm(selectedLease.paymentSchedule);

      handleCloseLeaseModal();
    } catch (err) {
      console.error("SellerLeaseNFTs: Error confirming lease:", err);
      setError("Failed to confirm lease: " + err.message);
    }
  };

  // Truncate Lease ID
  const truncateLeaseId = (id) => {
    if (!id) return "N/A";
    const parts = id.split("_");
    return parts.length > 1 ? `${parts[0]}...${parts[parts.length - 1].slice(-4)}` : id.slice(0, 6) + "...";
  };

  // Generate empty state message with active filters
  const getEmptyStateMessage = () => {
    const activeFilters = [];
    if (filters.term) activeFilters.push(`Term: ${filters.term}`);
    if (filters.type) activeFilters.push(`Type: ${filters.type}`);
    if (filters.currency) activeFilters.push(`Currency: ${filters.currency}`);
    if (filters.search) activeFilters.push(`Search: ${filters.search}`);

    if (activeFilters.length > 0) {
      return `No available leases found for ${activeFilters.join(", ")}.`;
    }
    return "No available leases found.";
  };

  // Leased NFT Table
  const leasedNFTTableData = {
    columns: [
      { Header: "Lease ID", accessor: "id", width: "15%" },
      { Header: "NFT Mint", accessor: "nftMintAddress", width: "20%" },
      { Header: "Type", accessor: "nftType", width: "10%" },
      { Header: "Buyer ID", accessor: "buyerId", width: "15%" },
      { Header: "Schedule", accessor: "paymentSchedule", width: "15%" },
      { Header: "Revenue", accessor: "price", width: "15%" },
    ],
    rows: leasedAgreement ? [{
      ...leasedAgreement,
      id: (
        <MDTypography variant="button" color="text">
          {truncateLeaseId(leasedAgreement.id)}
        </MDTypography>
      ),
      nftMintAddress: (
        <MDTypography variant="button" color="text">
          {leasedAgreement.nftMintAddress ? `${leasedAgreement.nftMintAddress.slice(0, 6)}...${leasedAgreement.nftMintAddress.slice(-4)}` : "N/A"}
        </MDTypography>
      ),
      price: (
        <MDTypography variant="button" color="text">
          {leasedAgreement.price.toFixed(2)} {leasedAgreement.currency || "N/A"}
        </MDTypography>
      ),
    }] : [],
  };

  // Available Leases Table
  const availableLeasesTableData = {
    columns: [
      { Header: "Lease ID", accessor: "id", width: "15%" },
      { Header: "NFT Mint", accessor: "nftMintAddress", width: "15%" },
      { Header: "Type", accessor: "nftType", width: "10%" },
      { Header: "Buyer ID", accessor: "buyerId", width: "15%" },
      { Header: "Schedule", accessor: "paymentSchedule", width: "10%" },
      { Header: "Price", accessor: "price", width: "15%" },
      { Header: "Fee Discount", accessor: "feeDiscount", width: "10%" },
      { Header: "Action", accessor: "action", width: "10%" },
    ],
    rows: displayedLeases.map(lease => ({
      ...lease,
      id: (
        <MDTypography variant="button" color="text">
          {truncateLeaseId(lease.id)}
        </MDTypography>
      ),
      nftMintAddress: (
        <MDTypography variant="button" color="text">
          {lease.nftMintAddress ? `${lease.nftMintAddress.slice(0, 6)}...${lease.nftMintAddress.slice(-4)}` : "N/A"}
        </MDTypography>
      ),
      price: (
        <MDTypography variant="button" color="text">
          {lease.price.toFixed(2)} {lease.currency || "N/A"}
        </MDTypography>
      ),
      feeDiscount: (
        <MDTypography variant="button" color="text">
          {lease.feeDiscount.toFixed(1)}%
        </MDTypography>
      ),
      action: (
        <MDButton
          variant="text"
          color="info"
          onClick={() => handleOpenLeaseModal(lease)}
        >
          Lease
        </MDButton>
      ),
    })),
  };

  // Filter Menu
  const renderMenu = (
    <Menu
      anchorEl={menu}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      open={Boolean(menu)}
      onClose={closeMenu}
      keepMounted
    >
      <MenuItem onClick={() => { handleFilterChange("term", "Monthly"); closeMenu(); }}>Term: Monthly</MenuItem>
      <MenuItem onClick={() => { handleFilterChange("term", "Quarterly"); closeMenu(); }}>Term: Quarterly</MenuItem>
      <MenuItem onClick={() => { handleFilterChange("term", "Yearly"); closeMenu(); }}>Term: Yearly</MenuItem>
      <Divider sx={{ margin: "0.5rem 0" }} />
      <MenuItem onClick={() => { handleFilterChange("type", "V1"); closeMenu(); }}>Type: V1</MenuItem>
      <MenuItem onClick={() => { handleFilterChange("type", "V2"); closeMenu(); }}>Type: V2</MenuItem>
      <Divider sx={{ margin: "0.5rem 0" }} />
      <MenuItem onClick={() => { handleFilterChange("currency", "SOL"); closeMenu(); }}>Currency: SOL</MenuItem>
      <MenuItem onClick={() => { handleFilterChange("currency", "USDC"); closeMenu(); }}>Currency: USDC</MenuItem>
      <Divider sx={{ margin: "0.5rem 0" }} />
      <MenuItem onClick={() => { setFilters({ term: "", type: "", currency: "", search: "" }); closeMenu(); }}>
        <MDTypography variant="button" color="error" fontWeight="regular">
          Remove Filters
        </MDTypography>
      </MenuItem>
    </Menu>
  );

  if (!user || !user.walletId || user.role !== "seller") {
    return null;
  }

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
              {user.walletId.slice(0, 6)}...{user.walletId.slice(-4)} -- NFT Leasing
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
            Loading lease data...
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
                      <Icon fontSize="medium">verified</Icon>
                    </MDBox>
                    <MDBox>
                      <MDTypography variant="h6" color="dark">
                        Verified NFTs
                      </MDTypography>
                      <MDTypography variant="h4" color="info">
                        {verifiedNFTs}
                      </MDTypography>
                      <MDTypography variant="caption" color="text">
                        V1/V2 Owned
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
                        Leased NFTs
                      </MDTypography>
                      <MDTypography variant="h4" color="info">
                        {leasedNFTs}
                      </MDTypography>
                      <MDTypography variant="caption" color="text">
                        Currently Leased
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
                      <Icon fontSize="medium">schedule</Icon>
                    </MDBox>
                    <MDBox>
                      <MDTypography variant="h6" color="dark">
                        Term
                      </MDTypography>
                      <MDTypography variant="h4" color="info">
                        {term}
                      </MDTypography>
                      <MDTypography variant="caption" color="text">
                        Lease Term
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
                        Total Payments
                      </MDTypography>
                      <MDTypography variant="h4" color="info">
                        ${totalPayments.toFixed(2)}
                      </MDTypography>
                      <MDTypography variant="caption" color="text">
                        From Leases
                      </MDTypography>
                    </MDBox>
                  </MDBox>
                </Card>
              </Grid>
            </Grid>

            {/* Leased NFT Table */}
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card sx={{ backgroundColor: "transparent", boxShadow: "none", overflow: "hidden" }}>
                  <MDBox p={3}>
                    <MDTypography variant="h5" color="dark" mb={2}>
                      Leased NFT
                    </MDTypography>
                    {leasedAgreement ? (
                      <DataTable
                        table={leasedNFTTableData}
                        entriesPerPage={false}
                        canSearch={false}
                        sx={{
                          "& th": { paddingRight: "20px !important", paddingLeft: "20px !important" },
                          "& .MuiTablePagination-root": { display: "none !important" },
                        }}
                      />
                    ) : (
                      <MDTypography variant="body2" color="text">
                        No NFT currently leased.
                      </MDTypography>
                    )}
                  </MDBox>
                </Card>
              </Grid>

              {/* Available Leases Table */}
              <Grid item xs={12}>
                <Card sx={{ backgroundColor: "transparent", boxShadow: "none", overflow: "hidden" }}>
                  <MDBox p={3}>
                    <MDTypography variant="h5" color="dark" mb={2}>
                      Available Leases
                    </MDTypography>
                    <MDBox
                      display="flex"
                      flexDirection={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      mb={2}
                      gap={2}
                    >
                      <MDBox width={{ xs: "100%", sm: "200px" }}>
                        <MDInput
                          placeholder="Search by Lease ID..."
                          value={filters.search || ""}
                          onChange={(e) => handleFilterChange("search", e.target.value)}
                          fullWidth
                          sx={{
                            "& .MuiInputBase-input": { padding: { xs: "10px", md: "12px" }, color: "#344767" },
                            "& .MuiInputLabel-root": { color: "#344767 !important" },
                            "& .MuiInputLabel-root.Mui-focused": { color: "#344767 !important" },
                          }}
                        />
                      </MDBox>
                      <MDButton
                        variant={menu ? "contained" : "outlined"}
                        color="dark"
                        onClick={openMenu}
                        sx={{ width: { xs: "100%", sm: "auto" } }}
                      >
                        Filters <Icon>keyboard_arrow_down</Icon>
                      </MDButton>
                      {renderMenu}
                    </MDBox>
                    {tableLoading ? (
                      <MDTypography variant="body2" color="text">
                        Loading available leases...
                      </MDTypography>
                    ) : displayedLeases.length === 0 ? (
                      <MDTypography variant="body2" color="text">
                        {getEmptyStateMessage()}
                      </MDTypography>
                    ) : (
                      <>
                        <DataTable
                          table={availableLeasesTableData}
                          entriesPerPage={false}
                          canSearch={false}
                          sx={{
                            "& th": { paddingRight: "20px !important", paddingLeft: "20px !important" },
                            "& .MuiTablePagination-root": { display: "none !important" },
                          }}
                        />
                        <MDBox display="flex" justifyContent="center" alignItems="center" mt={2} gap={2}>
                          <MDButton
                            variant="outlined"
                            color="dark"
                            onClick={handlePreviousPage}
                            disabled={page === 1}
                          >
                            Previous
                          </MDButton>
                          <MDTypography variant="body2" color="text">
                            Page {page} of {totalPages}
                          </MDTypography>
                          <MDButton
                            variant="outlined"
                            color="dark"
                            onClick={handleNextPage}
                            disabled={page === totalPages}
                          >
                            Next
                          </MDButton>
                        </MDBox>
                      </>
                    )}
                  </MDBox>
                </Card>
              </Grid>
            </Grid>
          </>
        )}

        {/* Lease Confirmation Modal */}
        <Dialog
          open={openLeaseModal}
          onClose={handleCloseLeaseModal}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              background: "linear-gradient(135deg, #f5f7fa 0%, #c3dfe2 100%)",
            },
          }}
        >
          <DialogTitle>
            <MDBox display="flex" justifyContent="space-between" alignItems="center">
              <MDTypography variant="h5" color="dark" fontWeight="bold" sx={{ color: "#344767" }}>
                Confirm Lease
              </MDTypography>
              <MDButton
                variant="text"
                color="dark"
                onClick={handleCloseLeaseModal}
                sx={{ minWidth: "auto", p: 1 }}
              >
                <Icon>close</Icon>
              </MDButton>
            </MDBox>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {error && (
              <MDBox
                sx={{
                  bgcolor: "error.light",
                  borderRadius: 1,
                  p: 1,
                  mb: 2,
                }}
              >
                <MDTypography variant="body2" color="error">
                  {error}
                </MDTypography>
              </MDBox>
            )}
            {selectedLease && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <MDTypography variant="body1" sx={{ color: "#344767" }}>
                    <strong>NFT Mint:</strong> {selectedLease.nftMintAddress ? `${selectedLease.nftMintAddress.slice(0, 6)}...${selectedLease.nftMintAddress.slice(-4)}` : "N/A"}
                  </MDTypography>
                </Grid>
                <Grid item xs={12}>
                  <MDTypography variant="body1" sx={{ color: "#344767" }}>
                    <strong>Type:</strong> {selectedLease.nftType}
                  </MDTypography>
                </Grid>
                <Grid item xs={12}>
                  <MDTypography variant="body1" sx={{ color: "#344767" }}>
                    <strong>Buyer ID:</strong> {selectedLease.buyerId}
                  </MDTypography>
                </Grid>
                <Grid item xs={12}>
                  <MDTypography variant="body1" sx={{ color: "#344767" }}>
                    <strong>Payment Schedule:</strong> {selectedLease.paymentSchedule}
                  </MDTypography>
                </Grid>
                <Grid item xs={12}>
                  <MDTypography variant="body1" sx={{ color: "#344767" }}>
                    <strong>Price:</strong> {selectedLease.price.toFixed(2)} {selectedLease.currency || "N/A"}
                  </MDTypography>
                </Grid>
                <Grid item xs={12}>
                  <MDTypography variant="body1" sx={{ color: "#344767" }}>
                    <strong>Fee Discount:</strong> {selectedLease.feeDiscount.toFixed(1)}%
                  </MDTypography>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", gap: 2 }}>
            <MDButton
              onClick={handleCloseLeaseModal}
              color="secondary"
              sx={{
                px: 3,
                py: 1,
                borderRadius: "8px",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                },
              }}
            >
              Cancel
            </MDButton>
            <MDButton
              onClick={handleConfirmLease}
              color="info"
              variant="gradient"
              sx={{
                px: 3,
                py: 1,
                borderRadius: "8px",
                background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                "&:hover": {
                  background: "linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(33, 150, 243, 0.3)",
                },
                transition: "all 0.3s ease",
              }}
            >
              Confirm Payment
            </MDButton>
          </DialogActions>
        </Dialog>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default SellerLeaseNFTs;