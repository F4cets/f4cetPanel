/**
=========================================================
* F4cetPanel - Account Settings Page
=========================================================

* Copyright 2025 F4cets Team
*/

// React imports
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

// User context
import { useUser } from "/contexts/UserContext";

// Firebase imports
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "/lib/firebase";

// Axios for HTTP requests
import axios from "axios";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
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
import DataTable from "/examples/Tables/DataTable";

function AccountSettings() {
  const { user, setUser } = useUser();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    nftMintAddress: "",
  });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Redirect to home if no user or walletId
  useEffect(() => {
    if (!user || !user.walletId) {
      router.replace("/");
    } else {
      setForm({
        name: user.profile.name || "",
        email: user.profile.email || "",
        nftMintAddress: "",
      });
      setPreview(user.profile.avatar || "/assets/images/default-avatar.png");
    }
  }, [user, router]);

  // Fetch user profile from Firestore on page load
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user || !user.walletId) return;

      try {
        const userDocRef = doc(db, "users", user.walletId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const profile = userDoc.data().profile || {};
          setUser({
            ...user,
            profile: {
              ...user.profile,
              nfts: profile.nfts || [],
              name: profile.name || "",
              email: profile.email || "",
              avatar: profile.avatar || "/assets/images/default-avatar.png",
            },
          });
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("Failed to load user profile.");
      }
    };

    if (user?.walletId) {
      fetchUserProfile();
    }
  }, [user?.walletId, setUser]);

  // Handle file selection (click or drop)
  const handleFileChange = (file) => {
    if (file) {
      setAvatar(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // Drag-and-drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFileChange(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      let avatarUrl = user.profile.avatar || "/assets/images/default-avatar.png";
      if (avatar) {
        const avatarRef = ref(storage, `avatars/${user.walletId}/avatar.png`);
        await uploadBytes(avatarRef, avatar);
        avatarUrl = await getDownloadURL(avatarRef);
      }

      await setDoc(
        doc(db, "users", user.walletId),
        {
          profile: {
            name: form.name,
            email: form.email,
            avatar: avatarUrl,
            nfts: user.profile.nfts || [], // Preserve existing NFTs
          },
        },
        { merge: true }
      );

      setUser({
        ...user,
        profile: {
          ...user.profile,
          name: form.name,
          email: form.email,
          avatar: avatarUrl,
          nfts: user.profile.nfts || [],
        },
      });

      setSuccess("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile: " + err.message);
    }
  };

  // Handle NFT verification
  const handleVerifyNFT = async () => {
    setError(null);
    setSuccess(null);

    if (!form.nftMintAddress) {
      setError("Please enter an NFT mint address.");
      return;
    }

    try {
      // Call nftVerify Cloud Run function
      const verifyResponse = await axios.post(
        "https://nftverify-232592911911.us-central1.run.app",
        {
          walletAddress: user.walletId,
          mintAddress: form.nftMintAddress,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      if (verifyResponse.data.success) {
        // Determine NFT type (mock logic, replace with actual API check)
        const nftType = verifyResponse.data.nftType || "V1"; // Mock; update API to return "V1", "V2", or "V3"
        const sellerFee = nftType === "V1" ? 0.02 : nftType === "V2" ? 0.032 : 0.04; // 2%, 3.2%, 4%
        const buyerDiscount = 0.10; // 10% for all types
        const leasable = nftType !== "V3"; // V1/V2 leasable, V3 not

        // Update nfts array
        const updatedNfts = [
          ...(user.profile.nfts || []),
          {
            mintAddress: form.nftMintAddress,
            type: nftType,
            verified: true,
            verifiedAt: new Date().toISOString(),
            sellerFee,
            buyerDiscount,
            leasable,
          },
        ];

        // Update Firestore
        await setDoc(
          doc(db, "users", user.walletId),
          {
            profile: {
              nfts: updatedNfts,
            },
          },
          { merge: true }
        );

        // Update user context
        setUser({
          ...user,
          profile: {
            ...user.profile,
            nfts: updatedNfts,
          },
        });

        // Clear input
        setForm({ ...form, nftMintAddress: "" });
        setSuccess(`NFT (${nftType}) verified successfully!`);
      } else {
        setError(verifyResponse.data.error || "Failed to verify NFT ownership.");
      }
    } catch (err) {
      console.error("Error verifying NFT:", err);
      setError("Failed to verify NFT: " + (err.response?.data?.error || err.message));
    }
  };

  // Table data for verified NFTs
  const tableData = {
    columns: [
      { Header: "Mint Address", accessor: "mintAddress", width: "20%" },
      { Header: "Type", accessor: "type", width: "10%" },
      { Header: "Seller Fee", accessor: "sellerFee", width: "15%" },
      { Header: "Buyer Discount", accessor: "buyerDiscount", width: "15%" },
      { Header: "Leasable", accessor: "leasable", width: "10%" },
      { Header: "Verified At", accessor: "verifiedAt", width: "20%" },
      { Header: "Status", accessor: "status", width: "10%" },
    ],
    rows: (user.profile.nfts || []).map((nft) => ({
      mintAddress: (
        <MDTypography variant="button" sx={{ color: "#ffffff" }}>
          {nft.mintAddress.slice(0, 6) + "..." + nft.mintAddress.slice(-4)}
        </MDTypography>
      ),
      type: <MDTypography variant="button" sx={{ color: "#ffffff" }}>{nft.type}</MDTypography>,
      sellerFee: <MDTypography variant="button" sx={{ color: "#ffffff" }}>{(nft.sellerFee * 100).toFixed(1)}%</MDTypography>,
      buyerDiscount: <MDTypography variant="button" sx={{ color: "#ffffff" }}>{(nft.buyerDiscount * 100).toFixed(1)}%</MDTypography>,
      leasable: <MDTypography variant="button" sx={{ color: "#ffffff" }}>{nft.leasable ? "Yes" : "No"}</MDTypography>,
      verifiedAt: (
        <MDTypography variant="button" sx={{ color: "#ffffff" }}>
          {new Date(nft.verifiedAt).toLocaleDateString()}
        </MDTypography>
      ),
      status: (
        <MDBox display="flex" alignItems="center">
          <Icon
            fontSize="small"
            sx={{
              color: nft.verified ? "success.main" : "info.main",
              mr: 1,
            }}
          >
            {nft.verified ? "check_circle" : "pending"}
          </Icon>
          <MDTypography variant="button" sx={{ color: "#ffffff" }}>
            {nft.verified ? "Verified" : "Pending"}
          </MDTypography>
        </MDBox>
      ),
    })),
  };

  if (!user || !user.walletId) {
    return null; // Or a loading spinner
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={{ xs: 2, md: 3 }}>
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} md={8}>
            <Card sx={{ 
              background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)", 
              borderRadius: "16px", 
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              overflow: "hidden"
            }}>
              <MDBox p={{ xs: 2, md: 3 }}>
                <MDTypography 
                  variant="h5" 
                  mb={{ xs: 2, md: 3 }} 
                  sx={{ 
                    fontWeight: 600, 
                    color: "#344767",
                    textAlign: { xs: "center", md: "left" }
                  }}
                >
                  Account Settings
                </MDTypography>
                {error && (
                  <MDTypography 
                    variant="body2" 
                    color="error" 
                    mb={2} 
                    sx={{ 
                      color: "#d32f2f",
                      textAlign: { xs: "center", md: "left" } 
                    }}
                  >
                    {error}
                  </MDTypography>
                )}
                {success && (
                  <MDTypography 
                    variant="body2" 
                    color="success" 
                    mb={2} 
                    sx={{ 
                      color: "#2e7d32",
                      textAlign: { xs: "center", md: "left" } 
                    }}
                  >
                    {success}
                  </MDTypography>
                )}
                <form onSubmit={handleSubmit}>
                  <MDBox mb={3} display="flex" justifyContent="center">
                    <Avatar
                      src={preview}
                      sx={{ 
                        width: { xs: 80, md: 100 }, 
                        height: { xs: 80, md: 100 }, 
                        border: "3px solid #fff",
                        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)"
                      }}
                    />
                  </MDBox>
                  <MDBox
                    mb={3}
                    sx={{
                      border: `2px dashed ${dragActive ? "#3f51b5" : "#bdbdbd"}`,
                      borderRadius: "8px",
                      padding: { xs: "16px", md: "20px" },
                      textAlign: "center",
                      backgroundColor: dragActive ? "rgba(63, 81, 181, 0.1)" : "rgba(0, 0, 0, 0.02)",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                    }}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("avatarInput").click()}
                  >
                    <MDTypography 
                      variant="body2" 
                      sx={{ 
                        color: dragActive ? "#3f51b5" : "#344767",
                        mb: 1 
                      }}
                    >
                      Drag & Drop or Click to Upload Avatar
                    </MDTypography>
                    <MDTypography 
                      variant="caption" 
                      sx={{ 
                        color: "#344767",
                        display: "block", 
                        mb: 1 
                      }}
                    >
                      (Supports PNG, JPG, up to 5MB)
                    </MDTypography>
                    <MDInput
                      id="avatarInput"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e.target.files[0])}
                      sx={{ display: "none" }}
                    />
                  </MDBox>
                  <Divider sx={{ mb: 3, backgroundColor: "rgba(0, 0, 0, 0.1)" }} />
                  <MDBox mb={3}>
                    <MDInput
                      label="Full Name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      fullWidth
                      required
                      sx={{
                        "& .MuiInputBase-input": {
                          padding: { xs: "10px", md: "12px" },
                          color: "#344767",
                        },
                        "& .MuiInputLabel-root": {
                          color: "#344767 !important",
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#344767 !important",
                        },
                        "& .MuiInputBase-input::placeholder": {
                          color: "#344767 !important",
                          opacity: 0.6,
                        },
                      }}
                    />
                  </MDBox>
                  <MDBox mb={3}>
                    <MDInput
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      fullWidth
                      required
                      sx={{
                        "& .MuiInputBase-input": {
                          padding: { xs: "10px", md: "12px" },
                          color: "#344767",
                        },
                        "& .MuiInputLabel-root": {
                          color: "#344767 !important",
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#344767 !important",
                        },
                        "& .MuiInputBase-input::placeholder": {
                          color: "#344767 !important",
                          opacity: 0.6,
                        },
                      }}
                    />
                  </MDBox>
                  <MDBox mb={3}>
                    <MDInput
                      label="NFT Mint Address (V1, V2, or V3)"
                      value={form.nftMintAddress}
                      onChange={(e) => setForm({ ...form, nftMintAddress: e.target.value })}
                      fullWidth
                      placeholder="Enter NFT mint address (e.g., 7GyvpxxxxxBaySaR)"
                      sx={{
                        "& .MuiInputBase-input": {
                          padding: { xs: "10px", md: "12px" },
                          color: "#344767",
                        },
                        "& .MuiInputLabel-root": {
                          color: "#344767 !important",
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#344767 !important",
                        },
                        "& .MuiInputBase-input::placeholder": {
                          color: "#344767 !important",
                          opacity: 0.6,
                        },
                      }}
                    />
                  </MDBox>
                  <MDBox display="flex" justifyContent="center" mb={3}>
                    <MDButton 
                      onClick={handleVerifyNFT}
                      color="secondary"
                      variant="gradient"
                      sx={{ 
                        padding: { xs: "8px 24px", md: "10px 32px" },
                        borderRadius: "8px",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                        },
                      }}
                    >
                      Verify NFT
                    </MDButton>
                  </MDBox>
                  <Divider sx={{ mb: 3, backgroundColor: "rgba(0, 0, 0, 0.1)" }} />
                  <MDBox mb={3}>
                    <MDTypography 
                      variant="h6" 
                      sx={{ 
                        color: "#344767", 
                        mb: 2,
                        textAlign: { xs: "center", md: "left" }
                      }}
                    >
                      Verified NFTs
                    </MDTypography>
                    <Card sx={{ background: "transparent", boxShadow: "none" }}>
                      <DataTable
                        table={tableData}
                        entriesPerPage={{ default: user.profile.nfts?.length || 100 }}
                        canSearch={false}
                        canSort={true}
                        sx={{
                          "& th": {
                            paddingRight: "20px !important",
                            paddingLeft: "20px !important",
                            color: "#ffffff !important",
                          },
                          "& td": {
                            color: "#ffffff !important",
                          },
                          "& .MuiTablePagination-root": {
                            display: "none !important",
                          },
                        }}
                      />
                      {(!user.profile.nfts || user.profile.nfts.length === 0) && (
                        <MDBox textAlign="center" py={2}>
                          <MDTypography variant="body2" sx={{ color: "#ffffff" }}>
                            No verified NFTs
                          </MDTypography>
                        </MDBox>
                      )}
                    </Card>
                  </MDBox>
                  <MDBox display="flex" justifyContent="center">
                    <MDButton 
                      type="submit" 
                      color="primary" 
                      variant="gradient" 
                      sx={{ 
                        padding: { xs: "8px 24px", md: "10px 32px" },
                        borderRadius: "8px",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(63, 81, 181, 0.3)",
                        },
                      }}
                    >
                      Save Changes
                    </MDButton>
                  </MDBox>
                </form>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default AccountSettings;