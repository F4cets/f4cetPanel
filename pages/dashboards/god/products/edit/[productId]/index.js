/**
=========================================================
* F4cetPanel - God Product Edit/Create Page
=========================================================

* Copyright 2023 F4cets Team
*/

// React imports
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

// User context
import { useUser } from "/contexts/UserContext";

// Firebase imports
import { doc, getDoc, updateDoc, setDoc, collection, serverTimestamp, getDocs, query, where, deleteDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";
import { db, storage } from "/lib/firebase";

// Google Cloud Storage
import { Storage } from '@google-cloud/storage';

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Switch from "@mui/material/Switch";
import Chip from "@mui/material/Chip";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
import MDInput from "/components/MDInput";
import MDButton from "/components/MDButton";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";

function EditProduct() {
  const { user } = useUser();
  const router = useRouter();
  const { productId } = router.query;

  // Form state
  const [inventoryType, setInventoryType] = useState("digital");
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
    shippingLocation: "",
    categories: [],
    isActive: true,
    storeId: "",
  });
  const [inventoryVariants, setInventoryVariants] = useState([]);
  const [variantForm, setVariantForm] = useState({ size: "", color: "", quantity: "" });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [stores, setStores] = useState([]);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTogglingActive, setIsTogglingActive] = useState(false);
  // Minting state
  const [isMinting, setIsMinting] = useState(false);
  const [mintError, setMintError] = useState(null);
  const [mintSuccess, setMintSuccess] = useState(null);

  // Category options
  const digitalCategories = [
    "Books, Movies & Music", "Digital Goods", "Digital Services", "Ebooks",
    "EGames", "NFTs", "Private Access Groups", "Software",
  ];
  const rwiCategories = [
    "Accessories", "Art & Collectibles", "Baby & Toddler", "Beauty",
    "Books, Movies & Music", "Clothing", "Craft Supplies", "Electronics",
    "Fitness & Nutrition", "Food & Drinks", "Home & Living", "Jewelry",
    "Luggage & Bags", "NFTs", "Pet Supplies", "Shoes", "Sporting Goods",
    "Toys & Games",
  ];

  // Check role and fetch data
  useEffect(() => {
    const checkRoleAndData = async () => {
      try {
        if (!user || !user.walletId) {
          console.log("EditProduct: No user or walletId, redirecting to home");
          router.replace("/");
          return;
        }

        console.log("EditProduct: Fetching user role for wallet:", user.walletId);
        const userDoc = await getDoc(doc(db, "users", user.walletId));
        if (!userDoc.exists()) {
          console.log("EditProduct: No user found, redirecting to home");
          router.replace("/");
          return;
        }

        const userData = userDoc.data();
        const role = userData.role || "buyer";
        console.log("EditProduct: User Role:", role);
        if (role !== "god") {
          console.log("EditProduct: User is not god, redirecting to home");
          router.replace("/");
          return;
        }

        // Fetch stores for dropdown
        const storesQuery = query(collection(db, "stores"), where("isActive", "==", true));
        const storesSnapshot = await getDocs(storesQuery);
        const storesData = storesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStores(storesData);

        // Fetch product if editing
        if (productId !== "new") {
          const productDoc = await getDoc(doc(db, "products", productId));
          if (!productDoc.exists()) {
            console.log("EditProduct: No product found, redirecting to products.");
            router.replace("/dashboards/god/products");
            return;
          }
          const productData = productDoc.data();
          setProduct(productData);
          setInventoryType(productData.type);
          setForm({
            name: productData.name || "",
            description: productData.description || "",
            price: productData.price || "",
            quantity: productData.quantity || "",
            shippingLocation: productData.shippingLocation || "",
            categories: productData.categories || [],
            isActive: productData.isActive !== false,
            storeId: productData.storeId || "",
          });
          setInventoryVariants(productData.variants || []);
          setImagePreviews(productData.imageUrls || []);
          setImages([]);
        }

        setLoading(false);
      } catch (err) {
        console.error("EditProduct: Error fetching data:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    checkRoleAndData();
  }, [productId, router, user]);

  // Handle file selection
  const handleFileSelect = (files) => {
    const selectedFiles = Array.from(files);
    if (selectedFiles.length + imagePreviews.length > 3) {
      setError("You can upload a maximum of 3 images.");
      return;
    }
    setImages([...images, ...selectedFiles]);
    setImagePreviews([...imagePreviews, ...selectedFiles.map(file => URL.createObjectURL(file))]);
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
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const validFiles = Array.from(files).filter(file => file.type.startsWith("image/"));
      handleFileSelect(validFiles);
    }
  };

  // Handle category selection
  const handleCategoryChange = (category) => {
    setForm((prev) => {
      const categories = prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories };
    });
  };

  // Handle variant addition
  const handleAddVariant = () => {
    if (!variantForm.size || !variantForm.color || !variantForm.quantity) {
      setError("Please fill out all variant fields.");
      return;
    }
    setInventoryVariants([...inventoryVariants, { ...variantForm }]);
    setVariantForm({ size: "", color: "", quantity: "" });
  };

  // Handle variant removal
  const handleRemoveVariant = (index) => {
    setInventoryVariants(inventoryVariants.filter((_, i) => i !== index));
  };

  // Handle image removal
  const handleImageDelete = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  // Handle toggle isActive
  const handleToggleActive = async () => {
    if (!productId || productId === "new" || isTogglingActive) return;

    setIsTogglingActive(true);
    setError(null);
    setSuccess(null);

    try {
      const productRef = doc(db, "products", productId);
      const newIsActive = !form.isActive;
      await updateDoc(productRef, {
        isActive: newIsActive,
        updatedAt: serverTimestamp(),
      });
      setForm({ ...form, isActive: newIsActive });
      setSuccess(`Product ${newIsActive ? "activated" : "deactivated"} successfully`);
    } catch (err) {
      console.error("EditProduct: Error toggling active status:", err);
      setError("Failed to toggle product active status: " + err.message);
    } finally {
      setIsTogglingActive(false);
    }
  };

  // Cleanup function for failed minting
  const cleanupFailedMint = async (targetProductId, storeId, txId, imagePaths) => {
    try {
      // Delete Firestore product
      await deleteDoc(doc(db, `products/${targetProductId}`));
      console.log(`EditProduct: Deleted product ${targetProductId}`);

      // Delete Firestore transaction
      if (txId) {
        await deleteDoc(doc(db, `transactions/${txId}`));
        console.log(`EditProduct: Deleted transaction ${txId}`);
      }

      // Delete Firebase Storage images
      for (const path of imagePaths) {
        const imageRef = ref(storage, path);
        await deleteObject(imageRef);
        console.log(`EditProduct: Deleted Firebase Storage image ${path}`);
      }

      // Delete Google Cloud Storage folder
      const gcsCredentials = JSON.parse(Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString('utf8'));
      const gcs = new Storage({ credentials: gcsCredentials });
      const bucket = gcs.bucket('f4cet-nft-assets');
      const [files] = await bucket.getFiles({ prefix: `nfts/${storeId}/${targetProductId}/` });
      await Promise.all(files.map(file => file.delete()));
      console.log(`EditProduct: Deleted Google Cloud Storage folder nfts/${storeId}/${targetProductId}/`);
    } catch (err) {
      console.error("EditProduct: Error during cleanup:", err);
      setError(`Cleanup failed: ${err.message}`);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setMintError(null);
    setMintSuccess(null);
    setIsMinting(true);

    if (!form.name || !form.description || !form.price || form.categories.length === 0 || !form.storeId) {
      setError("Please fill out all required fields, select at least one category, and choose a store.");
      setIsMinting(false);
      return;
    }

    if (inventoryType === "digital") {
      if (!form.quantity || parseInt(form.quantity) < 1) {
        setError("Please specify a quantity of at least 1 for digital items.");
        setIsMinting(false);
        return;
      }
    } else if (inventoryType === "rwi") {
      if (!form.shippingLocation) {
        setError("Please fill out the shipping location for RWI.");
        setIsMinting(false);
        return;
      }
      if (inventoryVariants.length === 0) {
        setError("Please add at least one size/color/quantity combination for RWI.");
        setIsMinting(false);
        return;
      }
    }

    if (imagePreviews.length === 0 && images.length === 0) {
      setError("Please upload at least one image.");
      setIsMinting(false);
      return;
    }

    let txId = null;
    let imagePaths = [];
    try {
      // Fetch store to get sellerId
      const storeDoc = await getDoc(doc(db, "stores", form.storeId));
      if (!storeDoc.exists()) {
        throw new Error("Selected store does not exist.");
      }
      const storeData = storeDoc.data();
      const sellerId = storeData.sellerId;

      // Determine productId
      const targetProductId = productId === "new" ? doc(collection(db, "products")).id : productId;

      // Upload new images to Firebase Storage
      let imageUrls = product?.imageUrls || [];
      if (images.length > 0) {
        imageUrls = await Promise.all(
          images.slice(0, 3).map(async (image, index) => {
            const fileExt = image.name.split('.').pop().toLowerCase();
            const imageRef = ref(storage, `products/${targetProductId}/image${index + 1}.${fileExt}`);
            console.log("EditProduct: Uploading image to:", imageRef.fullPath);
            await uploadBytes(imageRef, image);
            const url = await getDownloadURL(imageRef);
            console.log("EditProduct: Image URL:", url);
            imagePaths.push(imageRef.fullPath);
            return url;
          })
        );
      }

      // Prepare product data
      const productData = {
        type: inventoryType,
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        categories: form.categories,
        imageUrls,
        selectedImage: imageUrls[0] || product?.imageUrls[0] || "",
        storeId: form.storeId,
        sellerId,
        isActive: form.isActive,
        updatedAt: serverTimestamp(),
      };

      if (inventoryType === "digital") {
        productData.quantity = parseInt(form.quantity);
      } else if (inventoryType === "rwi") {
        productData.shippingLocation = form.shippingLocation;
        productData.variants = inventoryVariants;
      }

      // Save product to Firestore
      if (productId === "new") {
        productData.createdAt = serverTimestamp();
        console.log("EditProduct: Creating new product at products/", targetProductId, ":", productData);
        await setDoc(doc(db, "products", targetProductId), productData);
      } else {
        console.log("EditProduct: Updating product at products/", targetProductId, ":", productData);
        await updateDoc(doc(db, "products", targetProductId), productData);
      }

      // Handle cNFT minting for new products
      let mintedCnfts = [];
      if (productId === "new" && imageUrls.length > 0) {
        // Upload first image to Google Cloud Storage for cNFT metadata
        const firstImage = images[0];
        const formData = new FormData();
        formData.append("image", firstImage);
        formData.append("storeId", form.storeId);
        formData.append("productId", targetProductId);

        const uploadResponse = await fetch("https://user.f4cets.market/api/upload-nft-image", {
          method: "POST",
          body: formData,
        });
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(`Failed to upload cNFT image: ${errorData.error || uploadResponse.statusText}`);
        }
        const { url: imageUrl, fileExt } = await uploadResponse.json();
        console.log("EditProduct: cNFT image uploaded:", imageUrl);

        // Prepare mintcnfts parameters
        const quantity = inventoryType === "digital"
          ? parseInt(form.quantity)
          : inventoryVariants.reduce((sum, v) => sum + parseInt(v.quantity), 0);
        const mintParams = {
          walletAddress: sellerId,
          storeId: form.storeId,
          productId: targetProductId,
          quantity,
          name: form.name,
          imageUrl,
          imageExt: fileExt,
          type: inventoryType,
          variants: inventoryType === "rwi" ? inventoryVariants : [],
          feeTxSignature: `fee-${Math.random().toString(36).substring(2, 10)}`,
          treeId: "25a893ed-ac27-4fe6-832e-c8abd627fb14",
        };

        // Call mintcnfts
        const mintResponse = await fetch("https://mintcnfts-232592911911.us-central1.run.app", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mintParams),
        });
        if (!mintResponse.ok) {
          const errorData = await mintResponse.json();
          txId = errorData.txId; // Capture txId if included in error response
          throw new Error(`Failed to mint cNFTs: ${errorData.error || mintResponse.statusText}`);
        }
        mintedCnfts = await mintResponse.json();
        console.log("EditProduct: Minted cNFTs:", mintedCnfts);

        // Save minted cNFTs to Firestore
        for (const cnft of mintedCnfts.cnfts || []) {
          await setDoc(doc(db, `products/${targetProductId}/nfts`, cnft.assetId), {
            assetId: cnft.assetId,
            metadataUri: cnft.metadataUri,
            leafIndex: cnft.leafIndex,
            productId: targetProductId,
            storeId: form.storeId,
            status: "Ordered",
            createdAt: serverTimestamp(),
            transferred: false,
          });
          console.log("EditProduct: Saved cNFT:", cnft.assetId);
        }
      }

      if (productId === "new") {
        setSuccess(`Product created${mintedCnfts.cnfts?.length ? ` and ${mintedCnfts.cnfts.length} cNFTs minted` : ""} successfully!`);
      } else {
        setSuccess("Product updated successfully!");
      }

      setForm({ name: "", description: "", price: "", quantity: "", shippingLocation: "", categories: [], isActive: true, storeId: "" });
      setImages([]);
      setImagePreviews([]);
      setInventoryVariants([]);
      setVariantForm({ size: "", color: "", quantity: "" });
      setTimeout(() => router.push("/dashboards/god/products"), 2000);
    } catch (err) {
      console.error("EditProduct: Error saving product:", err);
      setError("Failed to save product: " + err.message);
      setMintError("Failed to mint cNFTs: " + err.message);
      if (productId === "new") {
        await cleanupFailedMint(targetProductId, form.storeId, txId, imagePaths);
      }
    } finally {
      setIsMinting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push("/dashboards/god/products");
  };

  if (loading) {
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
                overflow: "hidden",
              }}>
                <MDBox p={{ xs: 2, md: 3 }}>
                  <MDTypography variant="h5" sx={{ color: "#fff", textAlign: { xs: "center", md: "left" } }}>
                    Loading...
                  </MDTypography>
                </MDBox>
              </Card>
            </Grid>
          </Grid>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  if (error) {
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
                overflow: "hidden",
              }}>
                <MDBox p={{ xs: 2, md: 3 }}>
                  <MDTypography variant="h5" sx={{ color: "#fff", textAlign: { xs: "center", md: "left" } }}>
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
        <Footer />
      </DashboardLayout>
    );
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
              overflow: "hidden",
            }}>
              <MDBox p={{ xs: 2, md: 3 }}>
                <MDTypography
                  variant="h5"
                  sx={{ color: "#212121", mb: { xs: 2, md: 3 }, textAlign: { xs: "center", md: "left" } }}
                >
                  {productId === "new" ? "Create Product" : `Edit Product - ${product?.name}`}
                </MDTypography>
                {error && (
                  <MDTypography
                    variant="body2"
                    color="error"
                    mb={2}
                    sx={{ textAlign: { xs: "center", md: "left" } }}
                  >
                    {error}
                  </MDTypography>
                )}
                {success && (
                  <MDTypography
                    variant="body2"
                    color="success"
                    mb={2}
                    sx={{ textAlign: { xs: "center", md: "left" } }}
                  >
                    {success}
                  </MDTypography>
                )}
                {mintError && (
                  <MDTypography
                    variant="body2"
                    color="error"
                    mb={2}
                    sx={{ textAlign: { xs: "center", md: "left" } }}
                  >
                    {mintError}
                  </MDTypography>
                )}
                {mintSuccess && (
                  <MDTypography
                    variant="body2"
                    color="success"
                    mb={2}
                    sx={{ textAlign: { xs: "center", md: "left" } }}
                  >
                    {mintSuccess}
                  </MDTypography>
                )}
                <form onSubmit={handleSubmit}>
                  <MDBox mb={3}>
                    <Autocomplete
                      options={stores}
                      getOptionLabel={(option) => option.name || option.id}
                      value={stores.find(store => store.id === form.storeId) || null}
                      onChange={(event, newValue) => setForm({ ...form, storeId: newValue ? newValue.id : "" })}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select Store"
                          required
                          sx={{
                            "& .MuiInputBase-input": { padding: { xs: "10px", md: "12px" }, color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                            "& .MuiInputLabel-root": { color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                            "& .MuiInputLabel-root.Mui-focused": { color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                            "& .MuiOutlinedInput-root": {
                              "& fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#bdbdbd' },
                              "&:hover fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#e0e0e0' : '#3f51b5' },
                              "&.Mui-focused fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#3f51b5' },
                            },
                          }}
                        />
                      )}
                    />
                  </MDBox>
                  <MDBox mb={3} display="flex" alignItems="center">
                    <Switch
                      checked={inventoryType === "rwi"}
                      onChange={(e) => setInventoryType(e.target.checked ? "rwi" : "digital")}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": { color: "#3f51b5" },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#3f51b5" },
                      }}
                    />
                    <MDTypography variant="body2" sx={{ color: "#212121", textAlign: { xs: "center", md: "left" } }}>
                      {inventoryType === "digital" ? "Digital" : "Real World Item (RWI)"}
                    </MDTypography>
                  </MDBox>
                  <MDBox mb={3}>
                    <MDInput
                      label="Item Name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      fullWidth
                      required
                      sx={{
                        "& .MuiInputBase-input": { padding: { xs: "10px", md: "12px" }, color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                        "& .MuiInputLabel-root": { color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                        "& .MuiInputLabel-root.Mui-focused": { color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#bdbdbd' },
                          "&:hover fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#e0e0e0' : '#3f51b5' },
                          "&.Mui-focused fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#3f51b5' },
                        },
                      }}
                    />
                  </MDBox>
                  <MDBox mb={3}>
                    <MDInput
                      label="Description"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      fullWidth
                      multiline
                      rows={4}
                      required
                      sx={{
                        "& .MuiInputBase-input": { padding: { xs: "10px", md: "12px" }, color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                        "& .MuiInputLabel-root": { color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                        "& .MuiInputLabel-root.Mui-focused": { color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#bdbdbd' },
                          "&:hover fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#e0e0e0' : '#3f51b5' },
                          "&.Mui-focused fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#3f51b5' },
                        },
                      }}
                    />
                  </MDBox>
                  <MDBox mb={3}>
                    <MDInput
                      label="Price (USDC)"
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      fullWidth
                      required
                      sx={{
                        "& .MuiInputBase-input": { padding: { xs: "10px", md: "12px" }, color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                        "& .MuiInputLabel-root": { color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                        "& .MuiInputLabel-root.Mui-focused": { color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#bdbdbd' },
                          "&:hover fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#e0e0e0' : '#3f51b5' },
                          "&.Mui-focused fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#3f51b5' },
                        },
                      }}
                    />
                  </MDBox>
                  <MDBox mb={3} display="flex" alignItems="center">
                    <Switch
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": { color: "#3f51b5" },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#3f51b5" },
                      }}
                    />
                    <MDTypography variant="body2" sx={{ color: "#212121", textAlign: { xs: "center", md: "left" } }}>
                      Active
                    </MDTypography>
                  </MDBox>
                  {productId !== "new" && (
                    <MDBox mb={3}>
                      <MDButton
                        onClick={handleToggleActive}
                        color={form.isActive ? "error" : "success"}
                        variant="gradient"
                        disabled={isTogglingActive}
                        sx={{ width: { xs: "100%", sm: "auto" } }}
                      >
                        {isTogglingActive ? "Toggling..." : form.isActive ? "Deactivate Product" : "Activate Product"}
                      </MDButton>
                    </MDBox>
                  )}
                  {inventoryType === "digital" && (
                    <>
                      <MDBox mb={3}>
                        <MDInput
                          label="Quantity"
                          type="number"
                          value={form.quantity}
                          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                          fullWidth
                          required
                          sx={{
                            "& .MuiInputBase-input": { padding: { xs: "10px", md: "12px" }, color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                            "& .MuiInputLabel-root": { color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                            "& .MuiInputLabel-root.Mui-focused": { color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                            "& .MuiOutlinedInput-root": {
                              "& fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#bdbdbd' },
                              "&:hover fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#e0e0e0' : '#3f51b5' },
                              "&.Mui-focused fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#3f51b5' },
                            },
                          }}
                        />
                      </MDBox>
                      <MDBox mb={3}>
                        <MDTypography variant="body2" sx={{ color: "#212121", mb: 1, textAlign: { xs: "center", md: "left" } }}>
                          Categories
                        </MDTypography>
                        <MDBox sx={{
                          maxHeight: "200px",
                          overflowY: "auto",
                          borderRadius: "12px",
                          padding: "10px",
                          background: "linear-gradient(135deg, #6c6083 0%, #4d455d 100%)",
                          boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1)",
                        }}>
                          {digitalCategories.map((category) => (
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
                                  }}
                                />
                              )}
                            </MDBox>
                          ))}
                        </MDBox>
                      </MDBox>
                    </>
                  )}
                  {inventoryType === "rwi" && (
                    <>
                      <MDBox mb={3}>
                        <MDInput
                          label="Shipping Location"
                          value={form.shippingLocation}
                          onChange={(e) => setForm({ ...form, shippingLocation: e.target.value })}
                          fullWidth
                          required
                          sx={{
                            "& .MuiInputBase-input": { padding: { xs: "10px", md: "12px" }, color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                            "& .MuiInputLabel-root": { color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                            "& .MuiInputLabel-root.Mui-focused": { color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                            "& .MuiOutlinedInput-root": {
                              "& fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#bdbdbd' },
                              "&:hover fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#e0e0e0' : '#3f51b5' },
                              "&.Mui-focused fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#3f51b5' },
                            },
                          }}
                        />
                      </MDBox>
                      <MDBox mb={3}>
                        <MDTypography variant="body2" sx={{ color: "#212121", mb: 1, textAlign: { xs: "center", md: "left" } }}>
                          Categories
                        </MDTypography>
                        <MDBox sx={{
                          maxHeight: "200px",
                          overflowY: "auto",
                          borderRadius: "12px",
                          padding: "10px",
                          background: "linear-gradient(135deg, #6c6083 0%, #4d455d 100%)",
                          boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1)",
                        }}>
                          {rwiCategories.map((category) => (
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
                                  }}
                                />
                              )}
                            </MDBox>
                          ))}
                        </MDBox>
                      </MDBox>
                      <MDBox mb={3}>
                        <MDTypography variant="body2" sx={{ color: "#212121", mb: 1, textAlign: { xs: "center", md: "left" } }}>
                          Inventory Variants (Size, Color, Quantity)
                        </MDTypography>
                        {inventoryVariants.length > 0 && (
                          <MDBox mb={2}>
                            {inventoryVariants.map((variant, index) => (
                              <MDBox
                                key={index}
                                display="flex"
                                alignItems="center"
                                gap={1}
                                mb={1}
                                sx={{ backgroundColor: "rgba(255, 255, 255, 0.5)", padding: "8px", borderRadius: "8px" }}
                              >
                                <MDTypography variant="body2" sx={{ color: "#fff", flex: 1 }}>
                                  Size: {variant.size}, Color: {variant.color}, Quantity: {variant.quantity}
                                </MDTypography>
                                <IconButton onClick={() => handleRemoveVariant(index)} sx={{ color: "#d32f2f" }}>
                                  <Icon>delete</Icon>
                                </IconButton>
                              </MDBox>
                            ))}
                          </MDBox>
                        )}
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={4}>
                            <MDInput
                              label="Size"
                              value={variantForm.size}
                              onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
                              fullWidth
                              sx={{
                                "& .MuiInputBase-input": { padding: { xs: "10px", md: "12px" }, color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                                "& .MuiInputLabel-root": { color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                                "& .MuiInputLabel-root.Mui-focused": { color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                                "& .MuiOutlinedInput-root": {
                                  "& fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#bdbdbd' },
                                  "&:hover fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#e0e0e0' : '#3f51b5' },
                                  "&.Mui-focused fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#3f51b5' },
                                },
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <MDInput
                              label="Color"
                              value={variantForm.color}
                              onChange={(e) => setVariantForm({ ...variantForm, color: e.target.value })}
                              fullWidth
                              sx={{
                                "& .MuiInputBase-input": { padding: { xs: "10px", md: "12px" }, color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                                "& .MuiInputLabel-root": { color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                                "& .MuiInputLabel-root.Mui-focused": { color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                                "& .MuiOutlinedInput-root": {
                                  "& fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#bdbdbd' },
                                  "&:hover fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#e0e0e0' : '#3f51b5' },
                                  "&.Mui-focused fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#3f51b5' },
                                },
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <MDInput
                              label="Quantity"
                              type="number"
                              value={variantForm.quantity}
                              onChange={(e) => setVariantForm({ ...variantForm, quantity: e.target.value })}
                              fullWidth
                              sx={{
                                "& .MuiInputBase-input": { padding: { xs: "10px", md: "12px" }, color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                                "& .MuiInputLabel-root": { color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                                "& .MuiInputLabel-root.Mui-focused": { color: theme => theme.palette.mode === 'dark' ? '#fff' : '#344767' },
                                "& .MuiOutlinedInput-root": {
                                  "& fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#bdbdbd' },
                                  "&:hover fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#e0e0e0' : '#3f51b5' },
                                  "&.Mui-focused fieldset": { borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : '#3f51b5' },
                                },
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <MDButton
                              onClick={handleAddVariant}
                              color="info"
                              variant="gradient"
                              sx={{
                                padding: { xs: "8px", md: "10px" },
                                width: "100%",
                              }}
                            >
                              Add
                            </MDButton>
                          </Grid>
                        </Grid>
                      </MDBox>
                    </>
                  )}
                  <MDBox
                    mb={3}
                    sx={{
                      border: `2px dashed ${dragActive ? "#3f51b5" : "#bdbdbd"}`,
                      borderRadius: "8px",
                      padding: { xs: "16px", md: "20px" },
                      textAlign: "center",
                      backgroundColor: dragActive ? "rgba(63, 81, 181, 0.1)" : "rgba(0, 0, 0, 0.02)",
                      cursor: "pointer",
                    }}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("imageInput").click()}
                  >
                    <MDTypography variant="body2" sx={{ color: "#212121", mb: 1 }}>
                      Drag & Drop or Click to Upload Images (Max 3)
                    </MDTypography>
                    <MDTypography variant="caption" sx={{ color: "#212121", display: "block", mb: 1 }}>
                      (Supports PNG, JPG, up to 5MB each)
                    </MDTypography>
                    <MDInput
                      id="imageInput"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileSelect(e.target.files)}
                      sx={{ display: "none" }}
                    />
                  </MDBox>
                  {imagePreviews.length > 0 && (
                    <MDBox mb={3} display="flex" flexWrap="wrap" gap={1} justifyContent="center">
                      {imagePreviews.map((preview, index) => (
                        <MDBox
                          key={index}
                          sx={{ position: "relative", width: { xs: "80px", md: "100px" }, height: { xs: "80px", md: "100px" } }}
                        >
                          <MDBox
                            component="img"
                            src={preview}
                            alt={`Preview ${index}`}
                            sx={{
                              width: "100%",
                              height: "100%",
                              borderRadius: "8px",
                              objectFit: "cover",
                              border: "2px solid #fff",
                              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                            }}
                          />
                          <IconButton
                            onClick={() => handleImageDelete(index)}
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
                      ))}
                    </MDBox>
                  )}
                  <Divider sx={{ mb: 3, backgroundColor: "rgba(0, 0, 0, 0.1)" }} />
                  <MDBox display="flex" justifyContent="center" gap={2}>
                    <MDButton
                      type="submit"
                      color="dark"
                      variant="gradient"
                      disabled={isMinting}
                      sx={{ width: { xs: "100%", sm: "auto" } }}
                    >
                      {isMinting ? "Creating..." : (productId === "new" ? "Create Product" : "Update Product")}
                    </MDButton>
                    <MDButton
                      onClick={handleCancel}
                      color="dark"
                      variant="outlined"
                      sx={{ width: { xs: "100%", sm: "auto" } }}
                    >
                      Cancel
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

export default EditProduct;