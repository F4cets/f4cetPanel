/**
=========================================================
* F4cetPanel - NextJS Material Dashboard 2 PRO v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/nextjs-material-dashboard-pro
* Copyright 2023 Creative Tim (https://www.creative-tim.com)
* Coded by Creative Tim and F4cets Team
=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useState, useEffect, useMemo, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

// Solana Wallet Imports
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';

// @emotion
import createCache from "@emotion/cache";

// @emotion/react components
import { CacheProvider } from "@emotion/react";

// @mui material components
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Icon from "@mui/material/Icon";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";

// NextJS Material Dashboard 2 PRO examples
import Sidenav from "/examples/Sidenav";
import Configurator from "/examples/Configurator";

// NextJS Material Dashboard 2 PRO themes
import theme from "/assets/theme";
import themeRTL from "/assets/theme/theme-rtl";
import themeDark from "/assets/theme-dark";
import themeDarkRTL from "/assets/theme-dark/theme-rtl";

// RTL plugins
import rtlPlugin from "stylis-plugin-rtl";

// NextJS Material Dashboard 2 PRO routes
import routes from "/routes";

// NextJS Material Dashboard 2 PRO Context Provider
import { MaterialUIControllerProvider, useMaterialUIController, setMiniSidenav, setOpenConfigurator } from "/context";

// Images
import favicon from "/assets/images/favicon.png";
import appleIcon from "/assets/images/apple-icon.png";
import brandWhite from "/assets/images/logo-ct.png";
import brandDark from "/assets/images/logo-ct-dark.png";

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createCache({ key: "css", prepend: true });

function Main({ Component, pageProps }) {
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav, direction, layout, openConfigurator, sidenavColor, transparentSidenav, whiteSidenav, darkMode } = controller;
  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const [rtlCache, setRtlCache] = useState(null);
  const { pathname } = useRouter();
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const redirectRef = useRef({ hasRedirected: false }); // Use ref instead of state

  // Wallet redirect logic with loop prevention
  useEffect(() => {
    const currentPath = pathname;

    if (!connected || !publicKey) {
      if (currentPath !== "/" && !redirectRef.current.hasRedirected) {
        redirectRef.current.hasRedirected = true;
        router.replace("/");
      }
    } else if (currentPath === "/" && !redirectRef.current.hasRedirected) {
      redirectRef.current.hasRedirected = true;
      router.replace("/dashboards/analytics"); // Corrected to match actual path
    } else if (redirectRef.current.hasRedirected) {
      redirectRef.current.hasRedirected = false; // Reset after navigation
    }
  }, [connected, publicKey, router]); // Only wallet state changes trigger this

  // Cache for the rtl
  useMemo(() => {
    const cacheRtl = createCache({ key: "rtl", stylisPlugins: [rtlPlugin] });
    setRtlCache(cacheRtl);
  }, []);

  // Open sidenav when mouse enter on mini sidenav
  const handleOnMouseEnter = () => {
    if (miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false);
      setOnMouseEnter(true);
    }
  };

  // Close sidenav when mouse leave mini sidenav
  const handleOnMouseLeave = () => {
    if (onMouseEnter) {
      setMiniSidenav(dispatch, true);
      setOnMouseEnter(false);
    }
  };

  // Change the openConfigurator state
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);

  // Setting the dir attribute for the body element
  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  // Setting page scroll to 0 when changing the route
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const brandIcon = (transparentSidenav && !darkMode) || whiteSidenav ? brandDark : brandWhite;

  const configsButton = (
    <MDBox
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="3.25rem"
      height="3.25rem"
      bgColor="white"
      shadow="sm"
      borderRadius="50%"
      position="fixed"
      right="2rem"
      bottom="2rem"
      zIndex={99}
      color="dark"
      sx={{ cursor: "pointer" }}
      onClick={handleConfiguratorOpen}
    >
      <Icon fontSize="small" color="inherit">settings</Icon>
    </MDBox>
  );

  return direction === "rtl" ? (
    <CacheProvider value={rtlCache}>
      <ThemeProvider theme={darkMode ? themeDarkRTL : themeRTL}>
        <CssBaseline />
        <Component {...pageProps} />
        {layout === "dashboard" && (
          <>
            <Sidenav
              color={sidenavColor}
              brand={brandIcon}
              brandName="F4cet Dashboard PRO"
              routes={routes}
              onMouseEnter={handleOnMouseEnter}
              onMouseLeave={handleOnMouseLeave}
            />
            <Configurator />
            {configsButton}
          </>
        )}
        {layout === "vr" && <Configurator />}
      </ThemeProvider>
    </CacheProvider>
  ) : (
    <ThemeProvider theme={darkMode ? themeDark : theme}>
      <CssBaseline />
      <Component {...pageProps} />
      {layout === "dashboard" && (
        <>
          <Sidenav
            color={sidenavColor}
            brand={brandIcon}
            brandName="F4cet Dashboard PRO"
            routes={routes}
            onMouseEnter={handleOnMouseEnter}
            onMouseLeave={handleOnMouseLeave}
          />
          <Configurator />
          {configsButton}
        </>
      )}
      {layout === "vr" && <Configurator />}
    </ThemeProvider>
  );
}

function MyApp({ Component, pageProps, emotionCache = clientSideEmotionCache }) {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = clusterApiUrl(network);
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <MaterialUIControllerProvider>
            <CacheProvider value={emotionCache}>
              <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="shortcut icon" href={favicon.src} />
                <link rel="apple-touch-icon" sizes="76x76" href={appleIcon.src} />
                <title>F4cet Dashboard PRO</title>
              </Head>
              <Main Component={Component} pageProps={pageProps} />
            </CacheProvider>
          </MaterialUIControllerProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default MyApp;