/**
=========================================================
* F4cetPanel - Create Inventory Page
=========================================================

* Copyright 2025 F4cets Team
*/

// React imports
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

// Solana imports
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

// User context
import { useUser } from "/contexts/UserContext";

// Firebase imports
import { doc, setDoc, collection, getDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "/lib/firebase";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Switch from "@mui/material/Switch";
import Chip from "@mui/material/Chip";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import CircularProgress from "@mui/material/CircularProgress";
import Backdrop from "@mui/material/Backdrop";
import Typography from "@mui/material/Typography";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
import MDInput from "/components/MDInput";
import MDButton from "/components/MDButton";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";

function CreateInventory() {
  const { user, setUser } = useUser();
  const { publicKey, signTransaction } = useWallet();
  const router = useRouter();

  // Form state
  const [inventoryType, setInventoryType] = useState("digital");
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
    shippingLocation: "",
    categories: [],
  });
  const [inventoryVariants, setInventoryVariants] = useState([]);
  const [variantForm, setVariantForm] = useState({ size: "", color: "", quantity: "" });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [storeId, setStoreId] = useState(null);
  const [escrowPublicKey, setEscrowPublicKey] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Calculate total SOL cost (0.003 SOL per item)
  const calculateTotalSolCost = () => {
    const feePerItemSOL = 0.003;
    let totalQuantity = 0;
    if (inventoryType === "rwi") {
      totalQuantity = inventoryVariants.reduce((sum, v) => sum + (parseInt(v.quantity) || 0), 0);
    } else {
      totalQuantity = parseInt(form.quantity) || 0;
    }
    return (totalQuantity * feePerItemSOL).toFixed(5);
  };

  // Check role, fetch storeId, escrowPublicKey, and shipping address
  useEffect(() => {
    const checkRoleAndStore = async () => {
      try {
        if (!user || !user.walletId) {
          console.log("CreateInventory: No user or walletId, redirecting to home");
          router.replace("/");
          return;
        }

        console.log("CreateInventory: Fetching user data for wallet:", user.walletId);
        const userDoc = await getDoc(doc(db, "users", user.walletId));
        if (!userDoc.exists()) {
          console.log("CreateInventory: No user found, redirecting to buyer dashboard");
          router.push("/dashboards/buyer");
          return;
        }

        const userData = userDoc.data();
        const role = userData.role || "buyer";
        console.log("CreateInventory: User Role:", role);
        if (role !== "seller") {
          console.log("CreateInventory: User is not a seller, redirecting to buyer dashboard");
          router.push("/dashboards/buyer");
          return;
        }

        // Fetch storeId
        const storeIds = userData.storeIds || [];
        console.log("CreateInventory: Store IDs:", storeIds);
        if (storeIds.length === 0) {
          console.log("CreateInventory: No store found, redirecting to onboarding");
          router.push("/dashboards/onboarding");
          return;
        }
        setStoreId(storeIds[0]);

        // Fetch escrowPublicKey
        const plan = userData.plan || {};
        if (!plan.escrowPublicKey) {
          console.log("CreateInventory: No escrow public key found, redirecting to onboarding");
          router.push("/dashboards/onboarding");
          return;
        }
        setEscrowPublicKey(plan.escrowPublicKey);
        console.log("CreateInventory: Escrow Public Key:", plan.escrowPublicKey);

        // Fetch shipping address for RWI
        const storeDoc = await getDoc(doc(db, "stores", storeIds[0]));
        if (storeDoc.exists()) {
          const storeData = storeDoc.data();
          const shippingAddress = storeData.businessInfo?.shippingAddress || "";
          console.log("CreateInventory: Shipping Address:", shippingAddress);
          setForm((prev) => ({ ...prev, shippingLocation: shippingAddress }));
        }

        setLoading(false);
      } catch (err) {
        console.error("CreateInventory: Error fetching role/store/escrow:", err.message);
        setError(err.message);
        setLoading(false);
      }
    };
    checkRoleAndStore();
  }, [user, router]);

  // Handle file selection
  const handleFileChange = (files) => {
    const selectedFiles = Array.from(files).filter(file =>
      ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
    );
    if (selectedFiles.length + images.length > 3) {
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
      handleFileChange(files);
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

  // Handle variant addition for RWI
  const handleAddVariant = () => {
    if (!variantForm.size || !variantForm.color || !variantForm.quantity || parseInt(variantForm.quantity) < 1) {
      setError("Please fill out all variant fields with a quantity of at least 1.");
      return;
    }
    setInventoryVariants([...inventoryVariants, { ...variantForm }]);
    setVariantForm({ size: "", color: "", quantity: "" });
  };

  // Handle variant removal for RWI
  const handleRemoveVariant = (index) => {
    setInventoryVariants(inventoryVariants.filter((_, i) => i !== index));
  };

  // Handle image removal
  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) {
      setError("Submission in progress, please wait.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    setProcessing(true);

    // Validate common fields
    if (!form.name || !form.description || !form.price || parseFloat(form.price) <= 0 || form.categories.length === 0) {
      setError("Please fill out all required fields with a positive price and select at least one category.");
      setProcessing(false);
      setIsSubmitting(false);
      return;
    }

    // Validate based on inventory type
    if (inventoryType === "digital") {
      if (!form.quantity || parseInt(form.quantity) < 1) {
        setError("Please specify a quantity of at least 1 for digital items.");
        setProcessing(false);
        setIsSubmitting(false);
        return;
      }
    } else if (inventoryType === "rwi") {
      if (!form.shippingLocation) {
        setError("Please fill out the shipping location for RWI.");
        setProcessing(false);
        setIsSubmitting(false);
        return;
      }
      if (inventoryVariants.length === 0) {
        setError("Please add at least one size/color/quantity combination for RWI.");
        setProcessing(false);
        setIsSubmitting(false);
        return;
      }
      // Validate variant fields
      for (const variant of inventoryVariants) {
        if (!variant.size || !variant.color || !variant.quantity || parseInt(variant.quantity) < 1) {
          setError("All RWI variants must have size, color, and a quantity of at least 1.");
          setProcessing(false);
          setIsSubmitting(false);
          return;
        }
      }
    }

    if (images.length === 0) {
      setError("Please upload at least one image.");
      setProcessing(false);
      setIsSubmitting(false);
      return;
    }

    if (!publicKey || !signTransaction) {
      setError("Please connect your Solana wallet.");
      setProcessing(false);
      setIsSubmitting(false);
      return;
    }

    if (!escrowPublicKey) {
      setError("Escrow public key not found. Please complete seller onboarding.");
      setProcessing(false);
      setIsSubmitting(false);
      return;
    }

    try {
      // Generate productId
      const productRef = doc(collection(db, "products"));
      const productId = productRef.id;

      // Calculate total quantity
      const totalQuantity = inventoryType === "rwi"
        ? inventoryVariants.reduce((sum, v) => sum + parseInt(v.quantity), 0)
        : parseInt(form.quantity);

      // Fee structure: 0.003 SOL per item
      const feePerItemSOL = 0.003;
      const f4cetFeeSOL = 0.00299;
      const escrowFeeSOL = 0.00001;
      const totalFeeSOL = feePerItemSOL * totalQuantity;
      const totalF4cetFeeSOL = f4cetFeeSOL * totalQuantity;
      const totalEscrowFeeSOL = escrowFeeSOL * totalQuantity;

      // Create Solana transaction
      const connection = new Connection(process.env.NEXT_PUBLIC_QUICKNODE_RPC, 'confirmed');
      const f4cetsWallet = new PublicKey('2Wij9XGAEpXeTfDN4KB1ryrizicVkUHE1K5dFqMucy53');
      const escrowWallet = new PublicKey(escrowPublicKey);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: f4cetsWallet,
          lamports: Math.floor(totalF4cetFeeSOL * LAMPORTS_PER_SOL),
        }),
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: escrowWallet,
          lamports: Math.floor(totalEscrowFeeSOL * LAMPORTS_PER_SOL),
        })
      );

      // Fetch recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Sign and send transaction
      console.log("CreateInventory: Prompting Solana wallet payment");
      const signedTransaction = await signTransaction(transaction);
      const txSignature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(txSignature, 'confirmed');
      console.log("CreateInventory: Payment confirmed, txSignature:", txSignature);

      // Upload first image to Google Cloud Storage for cNFT metadata
      const firstImage = images[0];
      const formData = new FormData();
      formData.append("image", firstImage);
      formData.append("storeId", storeId);
      formData.append("productId", productId);

      console.log("CreateInventory: Uploading NFT image to API route");
      const uploadResponse = await fetch("https://user.f4cets.market/api/upload-nft-image", {
        method: "POST",
        body: formData,
      });
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(`Failed to upload cNFT image: ${errorData.error || uploadResponse.statusText}`);
      }
      const { url: imageUrl, fileExt } = await uploadResponse.json();
      console.log("CreateInventory: cNFT image uploaded:", imageUrl);

      // Upload remaining images to Firebase Storage
      const imageUrls = await Promise.all(
        images.slice(0, 3).map(async (image, index) => {
          const fileExt = image.name.split('.').pop().toLowerCase();
          const imageRef = ref(storage, `products/${productId}/image${index + 1}.${fileExt}`);
          console.log("CreateInventory: Uploading image to:", imageRef.fullPath);
          await uploadBytes(imageRef, image);
          const url = await getDownloadURL(imageRef);
          console.log("CreateInventory: Image URL:", url);
          return url;
        })
      );

      // Prepare product data
      const productData = {
        type: inventoryType,
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        categories: form.categories,
        imageUrls,
        selectedImage: imageUrls[0],
        storeId,
        sellerId: user.walletId,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (inventoryType === "digital") {
        productData.quantity = parseInt(form.quantity);
      } else if (inventoryType === "rwi") {
        productData.shippingLocation = form.shippingLocation;
        productData.variants = inventoryVariants;
      }

      // Save product to Firestore
      console.log("CreateInventory: Saving product at products/", productId, ":", productData);
      await setDoc(doc(db, "products", productId), productData);

      // Call mintcnfts
      const mintParams = {
        walletAddress: user.walletId,
        storeId,
        productId,
        quantity: totalQuantity,
        name: form.name,
        imageUrl,
        imageExt: fileExt,
        type: inventoryType,
        variants: inventoryType === "rwi" ? inventoryVariants : [],
        feeTxSignature: txSignature,
        treeId: "25a893ed-ac27-4fe6-832e-c8abd627fb14",
      };

      console.log("CreateInventory: Calling mintcnfts with params:", JSON.stringify(mintParams, null, 2));
      const mintResponse = await fetch("https://mintcnfts-232592911911.us-central1.run.app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mintParams),
      });
      if (!mintResponse.ok) {
        const errorData = await mintResponse.json();
        throw new Error(`Failed to mint cNFTs: ${errorData.error || mintResponse.statusText}`);
      }
      const mintedCnfts = await mintResponse.json();
      console.log("CreateInventory: Minted cNFTs response:", JSON.stringify(mintedCnfts, null, 2));

      setSuccess(`Inventory created and ${mintedCnfts.cnfts?.length || 0} cNFTs minted successfully!`);
      setForm({ name: "", description: "", price: "", quantity: "", shippingLocation: "", categories: [] });
      setImages([]);
      setImagePreviews([]);
      setInventoryVariants([]);
      setVariantForm({ size: "", color: "", quantity: "" });
      setTimeout(() => router.push(`/dashboards/seller/inventory/details/${productId}`), 2000);
    } catch (err) {
      console.error("CreateInventory: Error creating inventory:", err);
      setError("Failed to create inventory: " + err.message);
    } finally {
      setProcessing(false);
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push("/dashboards/seller");
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
                  Create New Inventory
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
                <form onSubmit={handleSubmit}>
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
                                "&:hover": { backgroundColor: "rgba(255, 255, 165, 0.1)" },
                                backgroundColor: form.categories.includes(category) ? "rgba(255, 255, 165, 0.15)" : "transparent",
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
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === "" || parseInt(value) >= 1) {
                                  setVariantForm({ ...variantForm, quantity: value });
                                } else {
                                  setVariantForm({ ...variantForm, quantity: "1" });
                                }
                              }}
                              fullWidth
                              min="1"
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
                      onChange={(e) => handleFileChange(e.target.files)}
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
                            onClick={() => handleRemoveImage(index)}
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
                  <MDBox mb={3} display="flex" justifyContent="center">
                    <MDTypography variant="body2" sx={{ color: "#212121" }}>
                      Total Minting Cost: {calculateTotalSolCost()} SOL
                    </MDTypography>
                  </MDBox>
                  <Divider sx={{ mb: 3, backgroundColor: "rgba(0, 0, 0, 0.1)" }} />
                  <MDBox display="flex" justifyContent="center" gap={2}>
                    <MDButton
                      type="submit"
                      color="dark"
                      variant="gradient"
                      disabled={isSubmitting}
                      sx={{ width: { xs: "100%", sm: "auto" } }}
                    >
                      {isSubmitting ? "Creating..." : "Create Inventory"}
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
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={processing}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Footer />
    </DashboardLayout>
  );
}

export default CreateInventory;