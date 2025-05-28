/**
=========================================================
* F4cetPanel - Account Settings Page
=========================================================

* Copyright 2023 F4cets Team
*/

// React imports
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

// User context
import { useUser } from "/contexts/UserContext";

// Firebase imports
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "/lib/firebase";

// Axios for HTTP requests
import axios from "axios";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
import MDInput from "/components/MDInput";
import MDButton from "/components/MDButton";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";

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
        nftMintAddress: user.profile.nftMintAddress || "",
      });
      setPreview(user.profile.avatar || "/assets/images/default-avatar.png");
    }
  }, [user, router]);

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
            nftMintAddress: form.nftMintAddress,
            nftVerified: user.profile.nftVerified || false,
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
          nftMintAddress: form.nftMintAddress,
          nftVerified: user.profile.nftVerified || false,
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
        // Update user context and Firebase
        setUser({
          ...user,
          profile: {
            ...user.profile,
            nftMintAddress: form.nftMintAddress,
            nftVerified: true,
            nftVerifiedAt: new Date().toISOString(),
          },
        });

        await setDoc(
          doc(db, "users", user.walletId),
          {
            profile: {
              nftMintAddress: form.nftMintAddress,
              nftVerified: true,
              nftVerifiedAt: serverTimestamp(),
            },
          },
          { merge: true }
        );

        setSuccess("NFT ownership verified successfully!");
      } else {
        setError(verifyResponse.data.error || "Failed to verify NFT ownership.");
      }
    } catch (err) {
      console.error("Error verifying NFT:", err);
      setError("Failed to verify NFT: " + (err.response?.data?.error || err.message));
    }
  };

  if (!user || !user.walletId) {
    return null; // Or a loading spinner
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={{ xs: 2, md: 3 }}>
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} md={6}>
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
                      label="V1 NFT Verification"
                      value={form.nftMintAddress}
                      onChange={(e) => setForm({ ...form, nftMintAddress: e.target.value })}
                      fullWidth
                      placeholder="Enter NFT mint address (e.g., 7Gyvp22EGuPisfRNZVAN1zj3iDMgE7LqpVSThzBaySaR)"
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