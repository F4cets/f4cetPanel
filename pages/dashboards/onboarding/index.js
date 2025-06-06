/**
=========================================================
* F4cetPanel - Seller Onboarding Page
=========================================================

* Copyright 2025 F4cets Team
*/

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useWallet } from "@solana/wallet-adapter-react";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Keypair } from "@solana/web3.js";
import { v4 as uuidv4 } from "uuid";

// User context
import { useUser } from "/contexts/UserContext";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Checkbox from "@mui/material/Checkbox";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDInput from "/components/MDInput";
import MDButton from "/components/MDButton";
import MDTypography from "/components/MDTypography";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";

import { db, storage } from "/lib/firebase";

const categories = [
  "Accessories", "Art & Collectibles", "Baby & Toddler", "Beauty", "Books, Movies & Music",
  "Clothing", "Craft Supplies", "Digital Goods", "Digital Services", "Ebooks", "EGames",
  "Electronics", "Fitness & Nutrition", "Food & Drinks", "Home & Living", "Jewelry",
  "Luggage & Bags", "NFTs", "Pet Supplies", "Private Access Groups", "Shoes", "Software",
  "Sporting Goods", "Toys & Games"
];

export default function SellerOnboarding() {
  const { user, setUser } = useUser();
  const router = useRouter();
  const { publicKey } = useWallet();
  const [form, setForm] = useState({
    storeName: "",
    description: "",
    sellerName: "",
    shippingAddress: "",
    taxId: "",
    maxPrice: "",
    minPrice: "",
    categories: [],
    thumbnailImage: null,
    bannerImage: null,
  });
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [dragActiveThumbnail, setDragActiveThumbnail] = useState(false);
  const [dragActiveBanner, setDragActiveBanner] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [storeId, setStoreId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Check role and load store data
  useEffect(() => {
    console.log("Onboarding: Starting role fetch - Wallet ID from user:", user?.walletId, "PublicKey:", publicKey?.toString());
    const checkRoleAndStore = async () => {
      try {
        if (!user || !user.walletId) {
          throw new Error("Wallet ID is missing from user context");
        }
        if (!publicKey) {
          throw new Error("PublicKey is missing - wallet not connected");
        }
        if (publicKey.toString() !== user.walletId) {
          throw new Error("Connected wallet does not match the wallet ID in user context");
        }

        console.log("Onboarding: Fetching user role for wallet:", user.walletId);
        const userDoc = await getDoc(doc(db, "users", user.walletId));
        if (!userDoc.exists()) {
          console.log("Onboarding: No user found in Firestore, redirecting to buyer dashboard");
          setUserRole("buyer");
          router.push("/dashboards/buyer");
          return;
        }

        const userData = userDoc.data();
        const role = userData.role || "buyer";
        console.log("Onboarding: User Role:", role);
        setUserRole(role);

        // Load store data if seller
        if (role === "seller") {
          const storeIds = userData.storeIds || [];
          console.log("Onboarding: Store IDs:", storeIds);
          if (storeIds.length > 0) {
            console.log("Onboarding: Loading store data for editing");
            setStoreId(storeIds[0]); // Assume one store for simplicity
            const storeDoc = await getDoc(doc(db, "stores", storeIds[0]));
            if (storeDoc.exists()) {
              const storeData = storeDoc.data();
              console.log("Onboarding: Store Data:", storeData);
              setForm({
                storeName: storeData.name || "",
                description: storeData.description || "",
                sellerName: storeData.businessInfo?.sellerName || "",
                shippingAddress: storeData.businessInfo?.shippingAddress || "",
                taxId: storeData.businessInfo?.taxId || "",
                maxPrice: storeData.maxPrice?.toString() || "",
                minPrice: storeData.minPrice?.toString() || "",
                categories: storeData.categories || [],
                thumbnailImage: null,
                bannerImage: null,
              });
              setThumbnailPreview(storeData.thumbnailUrl || null);
              setBannerPreview(storeData.bannerUrl || null);
              console.log("Onboarding: Thumbnail Preview URL:", storeData.thumbnailUrl);
              console.log("Onboarding: Banner Preview URL:", storeData.bannerUrl);
            } else {
              console.log("Onboarding: Store document not found for storeId:", storeIds[0]);
            }
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Onboarding: Error fetching role/store:", err.message);
        setError(err.message);
        setLoading(false);
      }
    };
    checkRoleAndStore();
  }, [user, publicKey, router]);

  // Handle file selection (click or drop)
  const handleFileChange = (file, field) => {
    if (file) {
      setForm((prev) => ({ ...prev, [field]: file }));
      if (field === "thumbnailImage") {
        setThumbnailPreview(URL.createObjectURL(file));
      } else if (field === "bannerImage") {
        setBannerPreview(URL.createObjectURL(file));
      }
    }
  };

  // Handle image deletion
  const handleDeleteImage = (field) => {
    setForm((prev) => ({ ...prev, [field]: null }));
    if (field === "thumbnailImage") {
      setThumbnailPreview(null);
    } else if (field === "bannerImage") {
      setBannerPreview(null);
    }
  };

  // Drag-and-drop handlers
  const handleDragEnter = (e, field) => {
    e.preventDefault();
    e.stopPropagation();
    if (field === "thumbnail") setDragActiveThumbnail(true);
    else if (field === "banner") setDragActiveBanner(true);
  };
  const handleDragLeave = (e, field) => {
    e.preventDefault();
    e.stopPropagation();
    if (field === "thumbnail") setDragActiveThumbnail(false);
    else if (field === "banner") setDragActiveBanner(false);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e, field) => {
    e.preventDefault();
    e.stopPropagation();
    if (field === "thumbnail") setDragActiveThumbnail(false);
    else if (field === "banner") setDragActiveBanner(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFileChange(file, field === "thumbnail" ? "thumbnailImage" : "bannerImage");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (category) => {
    setForm((prev) => {
      const categories = prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      const { storeName, description, sellerName, shippingAddress, taxId, maxPrice, minPrice, categories, thumbnailImage, bannerImage } = form;
      if (!storeName || !description || !sellerName || !shippingAddress || !maxPrice || !minPrice || !categories.length || (!thumbnailImage && !thumbnailPreview)) {
        throw new Error("Please fill in all required fields");
      }

      // Validate price fields
      const maxPriceNum = parseFloat(maxPrice);
      const minPriceNum = parseFloat(minPrice);
      if (isNaN(maxPriceNum) || isNaN(minPriceNum) || maxPriceNum <= minPriceNum) {
        throw new Error("Max price must be greater than min price and both must be valid numbers");
      }

      // Generate escrow wallet (only for new stores)
      const escrowId = storeId ? null : Keypair.generate().publicKey.toString();

      // Upload images if changed
      let thumbnailUrl = thumbnailPreview;
      let bannerUrl = bannerPreview;
      if (thumbnailImage) {
        const fileExt = thumbnailImage.name.split('.').pop().toLowerCase();
        const thumbnailRef = ref(storage, `stores/${storeId || user.walletId}/thumbnail.${fileExt}`);
        console.log("Onboarding: Uploading thumbnail to:", thumbnailRef.fullPath);
        await uploadBytes(thumbnailRef, thumbnailImage);
        thumbnailUrl = await getDownloadURL(thumbnailRef);
        console.log("Onboarding: Thumbnail URL:", thumbnailUrl);
      }
      if (bannerImage) {
        const fileExt = bannerImage.name.split('.').pop().toLowerCase();
        const bannerRef = ref(storage, `stores/${storeId || user.walletId}/banner.${fileExt}`);
        console.log("Onboarding: Uploading banner to:", bannerRef.fullPath);
        await uploadBytes(bannerRef, bannerImage);
        bannerUrl = await getDownloadURL(bannerRef);
        console.log("Onboarding: Banner URL:", bannerUrl);
      }

      // Use existing storeId or generate new one
      const targetStoreId = storeId || `${storeName.replace(/\s+/g, '-').toLowerCase()}-${uuidv4().slice(0, 8)}`;

      // Save or update store profile
      const storeData = {
        name: storeName,
        description,
        businessInfo: {
          sellerName,
          shippingAddress,
          taxId: taxId || "",
        },
        categories,
        maxPrice: maxPriceNum,
        minPrice: minPriceNum,
        thumbnailUrl,
        bannerUrl,
        isActive: true,
        sellerId: user.walletId,
        updatedAt: serverTimestamp(),
      };
      if (!storeId) {
        storeData.escrowId = escrowId;
        storeData.createdAt = serverTimestamp();
      }

      console.log("Onboarding: Saving store data to stores/", targetStoreId, ":", storeData);
      await setDoc(doc(db, "stores", targetStoreId), storeData, { merge: true });

      // Update user with storeId and role
      await setDoc(doc(db, "users", user.walletId), {
        role: "seller",
        storeIds: [targetStoreId],
      }, { merge: true });

      // Update local user context
      setUser({ ...user, role: "seller", storeIds: [targetStoreId] });

      setSuccess("Store profile saved successfully!");
      setTimeout(() => router.push("/dashboards/seller"), 2000);
    } catch (error) {
      console.error("Onboarding: Error saving seller profile:", error);
      setError("Failed to save seller profile: " + error.message);
    }
  };

  if (error) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={{ xs: 2, md: 3 }}>
          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} md={9}>
              <Card sx={{
                background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                borderRadius: "16px",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                backdropFilter: "blur(10px)",
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                overflow: "hidden"
              }}>
                <MDBox p={{ xs: 2, md: 3 }}>
                  <MDTypography variant="h5" mb={{ xs: 2, md: 3 }} sx={{ fontWeight: 600, textAlign: { xs: "center", md: "left" } }}>
                    Error
                  </MDTypography>
                  <MDTypography variant="body2" color="error" sx={{ textAlign: { xs: "center", md: "left" } }}>
                    {error}
                  </MDTypography>
                </MDBox>
              </Card>
            </Grid>
          </Grid>
        </MDBox>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={{ xs: 2, md: 3 }}>
          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} md={9}>
              <Card sx={{
                background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                borderRadius: "16px",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                backdropFilter: "blur(10px)",
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                overflow: "hidden"
              }}>
                <MDBox p={{ xs: 2, md: 3 }}>
                  <MDTypography variant="h5" mb={{ xs: 2, md: 3 }} sx={{ fontWeight: 600, textAlign: { xs: "center", md: "left" } }}>
                    Loading...
                  </MDTypography>
                </MDBox>
              </Card>
            </Grid>
          </Grid>
        </MDBox>
      </DashboardLayout>
    );
  }

  if (!publicKey || !user || publicKey.toString() !== user.walletId) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={{ xs: 2, md: 3 }}>
          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} md={9}>
              <Card sx={{
                background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                borderRadius: "16px",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                backdropFilter: "blur(10px)",
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                overflow: "hidden"
              }}>
                <MDBox p={{ xs: 2, md: 3 }}>
                  <MDTypography variant="h5" mb={{ xs: 2, md: 3 }} sx={{ fontWeight: 600, textAlign: { xs: "center", md: "left" } }}>
                    Connect Wallet
                  </MDTypography>
                  <MDTypography variant="body2" sx={{ textAlign: { xs: "center", md: "left" } }}>
                    Please connect your wallet to continue.
                  </MDTypography>
                  <MDTypography variant="body2" sx={{ textAlign: { xs: "center", md: "left" } }}>
                    Expected Wallet ID: {user?.walletId || "Unknown"}
                  </MDTypography>
                  <MDTypography variant="body2" sx={{ textAlign: { xs: "center", md: "left" } }}>
                    Connected Wallet: {publicKey ? publicKey.toString() : "Not connected"}
                  </MDTypography>
                </MDBox>
              </Card>
            </Grid>
          </Grid>
        </MDBox>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={{ xs: 2, md: 3 }}>
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} md={9}>
            <Card sx={{
              background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
              borderRadius: "16px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
              backdropFilter: "blur(10px)",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              overflow: "hidden"
            }}>
              <MDBox p={{ xs: 2, md: 4 }}>
                <MDTypography
                  variant="h5"
                  mb={{ xs: 3, md: 4 }}
                  sx={{
                    fontWeight: 700,
                    color: "#344767",
                    textAlign: "center",
                    letterSpacing: "0.5px"
                  }}
                >
                  {storeId ? "Edit Your F4cet Store Profile" : "Create Your F4cet Store Profile"}
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
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      {thumbnailPreview && (
                        <MDBox mb={3} display="flex" justifyContent="center">
                          <MDBox
                            sx={{
                              position: "relative",
                              width: { xs: "150px", md: "200px" },
                              height: { xs: "150px", md: "200px" },
                            }}
                          >
                            <MDBox
                              component="img"
                              src={thumbnailPreview}
                              sx={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "12px",
                                border: "2px solid #e0e0e0",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                                objectFit: "cover",
                              }}
                            />
                            <IconButton
                              onClick={() => handleDeleteImage("thumbnailImage")}
                              sx={{
                                position: "absolute",
                                top: "-10px",
                                right: "-10px",
                                backgroundColor: "#d32f2f",
                                color: "#fff",
                                "&:hover": { backgroundColor: "#b71c1c" },
                              }}
                            >
                              <Icon>close</Icon>
                            </IconButton>
                          </MDBox>
                        </MDBox>
                      )}
                      <MDBox
                        mb={1}
                        sx={{
                          border: `2px dashed ${dragActiveThumbnail ? "#3f51b5" : "#bdbdbd"}`,
                          borderRadius: "12px",
                          padding: { xs: "16px", md: "20px" },
                          textAlign: "center",
                          backgroundColor: dragActiveThumbnail ? "rgba(63, 81, 181, 0.1)" : "rgba(255, 255, 255, 0.9)",
                          transition: "all 0.3s ease",
                          cursor: "pointer",
                          "&:hover": { transform: "scale(1.02)", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" },
                          width: { xs: "150px", md: "250px" },
                          height: { xs: "112px", md: "100px" },
                          margin: "0 auto",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                        }}
                        onDragEnter={(e) => handleDragEnter(e, "thumbnail")}
                        onDragLeave={(e) => handleDragLeave(e, "thumbnail")}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, "thumbnail")}
                        onClick={() => document.getElementById("thumbnailInput").click()}
                      >
                        <MDTypography variant="body2" sx={{ color: dragActiveThumbnail ? "#3f51b5" : "#344767", mb: 1 }}>
                          Drag & Drop or Click to Upload
                        </MDTypography>
                        <MDTypography variant="caption" sx={{ color: "#344767", display: "block", mb: 1 }}>
                          (Supports PNG, JPG, WebP, up to 5MB)
                        </MDTypography>
                        <MDInput
                          id="thumbnailInput"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e.target.files[0], "thumbnailImage")}
                          sx={{ display: "none" }}
                        />
                      </MDBox>
                      <MDBox mb={4}>
                        <MDTypography variant="h6" sx={{ fontWeight: 600, color: "#344767", textAlign: "center" }}>
                          Store Thumbnail
                        </MDTypography>
                      </MDBox>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      {bannerPreview && (
                        <MDBox mb={3} display="flex" justifyContent="center">
                          <MDBox
                            sx={{
                              position: "relative",
                              width: { xs: "250px", md: "400px" },
                              height: { xs: "140px", md: "200px" },
                            }}
                          >
                            <MDBox
                              component="img"
                              src={bannerPreview}
                              sx={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "12px",
                                border: "2px solid #e0e0e0",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                                objectFit: "cover",
                              }}
                            />
                            <IconButton
                              onClick={() => handleDeleteImage("bannerImage")}
                              sx={{
                                position: "absolute",
                                top: "-10px",
                                right: "-10px",
                                backgroundColor: "#d32f2f",
                                color: "#fff",
                                "&:hover": { backgroundColor: "#b71c1c" },
                              }}
                            >
                              <Icon>close</Icon>
                            </IconButton>
                          </MDBox>
                        </MDBox>
                      )}
                      <MDBox
                        mb={1}
                        sx={{
                          border: `2px dashed ${dragActiveBanner ? "#3f51b5" : "#bdbdbd"}`,
                          borderRadius: "12px",
                          padding: { xs: "16px", md: "20px" },
                          textAlign: "center",
                          backgroundColor: dragActiveBanner ? "rgba(63, 81, 181, 0.1)" : "rgba(255, 255, 255, 0.9)",
                          transition: "all 0.3s ease",
                          cursor: "pointer",
                          "&:hover": { transform: "scale(1.02)", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" },
                          width: { xs: "150px", md: "250px" },
                          height: { xs: "112px", md: "100px" },
                          margin: "0 auto",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                        }}
                        onDragEnter={(e) => handleDragEnter(e, "banner")}
                        onDragLeave={(e) => handleDragLeave(e, "banner")}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, "banner")}
                        onClick={() => document.getElementById("bannerInput").click()}
                      >
                        <MDTypography variant="body2" sx={{ color: dragActiveBanner ? "#3f51b5" : "#344767", mb: 1 }}>
                          Drag & Drop or Click to Upload
                        </MDTypography>
                        <MDTypography variant="caption" sx={{ color: "#344767", display: "block", mb: 1 }}>
                          (Supports PNG, JPG, WebP, up to 5MB)
                        </MDTypography>
                        <MDInput
                          id="bannerInput"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e.target.files[0], "bannerImage")}
                          sx={{ display: "none" }}
                        />
                      </MDBox>
                      <MDBox mb={4}>
                        <MDTypography variant="h6" sx={{ fontWeight: 600, color: "#344767", textAlign: "center" }}>
                          Store Banner Image
                        </MDTypography>
                      </MDBox>
                    </Grid>
                  </Grid>
                  <Divider sx={{ mb: 4, backgroundColor: "rgba(0, 0, 0, 0.1)" }} />
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <MDBox mb={4}>
                        <MDInput
                          label="Store Name"
                          name="storeName"
                          value={form.storeName}
                          onChange={handleInputChange}
                          fullWidth
                          required
                          sx={{
                            "& .MuiInputBase-root": { transition: "all 0.3s ease", "&:hover": { transform: "scale(1.01)" } },
                            "& .MuiInputBase-input": { padding: { xs: "12px", md: "14px" }, color: "#344767" },
                            "& .MuiInputLabel-root": { color: "#344767 !important" },
                            "& .MuiInputLabel-root.Mui-focused": { color: "#344767 !important" },
                            "& .MuiOutlinedInput-root": {
                              "& fieldset": { borderColor: "#bdbdbd" },
                              "&:hover fieldset": { borderColor: "#3f51b5" },
                              "&.Mui-focused fieldset": { borderColor: "#3f51b5" },
                            },
                          }}
                        />
                      </MDBox>
                      <MDBox mb={4}>
                        <MDInput
                          label="Seller Name"
                          name="sellerName"
                          value={form.sellerName}
                          onChange={handleInputChange}
                          fullWidth
                          required
                          sx={{
                            "& .MuiInputBase-root": { transition: "all 0.3s ease", "&:hover": { transform: "scale(1.01)" } },
                            "& .MuiInputBase-input": { padding: { xs: "12px", md: "14px" }, color: "#344767" },
                            "& .MuiInputLabel-root": { color: "#344767 !important" },
                            "& .MuiInputLabel-root.Mui-focused": { color: "#344767 !important" },
                            "& .MuiOutlinedInput-root": {
                              "& fieldset": { borderColor: "#bdbdbd" },
                              "&:hover fieldset": { borderColor: "#3f51b5" },
                              "&.Mui-focused fieldset": { borderColor: "#3f51b5" },
                            },
                          }}
                        />
                      </MDBox>
                      <MDBox mb={4}>
                        <MDInput
                          label="Description"
                          name="description"
                          value={form.description}
                          onChange={handleInputChange}
                          multiline
                          rows={4}
                          fullWidth
                          required
                          placeholder="Company slogan - keep it to 1 sentence"
                          sx={{
                            "& .MuiInputBase-root": { transition: "all 0.3s ease", "&:hover": { transform: "scale(1.01)" } },
                            "& .MuiInputBase-input": { padding: { xs: "12px", md: "14px" }, color: "#344767" },
                            "& .MuiInputLabel-root": { color: "#344767 !important" },
                            "& .MuiInputLabel-root.Mui-focused": { color: "#344767 !important" },
                            "& .MuiInputBase-input::placeholder": { color: "#757575", opacity: 1 },
                            "& .MuiOutlinedInput-root": {
                              "&nbsp; fieldset": { borderColor: "#bdbdbd" },
                              "&:hover fieldset": { borderColor: "#3f51b5" },
                              "&.Mui-focused fieldset": { borderColor: "#3f51b5" },
                            },
                          }}
                        />
                      </MDBox>
                    </Grid>
                    <Grid item xs={6}>
                      <MDBox mb={4}>
                        <MDInput
                          label="Shipping Address"
                          name="shippingAddress"
                          value={form.shippingAddress}
                          onChange={handleInputChange}
                          fullWidth
                          required
                          sx={{
                            "& .MuiInputBase-root": { transition: "all 0.3s ease", "&:hover": { transform: "scale(1.01)" } },
                            "& .MuiInputBase-input": { padding: { xs: "12px", md: "14px" }, color: "#344767" },
                            "& .MuiInputLabel-root": { color: "#344767 !important" },
                            "& .MuiInputLabel-root.Mui-focused": { color: "#344767 !important" },
                            "& .MuiOutlinedInput-root": {
                              "& fieldset": { borderColor: "#bdbdbd" },
                              "&:hover fieldset": { borderColor: "#3f51b5" },
                              "&.Mui-focused fieldset": { borderColor: "#3f51b5" },
                            },
                          }}
                        />
                      </MDBox>
                      <MDBox mb={4}>
                        <MDInput
                          label="Tax ID (Optional)"
                          name="taxId"
                          value={form.taxId}
                          onChange={handleInputChange}
                          fullWidth
                          sx={{
                            "& .MuiInputBase-root": { transition: "all 0.3s ease", "&:hover": { transform: "scale(1.01)" } },
                            "& .MuiInputBase-input": { padding: { xs: "12px", md: "14px" }, color: "#344767" },
                            "& .MuiInputLabel-root": { color: "#344767 !important" },
                            "& .MuiInputLabel-root.Mui-focused": { color: "#344767 !important" },
                            "& .MuiOutlinedInput-root": {
                              "& fieldset": { borderColor: "#bdbdbd" },
                              "&:hover fieldset": { borderColor: "#3f51b5" },
                              "&.Mui-focused fieldset": { borderColor: "#3f51b5" },
                            },
                          }}
                        />
                      </MDBox>
                      <MDBox mb={4}>
                        {/* CHANGED: Prevent negative values, enforce min 0.01 */}
                        <MDInput
                          label="Minimum Price (USD)"
                          name="minPrice"
                          type="number"
                          value={form.minPrice}
                          onChange={(e) => {
                            const value = e.target.value;
                            setForm((prev) => ({
                              ...prev,
                              minPrice: value === "" || parseFloat(value) >= 0.01 ? value : "0.01",
                            }));
                          }}
                          min="0.01"
                          fullWidth
                          required
                          sx={{
                            "& .MuiInputBase-root": { transition: "all 0.3s ease", "&:hover": { transform: "scale(1.01)" } },
                            "& .MuiInputBase-input": { padding: { xs: "12px", md: "14px" }, color: "#344767" },
                            "& .MuiInputLabel-root": { color: "#344767 !important" },
                            "& .MuiInputLabel-root.Mui-focused": { color: "#344767 !important" },
                            "& .MuiOutlinedInput-root": {
                              "& fieldset": { borderColor: "#bdbdbd" },
                              "&:hover fieldset": { borderColor: "#3f51b5" },
                              "&.Mui-focused fieldset": { borderColor: "#3f51b5" },
                            },
                          }}
                        />
                      </MDBox>
                      <MDBox mb={4}>
                        {/* CHANGED: Prevent negative values, enforce min 0.01 */}
                        <MDInput
                          label="Maximum Price (USD)"
                          name="maxPrice"
                          type="number"
                          value={form.maxPrice}
                          onChange={(e) => {
                            const value = e.target.value;
                            setForm((prev) => ({
                              ...prev,
                              maxPrice: value === "" || parseFloat(value) >= 0.01 ? value : "0.01",
                            }));
                          }}
                          min="0.01"
                          fullWidth
                          required
                          sx={{
                            "& .MuiInputBase-root": { transition: "all 0.3s ease", "&:hover": { transform: "scale(1.01)" } },
                            "& .MuiInputBase-input": { padding: { xs: "12px", md: "14px" }, color: "#344767" },
                            "& .MuiInputLabel-root": { color: "#344767 !important" },
                            "& .MuiInputLabel-root.Mui-focused": { color: "#344767 !important" },
                            "& .MuiOutlinedInput-root": {
                              "& fieldset": { borderColor: "#bdbdbd" },
                              "&:hover fieldset": { borderColor: "#3f51b5" },
                              "&.Mui-focused fieldset": { borderColor: "#3f51b5" },
                            },
                          }}
                        />
                      </MDBox>
                    </Grid>
                  </Grid>
                  <MDBox mb={4}>
                    <MDTypography variant="h6" sx={{ fontWeight: 600, color: "#344767", mb: 1.5, letterSpacing: "0.5px" }}>
                      Categories
                    </MDTypography>
                    <MDBox
                      sx={{
                        maxHeight: "200px",
                        overflowY: "auto",
                        borderRadius: "12px",
                        padding: "10px",
                        background: "linear-gradient(135deg, #6c6083 0%, #4d455d 100%)",
                        boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      {categories.map((category) => (
                        <MDBox
                          key={category}
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          sx={{
                            padding: "8px 12px",
                            borderRadius: "8px",
                            transition: "background-color 0.3s ease",
                            "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
                            backgroundColor: form.categories.includes(category) ? "rgba(255, 255, 255, 0.15)" : "transparent",
                          }}
                        >
                          <MDBox display="flex" alignItems="center">
                            <Checkbox
                              checked={form.categories.includes(category)}
                              onChange={() => handleCategoryChange(category)}
                              sx={{
                                color: "#fff",
                                "&.Mui-checked": { color: "#fff" },
                                "& .MuiSvgIcon-root": { borderRadius: "4px" },
                                padding: "4px",
                              }}
                            />
                            <MDTypography variant="body2" sx={{ color: "#fff", fontSize: { xs: "0.875rem", md: "1rem" } }}>
                              {category}
                            </MDTypography>
                          </MDBox>
                          {form.categories.includes(category) && (
                            <Chip
                              label={category}
                              onDelete={() => handleCategoryChange(category)}
                              deleteIcon={<Icon sx={{ color: "#fff !important", "&:hover": { color: "#e0e0e0 !important" } }}>clear</Icon>}
                              sx={{
                                backgroundColor: "rgba(255, 255, 255, 0.2)",
                                color: "#fff",
                                borderRadius: "16px",
                                height: "24px",
                                "& .MuiChip-label": { padding: "0 8px", fontSize: "0.75rem" },
                                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
                              }
                            }
                            />
                          )}
                        </MDBox>
                      ))}
                    </MDBox>
                  </MDBox>
                  <MDBox display="flex" justifyContent="center">
                    <MDButton
                      type="submit"
                      color="primary"
                      variant="gradient"
                      sx={{
                        padding: { xs: "10px 28px", md: "12px 36px" },
                        borderRadius: "12px",
                        transition: "all 0.5s ease",
                        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 6px 16px rgba(0, 0, 0, 0.3)" },
                      }}
                    >
                      {storeId ? "Update Profile" : "Save Profile"}
                    </MDButton>
                  </MDBox>
                </form>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}