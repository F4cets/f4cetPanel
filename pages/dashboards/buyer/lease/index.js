/**
=========================================================
* F4cetPanel - Buyer NFT Leasing Page
=========================================================

* Copyright 2025 F4cets Team
*/

// React imports
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

// Firebase imports
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
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
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";

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

function LeaseNFTs() {
  const { user } = useUser();
  const router = useRouter();
  const [verifiedNFTs, setVerifiedNFTs] = useState(0);
  const [leasedNFTs, setLeasedNFTs] = useState(0);
  const [availableNFTs, setAvailableNFTs] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [leaseAgreements, setLeaseAgreements] = useState([]);
  const [leasedAgreements, setLeasedAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [error, setError] = useState(null);
  const [openLeaseModal, setOpenLeaseModal] = useState(false);
  const [leaseForm, setLeaseForm] = useState({
    leaseId: null,
    nftMintAddress: "",
    paymentSchedule: "Monthly",
    price: "",
    currency: "SOL",
  });
  const [userNFTs, setUserNFTs] = useState([]);
  const [availableNFTsList, setAvailableNFTsList] = useState([]);
  const [fetched, setFetched] = useState(false);

  // Wait for auth to be ready
  useEffect(() => {
    if (user && user.walletId) {
      console.log("LeaseNFTs: Auth ready, walletId:", user.walletId);
      setIsAuthReady(true);
    } else {
      console.log("LeaseNFTs: Waiting for auth, user:", !!user);
    }
  }, [user]);

  // Redirect to home if no user or walletId
  useEffect(() => {
    if (!user || !user.walletId) {
      console.log("LeaseNFTs: Unauthorized access, redirecting to home");
      router.replace("/");
      setLoading(false);
    }
  }, [user, router]);

  // Fetch user profile and lease data from Firestore
  useEffect(() => {
    const fetchLeaseData = async () => {
      if (!isAuthReady || !user || !user.walletId || fetched) {
        console.log("LeaseNFTs: Skipping fetch, isAuthReady:", isAuthReady, "user:", !!user, "walletId:", !!user?.walletId, "fetched:", fetched);
        return;
      }

      setLoading(true);
      try {
        console.log("LeaseNFTs: Fetching data for buyer:", user.walletId);

        // Use cached NFTs if available
        let nfts = user.profile?.nfts || [];
        if (!nfts.length) {
          const userDocRef = doc(db, "users", user.walletId);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const profile = userDoc.data().profile || {};
            nfts = profile.nfts || [];
            console.log("LeaseNFTs: Fetched NFTs from Firestore:", nfts);
          } else {
            throw new Error("User profile not found.");
          }
        } else {
          console.log("LeaseNFTs: Using cached NFTs:", nfts);
        }
        setUserNFTs(nfts);

        // Calculate verified NFTs
        const verifiedCount = nfts.filter(nft => nft.verified && (nft.type === "V1" || nft.type === "V2")).length;
        console.log("LeaseNFTs: Verified NFTs count:", verifiedCount);
        setVerifiedNFTs(verifiedCount);
        setAvailableNFTsList(nfts.filter(nft => nft.verified && (nft.type === "V1" || nft.type === "V2")));

        // Fetch lease agreements
        const leasesQuery = query(
          collection(db, `users/${user.walletId}/nftLeases`)
        );
        const leasesSnapshot = await getDocs(leasesQuery);
        const agreements = [];
        const leased = [];

        console.log("LeaseNFTs: Fetched leases count:", leasesSnapshot.size);
        for (const leaseDoc of leasesSnapshot.docs) {
          const leaseData = leaseDoc.data();
          const createdDate = leaseData.createdAt?.toDate ? leaseData.createdAt.toDate() : new Date(leaseData.createdAt);
          const nft = nfts.find(n => n.mintAddress === leaseData.nftMintAddress) || {};
          const agreement = {
            id: leaseDoc.id,
            nftMintAddress: leaseData.nftMintAddress,
            nftType: nft.type || "Unknown",
            paymentSchedule: leaseData.paymentSchedule,
            price: leaseData.price,
            currency: leaseData.currency,
            status: leaseData.status,
            createdAt: createdDate.toISOString().split("T")[0],
            sellerWalletId: leaseData.sellerWalletId || null,
          };

          if (leaseData.status === "Leased") {
            leased.push({
              ...agreement,
              sellerId: leaseData.sellerWalletId ? `${leaseData.sellerWalletId.slice(0, 6)}...${leaseData.sellerWalletId.slice(-4)}` : "N/A",
              revenue: leaseData.price, // Placeholder, update with payment function
            });
          } else {
            agreements.push(agreement);
          }
        }

        // Update state
        setLeaseAgreements(agreements);
        setLeasedAgreements(leased);
        setLeasedNFTs(leased.length);
        console.log("LeaseNFTs: Leased NFTs count:", leased.length);
        setTotalRevenue(0); // Placeholder until payment tracking
        setFetched(true);
        setLoading(false);
      } catch (err) {
        console.error("LeaseNFTs: Error fetching lease data:", err);
        if (err.code === "permission-denied") {
          setError("You do not have permission to access lease data. Please check Firestore rules or contact support.");
        } else {
          setError("Failed to load lease data: " + err.message);
        }
        setFetched(true);
        setLoading(false);
      }
    };

    if (isAuthReady && user?.walletId) {
      fetchLeaseData();
    }
  }, [isAuthReady, user?.walletId]);

  // Update Available NFTs metric
  useEffect(() => {
    if (!loading) {
      const available = verifiedNFTs - leasedAgreements.length;
      console.log("LeaseNFTs: Updating Available NFTs:", available, "verified:", verifiedNFTs, "leased:", leasedAgreements.length);
      setAvailableNFTs(available);
    }
  }, [loading, verifiedNFTs, leasedAgreements]);

  // Handle lease modal open/close
  const handleOpenLeaseModal = (lease = null) => {
    if (lease) {
      setLeaseForm({
        leaseId: lease.id,
        nftMintAddress: lease.nftMintAddress,
        paymentSchedule: lease.paymentSchedule,
        price: lease.price.toString(),
        currency: lease.currency,
      });
    } else {
      setLeaseForm({
        leaseId: null,
        nftMintAddress: "",
        paymentSchedule: "Monthly",
        price: "",
        currency: "SOL",
      });
    }
    setOpenLeaseModal(true);
  };

  const handleCloseLeaseModal = () => {
    setOpenLeaseModal(false);
    setLeaseForm({
      leaseId: null,
      nftMintAddress: "",
      paymentSchedule: "Monthly",
      price: "",
      currency: "SOL",
    });
    setError(null);
  };

  // Handle lease form submission
  const handleLeaseSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!leaseForm.nftMintAddress || !leaseForm.price || isNaN(leaseForm.price) || leaseForm.price <= 0) {
      setError("Please select an NFT and enter a valid price.");
      return;
    }

    try {
      const leaseId = leaseForm.leaseId || `lease_${Date.now()}_${user.walletId}`;
      const leaseRef = doc(db, `users/${user.walletId}/nftLeases`, leaseId);
      const nft = userNFTs.find(n => n.mintAddress === leaseForm.nftMintAddress);

      console.log("LeaseNFTs: Saving lease:", leaseId, leaseForm);
      await setDoc(leaseRef, {
        nftMintAddress: leaseForm.nftMintAddress,
        nftType: nft?.type || "Unknown",
        buyerWalletId: user.walletId,
        sellerWalletId: null,
        paymentSchedule: leaseForm.paymentSchedule,
        price: parseFloat(leaseForm.price),
        currency: leaseForm.currency,
        status: "Available",
        createdAt: leaseForm.leaseId ? leaseForm.createdAt : new Date(),
        updatedAt: new Date(),
        leaseStartDate: null,
        leaseEndDate: null,
      }, { merge: true });

      // Refresh lease data
      const leasesQuery = query(
        collection(db, `users/${user.walletId}/nftLeases`)
      );
      const leasesSnapshot = await getDocs(leasesQuery);
      const agreements = [];
      const leased = [];

      console.log("LeaseNFTs: Refreshed leases count:", leasesSnapshot.size);
      for (const leaseDoc of leasesSnapshot.docs) {
        const leaseData = leaseDoc.data();
        const createdDate = leaseData.createdAt?.toDate ? leaseData.createdAt.toDate() : new Date(leaseData.createdAt);
        const agreement = {
          id: leaseDoc.id,
          nftMintAddress: leaseData.nftMintAddress,
          nftType: leaseData.nftType || "Unknown",
          paymentSchedule: leaseData.paymentSchedule,
          price: leaseData.price,
          currency: leaseData.currency,
          status: leaseData.status,
          createdAt: createdDate.toISOString().split("T")[0],
          sellerWalletId: leaseData.sellerWalletId || null,
        };

        if (leaseData.status === "Leased") {
          leased.push({
            ...agreement,
            sellerId: leaseData.sellerWalletId ? `${leaseData.sellerWalletId.slice(0, 6)}...${leaseData.sellerWalletId.slice(-4)}` : "N/A",
            revenue: leaseData.price,
          });
        } else {
          agreements.push(agreement);
        }
      }

      setLeaseAgreements(agreements);
      setLeasedAgreements(leased);
      setLeasedNFTs(leased.length);
      console.log("LeaseNFTs: Post-submit Leased NFTs:", leased.length);
      handleCloseLeaseModal();
    } catch (err) {
      console.error("LeaseNFTs: Error saving lease:", err);
      if (err.code === "permission-denied") {
        setError("You do not have permission to create or update leases.");
      } else {
        setError("Failed to save lease: " + err.message);
      }
    }
  };

  // Handle lease deletion
  const handleDeleteLease = async (leaseId) => {
    try {
      console.log("LeaseNFTs: Deleting lease:", leaseId);
      await deleteDoc(doc(db, `users/${user.walletId}/nftLeases`, leaseId));
      setLeaseAgreements(leaseAgreements.filter(lease => lease.id !== leaseId));
      console.log("LeaseNFTs: Post-delete Leased NFTs:", leasedAgreements.length);
    } catch (err) {
      console.error("LeaseNFTs: Error deleting lease:", err);
      if (err.code === "permission-denied") {
        setError("You do not have permission to delete this lease.");
      } else {
        setError("Failed to delete lease: " + err.message);
      }
    }
  };

  // Lease Agreements Table
  const leaseAgreementsTableData = {
    columns: [
      { Header: "Lease ID", accessor: "id", width: "15%" },
      { Header: "NFT Mint", accessor: "nftMintAddress", width: "20%" },
      { Header: "Type", accessor: "nftType", width: "10%" },
      { Header: "Schedule", accessor: "paymentSchedule", width: "15%" },
      { Header: "Price", accessor: "price", width: "15%" },
      { Header: "Status", accessor: "status", width: "10%" },
      { Header: "Actions", accessor: "actions", width: "15%" },
    ],
    rows: leaseAgreements.map(item => ({
      ...item,
      nftMintAddress: (
        <MDTypography variant="button" color="text">
          {item.nftMintAddress.slice(0, 6) + "..." + item.nftMintAddress.slice(-4)}
        </MDTypography>
      ),
      price: (
        <MDTypography variant="button" color="text">
          {item.price.toFixed(2)} {item.currency}
        </MDTypography>
      ),
      status: (
        <MDBox display="flex" alignItems="center">
          <Icon
            fontSize="small"
            sx={{
              color: item.status === "Available" ? "info.main" : "success.main",
              mr: 1,
            }}
          >
            {item.status === "Available" ? "pending" : "check_circle"}
          </Icon>
          <MDTypography variant="button" color="text">
            {item.status}
          </MDTypography>
        </MDBox>
      ),
      actions: (
        <MDBox display="flex" gap={1}>
          <MDButton
            variant="text"
            color="info"
            onClick={() => handleOpenLeaseModal(item)}
            disabled={item.status === "Leased"}
          >
            Edit
          </MDButton>
          <MDButton
            variant="text"
            color="error"
            onClick={() => handleDeleteLease(item.id)}
            disabled={item.status === "Leased"}
          >
            Delete
          </MDButton>
        </MDBox>
      ),
    })),
  };

  // Leased NFTs Table
  const leasedNFTsTableData = {
    columns: [
      { Header: "Lease ID", accessor: "id", width: "15%" },
      { Header: "NFT Mint", accessor: "nftMintAddress", width: "20%" },
      { Header: "Type", accessor: "nftType", width: "10%" },
      { Header: "Seller ID", accessor: "sellerId", width: "15%" },
      { Header: "Schedule", accessor: "paymentSchedule", width: "15%" },
      { Header: "Revenue", accessor: "revenue", width: "15%" },
    ],
    rows: leasedAgreements.map(item => ({
      ...item,
      nftMintAddress: (
        <MDTypography variant="button" color="text">
          {item.nftMintAddress.slice(0, 6) + "..." + item.nftMintAddress.slice(-4)}
        </MDTypography>
      ),
      revenue: (
        <MDTypography variant="button" color="text">
          {item.revenue.toFixed(2)} {item.currency}
        </MDTypography>
      ),
    })),
  };

  if (!user || !user.walletId) {
    return null; // Or a loading spinner
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
              {user.walletId ? user.walletId.slice(0, 6) + "..." + user.walletId.slice(-4) : "Buyer"} -- NFT Leasing
            </MDTypography>
            <MDButton
              variant="gradient"
              color="info"
              onClick={() => handleOpenLeaseModal()}
              disabled={availableNFTsList.length === 0}
            >
              Create Lease
            </MDButton>
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
                      <Icon fontSize="medium">inventory</Icon>
                    </MDBox>
                    <MDBox>
                      <MDTypography variant="h6" color="dark">
                        Available NFTs
                      </MDTypography>
                      <MDTypography variant="h4" color="info">
                        {availableNFTs}
                      </MDTypography>
                      <MDTypography variant="caption" color="text">
                        For Lease
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
                        Total Revenue
                      </MDTypography>
                      <MDTypography variant="h4" color="info">
                        ${totalRevenue.toFixed(2)}
                      </MDTypography>
                      <MDTypography variant="caption" color="text">
                        From Leases
                      </MDTypography>
                    </MDBox>
                  </MDBox>
                </Card>
              </Grid>
            </Grid>

            {/* Lease Tables Section */}
            <Grid container spacing={3}>
              {/* Lease Agreements */}
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
                      Lease Agreements
                    </MDTypography>
                    {leaseAgreements.length === 0 ? (
                      <MDTypography variant="body2" color="text">
                        No lease agreements created.
                      </MDTypography>
                    ) : (
                      <DataTable
                        table={leaseAgreementsTableData}
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

              {/* Leased NFTs */}
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
                      Leased NFTs
                    </MDTypography>
                    {leasedAgreements.length === 0 ? (
                      <MDTypography variant="body2" color="text">
                        No NFTs currently leased.
                      </MDTypography>
                    ) : (
                      <DataTable
                        table={leasedNFTsTableData}
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

        {/* Lease Creation/Edit Modal */}
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
            <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <MDTypography variant="h5" color="dark" fontWeight="bold" sx={{ color: "#344767" }}>
                {leaseForm.leaseId ? "Edit Lease" : "Create Lease"}
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
            <form onSubmit={handleLeaseSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel sx={{ color: "#344767", "&.Mui-focused": { color: "#344767" } }}>
                      NFT
                    </InputLabel>
                    <Select
                      value={leaseForm.nftMintAddress}
                      onChange={(e) => setLeaseForm({ ...leaseForm, nftMintAddress: e.target.value })}
                      label="NFT"
                      disabled={leaseForm.leaseId !== null}
                      sx={{
                        "& .MuiSelect-select": { py: 2, color: "#344767", minHeight: "40px" },
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#d2d6da",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#344767",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#344767",
                        },
                      }}
                    >
                      {availableNFTsList
                        .filter(nft => !leaseAgreements.some(lease => lease.nftMintAddress === nft.mintAddress) || nft.mintAddress === leaseForm.nftMintAddress)
                        .map(nft => (
                          <MenuItem key={nft.mintAddress} value={nft.mintAddress}>
                            {nft.type} - {nft.mintAddress.slice(0, 6)}...{nft.mintAddress.slice(-4)}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: "#344767", "&.Mui-focused": { color: "#344767" } }}>
                      Payment Schedule
                    </InputLabel>
                    <Select
                      value={leaseForm.paymentSchedule}
                      onChange={(e) => setLeaseForm({ ...leaseForm, paymentSchedule: e.target.value })}
                      label="Payment Schedule"
                      sx={{
                        "& .MuiSelect-select": { py: 2, color: "#344767", minHeight: "40px" },
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#d2d6da",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#344767",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#344767",
                        },
                      }}
                    >
                      <MenuItem value="Monthly">Monthly</MenuItem>
                      <MenuItem value="Quarterly">Quarterly</MenuItem>
                      <MenuItem value="Yearly">Yearly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <MDInput
                    label="Price"
                    type="number"
                    value={leaseForm.price}
                    onChange={(e) => setLeaseForm({ ...leaseForm, price: e.target.value })}
                    fullWidth
                    inputProps={{ step: "0.01" }}
                    sx={{
                      "& .MuiInputBase-input": { color: "#344767" },
                      "& .MuiInputLabel-root": { color: "#344767" },
                      "& .MuiInputLabel-root.Mui-focused": { color: "#344767" },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#d2d6da",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#344767",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#344767",
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: "#344767", "&.Mui-focused": { color: "#344767" } }}>
                      Currency
                    </InputLabel>
                    <Select
                      value={leaseForm.currency}
                      onChange={(e) => setLeaseForm({ ...leaseForm, currency: e.target.value })}
                      label="Currency"
                      sx={{
                        "& .MuiSelect-select": { py: 2, color: "#344767", minHeight: "40px" },
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#d2d6da",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#344767",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#344767",
                        },
                      }}
                    >
                      <MenuItem value="SOL">SOL</MenuItem>
                      <MenuItem value="USDC">USDC</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </form>
          </DialogContent>
          <DialogActions>
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
              onClick={handleLeaseSubmit}
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
              {leaseForm.leaseId ? "Update" : "Create"}
            </MDButton>
          </DialogActions>
        </Dialog>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default LeaseNFTs;