/**
=========================================================
* F4cetPanel - Base Page for Wallet Connection
=========================================================

* Copyright 2023 F4cets Team
*/

// Next.js components
import { useRouter } from "next/router";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";

// Solana Wallet Imports
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

function BasePage() {
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