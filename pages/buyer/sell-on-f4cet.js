/**
=========================================================
* F4cetPanel - Sell on F4cet Page
=========================================================

* Copyright 2023 F4cets Team
*/

// React imports
import { useState, useEffect, useRef } from "react";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
import MDButton from "/components/MDButton";
import Grid from "@mui/material/Grid";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";

// Background image
import bgImage from "/assets/images/bg1.jpg";

function SellOnF4cet() {
  const [solPrice, setSolPrice] = useState(null);
  const [isPricingVisible, setIsPricingVisible] = useState(false);
  const pricingRef = useRef(null);

  // Fetch SOL price in USD from CoinGecko API
  const fetchSolPrice = async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
      );
      const data = await response.json();
      setSolPrice(data.solana.usd);
    } catch (error) {
      console.error("Error fetching SOL price:", error);
      setSolPrice(0); // Fallback to 0 if API fails
    }
  };

  // Initial fetch and set up Intersection Observer
  useEffect(() => {
    // Initial fetch
    fetchSolPrice();

    // Set up Intersection Observer to detect when pricing section is visible
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsPricingVisible(entry.isIntersecting);
      },
      { threshold: 0.1 } // Trigger when 10% of the section is visible
    );

    if (pricingRef.current) {
      observer.observe(pricingRef.current);
    }

    // Clean up observer on unmount
    return () => {
      if (pricingRef.current) {
        observer.unobserve(pricingRef.current);
      }
    };
  }, []);

  // Set up interval to refresh SOL price every 60 seconds when pricing section is visible
  useEffect(() => {
    let interval;
    if (isPricingVisible) {
      interval = setInterval(() => {
        fetchSolPrice();
      }, 60000); // 60 seconds
    }

    // Clean up interval when section is not visible or on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPricingVisible]);

  // USD prices for the plans
  const monthlyPriceUSD = 10;
  const sixMonthPriceUSD = 55;
  const yearlyPriceUSD = 75;

  // Calculate SOL equivalents (if solPrice is not yet fetched, show "Loading...")
  const monthlyPriceSOL = solPrice ? (monthlyPriceUSD / solPrice).toFixed(4) : "Loading...";
  const sixMonthPriceSOL = solPrice ? (sixMonthPriceUSD / solPrice).toFixed(4) : "Loading...";
  const yearlyPriceSOL = solPrice ? (yearlyPriceUSD / solPrice).toFixed(4) : "Loading...";

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox
        minHeight="100vh"
        sx={{
          background: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${bgImage.src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Hero Section */}
        <MDBox
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="50vh"
          textAlign="center"
          px={3}
          py={6}
        >
          <MDBox>
            <MDTypography variant="h1" color="white" fontWeight="bold" mb={2}>
              Sell Globally with F4cet’s Web3 Platform
            </MDTypography>
            <MDTypography variant="h5" color="white" opacity={0.8} maxWidth="800px" mx="auto">
              Launch your store on a fully decentralized platform. Manage preminted RWA NFTs, leverage blockchain inventory, and accept payments in SOL—all with F4cet.
            </MDTypography>
          </MDBox>
        </MDBox>

        {/* Features Section */}
        <MDBox px={3} py={6} bgColor="grey-100">
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} md={4}>
              <MDBox textAlign="center">
                <MDTypography variant="h4" color="dark" mb={2}>
                  Decentralized Inventory
                </MDTypography>
                <MDTypography variant="body1" color="text">
                  Manage your inventory on the blockchain with preminted RWA NFTs, ensuring transparency and authenticity for every item you sell.
                </MDTypography>
              </MDBox>
            </Grid>
            <Grid item xs={12} md={4}>
              <MDBox textAlign="center">
                <MDTypography variant="h4" color="dark" mb={2}>
                  Escrow Wallet
                </MDTypography>
                <MDTypography variant="body1" color="text">
                  Your seller escrow wallet securely holds your NFT inventory, streamlining sales and ensuring trust in every transaction.
                </MDTypography>
              </MDBox>
            </Grid>
            <Grid item xs={12} md={4}>
              <MDBox textAlign="center">
                <MDTypography variant="h4" color="dark" mb={2}>
                  Web3 Payments
                </MDTypography>
                <MDTypography variant="body1" color="text">
                  Accept payments in SOL with dynamic pricing based on USD, making it easy for buyers worldwide to shop on your store.
                </MDTypography>
              </MDBox>
            </Grid>
          </Grid>
        </MDBox>

        {/* Pricing Section */}
        <MDBox ref={pricingRef} px={3} py={6} textAlign="center">
          <MDTypography variant="h2" color="dark" mb={4}>
            Choose Your Plan
          </MDTypography>
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} sm={6} md={4}>
              <MDBox
                sx={{
                  backgroundColor: "white",
                  padding: 3,
                  borderRadius: 2,
                  boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  "&:hover": {
                    transform: "scale(1.02)",
                    boxShadow: "0px 6px 25px rgba(0, 0, 0, 0.15)",
                  },
                }}
              >
                <MDTypography variant="h4" color="dark" mb={2}>
                  Monthly
                </MDTypography>
                <MDTypography variant="h5" color="dark" mb={1}>
                  ${monthlyPriceUSD} USD
                </MDTypography>
                <MDTypography variant="body1" color="text" mb={2}>
                  {monthlyPriceSOL} SOL
                </MDTypography>
                <MDButton color="dark" variant="gradient" fullWidth disabled>
                  Select Plan
                </MDButton>
              </MDBox>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <MDBox
                sx={{
                  backgroundColor: "white",
                  padding: 3,
                  borderRadius: 2,
                  boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  "&:hover": {
                    transform: "scale(1.02)",
                    boxShadow: "0px 6px 25px rgba(0, 0, 0, 0.15)",
                  },
                }}
              >
                <MDTypography variant="h4" color="dark" mb={2}>
                  6 Months
                </MDTypography>
                <MDTypography variant="h5" color="dark" mb={1}>
                  ${sixMonthPriceUSD} USD
                </MDTypography>
                <MDTypography variant="body1" color="text" mb={2}>
                  {sixMonthPriceSOL} SOL
                </MDTypography>
                <MDButton color="dark" variant="gradient" fullWidth disabled>
                  Select Plan
                </MDButton>
              </MDBox>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <MDBox
                sx={{
                  backgroundColor: "white",
                  padding: 3,
                  borderRadius: 2,
                  boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  "&:hover": {
                    transform: "scale(1.02)",
                    boxShadow: "0px 6px 25px rgba(0, 0, 0, 0.15)",
                  },
                }}
              >
                <MDTypography variant="h4" color="dark" mb={2}>
                  Yearly
                </MDTypography>
                <MDTypography variant="h5" color="dark" mb={1}>
                  ${yearlyPriceUSD} USD
                </MDTypography>
                <MDTypography variant="body1" color="text" mb={2}>
                  {yearlyPriceSOL} SOL
                </MDTypography>
                <MDButton color="dark" variant="gradient" fullWidth disabled>
                  Select Plan
                </MDButton>
              </MDBox>
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default SellOnF4cet;