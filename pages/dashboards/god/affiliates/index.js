/**
=========================================================
* F4cetPanel - God Affiliate Search and Creation Page
=========================================================

* Copyright 2023 F4cets Team
*/

// React imports
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

// Framer Motion for animations
import { motion } from "framer-motion";

// Firebase imports
import { collection, getDocs, addDoc, query, orderBy, limit, startAfter } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "/lib/firebase";

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

// Animation variants for the button
const buttonVariants = {
  rest: {
    scale: 1,
    rotate: 0,
    transition: { duration: 0.3 },
  },
  hover: {
    scale: 1.1,
    rotate: [0, 5, -5, 5, 0],
    transition: {
      scale: { duration: 0.2 },
      rotate: { repeat: 1, duration: 0.5 },
    },
  },
};

function AffiliateSearch() {
  const { user } = useUser();
  const router = useRouter();
  const [affiliates, setAffiliates] = useState([]);
  const [displayedAffiliates, setDisplayedAffiliates] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    affiliateLink: "",
    cryptoBackOffer: "",
    categories: [],
    logo: null,
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [dragActiveLogo, setDragActiveLogo] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const loaderRef = useRef(null);

  // Fetch affiliates from Firestore with infinite scroll
  const fetchAffiliates = useCallback(async () => {
    if (!user || !user.walletId || isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const pageSize = 10; // Load 10 affiliates at a time
      let affiliatesQuery = query(
        collection(db, "affiliates"),
        orderBy("name"),
        limit(pageSize)
      );

      if (lastDoc) {
        affiliatesQuery = query(
          collection(db, "affiliates"),
          orderBy("name"),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }

      const affiliatesSnapshot = await getDocs(affiliatesQuery);
      const affiliatesData = affiliatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })).filter(affiliate => affiliate.name && affiliate.affiliateLink);

      setDisplayedAffiliates(prev => {
        const newData = [...prev, ...affiliatesData];
        return Array.from(new Map(newData.map(item => [item.id, item])).values());
      });
      setAffiliates(prev => {
        const newData = [...prev, ...affiliatesData];
        return Array.from(new Map(newData.map(item => [item.id, item])).values());
      });
      setLastDoc(affiliatesSnapshot.docs[affiliatesSnapshot.docs.length - 1]);
      setHasMore(affiliatesSnapshot.docs.length === pageSize);

      console.log("Fetched affiliates:", affiliatesData); // Debugging
    } catch (err) {
      console.error("Error fetching affiliates:", err);
      setError("Failed to load affiliates.");
    } finally {
      setIsLoading(false);
    }
  }, [user, lastDoc, isLoading, hasMore]);

  // Initial fetch
  useEffect(() => {
    fetchAffiliates();
  }, [fetchAffiliates]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchAffiliates();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [hasMore, isLoading, fetchAffiliates]);

  // Redirect to home if no user, no walletId, or unauthorized role
  useEffect(() => {
    if (!user || !user.walletId || user.role !== "god") {
      router.replace("/");
    }
  }, [user, router]);

  // Filter affiliates by search term
  const filteredAffiliates = displayedAffiliates.filter(affiliate =>
    (affiliate.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (affiliate.id?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  // Handle create affiliate modal
  const handleOpenCreateModal = () => setOpenCreateModal(true);
  const handleCloseCreateModal = () => {
    setOpenCreateModal(false);
    setCreateForm({
      name: "",
      affiliateLink: "",
      cryptoBackOffer: "",
      categories: [],
      logo: null,
    });
    setLogoPreview(null);
    setError(null);
  };

  const handleCreateFormChange = (field, value) => {
    setCreateForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (category) => {
    setCreateForm(prev => {
      const categories = prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories };
    });
  };

  const handleFileChange = (file) => {
    if (file) {
      setCreateForm(prev => ({ ...prev, logo: file }));
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleDeleteImage = () => {
    setCreateForm(prev => ({ ...prev, logo: null }));
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

  const handleCreateAffiliate = async () => {
    if (!createForm.name || !createForm.affiliateLink || !createForm.cryptoBackOffer || !createForm.categories.length || isCreating) {
      setError("Please fill in all required fields: Name, Affiliate Link, Crypto Back Offer, and at least one category.");
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      let logoUrl = "";
      if (createForm.logo) {
        // Extract file extension
        const extension = createForm.logo.name.split('.').pop();
        // Use clean affiliate name (sanitize if needed)
        const sanitizedName = createForm.name.replace(/[^a-zA-Z0-9-_]/g, '');
        // Construct path to match Storage rule (logo.<extension>)
        const logoRef = ref(storage, `affiliates/${sanitizedName}/logo.${extension}`);
        console.log("Uploading logo to:", logoRef.fullPath); // Debugging
        await uploadBytes(logoRef, createForm.logo);
        logoUrl = await getDownloadURL(logoRef);
        console.log("Logo uploaded, URL:", logoUrl); // Debugging
      }

      const newAffiliate = {
        name: createForm.name,
        affiliateLink: createForm.affiliateLink,
        cryptoBackOffer: createForm.cryptoBackOffer,
        categories: createForm.categories,
        logoUrl,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, "affiliates"), newAffiliate);
      setAffiliates(prev => {
        const updated = [...prev, { id: docRef.id, ...newAffiliate }];
        return Array.from(new Map(updated.map(item => [item.id, item])).values());
      });
      setDisplayedAffiliates(prev => {
        const updated = [...prev, { id: docRef.id, ...newAffiliate }];
        return Array.from(new Map(updated.map(item => [item.id, item])).values());
      });
      setSuccess("Affiliate created successfully!");
      handleCloseCreateModal();
    } catch (err) {
      console.error("Error creating affiliate:", err);
      setError("Failed to create affiliate: " + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Ensure user is loaded and authorized before rendering
  if (!user || !user.walletId || user.role !== "god") {
    return null; // Or a loading spinner
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3} minHeight="100vh">
        <MDBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <MDTypography variant="h4" color="dark">
            Affiliate Management
          </MDTypography>
          <motion.div variants={buttonVariants} initial="rest" whileHover="hover">
            <MDButton
              onClick={handleOpenCreateModal}
              variant="gradient"
              color="info"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                fontWeight: "bold",
                borderRadius: "12px",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
                background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                "&:hover": { background: "linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)" },
                width: { xs: "100%", sm: "auto" },
                maxWidth: { xs: "300px", sm: "auto" },
              }}
            >
              <Icon sx={{ mr: 1 }}>add</Icon> Create Affiliate
            </MDButton>
          </motion.div>
        </MDBox>
        <MDBox mb={3} mx="auto" maxWidth="600px">
          <Card
            sx={{
              background: 'transparent',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
              p: 2,
            }}
          >
            <MDInput
              label="Search by Affiliate Name or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              sx={{
                "& .MuiInputBase-root": { transition: "all 0.3s ease" },
                "& .MuiInputBase-input": { padding: { xs: "8px", md: "10px" } },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: '#bdbdbd' },
                  "&:hover fieldset": { borderColor: '#3f51b5' },
                  "&.Mui-focused fieldset": { borderColor: '#3f51b5' },
                },
              }}
            />
          </Card>
        </MDBox>
        {error && (
          <MDTypography variant="body2" color="error" mb={2}>
            {error}
          </MDTypography>
        )}
        {success && (
          <MDTypography variant="body2" color="success" mb={2}>
            {success}
          </MDTypography>
        )}
        <Grid container spacing={3}>
          {filteredAffiliates.length > 0 ? (
            filteredAffiliates.map(affiliate => (
              <Grid item xs={12} sm={6} md={4} lg={2} key={affiliate.id}>
                <Link href={`/dashboards/god/affiliates/edit/${affiliate.id}`}>
                  <Card
                    sx={{
                      background: 'transparent',
                      border: '1px solid rgba(0, 0, 0, 0.12)',
                      borderRadius: "12px",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      "&:hover": {
                        transform: "scale(1.05)",
                        boxShadow: "0 6px 30px rgba(0, 0, 0, 0.15)",
                      },
                      p: { xs: 2, md: 3 },
                      height: "100%",
                      cursor: "pointer",
                    }}
                  >
                    <MDTypography
                      variant="h6"
                      color="dark"
                      mb={1}
                      sx={{ fontSize: { xs: "0.9rem", md: "1rem" } }}
                    >
                      {affiliate.name || 'Unnamed Affiliate'}
                    </MDTypography>
                    <MDTypography
                      variant="body2"
                      color="text"
                      sx={{ fontSize: { xs: "0.8rem", md: "0.875rem" } }}
                    >
                      {affiliate.cryptoBackOffer || 'No offer available'}
                    </MDTypography>
                  </Card>
                </Link>
              </Grid>
            ))
          ) : (
            <MDBox width="100%" textAlign="center">
              <MDTypography variant="body2" color="text">
                No affiliates found.
              </MDTypography>
            </MDBox>
          )}
        </Grid>
        {hasMore && (
          <MDBox ref={loaderRef} textAlign="center" py={2}>
            <MDTypography variant="body2" color="text">
              Loading more affiliates...
            </MDTypography>
            </MDBox>
        )}
        <Dialog open={openCreateModal} onClose={handleCloseCreateModal} maxWidth="md" fullWidth>
          <DialogTitle>Create New Affiliate</DialogTitle>
          <DialogContent>
            {error && (
              <MDTypography variant="body2" color="error" mb={2}>
                {error}
              </MDTypography>
            )}
            {success && (
              <MDTypography variant="body2" color="success" mb={2}>
                {success}
              </MDTypography>
            )}
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {logoPreview && (
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
                    width: { xs: "150px", md: "250px" },
                    height: { xs: "112px", md: "100px" },
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
                    disabled={isCreating}
                  />
                </MDBox>
                <MDBox mb={2}>
                  <MDTypography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: "#344767",
                      textAlign: "center",
                    }}
                  >
                    Affiliate Logo
                  </MDTypography>
                </MDBox>
              </Grid>
            </Grid>
            <Divider sx={{ mb: 2, backgroundColor: "rgba(0, 0, 0, 0.1)" }} />
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <MDBox mb={2}>
                  <MDInput
                    label="Affiliate Name"
                    value={createForm.name}
                    onChange={(e) => handleCreateFormChange("name", e.target.value)}
                    fullWidth
                    required
                    disabled={isCreating}
                    sx={{
                      "& .MuiInputBase-root": { transition: "all 0.3s ease" },
                      "& .MuiInputBase-input": {
                        padding: { xs: "10px", md: "12px" },
                        color: theme => theme.palette.mode === 'dark' ? '#fff !important' : '#344767 !important',
                      },
                      "& .MuiInputLabel-root": {
                        color: theme => theme.palette.mode === 'dark' ? '#fff !important' : '#344767 !important',
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: theme => theme.palette.mode === 'dark' ? '#fff !important' : '#344767 !important',
                      },
                      "& .MuiInputBase-input::placeholder": {
                        color: theme => theme.palette.mode === 'dark' ? '#bbb !important' : '#757575 !important',
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
                  <MDInput
                    label="Affiliate Link"
                    value={createForm.affiliateLink}
                    onChange={(e) => handleCreateFormChange("affiliateLink", e.target.value)}
                    fullWidth
                    required
                    placeholder="e.g., https://example.com"
                    disabled={isCreating}
                    sx={{
                      "& .MuiInputBase-root": { transition: "all 0.3s ease" },
                      "& .MuiInputBase-input": {
                        padding: { xs: "10px", md: "12px" },
                        color: theme => theme.palette.mode === 'dark' ? '#fff !important' : '#344767 !important',
                      },
                      "& .MuiInputLabel-root": {
                        color: theme => theme.palette.mode === 'dark' ? '#fff !important' : '#344767 !important',
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: theme => theme.palette.mode === 'dark' ? '#fff !important' : '#344767 !important',
                      },
                      "& .MuiInputBase-input::placeholder": {
                        color: theme => theme.palette.mode === 'dark' ? '#bbb !important' : '#757575 !important',
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
              </Grid>
              <Grid item xs={12} md={6}>
                <MDBox mb={2}>
                  <MDInput
                    label="Crypto Back Offer"
                    value={createForm.cryptoBackOffer}
                    onChange={(e) => handleCreateFormChange("cryptoBackOffer", e.target.value)}
                    fullWidth
                    required
                    placeholder="e.g., Upto 85% Crypto Cashback"
                    disabled={isCreating}
                    sx={{
                      "& .MuiInputBase-root": { transition: "all 0.3s ease" },
                      "& .MuiInputBase-input": {
                        padding: { xs: "10px", md: "12px" },
                        color: theme => theme.palette.mode === 'dark' ? '#fff !important' : '#344767 !important',
                      },
                      "& .MuiInputLabel-root": {
                        color: theme => theme.palette.mode === 'dark' ? '#fff !important' : '#344767 !important',
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: theme => theme.palette.mode === 'dark' ? '#fff !important' : '#344767 !important',
                      },
                      "& .MuiInputBase-input::placeholder": {
                        color: theme => theme.palette.mode === 'dark' ? '#bbb !important' : '#757575 !important',
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
              </Grid>
            </Grid>
            <MDBox mb={2}>
              <MDTypography
                variant="h6"
                sx={{ fontWeight: 600, color: "#344767", mb: 1.5, letterSpacing: "0.5px" }}
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
                      backgroundColor: createForm.categories.includes(category) ? "rgba(255, 255, 255, 0.15)" : "transparent",
                    }}
                  >
                    <MDBox display="flex" alignItems="center">
                      <Checkbox
                        checked={createForm.categories.includes(category)}
                        onChange={() => handleCategoryChange(category)}
                        disabled={isCreating}
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
                    {createForm.categories.includes(category) && (
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
          </DialogContent>
          <DialogActions>
            <MDButton onClick={handleCloseCreateModal} color="secondary">
              Cancel
            </MDButton>
            <MDButton
              onClick={handleCreateAffiliate}
              color="primary"
              disabled={isCreating}
            >
              {isCreating ? "Creating..." : "Create Affiliate"}
            </MDButton>
          </DialogActions>
        </Dialog>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default AffiliateSearch;