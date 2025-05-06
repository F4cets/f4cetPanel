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
import PropTypes from "prop-types";
import { useWallet } from "@solana/wallet-adapter-react";

// User context
import { useUser } from "/contexts/UserContext";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";

// NextJS Material Dashboard 2 PRO context
import { useMaterialUIController, setLayout } from "/context";

// NextJS Material Dashboard 2 PRO routes
import routes from "/routes";

function DashboardLayout({ children }) {
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav } = controller;
  const { pathname } = useRouter();
  const { connected } = useWallet();
  const { user } = useUser();
  const router = useRouter();
  const [isWalletChecked, setIsWalletChecked] = useState(false);
  const [redirected, setRedirected] = useState(false); // Prevent redirect loop

  // Set layout
  useEffect(() => {
    setLayout(dispatch, "dashboard");
  }, [dispatch, pathname]);

  // Check wallet connection and user role
  useEffect(() => {
    setIsWalletChecked(true);
  }, []);

  // Redirect if wallet not connected or invalid route
  useEffect(() => {
    if (!connected || !user || !user.walletId) {
      console.log("DashboardLayout: No wallet connected or no user, redirecting to /");
      if (!redirected) {
        setRedirected(true);
        router.replace("/");
      }
      return;
    }

    const userRole = user.role || "buyer";
    const allowedRoutes = routes().filter((route) => {
      if (!route.roles) return true;
      if (userRole === "seller") {
        return route.roles.includes("buyer") || route.roles.includes("seller");
      }
      return route.roles.includes(userRole);
    });

    // Debug allowed routes
    console.log("DashboardLayout: Allowed Routes:", allowedRoutes.map(r => ({
      route: r.route,
      href: r.href,
      roles: r.roles,
    })));

    // Simplified function to match paths with dynamic segments and subpaths
    const matchPath = (routePath, currentPath) => {
      if (!routePath) {
        console.log("DashboardLayout: Skipping undefined routePath");
        return false;
      }

      // Handle external URLs
      if (routePath.startsWith("http")) {
        console.log("DashboardLayout: Skipping external route:", routePath);
        return false;
      }

      const routeSegments = routePath.split("/").filter(Boolean);
      const pathSegments = currentPath.split("/").filter(Boolean);

      console.log(`DashboardLayout: Comparing Route: ${routePath}, Path: ${currentPath}`);
      console.log(`Route Segments: ${routeSegments}, Path Segments: ${pathSegments}`);

      // Match as long as the current path starts with the route path, accounting for dynamic segments
      return pathSegments.length >= routeSegments.length && routeSegments.every((seg, i) => {
        if (seg.includes("[") && seg.includes("]") && pathSegments[i]) {
          console.log(`DashboardLayout: Dynamic segment match - Route: ${seg}, Path: ${pathSegments[i]}`);
          return true;
        }
        return seg === pathSegments[i];
      });
    };

    // Check if the current path matches any route or subroute
    const isValidRoute = allowedRoutes.some((route) => {
      if (matchPath(route.route, pathname)) {
        console.log("DashboardLayout: Matched route:", route.route);
        return true;
      }
      if (route.collapse) {
        return route.collapse.some((subRoute) => {
          if (matchPath(subRoute.route, pathname)) {
            console.log("DashboardLayout: Matched subroute:", subRoute.route);
            return true;
          }
          return false;
        });
      }
      return false;
    });

    if (!isValidRoute) {
      console.log("DashboardLayout: Invalid path for role", userRole, "redirecting");
      if (!redirected) {
        setRedirected(true);
        const redirectPath =
          userRole === "god"
            ? "/dashboards/god"
            : userRole === "seller"
            ? "/dashboards/seller"
            : "/dashboards/buyer";
        router.replace(redirectPath);
      }
    } else {
      console.log("DashboardLayout: Valid path for role", userRole, "Path:", pathname);
      setRedirected(false); // Reset redirect flag on successful route
    }
  }, [connected, user, pathname, router]);

  // Debug path and role
  useEffect(() => {
    console.log("DashboardLayout: Current Path:", pathname, "Role:", user?.role);
  }, [pathname, user]);

  // Prevent rendering until wallet check
  if (!isWalletChecked) {
    return null;
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