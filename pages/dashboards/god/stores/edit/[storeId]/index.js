/**
=========================================================
* F4cetPanel - God Store Editing Page
=========================================================

* Copyright 2023 F4cets Team
*/

// React imports
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

// Firebase imports
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
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
import DataTable from "/examples/Tables/DataTable";

// Categories for store selection
const categories = [
  "Accessories", "Art & Collectibles", "Baby & Toddler", "Beauty", "Books, Movies & Music",
  "Clothing", "Craft Supplies", "Digital Goods", "Digital Services", "Ebooks", "EGames",
  "Electronics", "Fitness & Nutrition", "Food & Drinks", "Home & Living", "Jewelry",
  "Luggage & Bags", "NFTs", "Pet Supplies", "Private Access Groups", "Shoes", "Software",
  "Sporting Goods", "Toys & Games"
];

function StoreEdit() {
  const { user } = useUser();
  const router = useRouter();
  const { storeId } = router.query;
  const [store, setStore] = useState(null);
  const [items, setItems] = useState(null);
  const [form, setForm] = useState({
    storeName: "",
    walletId: "",
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
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch store and items from Firestore
  useEffect(() => {
    const fetchStore = async () => {
      if (!user || !user.walletId || !storeId) return;

      try {
        const storeDoc = doc(db, "stores", storeId);
        const storeSnapshot = await getDoc(storeDoc);
        if (storeSnapshot.exists()) {
          const data = {
            id: storeSnapshot.id,
            ...storeSnapshot.data(),
          };
          setStore(data);
          setForm({
            storeName: data.name || "",
            walletId: data.sellerId || "",
            shortDescription: data.description || "",
            shopEmail: data.businessInfo?.sellerEmail || "",
            subheading: data.subheading || "",
            categories: data.categories || [],
            thumbnailImage: null,
            backgroundImage: null,
          });
          setThumbnailPreview(data.thumbnailUrl || null);
          setBackgroundPreview(data.bannerUrl || null);
        } else {
          setError("Store not found.");
        }
      } catch (err) {
        console.error("Error fetching store:", err);
        setError("Failed to load store details.");
      }
    };

    const fetchItems = async () => {
      if (!user || !user.walletId || !storeId) return;

      try {
        const productsQuery = query(
          collection(db, "products"),
          where("storeId", "==", storeId),
          where("isActive", "==", true)
        );
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems({
          columns: [
            { Header: "Item Name", accessor: "name", width: "40%" },
            { Header: "Price", accessor: "price", width: "20%" },
            { Header: "Type", accessor: "type", width: "20%" },
            { Header: "Status", accessor: "status", width: "20%" },
          ],
          rows: productsData.length > 0 ? productsData.map(item => ({
            id: item.id,
            name: item.name || "Unnamed Item",
            price: `${item.price || 0} USDC`,
            type: item.type?.toUpperCase() || "UNKNOWN",
            status: item.isActive ? "Active" : "Pending",
          })) : [],
        });
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products: " + err.message);
      }
    };

    fetchStore();
    fetchItems();
  }, [user, storeId]);

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

  const handleFileChange = (file, field) => {
    if (file) {
      setForm(prev => ({ ...prev, [field]: file }));
      if (field === "thumbnailImage") {
        setThumbnailPreview(URL.createObjectURL(file));
      } else if (field === "backgroundImage") {
        setBackgroundPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleDeleteImage = (field) => {
    setForm(prev => ({ ...prev, [field]: null }));
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

  // Handle saving store changes
  const handleSave = async () => {
    if (!store || isSaving) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    if (!form.storeName || !form.walletId || !form.shortDescription || !form.shopEmail || !form.categories.length) {
      setError("Please fill in all required fields: Store Name, Wallet ID, Short Description, Shop Email, and at least one category.");
      setIsSaving(false);
      return;
    }

    try {
      let updatedForm = { ...form };

      // Upload thumbnail if changed
      if (form.thumbnailImage) {
        const extension = form.thumbnailImage.name.split('.').pop();
        const thumbnailRef = ref(storage, `stores/${storeId}/thumbnail.${extension}`);
        console.log("Uploading thumbnail to:", thumbnailRef.fullPath);
        await uploadBytes(thumbnailRef, form.thumbnailImage);
        updatedForm.thumbnailUrl = await getDownloadURL(thumbnailRef);
        console.log("Thumbnail uploaded, URL:", updatedForm.thumbnailUrl);
      } else {
        updatedForm.thumbnailUrl = store.thumbnailUrl || "";
      }

      // Upload background if changed
      if (form.backgroundImage) {
        const extension = form.backgroundImage.name.split('.').pop();
        const backgroundRef = ref(storage, `stores/${storeId}/banner.${extension}`);
        console.log("Uploading banner to:", backgroundRef.fullPath);
        await uploadBytes(backgroundRef, form.backgroundImage);
        updatedForm.backgroundUrl = await getDownloadURL(backgroundRef);
        console.log("Banner uploaded, URL:", updatedForm.backgroundUrl);
      } else {
        updatedForm.backgroundUrl = store.bannerUrl || "";
      }

      const storeDoc = doc(db, "stores", storeId);
      await updateDoc(storeDoc, {
        name: updatedForm.storeName,
        sellerId: updatedForm.walletId,
        description: updatedForm.shortDescription,
        businessInfo: {
          ...store.businessInfo,
          sellerEmail: updatedForm.shopEmail,
        },
        subheading: updatedForm.subheading,
        categories: updatedForm.categories,
        thumbnailUrl: updatedForm.thumbnailUrl,
        bannerUrl: updatedForm.backgroundUrl,
        updatedAt: new Date().toISOString(),
      });
      setStore({ ...store, ...updatedForm });
      setSuccess("Store updated successfully!");
    } catch (err) {
      console.error("Error updating store:", err);
      setError("Failed to save store: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle toggle isActive
  const handleToggleStoreActive = async () => {
    if (!store || isTogglingActive) return;

    setIsTogglingActive(true);
    setError(null);
    setSuccess(null);

    try {
      const storeDoc = doc(db, "stores", storeId);
      const newIsActive = !store.isActive;
      await updateDoc(storeDoc, {
        isActive: newIsActive,
        updatedAt: new Date().toISOString(),
      });
      setStore({ ...store, isActive: newIsActive });
      setSuccess(`Store ${newIsActive ? "activated" : "deactivated"} successfully!`);
    } catch (err) {
      console.error("Error toggling store active status:", err);
      setError("Failed to toggle store active status: " + err.message);
    } finally {
      setIsTogglingActive(false);
    }
  };

  // Navigate to create product
  const handleCreateProduct = () => {
    router.push("/dashboards/god/products/edit/new");
  };

  // Handle row click to edit product
  const handleRowClick = (row) => {
    router.push(`/dashboards/god/products/edit/${row.id}`);
  };

  // Ensure user is loaded and authorized before rendering
  if (!user || !user.walletId || user.role !== "god") {
    return null; // Or a loading spinner
  }

  // Handle invalid or missing storeId
  if (!storeId) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          <MDTypography variant="h4" color="error">
            Invalid Store ID
          </MDTypography>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  // Handle no store (e.g., still loading)
  if (!store || !items) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          <MDTypography variant="body2" color="text">
            Loading store details...
          </MDTypography>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h4" sx={{ color: "#212121" }} mb={2}>
                  Edit Store - {store.id}
                </MDTypography>
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
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        {thumbnailPreview ? (
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
                        ) : (
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
                            <MDTypography
                              variant="body2"
                              sx={{ color: dragActiveThumbnail ? "#3f51b5" : "#344767", mb: 1 }}
                            >
                              Drag & Drop or Click to Upload
                            </MDTypography>
                            <MDTypography
                              variant="caption"
                              sx={{ color: "#344767", display: "block", mb: 1 }}
                            >
                              (Supports PNG, JPG, up to 5MB)
                            </MDTypography>
                            <MDInput
                              id="thumbnailInput"
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange(e.target.files[0], "thumbnailImage")}
                              sx={{ display: "none" }}
                              disabled={isSaving}
                            />
                          </MDBox>
                        )}
                        <MDBox mb={2}>
                          <MDTypography
                            variant="h6"
                            sx={{ fontWeight: 600, color: "#212121", textAlign: "center" }}
                          >
                            Store Thumbnail
                          </MDTypography>
                        </MDBox>
                      </Grid>
                      <Grid item xs={12}>
                        {backgroundPreview ? (
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
                                  "&:hover": { backgroundColor: "#b71c1c" },
                                }}
                              >
                                <Icon>close</Icon>
                              </IconButton>
                            </MDBox>
                          </MDBox>
                        ) : (
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
                              "&:hover": { transform: "scale(1.02)", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" },
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
                              sx={{ color: dragActiveBackground ? "#3f51b5" : "#344767", mb: 1 }}
                            >
                              Drag & Drop or Click to Upload
                            </MDTypography>
                            <MDTypography
                              variant="caption"
                              sx={{ color: "#344767", display: "block", mb: 1 }}
                            >
                              (Supports PNG, JPG, up to 5MB)
                            </MDTypography>
                            <MDInput
                              id="backgroundInput"
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange(e.target.files[0], "backgroundImage")}
                              sx={{ display: "none" }}
                              disabled={isSaving}
                            />
                          </MDBox>
                        )}
                        <MDBox mb={2}>
                          <MDTypography
                            variant="h6"
                            sx={{ fontWeight: 600, color: "#212121", textAlign: "center" }}
                          >
                            Store Banner Image
                          </MDTypography>
                        </MDBox>
                      </Grid>
                    </Grid>
                    <Divider sx={{ mb: 2, backgroundColor: "rgba(0, 0, 0, 0.1)" }} />
                    <MDBox mb={2}>
                      <MDTypography variant="h6" sx={{ color: "#212121", textAlign: "left" }}>
                        Store Name
                      </MDTypography>
                      <MDInput
                        value={form.storeName}
                        onChange={(e) => handleFormChange("storeName", e.target.value)}
                        fullWidth
                        required
                        disabled={isSaving}
                        sx={{
                          "& .MuiInputBase-input": { padding: { xs: "10px", md: "12px" }, color: theme => theme.palette.mode === 'dark' ? '#E0E0E0' : '#212121' },
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#bdbdbd' },
                            "&:hover fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#e0e0e0' : '#3f51b5' },
                            "&.Mui-focused fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#3f51b5' },
                          },
                        }}
                      />
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" sx={{ color: "#212121", textAlign: "left" }}>
                        Subheading
                      </MDTypography>
                      <MDInput
                        value={form.subheading}
                        onChange={(e) => handleFormChange("subheading", e.target.value)}
                        fullWidth
                        placeholder="e.g., Free shipping on orders over 2 SOL! Use code F4CETS10"
                        disabled={isSaving}
                        sx={{
                          "& .MuiInputBase-input": { padding: { xs: "10px", md: "12px" }, color: theme => theme.palette.mode === 'dark' ? '#E0E0E0' : '#212121' },
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#bdbdbd' },
                            "&:hover fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#e0e0e0' : '#3f51b5' },
                            "&.Mui-focused fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#3f51b5' },
                          },
                        }}
                      />
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" sx={{ color: "#212121", textAlign: "left" }}>
                        Short Description
                      </MDTypography>
                      <MDInput
                        value={form.shortDescription}
                        onChange={(e) => handleFormChange("shortDescription", e.target.value)}
                        fullWidth
                        multiline
                        rows={4}
                        required
                        placeholder="Company slogan - keep it to 1 sentence"
                        disabled={isSaving}
                        sx={{
                          "& .MuiInputBase-input": { padding: { xs: "10px", md: "12px" }, color: theme => theme.palette.mode === 'dark' ? '#E0E0E0' : '#212121' },
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#bdbdbd' },
                            "&:hover fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#e0e0e0' : '#3f51b5' },
                            "&.Mui-focused fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#3f51b5' },
                          },
                        }}
                      />
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" sx={{ color: "#212121", textAlign: "left" }}>
                        Shop Email
                      </MDTypography>
                      <MDInput
                        value={form.shopEmail}
                        onChange={(e) => handleFormChange("shopEmail", e.target.value)}
                        fullWidth
                        type="email"
                        required
                        disabled={isSaving}
                        sx={{
                          "& .MuiInputBase-input": { padding: { xs: "10px", md: "12px" }, color: theme => theme.palette.mode === 'dark' ? '#E0E0E0' : '#212121' },
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#bdbdbd' },
                            "&:hover fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#e0e0e0' : '#3f51b5' },
                            "&.Mui-focused fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#3f51b5' },
                          },
                        }}
                      />
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" sx={{ color: "#212121", textAlign: "left" }}>
                        Wallet ID
                      </MDTypography>
                      <MDInput
                        value={form.walletId}
                        onChange={(e) => handleFormChange("walletId", e.target.value)}
                        fullWidth
                        required
                        disabled={isSaving}
                        sx={{
                          "& .MuiInputBase-input": { padding: { xs: "10px", md: "12px" }, color: theme => theme.palette.mode === 'dark' ? '#E0E0E0' : '#212121' },
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#bdbdbd' },
                            "&:hover fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#e0e0e0' : '#3f51b5' },
                            "&.Mui-focused fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#3f51b5' },
                          },
                        }}
                      />
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography
                        variant="h6"
                        sx={{ fontWeight: 600, color: "#212121", mb: 1.5, textAlign: "left" }}
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
                                sx={{ color: "#fff", fontSize: { xs: "0.875rem", md: "1rem" } }}
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
                    <MDBox display="flex" gap={2}>
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
                        color={store.isActive ? "error" : "success"}
                        onClick={handleToggleStoreActive}
                        disabled={isTogglingActive}
                        sx={{ width: { xs: "100%", sm: "auto" } }}
                      >
                        {isTogglingActive ? "Toggling..." : store.isActive ? "Deactivate Store" : "Activate Store"}
                      </MDButton>
                    </MDBox>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <MDBox>
                      <MDTypography variant="h6" sx={{ color: "#212121", mb: 2 }}>
                        Store Items
                      </MDTypography>
                      <DataTable
                        table={items}
                        entriesPerPage={false}
                        showTotalEntries={false}
                        isSorted={false}
                        noEndBorder
                        onRowClick={handleRowClick}
                      />
                      <MDButton
                        variant="outlined"
                        color="dark"
                        onClick={handleCreateProduct}
                        sx={{ mt: 2, width: { xs: "100%", sm: "auto" } }}
                      >
                        <Icon sx={{ mr: 1 }}>add</Icon> Add New Item
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

export default StoreEdit;