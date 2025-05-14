/**
=========================================================
* F4cetPanel - God Affiliate Editing Page
=========================================================

* Copyright 2023 F4cets Team
*/

// React imports
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

// Firebase imports
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "/lib/firebase";

// User context
import { useUser } from "/contexts/UserContext";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
import MDInput from "/components/MDInput";
import MDButton from "/components/MDButton";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";

// Categories for affiliate selection (same as stores)
const categories = [
  "Accessories", "Art & Collectibles", "Baby & Toddler", "Beauty", "Books, Movies & Music",
  "Clothing", "Craft Supplies", "Digital Goods", "Digital Services", "Ebooks", "EGames",
  "Electronics", "Fitness & Nutrition", "Food & Drinks", "Home & Living", "Jewelry",
  "Luggage & Bags", "NFTs", "Pet Supplies", "Private Access Groups", "Shoes", "Software",
  "Sporting Goods", "Toys & Games"
];

function AffiliateEdit() {
  const { user } = useUser();
  const router = useRouter();
  const { affiliateId } = router.query;
  const [affiliate, setAffiliate] = useState(null);
  const [form, setForm] = useState({
    name: "",
    affiliateLink: "",
    cryptoBackOffer: "",
    categories: [],
    logo: null,
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [dragActiveLogo, setDragActiveLogo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch affiliate from Firestore
  useEffect(() => {
    const fetchAffiliate = async () => {
      if (!user || !user.walletId || !affiliateId) return;

      try {
        const affiliateDoc = doc(db, "affiliates", affiliateId);
        const affiliateSnapshot = await getDoc(affiliateDoc);
        if (affiliateSnapshot.exists()) {
          const data = {
            id: affiliateSnapshot.id,
            ...affiliateSnapshot.data(),
          };
          setAffiliate(data);
          setForm({
            name: data.name || "",
            affiliateLink: data.affiliateLink || "",
            cryptoBackOffer: data.cryptoBackOffer || "",
            categories: data.categories || [],
            logo: null,
          });
          setLogoPreview(data.logoUrl || null);
        } else {
          setError("Affiliate not found.");
        }
      } catch (err) {
        console.error("Error fetching affiliate:", err);
        setError("Failed to load affiliate details.");
      }
    };

    fetchAffiliate();
  }, [user, affiliateId]);

  // Redirect to home if no user, no walletId, or unauthorized role
  useEffect(() => {
    if (!user || !user.walletId || user.role !== "god") {
      router.replace("/");
    }
  }, [user, router]);

  // Handle form changes
  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (category) => {
    setForm(prev => {
      const categories = prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories };
    });
  };

  const handleFileChange = (file) => {
    if (file) {
      setForm(prev => ({ ...prev, logo: file }));
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleDeleteImage = () => {
    setForm(prev => ({ ...prev, logo: null }));
    setLogoPreview(null);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveLogo(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveLogo(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveLogo(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFileChange(file);
    }
  };

  // Handle saving affiliate changes
  const handleSave = async () => {
    if (!affiliate || isSaving) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    if (!form.name || !form.affiliateLink || !form.cryptoBackOffer || !form.categories.length) {
      setError("Please fill in all required fields: Name, Affiliate Link, Crypto Back Offer, and at least one category.");
      setIsSaving(false);
      return;
    }

    try {
      let updatedForm = { ...form };

      // Upload logo if changed
      if (form.logo) {
        const extension = form.logo.name.split('.').pop();
        const logoRef = ref(storage, `affiliates/${affiliateId}/logo.${extension}`);
        console.log("Uploading logo to:", logoRef.fullPath); // Debugging
        await uploadBytes(logoRef, form.logo);
        updatedForm.logoUrl = await getDownloadURL(logoRef);
        console.log("Logo uploaded, URL:", updatedForm.logoUrl); // Debugging
      } else {
        updatedForm.logoUrl = affiliate.logoUrl || "";
      }

      const affiliateDoc = doc(db, "affiliates", affiliateId);
      await updateDoc(affiliateDoc, {
        name: updatedForm.name,
        affiliateLink: updatedForm.affiliateLink,
        cryptoBackOffer: updatedForm.cryptoBackOffer,
        categories: updatedForm.categories,
        logoUrl: updatedForm.logoUrl,
        updatedAt: new Date().toISOString(),
      });
      setAffiliate({ ...affiliate, ...updatedForm });
      setSuccess("Affiliate updated successfully!");
    } catch (err) {
      console.error("Error updating affiliate:", err);
      setError("Failed to save affiliate: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle flagging affiliate
  const handleFlagAffiliate = async () => {
    if (!affiliate || isFlagging) return;

    setIsFlagging(true);
    setError(null);
    setSuccess(null);

    try {
      const affiliateDoc = doc(db, "affiliates", affiliateId);
      await updateDoc(affiliateDoc, {
        removed: true,
        updatedAt: new Date().toISOString(),
      });
      setAffiliate({ ...affiliate, removed: true });
      setSuccess("Affiliate flagged for removal successfully!");
    } catch (err) {
      console.error("Error flagging affiliate:", err);
      setError("Failed to flag affiliate: " + err.message);
    } finally {
      setIsFlagging(false);
    }
  };

  // Ensure user is loaded and authorized before rendering
  if (!user || !user.walletId || user.role !== "god") {
    return null; // Or a loading spinner
  }

  // Handle invalid or missing affiliateId
  if (!affiliateId) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3} display="flex" justifyContent="center">
          <MDTypography variant="h4" color="error">
            Invalid Affiliate ID
          </MDTypography>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  // Handle no affiliate (e.g., still loading)
  if (!affiliate) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3} display="flex" justifyContent="center">
          <MDTypography variant="body2" color="text">
            Loading affiliate details...
          </MDTypography>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3} display="flex" justifyContent="center">
        <Grid container spacing={3} maxWidth="md">
          <Grid item xs={12}>
            <Card>
              <MDBox p={3} display="flex" flexDirection="column" alignItems="center">
                <MDTypography variant="h4" sx={{ color: "#212121" }} mb={2} textAlign="center">
                  Edit Affiliate - {affiliate.id}
                </MDTypography>
                {error && (
                  <MDTypography variant="body2" color="error" mb={2} textAlign="center">
                    {error}
                  </MDTypography>
                )}
                {success && (
                  <MDTypography variant="body2" color="success" mb={2} textAlign="center">
                    {success}
                  </MDTypography>
                )}
                <Grid container spacing={3} maxWidth="sm">
                  <Grid item xs={12}>
                    {logoPreview && (
                      <MDBox mb={3} display="flex" justifyContent="center">
                        <MDBox
                          sx={{
                            position: "relative",
                            width: { xs: "200px", md: "350px" }, // Widened
                            height: { xs: "150px", md: "200px" }, // Adjusted height
                          }}
                        >
                          <MDBox
                            component="img"
                            src={logoPreview}
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
                            onClick={handleDeleteImage}
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
                        border: `2px dashed ${dragActiveLogo ? "#3f51b5" : "#bdbdbd"}`,
                        borderRadius: "12px",
                        padding: { xs: "16px", md: "20px" },
                        textAlign: "center",
                        backgroundColor: dragActiveLogo ? "rgba(63, 81, 181, 0.1)" : "rgba(255, 255, 255, 0.9)",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        "&:hover": {
                          transform: "scale(1.02)",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        },
                        width: { xs: "200px", md: "350px" }, // Widened
                        height: { xs: "150px", md: "200px" }, // Adjusted height
                        margin: "0 auto",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      }}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById("logoInput").click()}
                    >
                      <MDTypography
                        variant="body2"
                        sx={{
                          color: dragActiveLogo ? "#3f51b5" : "#344767",
                          mb: 1,
                        }}
                      >
                        Drag & Drop or Click to Upload
                      </MDTypography>
                      <MDTypography
                        variant="caption"
                        sx={{
                          color: "#344767",
                          display: "block",
                          mb: 1,
                        }}
                      >
                        (Supports PNG, JPG, up to 5MB)
                      </MDTypography>
                      <MDInput
                        id="logoInput"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e.target.files[0])}
                        sx={{ display: "none" }}
                        disabled={isSaving}
                      />
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: "#212121",
                          textAlign: "center", // Changed from center
                        }}
                      >
                        Affiliate Logo
                      </MDTypography>
                    </MDBox>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ mb: 2, backgroundColor: "rgba(0, 0, 0, 0.1)" }} />
                    <MDBox mb={2}>
                      <MDTypography variant="h6" sx={{ color: "#212121", textAlign: "left" }} textAlign="left">
                        Affiliate ID
                      </MDTypography>
                      <MDInput
                        value={affiliate.id}
                        fullWidth
                        disabled
                        sx={{
                          "& .MuiInputBase-root": {
                            transition: "all 0.3s ease",
                            backgroundColor: theme => theme.palette.mode === 'dark' ? '#fff' : 'inherit',
                          },
                          "& .MuiInputBase-input": {
                            padding: { xs: "10px", md: "12px" },
                            color: theme => theme.palette.mode === 'dark' ? '#E0E0E0' : '#212121',
                          },
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                              borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#bdbdbd',
                            },
                            "&:hover fieldset": {
                              borderColor: theme => theme.palette.mode === 'dark' ? '#e0e0e0' : '#3f51b5',
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#3f51b5',
                            },
                          },
                        }}
                      />
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" sx={{ color: "#212121", textAlign: "left" }} textAlign="left">
                        Affiliate Name
                      </MDTypography>
                      <MDInput
                        value={form.name}
                        onChange={(e) => handleFormChange("name", e.target.value)}
                        fullWidth
                        required
                        disabled={isSaving}
                        sx={{
                          "& .MuiInputBase-root": {
                            transition: "all 0.3s ease",
                            backgroundColor: theme => theme.palette.mode === 'dark' ? '#fff' : 'inherit',
                          },
                          "& .MuiInputBase-input": {
                            padding: { xs: "10px", md: "12px" },
                            color: theme => theme.palette.mode === 'dark' ? '#E0E0E0' : '#212121',
                          },
                          "& .MuiInputLabel-root": {
                            color: theme => theme.palette.mode === 'dark' ? '#E0E0E0' : '#212121',
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: theme => theme.palette.mode === 'dark' ? '#E0E0E0' : '#212121',
                          },
                          "& .MuiInputBase-input::placeholder": {
                            color: theme => theme.palette.mode === 'dark' ? '#757575' : '#757575',
                            opacity: 1,
                          },
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                              borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#bdbdbd',
                            },
                            "&:hover fieldset": {
                              borderColor: theme => theme.palette.mode === 'dark' ? '#e0e0e0' : '#3f51b5',
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#3f51b5',
                            },
                          },
                        }}
                      />
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" sx={{ color: "#212121", textAlign: "left" }} textAlign="left">
                        Affiliate Link
                      </MDTypography>
                      <MDInput
                        value={form.affiliateLink}
                        onChange={(e) => handleFormChange("affiliateLink", e.target.value)}
                        fullWidth
                        required
                        placeholder="e.g., https://example.com"
                        disabled={isSaving}
                        sx={{
                          "& .MuiInputBase-root": {
                            transition: "all 0.3s ease",
                            backgroundColor: theme => theme.palette.mode === 'dark' ? '#fff' : 'inherit',
                          },
                          "& .MuiInputBase-input": {
                            padding: { xs: "10px", md: "12px" },
                            color: theme => theme.palette.mode === 'dark' ? '#E0E0E0' : '#212121',
                          },
                          "& .MuiInputLabel-root": {
                            color: theme => theme.palette.mode === 'dark' ? '#E0E0E0' : '#212121',
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: theme => theme.palette.mode === 'dark' ? '#E0E0E0' : '#212121',
                          },
                          "& .MuiInputBase-input::placeholder": {
                            color: theme => theme.palette.mode === 'dark' ? '#757575' : '#757575',
                            opacity: 1,
                          },
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                              borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#bdbdbd',
                            },
                            "&:hover fieldset": {
                              borderColor: theme => theme.palette.mode === 'dark' ? '#e0e0e0' : '#3f51b5',
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#3f51b5',
                            },
                          },
                        }}
                      />
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" sx={{ color: "#212121", textAlign: "left" }} textAlign="left">
                        Crypto Back Offer
                      </MDTypography>
                      <MDInput
                        value={form.cryptoBackOffer}
                        onChange={(e) => handleFormChange("cryptoBackOffer", e.target.value)}
                        fullWidth
                        required
                        placeholder="e.g., Upto 85% Crypto Cashback"
                        disabled={isSaving}
                        sx={{
                          "& .MuiInputBase-root": {
                            transition: "all 0.3s ease",
                            backgroundColor: theme => theme.palette.mode === 'dark' ? '#fff' : 'inherit',
                          },
                          "& .MuiInputBase-input": {
                            padding: { xs: "10px", md: "12px" },
                            color: theme => theme.palette.mode === 'dark' ? '#E0E0E0' : '#212121',
                          },
                          "& .MuiInputLabel-root": {
                            color: theme => theme.palette.mode === 'dark' ? '#E0E0E0' : '#212121',
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: theme => theme.palette.mode === 'dark' ? '#E0E0E0' : '#212121',
                          },
                          "& .MuiInputBase-input::placeholder": {
                            color: theme => theme.palette.mode === 'dark' ? '#757575' : '#757575',
                            opacity: 1,
                          },
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                              borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#bdbdbd',
                            },
                            "&:hover fieldset": {
                              borderColor: theme => theme.palette.mode === 'dark' ? '#e0e0e0' : '#3f51b5',
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#3f51b5',
                            },
                          },
                        }}
                      />
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography
                        variant="h6"
                        sx={{ fontWeight: 600, color: "#212121", mb: 1.5, textAlign: "left" }} // Changed from center
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
                          margin: "0 auto",
                          width: "100%",
                        }}
                      >
                        {categories.map(category => (
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
                                disabled={isSaving}
                                sx={{
                                  color: "#fff",
                                  "&.Mui-checked": { color: "#fff" },
                                  "& .MuiSvgIcon-root": { borderRadius: "4px" },
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
                                  "& .MuiChip-label": { padding: "0 8px", fontSize: "0.75rem" },
                                  "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
                                }}
                              />
                            )}
                          </MDBox>
                        ))}
                      </MDBox>
                    </MDBox>
                    <MDBox display="flex" justifyContent="center" gap={2}>
                      <MDButton
                        variant="gradient"
                        color="dark"
                        onClick={handleSave}
                        disabled={isSaving}
                        sx={{ width: { xs: "100%", sm: "auto" } }}
                      >
                        {isSaving ? "Saving..." : "Save Changes"}
                      </MDButton>
                      <MDButton
                        variant="gradient"
                        color="error"
                        onClick={handleFlagAffiliate}
                        disabled={isFlagging || affiliate.removed}
                        sx={{ width: { xs: "100%", sm: "auto" } }}
                      >
                        {isFlagging ? "Flagging..." : affiliate.removed ? "Affiliate Flagged" : "Flag Affiliate"}
                      </MDButton>
                    </MDBox>
                  </Grid>
                </Grid>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default AffiliateEdit;