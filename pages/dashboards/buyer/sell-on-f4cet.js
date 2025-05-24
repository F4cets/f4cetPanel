/**
=========================================================
* F4cetPanel - Sell on F4cet Page
=========================================================

* Copyright 2023 F4cets Team
*/

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useUser } from "/contexts/UserContext";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "/lib/firebase";
import { motion, useAnimation } from "framer-motion";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
import MDButton from "/components/MDButton";
import { useMaterialUIController } from "/context";
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Image from "next/image";
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { fetchSolPrice } from "/lib/getSolPrice";

function SellOnF4cet() {
  const { user } = useUser();
  const router = useRouter();
  const [solPrice, setSolPrice] = useState(null);
  const [isPricingVisible, setIsPricingVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastSeverity, setToastSeverity] = useState("success");
  const pricingRef = useRef(null);
  const [controller] = useMaterialUIController();
  const { darkMode } = controller;
  const { publicKey, signTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  // Animation controls
  const monthlyPriceControls = useAnimation();
  const sixMonthPriceControls = useAnimation();
  const yearlyPriceControls = useAnimation();
  const featureCardControls = useAnimation();

  // Flash and pop animation for price updates
  const flashVariant = {
    flash: {
      color: darkMode ? ["#bcd2d0", "#6FCB9F", "#bcd2d0"] : ["#212121", "#6FCB9F", "#212121"],
      scale: [1, 1.1, 1],
      transition: { duration: 0.8, ease: "easeInOut" }
    }
  };

  // Section slide-in animation
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  // Card grow-shrink animation
  const cardVariants = {
    rest: { scale: 1, rotate: 0, boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.15)" },
    hover: {
      scale: 1.05,
      rotate: [0, 5, -5, 5, 0],
      boxShadow: "0px 12px 36px rgba(0, 0, 0, 0.25)",
      transition: { duration: 0.5, rotate: { repeat: 1, duration: 0.5 } },
    },
    animate: {
      scale: [1, 1.05, 1],
      transition: { duration: 36, repeat: Infinity, ease: "easeInOut" },
    },
  };

  // FAQ pop animation
  const faqVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
  };

  // Logo float animation
  const logoVariants = {
    rest: { y: 0, scale: 1 },
    animate: {
      y: [0, -10, 0],
      scale: [1, 1.02, 1],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
    },
  };

  // Start feature card animation
  useEffect(() => {
    featureCardControls.start("animate");
  }, [featureCardControls]);

  // Fetch SOL price with debugging
  const fetchPrice = async () => {
    console.log('SellOnF4cet: Attempting to fetch SOL price');
    try {
      const price = await fetchSolPrice();
      console.log(`SellOnF4cet: Setting solPrice to ${price}`);
      setSolPrice(price);
    } catch (error) {
      console.error('SellOnF4cet: Error fetching SOL price:', error);
      setSolPrice(200); // Fallback
    }
  };

  // Intersection Observer for pricing visibility
  useEffect(() => {
    console.log('SellOnF4cet: Setting up Intersection Observer');
    fetchPrice();
    const observer = new IntersectionObserver(
      ([entry]) => {
        console.log(`SellOnF4cet: Pricing section visible: ${entry.isIntersecting}`);
        setIsPricingVisible(entry.isIntersecting);
      },
      { threshold: 0.1 } // Trigger when 10% of section is visible
    );
    const pricingElement = pricingRef.current;
    if (pricingElement) {
      observer.observe(pricingElement);
      console.log('SellOnF4cet: Observer attached to pricingRef');
    }
    return () => {
      if (pricingElement) {
        observer.unobserve(pricingElement);
        console.log('SellOnF4cet: Observer detached');
      }
    };
  }, []);

  // Refresh SOL price every 15 seconds when visible
  useEffect(() => {
    console.log(`SellOnF4cet: isPricingVisible changed to ${isPricingVisible}`);
    let interval;
    if (isPricingVisible) {
      console.log('SellOnF4cet: Starting 15-second price refresh interval');
      interval = setInterval(() => {
        console.log('SellOnF4cet: Triggering price refresh');
        fetchPrice();
      }, 15000);
    }
    return () => {
      if (interval) {
        console.log('SellOnF4cet: Clearing price refresh interval');
        clearInterval(interval);
      }
    };
  }, [isPricingVisible]);

  // Trigger flash animation on price update
  useEffect(() => {
    if (solPrice !== null) {
      console.log(`SellOnF4cet: solPrice updated to ${solPrice}, triggering animations`);
      monthlyPriceControls.start("flash");
      sixMonthPriceControls.start("flash");
      yearlyPriceControls.start("flash");
    }
  }, [solPrice, monthlyPriceControls, sixMonthPriceControls, yearlyPriceControls]);

  // Handle plan selection and payment
  const handleSelectPlan = async (planType) => {
    if (!publicKey || !signTransaction) {
      setToastMessage("Please connect your wallet to proceed.");
      setToastSeverity("error");
      setToastOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const planDetails = {
        monthly: { usd: 10, durationDays: 30 },
        sixMonth: { usd: 55, durationDays: 180 },
        yearly: { usd: 75, durationDays: 365 },
      }[planType];

      if (!solPrice) {
        throw new Error("SOL price not available");
      }

      // Calculate dynamic SOL amount based on USD price
      const amountSol = (planDetails.usd / solPrice).toFixed(8);
      console.log(`SellOnF4cet: Selected ${planType} plan, amount: ${amountSol} SOL`);

      // Check if user already has an escrow wallet
      const userDocRef = doc(db, "users", user.walletId);
      const userDoc = await getDoc(userDocRef);
      let escrowPublicKey = userDoc.exists() && userDoc.data().plan?.escrowPublicKey;

      if (!escrowPublicKey) {
        console.log('SellOnF4cet: Creating seller payment transaction');
        // Call Cloud Run function
        const response = await fetch('https://create-seller-payment-232592911911.us-central1.run.app/createSellerPayment', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Origin': 'https://user.f4cets.market'
          },
          body: JSON.stringify({
            walletAddress: publicKey.toBase58(),
            amountSol,
            planType,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to create payment transaction');
        }

        const { transaction, lastValidBlockHeight, escrowPublicKey: newEscrowPublicKey } = result;
        escrowPublicKey = newEscrowPublicKey;
        console.log(`SellOnF4cet: Received escrowPublicKey: ${escrowPublicKey}`);

        if (!process.env.NEXT_PUBLIC_QUICKNODE_RPC) {
          throw new Error('NEXT_PUBLIC_QUICKNODE_RPC environment variable not set');
        }

        console.log('SellOnF4cet: Signing and sending transaction');
        const connection = new Connection(process.env.NEXT_PUBLIC_QUICKNODE_RPC, 'confirmed');
        const tx = Transaction.from(Buffer.from(transaction, 'base64'));
        const signedTx = await signTransaction(tx);
        const signature = await connection.sendRawTransaction(signedTx.serialize());

        // Track transaction
        console.log(`SellOnF4cet: Transaction signature: ${signature}`);
        const { blockhash } = await connection.getLatestBlockhash();
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        });

        if (confirmation.value.err) {
          throw new Error('Transaction failed');
        }

        // Update Firestore with escrow public key
        console.log('SellOnF4cet: Updating Firestore with plan details');
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + planDetails.durationDays);
        await setDoc(userDocRef, {
          role: "seller",
          plan: {
            type: planType,
            expiry: expiry.toISOString(),
            paymentSignature: signature,
            escrowPublicKey,
          },
        }, { merge: true });

        setToastMessage(`Successfully subscribed to ${planType} plan! Seller dashboard activated.`);
        setToastSeverity("success");
        setToastOpen(true);
        router.reload();
      } else {
        setToastMessage(`You are already a seller with an escrow wallet.`);
        setToastSeverity("info");
        setToastOpen(true);
      }
    } catch (error) {
      console.error("SellOnF4cet: Error processing payment:", error);
      setToastMessage(`Payment failed: ${error.message}`);
      setToastSeverity("error");
      setToastOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle toast close
  const handleToastClose = () => setToastOpen(false);

  // Pricing data
  const monthlyPriceUSD = 10;
  const sixMonthPriceUSD = 55;
  const yearlyPriceUSD = 75;
  const monthlyPriceSOL = solPrice ? (monthlyPriceUSD / solPrice).toFixed(4) : "Loading...";
  const sixMonthPriceSOL = solPrice ? (sixMonthPriceUSD / solPrice).toFixed(4) : "Loading...";
  const yearlyPriceSOL = solPrice ? (yearlyPriceUSD / solPrice).toFixed(4) : "Loading...";

  // Handle FAQ accordion
  const handleChange = (panel) => (event, isExpanded) => setExpanded(isExpanded ? panel : false);

  // Redirect if no user
  useEffect(() => {
    if (!user || !user.walletId) router.replace("/");
  }, [user, router]);

  if (!user || !user.walletId) return null;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox minHeight="100vh" pb={12}>
        <Container>
          <MDBox py={3} px={{ xs: 1, sm: 2, md: 3 }}>
            {/* Hero Section */}
            <motion.div initial="hidden" animate="visible" variants={sectionVariants}>
              <MDBox
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="50vh"
                textAlign="center"
                px={3}
                py={8}
                sx={{
                  background: "linear-gradient(135deg, #4d455d 0%, #f96161 100%)",
                  borderRadius: "16px",
                  boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.3)",
                  overflow: "hidden",
                  position: "relative",
                  "&:before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "linear-gradient(to right, rgba(77, 69, 93, 0.3), transparent)",
                    pointerEvents: "none",
                  },
                }}
              >
                <MDBox>
                  <motion.div variants={logoVariants} initial="rest" animate="animate">
                    <Image
                      src="/assets/images/f4cets.png"
                      alt="F4cets Logo"
                      width={250}
                      height={250}
                      style={{
                        filter: "drop-shadow(0px 6px 18px rgba(0, 0, 0, 0.5))",
                        marginBottom: "1.5rem",
                      }}
                    />
                  </motion.div>
                  <MDTypography
                    variant="h1"
                    sx={{
                      color: "#f7f2e9",
                      fontFamily: "'Quicksand', sans-serif",
                      fontWeight: 700,
                      mb: 2,
                      fontSize: { xs: "2.5rem", md: "4.5rem" },
                    }}
                  >
                    Where Crypto Meets Commerce
                  </MDTypography>
                  <MDTypography
                    variant="h5"
                    sx={{
                      color: "#bcd2d0",
                      fontFamily: "'Quicksand', sans-serif",
                      maxWidth: "800px",
                      mx: "auto",
                    }}
                  >
                    Build your Web3 store with RWA NFTs, blockchain inventory, and SOL payments.
                  </MDTypography>
                </MDBox>
              </MDBox>
            </motion.div>

            {/* Features Section */}
            <motion.div initial="hidden" animate="visible" variants={sectionVariants}>
              <MDBox py={8}>
                <Grid container spacing={4} justifyContent="center">
                  {[
                    {
                      title: "Decentralized Inventory",
                      desc: "Manage blockchain-based RWA NFTs for transparent inventory.",
                    },
                    {
                      title: "Escrow Wallet",
                      desc: "Securely hold NFTs in your escrow wallet for trusted transactions.",
                    },
                    {
                      title: "Web3 Payments",
                      desc: "Accept SOL payments with dynamic USD-based pricing.",
                    },
                  ].map((feature, index) => (
                    <Grid item xs={12} md={4} key={index}>
                      <motion.div
                        variants={cardVariants}
                        initial="rest"
                        whileHover="hover"
                        animate={featureCardControls}
                      >
                        <Card
                          sx={{
                            background: darkMode
                              ? "linear-gradient(to right, #4d455d, rgba(77, 69, 93, 0))"
                              : "linear-gradient(to right, #f9bfcc, rgba(249, 191, 204, 0))",
                            backdropFilter: "blur(12px)",
                            borderRadius: "16px",
                            p: 3,
                            textAlign: "center",
                            boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.2)",
                          }}
                        >
                          <MDTypography
                            variant="h4"
                            sx={{
                              color: darkMode ? "#bcd2d0" : "#212121",
                              fontFamily: "'Quicksand', sans-serif",
                              mb: 2,
                            }}
                          >
                            {feature.title}
                          </MDTypography>
                          <MDTypography
                            variant="body1"
                            sx={{
                              color: darkMode ? "#f7f2e9" : "#212121",
                              fontFamily: "'Quicksand', sans-serif",
                            }}
                          >
                            {feature.desc}
                          </MDTypography>
                        </Card>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </MDBox>
            </motion.div>

            {/* Pricing Section */}
            <motion.div initial="hidden" animate="visible" variants={sectionVariants}>
              <MDBox ref={pricingRef} py={8}>
                <MDBox textAlign="center" mb={6}>
                  <MDTypography
                    variant="h2"
                    sx={{
                      color: darkMode ? "#f7f2e9" : "#212121",
                      fontFamily: "'Quicksand', sans-serif",
                      fontWeight: 700,
                      mb: 2,
                    }}
                  >
                    Choose Your Plan
                  </MDTypography>
                  <MDTypography
                    variant="body1"
                    sx={{
                      color: darkMode ? "#bcd2d0" : "#212121",
                      fontFamily: "'Quicksand', sans-serif",
                      maxWidth: "800px",
                      mx: "auto",
                    }}
                  >
                    Start selling with a plan tailored to your needs, payable in SOL.
                  </MDTypography>
                </MDBox>
                <Grid container spacing={3} justifyContent="center">
                  <Grid item xs={12} sm={6} lg={4}>
                    <motion.div variants={cardVariants} initial="rest" whileHover="hover">
                      <Card
                        sx={{
                          background: darkMode
                            ? "linear-gradient(to right, #4d455d, rgba(77, 69, 93, 0))"
                            : "linear-gradient(to right, #f9bfcc, rgba(249, 191, 204, 0))",
                          backdropFilter: "blur(12px)",
                          borderRadius: "16px",
                          overflow: "hidden",
                          boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.2)",
                        }}
                      >
                        <MDBox
                          sx={{
                            background: darkMode ? "#4d455d" : "#f9bfcc",
                            color: "#f7f2e9",
                            textAlign: "center",
                            py: 2,
                          }}
                        >
                          <MDTypography
                            variant="h6"
                            sx={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600 }}
                          >
                            Monthly
                          </MDTypography>
                        </MDBox>
                        <MDBox p={3} textAlign="center">
                          <MDTypography
                            variant="h4"
                            sx={{
                              color: darkMode ? "#f7f2e9" : "#212121",
                              fontFamily: "'Quicksand', sans-serif",
                              mb: 1,
                            }}
                          >
                            ${monthlyPriceUSD}
                          </MDTypography>
                          <motion.div animate={monthlyPriceControls} variants={flashVariant}>
                            <MDTypography
                              variant="body2"
                              sx={{
                                fontFamily: "'Quicksand', sans-serif",
                                mb: 2,
                              }}
                            >
                              {monthlyPriceSOL} SOL
                            </MDTypography>
                          </motion.div>
                          <MDTypography
                            variant="body2"
                            sx={{
                              color: darkMode ? "#f7f2e9" : "#212121",
                              fontFamily: "'Quicksand', sans-serif",
                              mb: 3,
                            }}
                          >
                            Flexible plan with month-to-month billing.
                          </MDTypography>
                          <MDButton
                            color="dark"
                            variant="gradient"
                            fullWidth
                            onClick={() => handleSelectPlan('monthly')}
                            disabled={isLoading}
                          >
                            {isLoading ? "Processing..." : "Select Plan"}
                          </MDButton>
                        </MDBox>
                      </Card>
                    </motion.div>
                  </Grid>
                  <Grid item xs={12} sm={6} lg={4}>
                    <motion.div variants={cardVariants} initial="rest" whileHover="hover">
                      <Card
                        sx={{
                          background: darkMode
                            ? "linear-gradient(to right, #4d455d, rgba(77, 69, 93, 0))"
                            : "linear-gradient(to right, #bcd2d0, rgba(188, 210, 208, 0))",
                          backdropFilter: "blur(12px)",
                          borderRadius: "16px",
                          overflow: "hidden",
                          boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.2)",
                        }}
                      >
                        <MDBox
                          sx={{
                            background: darkMode ? "#4d455d" : "#bcd2d0",
                            color: "#f7f2e9",
                            textAlign: "center",
                            py: 2,
                          }}
                        >
                          <MDTypography
                            variant="h6"
                            sx={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600 }}
                          >
                            6 Months
                          </MDTypography>
                        </MDBox>
                        <MDBox p={3} textAlign="center">
                          <MDTypography
                            variant="h4"
                            sx={{
                              color: darkMode ? "#f7f2e9" : "#212121",
                              fontFamily: "'Quicksand', sans-serif",
                              mb: 1,
                            }}
                          >
                            ${sixMonthPriceUSD}
                          </MDTypography>
                          <motion.div animate={sixMonthPriceControls} variants={flashVariant}>
                            <MDTypography
                              variant="body2"
                              sx={{
                                fontFamily: "'Quicksand', sans-serif",
                                mb: 2,
                              }}
                            >
                              {sixMonthPriceSOL} SOL
                            </MDTypography>
                          </motion.div>
                          <MDTypography
                            variant="body2"
                            sx={{
                              color: darkMode ? "#f7f2e9" : "#212121",
                              fontFamily: "'Quicksand', sans-serif",
                              mb: 3,
                            }}
                          >
                            Save more with a 6-month commitment.
                          </MDTypography>
                          <MDButton
                            color="dark"
                            variant="gradient"
                            fullWidth
                            onClick={() => handleSelectPlan('sixMonth')}
                            disabled={isLoading}
                          >
                            {isLoading ? "Processing..." : "Select Plan"}
                          </MDButton>
                        </MDBox>
                      </Card>
                    </motion.div>
                  </Grid>
                  <Grid item xs={12} sm={6} lg={4}>
                    <motion.div variants={cardVariants} initial="rest" whileHover="hover">
                      <Card
                        sx={{
                          background: darkMode
                            ? "linear-gradient(to right, #4d455d, rgba(77, 69, 93, 0))"
                            : "linear-gradient(to right, #f96161, rgba(249, 97, 97, 0))",
                          backdropFilter: "blur(12px)",
                          borderRadius: "16px",
                          overflow: "hidden",
                          boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.2)",
                        }}
                      >
                        <MDBox
                          sx={{
                            background: darkMode ? "#4d455d" : "#f96161",
                            color: "#f7f2e9",
                            textAlign: "center",
                            py: 2,
                          }}
                        >
                          <MDTypography
                            variant="h6"
                            sx={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600 }}
                          >
                            Yearly
                          </MDTypography>
                        </MDBox>
                        <MDBox p={3} textAlign="center">
                          <MDTypography
                            variant="h4"
                            sx={{
                              color: darkMode ? "#f7f2e9" : "#212121",
                              fontFamily: "'Quicksand', sans-serif",
                              mb: 1,
                            }}
                          >
                            ${yearlyPriceUSD}
                          </MDTypography>
                          <motion.div animate={yearlyPriceControls} variants={flashVariant}>
                            <MDTypography
                              variant="body2"
                              sx={{
                                fontFamily: "'Quicksand', sans-serif",
                                mb: 2,
                              }}
                            >
                              {yearlyPriceSOL} SOL
                            </MDTypography>
                          </motion.div>
                          <MDTypography
                            variant="body2"
                            sx={{
                              color: darkMode ? "#f7f2e9" : "#212121",
                              fontFamily: "'Quicksand', sans-serif",
                              mb: 3,
                            }}
                          >
                            Best value for committed sellers.
                          </MDTypography>
                          <MDButton
                            color="dark"
                            variant="gradient"
                            fullWidth
                            onClick={() => handleSelectPlan('yearly')}
                            disabled={isLoading}
                          >
                            {isLoading ? "Processing..." : "Select Plan"}
                          </MDButton>
                        </MDBox>
                      </Card>
                    </motion.div>
                  </Grid>
                </Grid>
              </MDBox>
            </motion.div>

            {/* FAQ Section */}
            <motion.div initial="hidden" animate="visible" variants={sectionVariants}>
              <MDBox py={8} pb={16}>
                <MDBox textAlign="center" mb={6}>
                  <MDTypography
                    variant="h2"
                    sx={{
                      color: darkMode ? "#f7f2e9" : "#212121",
                      fontFamily: "'Quicksand', sans-serif",
                      fontWeight: 700,
                      mb: 2,
                    }}
                  >
                    Frequently Asked Questions
                  </MDTypography>
                  <MDTypography
                    variant="body1"
                    sx={{
                      color: darkMode ? "#bcd2d0" : "#212121",
                      fontFamily: "'Quicksand', sans-serif",
                      maxWidth: "800px",
                      mx: "auto",
                    }}
                  >
                    Everything you need to know about selling on F4cet.
                  </MDTypography>
                </MDBox>
                <MDBox>
                  {[
                    {
                      q: "What is F4cet’s Web3 platform?",
                      a: "A decentralized marketplace using blockchain for NFT inventory and SOL payments.",
                    },
                    {
                      q: "How does the escrow wallet work?",
                      a: "It securely holds your NFT inventory, ensuring trusted transactions.",
                    },
                    {
                      q: "Can I cancel my plan anytime?",
                      a: "Monthly plans are cancellable anytime; contact support for longer plans.",
                    },
                    {
                      q: "What happens after I choose a plan?",
                      a: "F4cet sets up your seller panel, escrow wallet, and store creation process.",
                    },
                  ].map((faq, index) => (
                    <motion.div key={index} variants={faqVariants} initial="hidden" animate="visible">
                      <Accordion
                        expanded={expanded === `panel${index + 1}`}
                        onChange={handleChange(`panel${index + 1}`)}
                        sx={{
                          background: darkMode
                            ? "rgba(255, 255, 255, 0.1)"
                            : "rgba(255, 255, 255, 0.8)",
                          backdropFilter: "blur(12px)",
                          borderRadius: "12px",
                          mb: 2,
                          "&:before": { display: "none" },
                          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon sx={{ color: darkMode ? "#f7f2e9" : "#212121" }} />}
                        >
                          <MDTypography
                            variant="h6"
                            sx={{
                              color: darkMode ? "#f7f2e9" : "#212121",
                              fontFamily: "'Quicksand', sans-serif",
                              fontWeight: 600,
                            }}
                          >
                            {faq.q}
                          </MDTypography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <MDTypography
                            variant="body2"
                            sx={{
                              color: darkMode ? "#bcd2d0" : "#212121",
                              fontFamily: "'Quicksand', sans-serif",
                            }}
                          >
                            {faq.a}
                          </MDTypography>
                        </AccordionDetails>
                      </Accordion>
                    </motion.div>
                  ))}
                </MDBox>
              </MDBox>
            </motion.div>
          </MDBox>
        </Container>
        <Snackbar open={toastOpen} autoHideDuration={3000} onClose={handleToastClose}>
          <Alert onClose={handleToastClose} severity={toastSeverity} sx={{ width: "100%" }}>
            {toastMessage}
          </Alert>
        </Snackbar>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default SellOnF4cet;