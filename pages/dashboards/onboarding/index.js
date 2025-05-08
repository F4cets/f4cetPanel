/**
=========================================================
* F4cetPanel - Seller Onboarding Page
=========================================================

* Copyright 2023 F4cets Team
*/

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useWallet } from "@solana/wallet-adapter-react";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// User context
import { useUser } from "/contexts/UserContext";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Checkbox from "@mui/material/Checkbox";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton"; // Added for delete button

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
    shortDescription: "",
    shopEmail: "",
    subheading: "",
    categories: [],
    thumbnailImage: null,
    backgroundImage: null,
  });
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [dragActiveThumbnail, setDragActiveThumbnail] = useState(false);
  const [dragActiveBackground, setDragActiveBackground] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Check role and wallet
  useEffect(() => {
    console.log("Onboarding: Starting role fetch - Wallet ID from user:", user?.walletId, "PublicKey:", publicKey?.toString());
    const checkRole = async () => {
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
        if (userDoc.exists()) {
          const role = userDoc.data().role || "buyer";
          console.log("Onboarding: User Role:", role);
          setUserRole(role);
          // Redirect if not seller
          if (role !== "seller") {
            console.log("Onboarding: Unauthorized role, redirecting to buyer dashboard");
            router.push("/dashboards/buyer");
          }
        } else {
          console.log("Onboarding: No user found in Firestore");
          setUserRole("buyer");
          router.push("/dashboards/buyer");
        }
        setLoading(false);
      } catch (err) {
        console.error("Onboarding: Error fetching role:", err.message);
        setError(err.message);
        setLoading(false);
      }
    };
    checkRole();
  }, [user, publicKey, router]);

  // Handle file selection (click or drop)
  const handleFileChange = (file, field) => {
    if (file) {
      setForm((prev) => ({ ...prev, [field]: file }));
      if (field === "thumbnailImage") {
        setThumbnailPreview(URL.createObjectURL(file));
      } else if (field === "backgroundImage") {
        setBackgroundPreview(URL.createObjectURL(file));
      }
    }
  };

  // Handle image deletion
  const handleDeleteImage = (field) => {
    setForm((prev) => ({ ...prev, [field]: null }));
    if (field === "thumbnailImage") {
      setThumbnailPreview(null);
    } else if (field === "backgroundImage") {
      setBackgroundPreview(null);
    }
  };

  // Drag-and-drop handlers
  const handleDragEnter = (e, field) => {
    e.preventDefault();
    e.stopPropagation();
    if (field === "thumbnail") setDragActiveThumbnail(true);
    else if (field === "background") setDragActiveBackground(true);
  };
  const handleDragLeave = (e, field) => {
    e.preventDefault();
    e.stopPropagation();
    if (field === "thumbnail") setDragActiveThumbnail(false);
    else if (field === "background") setDragActiveBackground(false);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e, field) => {
    e.preventDefault();
    e.stopPropagation();
    if (field === "thumbnail") setDragActiveThumbnail(false);
    else if (field === "background") setDragActiveBackground(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFileChange(file, field === "thumbnail" ? "thumbnailImage" : "backgroundImage");
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
      const { storeName, shortDescription, shopEmail, subheading, categories, thumbnailImage, backgroundImage } = form;
      if (!storeName || !shortDescription || !shopEmail || !categories.length) {
        throw new Error("Please fill in all required fields");
      }

      // Upload images
      let thumbnailUrl = "";
      let backgroundUrl = "";
      if (thumbnailImage) {
        const thumbnailRef = ref(storage, `stores/${user.walletId}/thumbnail-${thumbnailImage.name}`);
        await uploadBytes(thumbnailRef, thumbnailImage);
        thumbnailUrl = await getDownloadURL(thumbnailRef);
      }
      if (backgroundImage) {
        const backgroundRef = ref(storage, `stores/${user.walletId}/banner-${backgroundImage.name}`);
        await uploadBytes(backgroundRef, backgroundImage);
        backgroundUrl = await getDownloadURL(backgroundRef);
      }

      // Save seller profile
      await setDoc(doc(db, "sellers", user.walletId), {
        storeName,
        shortDescription,
        shopEmail,
        subheading,
        categories,
        thumbnailImage: thumbnailUrl,
        backgroundImage: backgroundUrl,
        createdAt: new Date(),
      });

      // Update user role
      await setDoc(doc(db, "users", user.walletId), { role: "seller" }, { merge: true });
      setUser({ ...user, role: "seller" });

      setSuccess("Store profile created successfully!");
      setTimeout(() => router.push("/dashboards/seller"), 2000);
    } catch (error) {
      console.error("Error creating seller profile:", error);
      setError("Failed to create seller profile: " + error.message);
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
                backgroundColor: "rgba(255, 255, 0.8)",
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

  if (userRole !== "seller") {
    return null; // Redirect handled in useEffect
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
                    color: "#344767", // Dark text
                    textAlign: "center",
                    letterSpacing: "0.5px"
                  }}
                >
                  Create Your F4cet Store Profile
                </MDTypography>
                {error && (
                  <MDTypography 
                    variant="body2" 
                    color="error" 
                    mb={2} 
                    sx={{ 
                      color: "#d32f2f", // Explicit red for error
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
                      color: "#2e7d32", // Explicit green for success
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
                                "&:hover": {
                                  backgroundColor: "#b71c1c",
                                },
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
                          "&:hover": {
                            transform: "scale(1.02)",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                          },
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
                        <MDTypography 
                          variant="body2" 
                          sx={{ 
                            color: dragActiveThumbnail ? "#3f51b5" : "#344767",
                            mb: 1 
                          }}
                        >
                          Drag & Drop or Click to Upload
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
                          id="thumbnailInput"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e.target.files[0], "thumbnailImage")}
                          sx={{ display: "none" }}
                        />
                      </MDBox>
                      <MDBox mb={4}>
                        <MDTypography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600, 
                            color: "#344767",
                            textAlign: "center"
                          }}
                        >
                          Store Thumbnail
                        </MDTypography>
                      </MDBox>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      {backgroundPreview && (
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
                              src={backgroundPreview}
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
                              onClick={() => handleDeleteImage("backgroundImage")}
                              sx={{
                                position: "absolute",
                                top: "-10px",
                                right: "-10px",
                                backgroundColor: "#d32f2f",
                                color: "#fff",
                                "&:hover": {
                                  backgroundColor: "#b71c1c",
                                },
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
                          border: `2px dashed ${dragActiveBackground ? "#3f51b5" : "#bdbdbd"}`,
                          borderRadius: "12px",
                          padding: { xs: "16px", md: "20px" },
                          textAlign: "center",
                          backgroundColor: dragActiveBackground ? "rgba(63, 81, 181, 0.1)" : "rgba(255, 255, 255, 0.9)",
                          transition: "all 0.3s ease",
                          cursor: "pointer",
                          "&:hover": {
                            transform: "scale(1.02)",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                          },
                          width: { xs: "150px", md: "250px" },
                          height: { xs: "112px", md: "100px" },
                          margin: "0 auto",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                        }}
                        onDragEnter={(e) => handleDragEnter(e, "background")}
                        onDragLeave={(e) => handleDragLeave(e, "background")}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, "background")}
                        onClick={() => document.getElementById("backgroundInput").click()}
                      >
                        <MDTypography 
                          variant="body2" 
                          sx={{ 
                            color: dragActiveBackground ? "#3f51b5" : "#344767",
                            mb: 1 
                          }}
                        >
                          Drag & Drop or Click to Upload
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
                          id="backgroundInput"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e.target.files[0], "backgroundImage")}
                          sx={{ display: "none" }}
                        />
                      </MDBox>
                      <MDBox mb={4}>
                        <MDTypography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600, 
                            color: "#344767",
                            textAlign: "center"
                          }}
                        >
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
                            "& .MuiInputBase-root": {
                              transition: "all 0.3s ease",
                              "&:hover": {
                                transform: "scale(1.01)",
                              },
                            },
                            "& .MuiInputBase-input": {
                              padding: { xs: "12px", md: "14px" },
                              color: "#344767",
                            },
                            "& .MuiInputLabel-root": {
                              color: "#344767 !important",
                            },
                            "& .MuiInputLabel-root.Mui-focused": {
                              color: "#344767 !important",
                            },
                            "& .MuiOutlinedInput-root": {
                              "& fieldset": {
                                borderColor: "#bdbdbd",
                              },
                              "&:hover fieldset": {
                                borderColor: "#3f51b5",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: "#3f51b5",
                              },
                            },
                          }}
                        />
                      </MDBox>
                      <MDBox mb={4}>
                        <MDInput
                          label="Subheading"
                          name="subheading"
                          value={form.subheading}
                          onChange={handleInputChange}
                          fullWidth
                          placeholder="e.g., Free shipping on orders over 2 SOL! Use code F4CETS10"
                          sx={{
                            "& .MuiInputBase-root": {
                              transition: "all 0.3s ease",
                              "&:hover": {
                                transform: "scale(1.01)",
                              },
                            },
                            "& .MuiInputBase-input": {
                              padding: { xs: "12px", md: "14px" },
                              color: "#344767",
                            },
                            "& .MuiInputLabel-root": {
                              color: "#344767 !important",
                            },
                            "& .MuiInputLabel-root.Mui-focused": {
                              color: "#344767 !important",
                            },
                            "& .MuiInputBase-input::placeholder": {
                              color: "#757575",
                              opacity: 1,
                            },
                            "& .MuiOutlinedInput-root": {
                              "& fieldset": {
                                borderColor: "#bdbdbd",
                              },
                              "&:hover fieldset": {
                                borderColor: "#3f51b5",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: "#3f51b5",
                              },
                            },
                          }}
                        />
                      </MDBox>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <MDBox mb={4}>
                        <MDInput
                          label="Short Description"
                          name="shortDescription"
                          value={form.shortDescription}
                          onChange={handleInputChange}
                          multiline
                          rows={4}
                          fullWidth
                          required
                          placeholder="Company slogan - keep it to 1 sentence"
                          sx={{
                            "& .MuiInputBase-root": {
                              transition: "all 0.3s ease",
                              "&:hover": {
                                transform: "scale(1.01)",
                              },
                            },
                            "& .MuiInputBase-input": {
                              padding: { xs: "12px", md: "14px" },
                              color: "#344767",
                            },
                            "& .MuiInputLabel-root": {
                              color: "#344767 !important",
                            },
                            "& .MuiInputLabel-root.Mui-focused": {
                              color: "#344767 !important",
                            },
                            "& .MuiInputBase-input::placeholder": {
                              color: "#757575",
                              opacity: 1,
                            },
                            "& .MuiOutlinedInput-root": {
                              "& fieldset": {
                                borderColor: "#bdbdbd",
                              },
                              "&:hover fieldset": {
                                borderColor: "#3f51b5",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: "#3f51b5",
                              },
                            },
                          }}
                        />
                      </MDBox>
                      <MDBox mb={4}>
                        <MDInput
                          label="Shop Email"
                          name="shopEmail"
                          type="email"
                          value={form.shopEmail}
                          onChange={handleInputChange}
                          fullWidth
                          required
                          sx={{
                            "& .MuiInputBase-root": {
                              transition: "all 0.3s ease",
                              "&:hover": {
                                transform: "scale(1.01)",
                              },
                            },
                            "& .MuiInputBase-input": {
                              padding: { xs: "12px", md: "14px" },
                              color: "#344767",
                            },
                            "& .MuiInputLabel-root": {
                              color: "#344767 !important",
                            },
                            "& .MuiInputLabel-root.Mui-focused": {
                              color: "#344767 !important",
                            },
                            "& .MuiOutlinedInput-root": {
                              "& fieldset": {
                                borderColor: "#bdbdbd",
                              },
                              "&:hover fieldset": {
                                borderColor: "#3f51b5",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: "#3f51b5",
                              },
                            },
                          }}
                        />
                      </MDBox>
                    </Grid>
                  </Grid>
                  <MDBox mb={4}>
                    <MDTypography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600, 
                        color: "#344767",
                        mb: 1.5,
                        letterSpacing: "0.5px"
                      }}
                    >
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
                            "&:hover": {
                              backgroundColor: "rgba(255, 255, 255, 0.1)",
                            },
                            backgroundColor: form.categories.includes(category) ? "rgba(255, 255, 255, 0.15)" : "transparent",
                          }}
                        >
                          <MDBox display="flex" alignItems="center">
                            <Checkbox
                              checked={form.categories.includes(category)}
                              onChange={() => handleCategoryChange(category)}
                              sx={{
                                color: "#fff",
                                "&.Mui-checked": {
                                  color: "#fff",
                                },
                                "& .MuiSvgIcon-root": {
                                  borderRadius: "4px",
                                },
                                padding: "4px",
                              }}
                            />
                            <MDTypography
                              variant="body2"
                              sx={{
                                color: "#fff",
                                fontSize: { xs: "0.875rem", md: "1rem" },
                              }}
                            >
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
                                "& .MuiChip-label": {
                                  padding: "0 8px",
                                  fontSize: "0.75rem",
                                },
                                "&:hover": {
                                  backgroundColor: "rgba(255, 255, 255, 0.3)",
                                },
                              }}
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
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: "0 6px 16px rgba(0, 0, 0, 0.3)",
                        },
                      }}
                    >
                      Save Profile
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