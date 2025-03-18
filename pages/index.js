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

// Solana Wallet Imports
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

function BasePage() {
  const { publicKey, connected } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (connected && publicKey) {
      router.replace("/dashboards/analytics"); // Corrected to match actual path
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
          backgroundColor: "white",
          padding: 3,
          borderRadius: 2,
          textAlign: "center",
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
        }}
      >
        <MDTypography variant="h4" color="dark" mb={2}>
          Welcome to F4cet Dashboard
        </MDTypography>
        <MDTypography variant="h6" color="dark" mb={2}>
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