/**
=========================================================
* F4cetPanel - God Store Search and Creation Page
=========================================================

* Copyright 2023 F4cets Team
*/

// React imports
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

// Framer Motion for animations
import { motion } from "framer-motion";

// Firebase imports
import { collection, query, getDocs, addDoc, limit, startAfter, orderBy, doc, getDoc, setDoc, runTransaction } from "firebase/firestore"; // CHANGED: Added doc, getDoc, setDoc, runTransaction
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
import Select from "@mui/material/Select"; // CHANGED: Added Select
import MenuItem from "@mui/material/MenuItem"; // CHANGED: Added MenuItem
import InputLabel from "@mui/material/InputLabel"; // CHANGED: Added InputLabel
import FormControl from "@mui/material/FormControl"; // CHANGED: Added FormControl

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
import MDInput from "/components/MDInput";
import MDButton from "/components/MDButton";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";

// Categories for store selection
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

function StoreSearch() {
  const { user } = useUser();
  const router = useRouter();
  const [stores, setStores] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    storeName: "",
    walletId: "",
    shortDescription: "",
    shopEmail: "",
    subheading: "",
    categories: [],
    thumbnailImage: null,
    backgroundImage: null,
    planType: "monthly", // CHANGED: Added planType
  });
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [dragActiveThumbnail, setDragActiveThumbnail] = useState(false);
  const [dragActiveBackground, setDragActiveBackground] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef(null);

  // Fetch stores with pagination
  const fetchStores = async (isLoadMore = false) => {
    if (!user || !user.walletId || isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const storesCollection = collection(db, "stores");
      const pageSize = 6; // Load 6 stores per page
      const storesQuery = isLoadMore
        ? query(storesCollection, orderBy("createdAt", "desc"), startAfter(lastDoc), limit(pageSize))
        : query(storesCollection, orderBy("createdAt", "desc"), limit(pageSize));

      const storesSnapshot = await getDocs(storesQuery);
      const storesData = storesSnapshot.docs.map(doc => ({
        id: doc.id,
        storeName: doc.data().name,
        walletId: doc.data().sellerId,
        shortDescription: doc.data().description,
        shopEmail: doc.data().businessInfo?.sellerEmail || "",
        subheading: "", // Not in schema, set to empty
        categories: doc.data().categories || [],
        thumbnailUrl: doc.data().thumbnailUrl || "",
        backgroundUrl: doc.data().bannerUrl || "",
        removed: !doc.data().isActive,
        flagCount: doc.data().flagCount || 0,
        flagReasons: [], // Not in schema, set to empty
      }));

      setStores(prev => isLoadMore ? [...prev, ...storesData] : storesData);
      setLastDoc(storesSnapshot.docs[storesSnapshot.docs.length - 1]);
      setHasMore(storesSnapshot.docs.length === pageSize);
    } catch (err) {
      console.error("Error fetching stores:", err);
      setError("Failed to load stores.");
      setStores([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchStores();
  }, [user]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchStores(true);
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMore, isLoading]);

  // Redirect to home if no user, no walletId, or unauthorized role
  useEffect(() => {
    if (!user || !user.walletId || user.role !== "god") {
      router.replace("/");
    }
  }, [user, router]);

  // Filter stores by search term
  const filteredStores = stores.filter(store =>
    (store.storeName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (store.walletId?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  // Handle create store modal
  const handleOpenCreateModal = () => setOpenCreateModal(true);
  const handleCloseCreateModal = () => {
    setOpenCreateModal(false);
    setCreateForm({
      storeName: "",
      walletId: "",
      shortDescription: "",
      shopEmail: "",
      subheading: "",
      categories: [],
      thumbnailImage: null,
      backgroundImage: null,
      planType: "monthly", // CHANGED: Reset planType
    });
    setThumbnailPreview(null);
    setBackgroundPreview(null);
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

  const handleFileChange = (file, field) => {
    if (file) {
      setCreateForm(prev => ({ ...prev, [field]: file }));
      if (field === "thumbnailImage") {
        setThumbnailPreview(URL.createObjectURL(file));
      } else if (field === "backgroundImage") {
        setBackgroundPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleDeleteImage = (field) => {
    setCreateForm(prev => ({ ...prev, [field]: null }));
    if (field === "thumbnailImage") {
      setThumbnailPreview(null);
    } else if (field === "backgroundImage") {
      setBackgroundPreview(null);
    }
  };

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

  const handleCreateStore = async () => {
    // CHANGED: Updated validation to include planType
    if (!createForm.storeName || !createForm.walletId || !createForm.shortDescription || !createForm.shopEmail || !createForm.categories.length || !createForm.planType || isCreating) {
      setError("Please fill in all required fields: Store Name, Wallet ID, Short Description, Shop Email, at least one category, and Plan Type.");
      return;
    }

    // CHANGED: Validate wallet ID format (base58, ~44 characters)
    const walletIdRegex = /^[1-9A-HJ-NP-Za-km-z]{42,44}$/;
    if (!walletIdRegex.test(createForm.walletId)) {
      setError("Invalid wallet ID format.");
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      // CHANGED: Check if wallet already has a store
      const userDocRef = doc(db, "users", createForm.walletId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists() && userDoc.data().storeIds?.length > 0) {
        throw new Error("This wallet is already linked to a store.");
      }

      // CHANGED: Get or create escrow wallet
      let escrowPublicKey = userDoc.exists() && userDoc.data().plan?.escrowPublicKey;
      if (!escrowPublicKey) {
        const response = await fetch('https://create-store-escrow-232592911911.us-central1.run.app/createStoreEscrow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletId: createForm.walletId,
            planType: createForm.planType,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to create escrow wallet');
        }

        escrowPublicKey = result.escrowPublicKey;
      }

      // CHANGED: Calculate plan expiry
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + { monthly: 30, sixMonth: 180, yearly: 365 }[createForm.planType]);

      // CHANGED: Use transaction for atomic updates
      const newStoreId = `store-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await runTransaction(db, async (transaction) => {
        // Upload images
        let thumbnailUrl = "";
        let backgroundUrl = "";
        const sanitizedStoreName = createForm.storeName.replace(/[^a-zA-Z0-9-_]/g, '');

        if (createForm.thumbnailImage) {
          const extension = createForm.thumbnailImage.name.split('.').pop();
          const thumbnailRef = ref(storage, `stores/${sanitizedStoreName}/thumbnail.${extension}`);
          await uploadBytes(thumbnailRef, createForm.thumbnailImage);
          thumbnailUrl = await getDownloadURL(thumbnailRef);
        }

        if (createForm.backgroundImage) {
          const extension = createForm.backgroundImage.name.split('.').pop();
          const backgroundRef = ref(storage, `stores/${sanitizedStoreName}/banner.${extension}`);
          await uploadBytes(backgroundRef, createForm.backgroundImage);
          backgroundUrl = await getDownloadURL(backgroundRef);
        }

        // Create store document
        const newStore = {
          name: createForm.storeName,
          sellerId: createForm.walletId,
          description: createForm.shortDescription,
          businessInfo: {
            sellerEmail: createForm.shopEmail,
            sellerName: "",
            shippingAddress: "",
            taxId: "",
          },
          categories: createForm.categories,
          thumbnailUrl,
          bannerUrl: backgroundUrl,
          escrowId: escrowPublicKey, // CHANGED: Set escrowId
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          flagCount: 0,
        };
        const storeDocRef = doc(db, "stores", newStoreId);
        transaction.set(storeDocRef, newStore);

        // Update or create user document
        const userData = userDoc.exists() ? userDoc.data() : {
          walletId: createForm.walletId,
          role: "seller",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          storeIds: [],
          plan: {},
        };
        transaction.set(userDocRef, {
          ...userData,
          role: "seller",
          storeIds: [newStoreId],
          plan: {
            escrowPublicKey,
            type: createForm.planType,
            expiry: expiry.toISOString(),
            paymentSignature: "", // CHANGED: No payment
          },
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        // Update local state
        setStores([...stores, {
          id: newStoreId,
          storeName: newStore.name,
          walletId: newStore.sellerId,
          shortDescription: newStore.description,
          shopEmail: newStore.businessInfo.sellerEmail,
          subheading: "",
          categories: newStore.categories,
          thumbnailUrl: newStore.thumbnailUrl,
          backgroundUrl: newStore.bannerUrl,
          removed: !newStore.isActive,
          flagCount: newStore.flagCount,
          flagReasons: [],
        }]);
      });

      setSuccess("Store created successfully!");
      handleCloseCreateModal();
    } catch (err) {
      console.error("Error creating store:", err);
      setError(`Failed to create store: ${err.message}`);
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
      <MDBox py={3}>
        <MDBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <MDTypography variant="h4" color="dark">
            Store Management
          </MDTypography>
          <motion.div
            variants={buttonVariants}
            initial="rest"
            whileHover="hover"
          >
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
                "&:hover": {
                  background: "linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)",
                },
                width: { xs: "100%", sm: "auto" },
                maxWidth: { xs: "300px", sm: "auto" },
              }}
            >
              <Icon sx={{ mr: 1 }}>add</Icon> Create Store
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
              label="Search by Store Name or Wallet ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              sx={{
                "& .MuiInputBase-root": {
                  transition: "all 0.3s ease",
                },
                "& .MuiInputBase-input": {
                  padding: { xs: "8px", md: "10px" },
                },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: '#bdbdbd',
                  },
                  "&:hover fieldset": {
                    borderColor: '#3f51b5',
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: '#3f51b5',
                  },
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
          {filteredStores.length > 0 ? (
            filteredStores.map(store => (
              <Grid item xs={12} sm={6} md={4} lg={2} key={store.id}>
                <Link href={`/dashboards/god/stores/edit/${store.id}`}>
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
                      {store.storeName || 'Unnamed Store'}
                    </MDTypography>
                    <MDTypography
                      variant="body2"
                      color="text"
                      mb={1}
                      sx={{ fontSize: { xs: "0.8rem", md: "0.875rem" } }}
                    >
                      Wallet ID: {store.walletId ? `${store.walletId.slice(0, 6)}...${store.walletId.slice(-4)}` : 'N/A'}
                    </MDTypography>
                    <MDTypography
                      variant="body2"
                      color="text"
                      sx={{ fontSize: { xs: "0.8rem", md: "0.875rem" } }}
                    >
                      {store.shortDescription || 'No description available'}
                    </MDTypography>
                  </Card>
                </Link>
              </Grid>
            ))
          ) : (
            <MDBox width="100%" textAlign="center">
              <MDTypography variant="body2" color="text">
                No stores found.
              </MDTypography>
            </MDBox>
          )}
        </Grid>
        {isLoading && (
          <MDBox width="100%" textAlign="center" py={3}>
            <MDTypography variant="body2" color="text">
              Loading more stores...
            </MDTypography>
          </MDBox>
        )}
        {!isLoading && hasMore && (
          <MDBox ref={observerRef} width="100%" height="20px" />
        )}
        {!isLoading && !hasMore && filteredStores.length > 0 && (
          <MDBox width="100%" textAlign="center" py={3}>
            <MDTypography variant="body2" color="text">
              No more stores to load.
            </MDTypography>
          </MDBox>
        )}
        <Dialog open={openCreateModal} onClose={handleCloseCreateModal} maxWidth="md" fullWidth>
          <DialogTitle>Create New Store</DialogTitle>
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
                    id="thumbnailInput"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e.target.files[0], "thumbnailImage")}
                    sx={{ display: "none" }}
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
                    id="backgroundInput"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e.target.files[0], "backgroundImage")}
                    sx={{ display: "none" }}
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
                    Store Banner Image
                  </MDTypography>
                </MDBox>
              </Grid>
            </Grid>
            <Divider sx={{ mb: 2, backgroundColor: "rgba(0, 0, 0, 0.1)" }} />
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <MDBox mb={2}>
                  <MDInput
                    label="Store Name"
                    value={createForm.storeName}
                    onChange={(e) => handleCreateFormChange("storeName", e.target.value)}
                    fullWidth
                    required
                    sx={{
                      "& .MuiInputBase-root": {
                        transition: "all 0.3s ease",
                      },
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
                    label="Subheading"
                    value={createForm.subheading}
                    onChange={(e) => handleCreateFormChange("subheading", e.target.value)}
                    fullWidth
                    placeholder="e.g., Free shipping on orders over 2 SOL! Use code F4CETS10"
                    sx={{
                      "& .MuiInputBase-root": {
                        transition: "all 0.3s ease",
                      },
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
                    label="Short Description"
                    value={createForm.shortDescription}
                    onChange={(e) => handleCreateFormChange("shortDescription", e.target.value)}
                    multiline
                    rows={4}
                    fullWidth
                    required
                    placeholder="Company slogan - keep it to 1 sentence"
                    sx={{
                      "& .MuiInputBase-root": {
                        transition: "all 0.3s ease",
                      },
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
                    label="Shop Email"
                    type="email"
                    value={createForm.shopEmail}
                    onChange={(e) => handleCreateFormChange("shopEmail", e.target.value)}
                    fullWidth
                    required
                    sx={{
                      "& .MuiInputBase-root": {
                        transition: "all 0.3s ease",
                      },
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
              <MDInput
                label="Wallet ID"
                value={createForm.walletId}
                onChange={(e) => handleCreateFormChange("walletId", e.target.value)}
                fullWidth
                required
                sx={{
                  "& .MuiInputBase-root": {
                    transition: "all 0.3s ease",
                  },
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
            {/* CHANGED: Added Plan Type Selection */}
            <MDBox mb={2}>
              <FormControl fullWidth required>
                <InputLabel id="plan-type-label">Plan Type</InputLabel>
                <Select
                  labelId="plan-type-label"
                  value={createForm.planType}
                  label="Plan Type"
                  onChange={(e) => handleCreateFormChange("planType", e.target.value)}
                  sx={{
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
                >
                  <MenuItem value="monthly">Monthly (30 days)</MenuItem>
                  <MenuItem value="sixMonth">6 Months (180 days)</MenuItem>
                  <MenuItem value="yearly">Yearly (365 days)</MenuItem>
                </Select>
              </FormControl>
            </MDBox>
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
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                      },
                      backgroundColor: createForm.categories.includes(category) ? "rgba(255, 255, 255, 0.15)" : "transparent",
                    }}
                  >
                    <MDBox display="flex" alignItems="center">
                      <Checkbox
                        checked={createForm.categories.includes(category)}
                        onChange={() => handleCategoryChange(category)}
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
          </DialogContent>
          <DialogActions>
            <MDButton onClick={handleCloseCreateModal} color="secondary">
              Cancel
            </MDButton>
            <MDButton
              onClick={handleCreateStore}
              color="primary"
              disabled={isCreating}
            >
              {isCreating ? "Creating..." : "Create Store"}
            </MDButton>
          </DialogActions>
        </Dialog>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default StoreSearch;