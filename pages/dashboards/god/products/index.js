/**
=========================================================
* F4cetPanel - God Products Search and Management Page
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
import { collection, query, where, orderBy, limit, getDocs, startAfter } from "firebase/firestore";
import { db } from "/lib/firebase";

// User context
import { useUser } from "/contexts/UserContext";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
import MDInput from "/components/MDInput";
import MDButton from "/components/MDButton";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";

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

function ProductSearch() {
  const { user } = useUser();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef(null);

  // Fetch products from Firestore with infinite scroll
  const fetchProducts = useCallback(async () => {
    if (!user || !user.walletId || isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const pageSize = 10; // Load 10 products at a time
      let productsQuery = query(
        collection(db, "products"),
        orderBy("name"),
        limit(pageSize)
      );

      if (lastDoc) {
        productsQuery = query(
          collection(db, "products"),
          orderBy("name"),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }

      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })).filter(product => product.name && product.storeId);

      setDisplayedProducts(prev => {
        const newData = [...prev, ...productsData];
        return Array.from(new Map(newData.map(item => [item.id, item])).values());
      });
      setProducts(prev => {
        const newData = [...prev, ...productsData];
        return Array.from(new Map(newData.map(item => [item.id, item])).values());
      });
      setLastDoc(productsSnapshot.docs[productsSnapshot.docs.length - 1]);
      setHasMore(productsSnapshot.docs.length === pageSize);

      console.log("Fetched products:", productsData); // Debugging
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, lastDoc, isLoading, hasMore]);

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchProducts();
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
  }, [hasMore, isLoading, fetchProducts]);

  // Redirect to home if no user, no walletId, or unauthorized role
  useEffect(() => {
    if (!user || !user.walletId || user.role !== "god") {
      router.replace("/");
    }
  }, [user, router]);

  // Filter products by search term
  const filteredProducts = displayedProducts.filter(product =>
    (product.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (product.id?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  // Navigate to create product
  const handleCreateProduct = () => {
    router.push("/dashboards/god/products/edit/new");
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
          <MDTypography variant="h4" sx={{ color: "#fff" }}>
            Product Management
          </MDTypography>
          <motion.div variants={buttonVariants} initial="rest" whileHover="hover">
            <MDButton
              onClick={handleCreateProduct}
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
              <Icon sx={{ mr: 1 }}>add</Icon> Create Product
            </MDButton>
          </motion.div>
        </MDBox>
        <MDBox mb={3} mx="auto" maxWidth="600px">
          <Card
            sx={{
              background: "transparent",
              border: "1px solid rgba(0, 0, 0, 0.12)",
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
              p: 2,
            }}
          >
            <MDInput
              label="Search by Product Name or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              sx={{
                "& .MuiInputBase-root": { transition: "all 0.3s ease" },
                "& .MuiInputBase-input": {
                  padding: { xs: "8px", md: "10px" },
                  color: theme => theme.palette.mode === "dark" ? "#fff" : "#344767",
                },
                "& .MuiInputLabel-root": {
                  color: theme => theme.palette.mode === "dark" ? "#fff" : "#344767",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: theme => theme.palette.mode === "dark" ? "#fff" : "#344767",
                },
                "& .MuiInputBase-input::placeholder": {
                  color: theme => theme.palette.mode === "dark" ? "#bbb" : "#757575",
                  opacity: 1,
                },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: theme => theme.palette.mode === "dark" ? "#fff" : "#bdbdbd",
                  },
                  "&:hover fieldset": {
                    borderColor: theme => theme.palette.mode === "dark" ? "#e0e0e0" : "#3f51b5",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: theme => theme.palette.mode === "dark" ? "#fff" : "#3f51b5",
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
        <Grid container spacing={3}>
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <Grid item xs={12} sm={6} md={4} lg={2} key={product.id}>
                <Link href={`/dashboards/god/products/edit/${product.id}`}>
                  <Card
                    sx={{
                      background: "transparent",
                      border: "1px solid rgba(0, 0, 0, 0.12)",
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
                      sx={{ color: "#fff", mb: 1, fontSize: { xs: "0.9rem", md: "1rem" } }}
                    >
                      {product.name || "Unnamed Product"}
                    </MDTypography>
                    <MDTypography
                      variant="body2"
                      sx={{ color: "#fff", fontSize: { xs: "0.8rem", md: "0.875rem" } }}
                    >
                      Store: {product.storeId || "N/A"}
                    </MDTypography>
                    <MDTypography
                      variant="body2"
                      sx={{ color: "#fff", fontSize: { xs: "0.8rem", md: "0.875rem" } }}
                    >
                      Price: {product.price ? `${product.price} USDC` : "N/A"}
                    </MDTypography>
                    <MDTypography
                      variant="body2"
                      sx={{ color: "#fff", fontSize: { xs: "0.8rem", md: "0.875rem" } }}
                    >
                      Type: {product.type?.toUpperCase() || "UNKNOWN"}
                    </MDTypography>
                  </Card>
                </Link>
              </Grid>
            ))
          ) : (
            <MDBox width="100%" textAlign="center">
              <MDTypography variant="body2" sx={{ color: "#fff" }}>
                No products found.
              </MDTypography>
            </MDBox>
          )}
        </Grid>
        {hasMore && (
          <MDBox ref={loaderRef} textAlign="center" py={2}>
            <MDTypography variant="body2" sx={{ color: "#fff" }}>
              Loading more products...
            </MDTypography>
          </MDBox>
        )}
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default ProductSearch;