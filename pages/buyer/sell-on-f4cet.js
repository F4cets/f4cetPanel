/**
=========================================================
* F4cetPanel - Sell on F4cet Page
=========================================================

* Copyright 2023 F4cets Team
*/

// React imports
import { useState, useEffect, useRef } from "react";

// @mui material components
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

// Framer Motion for animations
import { motion } from "framer-motion";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
import MDButton from "/components/MDButton";

// NextJS Material Dashboard 2 PRO context
import { useMaterialUIController } from "/context";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";

// Background image
import bgImage from "/assets/images/bg1.jpg";

function SellOnF4cet() {
  const [solPrice, setSolPrice] = useState(null);
  const [isPricingVisible, setIsPricingVisible] = useState(false);
  const [expanded, setExpanded] = useState(false); // For FAQ accordion
  const pricingRef = useRef(null);
  const [controller] = useMaterialUIController();
  const { darkMode } = controller;

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
    fetchSolPrice();

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsPricingVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (pricingRef.current) {
      observer.observe(pricingRef.current);
    }

    return () => {
      if (pricingRef.current) {
        observer.unobserve(pricingRef.current);
      }
    };
  }, []);

  // Refresh SOL price every 60 seconds when pricing section is visible
  useEffect(() => {
    let interval;
    if (isPricingVisible) {
      interval = setInterval(() => {
        fetchSolPrice();
      }, 60000);
    }

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

  // Calculate SOL equivalents
  const monthlyPriceSOL = solPrice ? (monthlyPriceUSD / solPrice).toFixed(4) : "Loading...";
  const sixMonthPriceSOL = solPrice ? (sixMonthPriceUSD / solPrice).toFixed(4) : "Loading...";
  const yearlyPriceSOL = solPrice ? (yearlyPriceUSD / solPrice).toFixed(4) : "Loading...";

  // Animation variants for pricing cards
  const cardVariants = {
    rest: {
      scale: 1,
      rotate: 0,
      transition: { duration: 0.3 },
    },
    hover: {
      scale: 1.05,
      rotate: [0, 5, -5, 5, 0],
      transition: {
        scale: { duration: 0.2 },
        rotate: { repeat: 1, duration: 0.5 },
      },
    },
  };

  // Handle FAQ accordion expansion
  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

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
          sx={{
            borderRadius: "16px",
            mx: { xs: 2, md: 4 },
          }}
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
        <MDBox px={3} py={6} bgColor="grey-100" sx={{ borderRadius: "16px", mx: { xs: 2, md: 4 } }}>
          <Container>
            <Grid container spacing={4} justifyContent="center">
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    boxShadow: "0px 5px 20px rgba(0, 0, 0, 0.1)",
                    borderRadius: "12px",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.15)",
                    },
                  }}
                >
                  <MDBox p={3} textAlign="center">
                    <MDTypography variant="h4" color={darkMode ? "white" : "dark"} mb={2}>
                      Decentralized Inventory
                    </MDTypography>
                    <MDTypography variant="body1" color={darkMode ? "white" : "text"}>
                      Manage your inventory on the blockchain with preminted RWA NFTs, ensuring transparency and authenticity for every item you sell.
                    </MDTypography>
                  </MDBox>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    boxShadow: "0px 5px 20px rgba(0, 0, 0, 0.1)",
                    borderRadius: "12px",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.15)",
                    },
                  }}
                >
                  <MDBox p={3} textAlign="center">
                    <MDTypography variant="h4" color={darkMode ? "white" : "dark"} mb={2}>
                      Escrow Wallet
                    </MDTypography>
                    <MDTypography variant="body1" color={darkMode ? "white" : "text"}>
                      Your seller escrow wallet securely holds your NFT inventory, streamlining sales and ensuring trust in every transaction.
                    </MDTypography>
                  </MDBox>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    boxShadow: "0px 5px 20px rgba(0, 0, 0, 0.1)",
                    borderRadius: "12px",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.15)",
                    },
                  }}
                >
                  <MDBox p={3} textAlign="center">
                    <MDTypography variant="h4" color={darkMode ? "white" : "dark"} mb={2}>
                      Web3 Payments
                    </MDTypography>
                    <MDTypography variant="body1" color={darkMode ? "white" : "text"}>
                      Accept payments in SOL with dynamic pricing based on USD, making it easy for buyers worldwide to shop on your store.
                    </MDTypography>
                  </MDBox>
                </Card>
              </Grid>
            </Grid>
          </Container>
        </MDBox>

        {/* Pricing Section */}
        <MDBox ref={pricingRef} py={6} bgColor="grey-100" sx={{ borderRadius: "16px", mx: { xs: 2, md: 4 } }}>
          <Container>
            <MDBox textAlign="center" mb={6}>
              <MDTypography variant="h2" color={darkMode ? "white" : "dark"} mb={2}>
                Choose Your Plan
              </MDTypography>
              <MDTypography variant="body1" color={darkMode ? "white" : "text"} maxWidth="800px" mx="auto">
                Start selling on F4cet with a plan that suits your needs. Pay in SOL with dynamic pricing based on USD.
              </MDTypography>
            </MDBox>
            <Grid container spacing={3} justifyContent="center">
              <Grid item xs={12} sm={6} lg={4}>
                <motion.div variants={cardVariants} initial="rest" whileHover="hover">
                  <Card
                    sx={{
                      boxShadow: "0px 5px 20px rgba(0, 0, 0, 0.1)",
                      borderRadius: "12px",
                      backgroundColor: darkMode ? "#42424a" : "#f8f9fa", // Light gray in light mode, dark gray in dark mode
                    }}
                  >
                    <MDBox
                      bgColor="info"
                      color="white"
                      textAlign="center"
                      py={1}
                      borderRadius="12px 12px 0 0"
                    >
                      <MDTypography variant="h6" color="white">
                        Monthly
                      </MDTypography>
                    </MDBox>
                    <MDBox p={3} textAlign="center">
                      <MDTypography variant="h4" color={darkMode ? "white" : "dark"} mb={1}>
                        ${monthlyPriceUSD}
                      </MDTypography>
                      <MDTypography variant="body2" color={darkMode ? "white" : "text"} mb={2}>
                        {monthlyPriceSOL} SOL
                      </MDTypography>
                      <MDTypography variant="body2" color={darkMode ? "white" : "text"} mb={3}>
                        Perfect for trying out F4cet. Pay month-to-month and cancel anytime.
                      </MDTypography>
                      <MDButton color="dark" variant="gradient" fullWidth disabled>
                        Select Plan
                      </MDButton>
                    </MDBox>
                  </Card>
                </motion.div>
              </Grid>
              <Grid item xs={12} sm={6} lg={4}>
                <motion.div variants={cardVariants} initial="rest" whileHover="hover">
                  <Card
                    sx={{
                      boxShadow: "0px 5px 20px rgba(0, 0, 0, 0.1)",
                      borderRadius: "12px",
                      backgroundColor: darkMode ? "#323a54" : "#dee2e6", // Medium gray in light mode, darker gray in dark mode
                    }}
                  >
                    <MDBox
                      bgColor="success"
                      color="white"
                      textAlign="center"
                      py={1}
                      borderRadius="12px 12px 0 0"
                    >
                      <MDTypography variant="h6" color="white">
                        6 Months
                      </MDTypography>
                    </MDBox>
                    <MDBox p={3} textAlign="center">
                      <MDTypography variant="h4" color={darkMode ? "white" : "dark"} mb={1}>
                        ${sixMonthPriceUSD}
                      </MDTypography>
                      <MDTypography variant="body2" color={darkMode ? "white" : "text"} mb={2}>
                        {sixMonthPriceSOL} SOL
                      </MDTypography>
                      <MDTypography variant="body2" color={darkMode ? "white" : "text"} mb={3}>
                        Save more with a 6-month plan. Ideal for growing your Web3 store.
                      </MDTypography>
                      <MDButton color="dark" variant="gradient" fullWidth disabled>
                        Select Plan
                      </MDButton>
                    </MDBox>
                  </Card>
                </motion.div>
              </Grid>
              <Grid item xs={12} sm={6} lg={4}>
                <motion.div variants={cardVariants} initial="rest" whileHover="hover">
                  <Card
                    sx={{
                      boxShadow: "0px 5px 20px rgba(0, 0, 0, 0.1)",
                      borderRadius: "12px",
                      backgroundColor: darkMode ? "#1a2035" : "#ced4da", // Dark gray in light mode, darkest gray in dark mode
                    }}
                  >
                    <MDBox
                      bgColor="error"
                      color="white"
                      textAlign="center"
                      py={1}
                      borderRadius="12px 12px 0 0"
                    >
                      <MDTypography variant="h6" color="white">
                        Yearly
                      </MDTypography>
                    </MDBox>
                    <MDBox p={3} textAlign="center">
                      <MDTypography variant="h4" color={darkMode ? "white" : "dark"} mb={1}>
                        ${yearlyPriceUSD}
                      </MDTypography>
                      <MDTypography variant="body2" color={darkMode ? "white" : "text"} mb={2}>
                        {yearlyPriceSOL} SOL
                      </MDTypography>
                      <MDTypography variant="body2" color={darkMode ? "white" : "text"} mb={3}>
                        Best value for long-term sellers. Get a full year of F4cet benefits.
                      </MDTypography>
                      <MDButton color="dark" variant="gradient" fullWidth disabled>
                        Select Plan
                      </MDButton>
                    </MDBox>
                  </Card>
                </motion.div>
              </Grid>
            </Grid>
          </Container>
        </MDBox>

        {/* Trusted Brands Section */}
        <MDBox py={6} bgColor="grey-100" sx={{ borderRadius: "16px", mx: { xs: 2, md: 4 } }}>
          <Container>
            <MDBox textAlign="center" mb={4}>
              <MDTypography variant="body2" color={darkMode ? "white" : "text"} fontWeight="medium">
                Trusted by Web3 Innovators
              </MDTypography>
            </MDBox>
            <Grid container spacing={3} justifyContent="center" alignItems="center">
              <Grid item xs={6} sm={4} md={2}>
                <MDBox component="img" src="/assets/images/brand1.png" alt="Brand 1" width="100%" opacity={0.6} />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <MDBox component="img" src="/assets/images/brand2.png" alt="Brand 2" width="100%" opacity={0.6} />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <MDBox component="img" src="/assets/images/brand3.png" alt="Brand 3" width="100%" opacity={0.6} />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <MDBox component="img" src="/assets/images/brand4.png" alt="Brand 4" width="100%" opacity={0.6} />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <MDBox component="img" src="/assets/images/brand5.png" alt="Brand 5" width="100%" opacity={0.6} />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <MDBox component="img" src="/assets/images/brand6.png" alt="Brand 6" width="100%" opacity={0.6} />
              </Grid>
            </Grid>
          </Container>
        </MDBox>

        {/* FAQ Section */}
        <MDBox py={6} pb={10} bgColor="grey-100" sx={{ borderRadius: "16px", mx: { xs: 2, md: 4 } }}>
          <Container>
            <MDBox textAlign="center" mb={6}>
              <MDTypography variant="h2" color={darkMode ? "white" : "dark"} mb={2}>
                Frequently Asked Questions
              </MDTypography>
              <MDTypography variant="body1" color={darkMode ? "white" : "text"} maxWidth="800px" mx="auto">
                Everything you need to know about selling on F4cet’s Web3 platform.
              </MDTypography>
            </MDBox>
            <MDBox>
              <Accordion
                expanded={expanded === "panel1"}
                onChange={handleChange("panel1")}
                sx={{
                  borderRadius: "8px",
                  mb: 2,
                  boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.1)",
                  backgroundColor: darkMode ? "#42424a" : "white",
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <MDTypography variant="h6" color={darkMode ? "white" : "dark"}>
                    What is F4cet’s Web3 platform?
                  </MDTypography>
                </AccordionSummary>
                <AccordionDetails>
                  <MDTypography variant="body2" color={darkMode ? "white" : "text"}>
                    F4cet is a fully decentralized marketplace where you can sell using blockchain technology. Your inventory is managed as preminted RWA NFTs, and payments are accepted in SOL.
                  </MDTypography>
                </AccordionDetails>
              </Accordion>
              <Accordion
                expanded={expanded === "panel2"}
                onChange={handleChange("panel2")}
                sx={{
                  borderRadius: "8px",
                  mb: 2,
                  boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.1)",
                  backgroundColor: darkMode ? "#42424a" : "white",
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <MDTypography variant="h6" color={darkMode ? "white" : "dark"}>
                    How does the escrow wallet work?
                  </MDTypography>
                </AccordionSummary>
                <AccordionDetails>
                  <MDTypography variant="body2" color={darkMode ? "white" : "text"}>
                    When you sign up, F4cet creates an escrow wallet to securely hold your NFT inventory. This ensures trust and transparency in every transaction.
                  </MDTypography>
                </AccordionDetails>
              </Accordion>
              <Accordion
                expanded={expanded === "panel3"}
                onChange={handleChange("panel3")}
                sx={{
                  borderRadius: "8px",
                  mb: 2,
                  boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.1)",
                  backgroundColor: darkMode ? "#42424a" : "white",
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <MDTypography variant="h6" color={darkMode ? "white" : "dark"}>
                    Can I cancel my plan anytime?
                  </MDTypography>
                </AccordionSummary>
                <AccordionDetails>
                  <MDTypography variant="body2" color={darkMode ? "white" : "text"}>
                    Yes, the monthly plan allows you to cancel anytime. For 6-month and yearly plans, you’ll need to contact support to discuss cancellation options.
                  </MDTypography>
                </AccordionDetails>
              </Accordion>
              <Accordion
                expanded={expanded === "panel4"}
                onChange={handleChange("panel4")}
                sx={{
                  borderRadius: "8px",
                  mb: 2,
                  boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.1)",
                  backgroundColor: darkMode ? "#42424a" : "white",
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <MDTypography variant="h6" color={darkMode ? "white" : "dark"}>
                    What happens after I choose a plan?
                  </MDTypography>
                </AccordionSummary>
                <AccordionDetails>
                  <MDTypography variant="body2" color={darkMode ? "white" : "text"}>
                    Once you select a plan and pay in SOL, F4cet will set up your seller admin panel, create your escrow wallet, and guide you through building your store and adding inventory.
                  </MDTypography>
                </AccordionDetails>
              </Accordion>
            </MDBox>
          </Container>
        </MDBox>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default SellOnF4cet;