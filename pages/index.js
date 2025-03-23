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

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";

// NextJS Material Dashboard 2 PRO context
import { useMaterialUIController } from "/context";

// Solana Wallet Imports
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

// Background image
import bgImage from "/assets/images/bg1.jpg";

function BasePage() {
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const [controller] = useMaterialUIController();
  const { darkMode } = controller;

  // Redirect to buyer-specific route when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      const walletId = publicKey.toString();
      router.replace(`/buyer/${walletId}`);
    }
  }, [connected, publicKey, router]);

  return (
    <MDBox
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgColor="grey-100"
    >
      <MDBox
        sx={{
          background: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${bgImage.src})`, // Same background image with overlay for both modes
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: 3,
          borderRadius: 2,
          textAlign: "center",
          boxShadow: darkMode
            ? "0px 4px 20px rgba(0, 0, 0, 0.5)" // Dark shadow in dark mode
            : "0px 4px 20px rgba(0, 0, 0, 0.1)", // Lighter shadow in light mode
        }}
      >
        <MDTypography variant="h4" color="white" mb={2}>
          Welcome to F4cet Dashboard
        </MDTypography>
        <MDTypography variant="h6" color="white" mb={2}>
          Please connect your wallet to access the dashboard
        </MDTypography>
        <MDBox>
          <WalletMultiButton />
        </MDBox>
      </MDBox>
    </MDBox>
  );
}

export default BasePage;