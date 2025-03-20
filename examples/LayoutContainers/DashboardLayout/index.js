/**
=========================================================
* NextJS Material Dashboard 2 PRO - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/nextjs-material-dashboard-pro
* Copyright 2023 Creative Tim (https://www.creative-tim.com)
* Coded by Creative Tim and F4cets Team
=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useEffect, useState } from "react";
import { useRouter } from "next/router";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";

// NextJS Material Dashboard 2 PRO context
import { useMaterialUIController, setLayout } from "/context";

// Solana Wallet Imports
import { useWallet } from "@solana/wallet-adapter-react";

function DashboardLayout({ children }) {
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav } = controller;
  const { pathname } = useRouter();
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const [isWalletChecked, setIsWalletChecked] = useState(false);

  useEffect(() => {
    setLayout(dispatch, "dashboard");
  }, [dispatch, pathname]);

  // Redirect to base page if wallet is not connected
  useEffect(() => {
    if (!connected || !publicKey) {
      router.replace("/");
    } else {
      setIsWalletChecked(true); // Only render children after wallet check passes
    }
  }, [connected, publicKey, router]);

  // Prevent rendering children until wallet check is complete
  if (!isWalletChecked) {
    return null; // Or a loading spinner if desired
  }

  return (
    <MDBox
      sx={({ breakpoints, transitions, functions: { pxToRem } }) => ({
        p: 3,
        position: "relative",
        [breakpoints.up("xl")]: {
          marginLeft: miniSidenav ? pxToRem(120) : pxToRem(274),
          transition: transitions.create(["margin-left", "margin-right"], {
            easing: transitions.easing.easeInOut,
            duration: transitions.duration.standard,
          }),
        },
      })}
    >
      {children}
    </MDBox>
  );
}

// Typechecking props for the DashboardLayout
DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default DashboardLayout;