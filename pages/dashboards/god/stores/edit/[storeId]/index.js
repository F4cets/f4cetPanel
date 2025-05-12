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
import { doc, getDoc, updateDoc, collection, getDocs, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "/lib/firebase";

// User context
import { useUser } from "/contexts/UserContext";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
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
import DataTable from "/examples/Tables/DataTable";

// Categories for store selection
const categories = [
  "Accessories", "Art & Collectibles", "Baby & Toddler", "Beauty", "Books, Movies & Music",
  "Clothing", "Craft Supplies", "Digital Goods", "Digital Services", "Ebooks", "EGames",
  "Electronics", "Fitness & Nutrition", "Food & Drinks", "Home & Living", "Jewelry",
  "Luggage & Bags", "NFTs", "Pet Supplies", "Private Access Groups", "Shoes", "Software",
  "Sporting Goods", "Toys & Games"
];

// Dummy Data
const dummyStore = {
  id: "store123",
  storeName: "FashionHub",
  walletId: "sellerWallet456",
  shortDescription: "Trendy clothing and accessories",
  shopEmail: "contact@fashionhub.com",
  subheading: "Free shipping on orders over 2 SOL!",
  categories: ["Clothing", "Accessories"],
  thumbnailUrl: "",
  backgroundUrl: "",
  removed: false,
  flagCount: 0,
  flagReasons: [],
};

const dummyItems = {
  columns: [
    { Header: "Item Name", accessor: "name", width: "40%" },
    { Header: "Price", accessor: "price", width: "20%" },
    { Header: "Type", accessor: "type", width: "20%" },
    { Header: "Status", accessor: "status", width: "20%" },
  ],
  rows: [
    {
      name: "Strong Hold Hoodie",
      price: "$50 USDC",
      type: "RWI",
      status: "Active",
    },
    {
      name: "Leather Jacket",
      price: "$120 USDC",
      type: "RWI",
      status: "Active",
    },
  ],
};

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
  const [openItemModal, setOpenItemModal] = useState(false);
  const [itemForm, setItemForm] = useState({ name: "", price: "", type: "rwi" });
  const [isSaving, setIsSaving] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
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
            storeName: data.storeName || "",
            walletId: data.walletId || "",
            shortDescription: data.shortDescription || "",
            shopEmail: data.shopEmail || "",
            subheading: data.subheading || "",
            categories: data.categories || [],
            thumbnailImage: null,
            backgroundImage: null,
          });
          setThumbnailPreview(data.thumbnailUrl || null);
          setBackgroundPreview(data.backgroundUrl || null);
        } else {
          setError("Store not found. Using sample data.");
          setStore(dummyStore);
          setForm({
            storeName: dummyStore.storeName,
            walletId: dummyStore.walletId,
            shortDescription: dummyStore.shortDescription,
            shopEmail: dummyStore.shopEmail,
            subheading: dummyStore.subheading,
            categories: dummyStore.categories,
            thumbnailImage: null,
            backgroundImage: null,
          });
          setThumbnailPreview(dummyStore.thumbnailUrl);
          setBackgroundPreview(dummyStore.backgroundUrl);
        }
      } catch (err) {
        console.error("Error fetching store:", err);
        setError("Failed to load store details. Using sample data.");
        setStore(dummyStore);
        setForm({
          storeName: dummyStore.storeName,
          walletId: dummyStore.walletId,
          shortDescription: dummyStore.shortDescription,
          shopEmail: dummyStore.shopEmail,
          subheading: dummyStore.subheading,
          categories: dummyStore.categories,
          thumbnailImage: null,
          backgroundImage: null,
        });
        setThumbnailPreview(dummyStore.thumbnailUrl);
        setBackgroundPreview(dummyStore.backgroundUrl);
      }
    };

    const fetchItems = async () => {
      if (!user || !user.walletId || !storeId) return;

      try {
        const itemsCollection = collection(db, `stores/${storeId}/items`);
        const itemsSnapshot = await getDocs(itemsCollection);
        const itemsData = itemsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems({
          columns: dummyItems.columns,
          rows: itemsData.length > 0 ? itemsData.map(item => ({
            name: item.name || "Unnamed Item",
            price: `${item.price || 0} ${item.currency || "USDC"}`,
            type: item.type?.toUpperCase() || "UNKNOWN",
            status: item.removed ? "Removed" : "Active",
          })) : dummyItems.rows,
        });
      } catch (err) {
        console.error("Error fetching items:", err);
        setError("Failed to load items. Using sample data.");
        setItems(dummyItems);
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
    if (!store || isSaving || store.id === dummyStore.id) return;

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
        const thumbnailRef = ref(storage, `stores/${storeId}/thumbnail-${form.thumbnailImage.name}`);
        await uploadBytes(thumbnailRef, form.thumbnailImage);
        updatedForm.thumbnailUrl = await getDownloadURL(thumbnailRef);
      } else {
        updatedForm.thumbnailUrl = store.thumbnailUrl || "";
      }

      // Upload background if changed
      if (form.backgroundImage) {
        const backgroundRef = ref(storage, `stores/${storeId}/banner-${form.backgroundImage.name}`);
        await uploadBytes(backgroundRef, form.backgroundImage);
        updatedForm.backgroundUrl = await getDownloadURL(backgroundRef);
      } else {
        updatedForm.backgroundUrl = store.backgroundUrl || "";
      }

      const storeDoc = doc(db, "stores", storeId);
      await updateDoc(storeDoc, {
        storeName: updatedForm.storeName,
        walletId: updatedForm.walletId,
        shortDescription: updatedForm.shortDescription,
        shopEmail: updatedForm.shopEmail,
        subheading: updatedForm.subheading,
        categories: updatedForm.categories,
        thumbnailUrl: updatedForm.thumbnailUrl,
        backgroundUrl: updatedForm.backgroundUrl,
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

  // Handle flagging store
  const handleFlagStore = async () => {
    if (!store || isFlagging || store.id === dummyStore.id) return;

    setIsFlagging(true);
    setError(null);
    setSuccess(null);

    try {
      const storeDoc = doc(db, "stores", storeId);
      await updateDoc(storeDoc, {
        removed: true,
      });
      setStore({ ...store, removed: true });
      setSuccess("Store flagged for removal successfully!");
    } catch (err) {
      console.error("Error flagging store:", err);
      setError("Failed to flag store: " + err.message);
    } finally {
      setIsFlagging(false);
    }
  };

  // Handle item modal
  const handleOpenItemModal = () => setOpenItemModal(true);
  const handleCloseItemModal = () => {
    setOpenItemModal(false);
    setItemForm({ name: "", price: "", type: "rwi" });
    setError(null);
  };

  const handleItemFormChange = (field, value) => {
    setItemForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddItem = async () => {
    if (!itemForm.name || !itemForm.price || isAddingItem || store.id === dummyStore.id) {
      setError("Item name and price are required.");
      return;
    }

    setIsAddingItem(true);
    setError(null);
    setSuccess(null);

    try {
      const newItem = {
        name: itemForm.name,
        price: parseFloat(itemForm.price),
        currency: "USDC",
        type: itemForm.type,
        removed: false,
        flagCount: 0,
        flagReasons: [],
      };
      const itemsCollection = collection(db, `stores/${storeId}/items`);
      await addDoc(itemsCollection, newItem);
      setItems({
        ...items,
        rows: [
          ...items.rows,
          {
            name: newItem.name,
            price: `${newItem.price} ${newItem.currency}`,
            type: newItem.type.toUpperCase(),
            status: "Active",
          },
        ],
      });
      setSuccess("Item added successfully!");
      handleCloseItemModal();
    } catch (err) {
      console.error("Error adding item:", err);
      setError("Failed to add item: " + err.message);
    } finally {
      setIsAddingItem(false);
    }
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
                <MDTypography variant="h4" color="dark" mb={2}>
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
                            disabled={isSaving || store.id === dummyStore.id}
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
                      <Grid item xs={12}>
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
                            disabled={isSaving || store.id === dummyStore.id}
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
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Store Name
                      </MDTypography>
                      <MDInput
                        value={form.storeName}
                        onChange={(e) => handleFormChange("storeName", e.target.value)}
                        fullWidth
                        required
                        disabled={isSaving || store.id === dummyStore.id}
                        sx={{
                          "& .MuiInputBase-input": {
                            padding: { xs: "10px", md: "12px" },
                            color: "#344767",
                          },
                        }}
                      />
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Subheading
                      </MDTypography>
                      <MDInput
                        value={form.subheading}
                        onChange={(e) => handleFormChange("subheading", e.target.value)}
                        fullWidth
                        placeholder="e.g., Free shipping on orders over 2 SOL! Use code F4CETS10"
                        disabled={isSaving || store.id === dummyStore.id}
                        sx={{
                          "& .MuiInputBase-input": {
                            padding: { xs: "10px", md: "12px" },
                            color: "#344767",
                          },
                        }}
                      />
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
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
                        disabled={isSaving || store.id === dummyStore.id}
                        sx={{
                          "& .MuiInputBase-input": {
                            padding: { xs: "10px", md: "12px" },
                            color: "#344767",
                          },
                        }}
                      />
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Shop Email
                      </MDTypography>
                      <MDInput
                        value={form.shopEmail}
                        onChange={(e) => handleFormChange("shopEmail", e.target.value)}
                        fullWidth
                        type="email"
                        required
                        disabled={isSaving || store.id === dummyStore.id}
                        sx={{
                          "& .MuiInputBase-input": {
                            padding: { xs: "10px", md: "12px" },
                            color: "#344767",
                          },
                        }}
                      />
                    </MDBox>
                    <MDBox mb={2}>
                      <MDTypography variant="h6" color="dark">
                        Wallet ID
                      </MDTypography>
                      <MDInput
                        value={form.walletId}
                        onChange={(e) => handleFormChange("walletId", e.target.value)}
                        fullWidth
                        required
                        disabled={isSaving || store.id === dummyStore.id}
                        sx={{
                          "& .MuiInputBase-input": {
                            padding: { xs: "10px", md: "12px" },
                            color: "#344767",
                          },
                        }}
                      />
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
                              backgroundColor: form.categories.includes(category) ? "rgba(255, 255, 255, 0.15)" : "transparent",
                            }}
                          >
                            <MDBox display="flex" alignItems="center">
                              <Checkbox
                                checked={form.categories.includes(category)}
                                onChange={() => handleCategoryChange(category)}
                                disabled={isSaving || store.id === dummyStore.id}
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
                    <MDBox display="flex" gap={2}>
                      <MDButton
                        variant="gradient"
                        color="dark"
                        onClick={handleSave}
                        disabled={isSaving || store.id === dummyStore.id}
                        sx={{ width: { xs: "100%", sm: "auto" } }}
                      >
                        {isSaving ? "Saving..." : "Save Changes"}
                      </MDButton>
                      <MDButton
                        variant="gradient"
                        color="error"
                        onClick={handleFlagStore}
                        disabled={isFlagging || store.removed || store.id === dummyStore.id}
                        sx={{ width: { xs: "100%", sm: "auto" } }}
                      >
                        {isFlagging ? "Flagging..." : store.removed ? "Store Flagged" : "Flag Store"}
                      </MDButton>
                    </MDBox>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <MDBox>
                      <MDTypography variant="h6" color="dark" mb={2}>
                        Store Items
                      </MDTypography>
                      <DataTable
                        table={items}
                        entriesPerPage={false}
                        showTotalEntries={false}
                        isSorted={false}
                        noEndBorder
                      />
                      <MDButton
                        variant="outlined"
                        color="dark"
                        onClick={handleOpenItemModal}
                        disabled={store.id === dummyStore.id}
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
        <Dialog open={openItemModal} onClose={handleCloseItemModal}>
          <DialogTitle>Add New Item</DialogTitle>
          <DialogContent>
            {error && (
              <MDTypography variant="body2" color="error" mb={2}>
                {error}
              </MDTypography>
            )}
            <MDBox mb={2}>
              <MDInput
                label="Item Name"
                value={itemForm.name}
                onChange={(e) => handleItemFormChange("name", e.target.value)}
                fullWidth
                sx={{
                  "& .MuiInputBase-input": {
                    padding: { xs: "10px", md: "12px" },
                    color: "#344767",
                  },
                }}
              />
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                label="Price (USDC)"
                type="number"
                value={itemForm.price}
                onChange={(e) => handleItemFormChange("price", e.target.value)}
                fullWidth
                sx={{
                  "& .MuiInputBase-input": {
                    padding: { xs: "10px", md: "12px" },
                    color: "#344767",
                  },
                }}
              />
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                label="Type (RWI or Digital)"
                value={itemForm.type}
                onChange={(e) => handleItemFormChange("type", e.target.value)}
                fullWidth
                sx={{
                  "& .MuiInputBase-input": {
                    padding: { xs: "10px", md: "12px" },
                    color: "#344767",
                  },
                }}
              />
            </MDBox>
          </DialogContent>
          <DialogActions>
            <MDButton onClick={handleCloseItemModal} color="secondary">
              Cancel
            </MDButton>
            <MDButton
              onClick={handleAddItem}
              color="primary"
              disabled={isAddingItem}
            >
              {isAddingItem ? "Adding..." : "Add Item"}
            </MDButton>
          </DialogActions>
        </Dialog>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default StoreEdit;