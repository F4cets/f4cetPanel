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
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { db } from "/lib/firebase";

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
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const [isWalletChecked, setIsWalletChecked] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [redirected, setRedirected] = useState(false); // Prevent redirect loop

  // Fetch user role
  useEffect(() => {
    const fetchRole = async () => {
      if (publicKey) {
        const walletId = publicKey.toString();
        console.log("DashboardLayout: Fetching role for wallet:", walletId);
        const userDoc = await getDoc(doc(db, "users", walletId));
        if (userDoc.exists()) {
          const role = userDoc.data().role || "buyer";
          setUserRole(role);
          console.log("DashboardLayout: Role:", role, "Path:", pathname);
        } else {
          console.log("DashboardLayout: No user found for", walletId);
          setUserRole("buyer");
        }
      }
      setIsWalletChecked(true);
    };
    fetchRole();
  }, [publicKey]);

  // Set layout
  useEffect(() => {
    setLayout(dispatch, "dashboard");
  }, [dispatch, pathname]);

  // Redirect if wallet not connected or invalid route
  useEffect(() => {
    if (!connected || !publicKey) {
      console.log("DashboardLayout: No wallet connected, redirecting to /");
      if (!redirected) {
        setRedirected(true);
        router.replace("/");
      }
      return;
    }

    if (userRole) {
      const allowedRoutes = routes(publicKey.toString()).filter((route) => {
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

      // Function to match paths with dynamic segments and subpaths
      const matchPath = (routePath, currentPath) => {
        if (!routePath) {
          console.log("DashboardLayout: Skipping undefined routePath");
          return false;
        }

        const routeSegments = routePath.split("/").filter(Boolean); // Remove empty segments
        const pathSegments = currentPath.split("/").filter(Boolean);

        // Debug segments
        console.log(`DashboardLayout: Comparing Route: ${routePath}, Path: ${currentPath}`);
        console.log(`Route Segments: ${routeSegments}, Path Segments: ${pathSegments}`);

        // Check if the route matches the path or is a base path for the current path
        if (routeSegments.length > pathSegments.length) {
          return false; // Route is longer than path, no match
        }

        let matched = true;
        for (let i = 0; i < routeSegments.length; i++) {
          const routeSegment = routeSegments[i];
          const pathSegment = pathSegments[i];

          if (!pathSegment) {
            matched = false;
            break;
          }

          if (routeSegment === pathSegment) {
            continue; // Exact match
          }

          // Check if the route segment is dynamic (e.g., [walletId])
          if (routeSegment.includes("[") && pathSegment) {
            console.log(`DashboardLayout: Dynamic segment match - Route segment: ${routeSegment}, Path segment: ${pathSegment}`);
            continue;
          }

          matched = false;
          break;
        }

        if (matched) {
          console.log(`DashboardLayout: Path match - Route: ${routePath}, Path: ${currentPath}`);
          return true;
        }

        return false;
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

      // Allow specific buyer subroutes for both buyer and seller roles
      const isBuyerSubRoute = pathname === "/buyer/sell-on-f4cet";

      // Replace dynamic segments in the pathname for comparison
      const resolvedPathname = pathname.replace("[walletId]", publicKey.toString());

      // Check if the resolved pathname matches any route
      const isResolvedRoute = allowedRoutes.some((route) => {
        if (matchPath(route.route, resolvedPathname)) {
          console.log("DashboardLayout: Matched resolved route:", route.route);
          return true;
        }
        if (route.collapse) {
          return route.collapse.some((subRoute) => {
            if (matchPath(subRoute.route, resolvedPathname)) {
              console.log("DashboardLayout: Matched resolved subroute:", subRoute.route);
              return true;
            }
            return false;
          });
        }
        return false;
      });

      if (!isValidRoute && !isBuyerSubRoute && !isResolvedRoute) {
        console.log("DashboardLayout: Invalid path for role", userRole, "redirecting to", `/buyer/${publicKey.toString()}`);
        if (!redirected) {
          setRedirected(true);
          router.replace(`/buyer/${publicKey.toString()}`);
        }
      } else {
        console.log("DashboardLayout: Valid path for role", userRole, "Path:", pathname);
        setRedirected(false); // Reset redirect flag on successful route
      }
    }
  }, [connected, publicKey, userRole, pathname, router]);

  // Debug path and role
  useEffect(() => {
    console.log("DashboardLayout: Current Path:", pathname, "Role:", userRole);
  }, [pathname, userRole]);

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