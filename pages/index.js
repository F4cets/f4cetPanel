/**
=========================================================
* F4cetPanel - Base Page for Wallet Connection
=========================================================

* Copyright 2023 F4cets Team
*/

// React imports
import { useEffect } from "react";

// Next.js components
import { useRouter } from "next/router";

// Framer Motion for animations
import { motion } from "framer-motion";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";

// NextJS Material Dashboard 2 PRO context
import { useMaterialUIController } from "/context";

// User context
import { useUser } from "/contexts/UserContext";

// Solana Wallet Imports
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

// Background image
import bgImage from "/assets/images/bg1.jpg";

// Solflare logo and QR code images
import solflareLogo from "/assets/images/Solflare-logo.png";
import solflareQRCode from "/assets/images/Solflare-m.png";

function BasePage() {
  const { publicKey, connected } = useWallet();
  const { user } = useUser();
  const router = useRouter();
  const [controller] = useMaterialUIController();
  const { darkMode } = controller;

  // Redirect based on user role when wallet connects
  useEffect(() => {
    if (connected && publicKey && user) {
      console.log("BasePage: User data:", user);
      const { role } = user;
      switch (role) {
        case "buyer":
          router.replace("/dashboards/buyer");
          break;
        case "seller":
          router.replace("/dashboards/seller");
          break;
        case "god":
          router.replace("/dashboards/god");
          break;
        default:
          console.error("BasePage: Unknown role:", role);
          router.replace("/");
      }
    }
  }, [connected, publicKey, user, router]);

  // Animation variants for the Solflare logo
  const logoVariants = {
    rest: {
      scale: 1,
      rotate: 0,
      transition: { duration: 0.3 },
    },
    hover: {
      scale: 1.1, // Pop effect
      rotate: [0, 5, -5, 5, 0], // Shake effect
      transition: {
        scale: { duration: 0.2 },
        rotate: { repeat: 1, duration: 0.5 },
      },
    },
  };

  return (
    <MDBox
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={({ palette: { primary, dark } }) => ({
        backgroundColor: darkMode ? dark.main : primary.main, // Use theme's primary color (purple)
      })}
    >
      <MDBox
        sx={{
          background: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${bgImage.src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: 3,
          borderRadius: 2,
          textAlign: "center",
          boxShadow: darkMode
            ? "0px 4px 20px rgba(0, 0, 0, 0.5)"
            : "0px 4px 20px rgba(0, 0, 0, 0.1)",
        }}
      >
        <MDTypography variant="h4" color="white" mb={2}>
          Welcome to F4cet Dashboard
        </MDTypography>
        <MDTypography variant="h6" color="white" mb={2}>
          Please connect your wallet to access the dashboard
        </MDTypography>
        <MDBox mb={2}>
          <WalletMultiButton />
        </MDBox>
        <MDBox mt={2}>
          <MDTypography variant="body2" color="white" mb={2}>
            do not have a wallet?{" "}
            <MDTypography
              variant="body2"
              color="white"
              component="a"
              href="https://chromewebstore.google.com/detail/solflare-wallet/bhhhlbepdkbapadjdnnojkbgioiodbic"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                textDecoration: "underline",
                "&:hover": {
                  color: "info.main",
                },
              }}
            >
              download
            </MDTypography>
          </MDTypography>
          <motion.div
            variants={logoVariants}
            initial="rest"
            whileHover="hover"
          >
            <MDBox
              component="a"
              href="https://chromewebstore.google.com/detail/solflare-wallet/bhhhlbepdkbapadjdnnojkbgioiodbic"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MDBox
                component="img"
                src={solflareLogo.src}
                alt="Solflare Logo"
                sx={{
                  width: { xs: "100px", md: "250px" },
                  height: "auto",
                  mb: 1,
                }}
              />
            </MDBox>
          </motion.div>
          <MDTypography
            variant="body1"
            fontWeight="bold"
            color="white"
            mt={1}
            mb={2}
          >
            Preferred Wallet
          </MDTypography>
          <MDBox mt={2}>
            <MDTypography variant="body2" color="white" mb={1}>
              Scan the QR code to download the Solflare App to your mobile device.
            </MDTypography>
            <MDBox
              component="img"
              src={solflareQRCode.src}
              alt="Solflare QR Code"
              sx={{
                width: { xs: "100px", md: "150px" },
                height: "auto",
              }}
            />
          </MDBox>
        </MDBox>
      </MDBox>
    </MDBox>
  );
}

export default BasePage;