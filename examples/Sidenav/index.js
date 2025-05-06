/**
=========================================================
* NextJS Material Dashboard 2 PRO - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/nextjs-material-dashboard-pro
* Copyright 2023 Creative Tim (https://www.creative-tim.com)
* Coded by www.creative-tim.com and F4cets Team
=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import PropTypes from "prop-types";

// User context
import { useUser } from "/contexts/UserContext";

// @mui material components
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import MuiLink from "@mui/material/Link";
import Icon from "@mui/material/Icon";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
import MDAvatar from "/components/MDAvatar";

// NextJS Material Dashboard 2 PRO examples
import SidenavCollapse from "/examples/Sidenav/SidenavCollapse";
import SidenavList from "/examples/Sidenav/SidenavList";
import SidenavItem from "/examples/Sidenav/SidenavItem";

// Custom styles for the Sidenav
import SidenavRoot from "/examples/Sidenav/SidenavRoot";
import sidenavLogoLabel from "/examples/Sidenav/styles/sidenav";

// NextJS Material Dashboard 2 PRO context
import {
  useMaterialUIController,
  setMiniSidenav,
  setTransparentSidenav,
  setWhiteSidenav,
} from "/context";

// NextJS Material Dashboard 2 PRO routes
import routes from "/routes";

function Sidenav({ color, brand, brandName, ...rest }) {
  const [openCollapse, setOpenCollapse] = useState(false);
  const [openNestedCollapse, setOpenNestedCollapse] = useState(false);
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav, transparentSidenav, whiteSidenav, darkMode } = controller;
  const { user } = useUser();
  const { pathname } = useRouter();

  // Debug user data
  useEffect(() => {
    console.log("Sidenav: User data:", user, "Path:", pathname);
  }, [user, pathname]);

  let textColor = "white";
  if (transparentSidenav || (whiteSidenav && !darkMode)) {
    textColor = "dark";
  } else if (whiteSidenav && darkMode) {
    textColor = "inherit";
  }

  const closeSidenav = () => setMiniSidenav(dispatch, true);

  useEffect(() => {
    setOpenCollapse(pathname.split("/").slice(1)[1]); // Adjust for static paths
    setOpenNestedCollapse(pathname.split("/").slice(1)[2]);
  }, [pathname]);

  useEffect(() => {
    function handleMiniSidenav() {
      setMiniSidenav(dispatch, window.innerWidth < 1200);
      setTransparentSidenav(
        dispatch,
        window.innerWidth < 1200 ? false : transparentSidenav
      );
      setWhiteSidenav(
        dispatch,
        window.innerWidth < 1200 ? false : whiteSidenav
      );
    }
    window.addEventListener("resize", handleMiniSidenav);
    handleMiniSidenav();
    return () => window.removeEventListener("resize", handleMiniSidenav);
  }, [dispatch, transparentSidenav, whiteSidenav]);

  // Filter routes based on user role (sellers see buyer routes too)
  const filteredRoutes = routes().filter((route) => {
    if (!route.roles) return true;
    if (user?.role === "seller") {
      return route.roles.includes("buyer") || route.roles.includes("seller");
    }
    return route.roles.includes(user?.role || "buyer");
  });

  // Further filter collapse items if they exist
  const processedRoutes = filteredRoutes.map((route) => {
    if (route.collapse) {
      return {
        ...route,
        collapse: route.collapse.filter((item) => {
          if (!item.roles) return true;
          if (user?.role === "seller") {
            return item.roles.includes("buyer") || item.roles.includes("seller");
          }
          return item.roles.includes(user?.role || "buyer");
        }),
      };
    }
    return route;
  });

  // Render all the nested collapse items from the routes.js
  const renderNestedCollapse = (collapse) =>
    collapse.map(({ name, route, key, href }) =>
      href ? (
        <MuiLink
          key={key}
          href={href}
          target="_blank"
          rel="noreferrer"
          sx={{ textDecoration: "none" }}
        >
          <SidenavItem name={name} nested />
        </MuiLink>
      ) : (
        <Link href={route} key={key} passHref>
          <SidenavItem name={name} active={route === pathname} nested />
        </Link>
      )
    );

  // Render the all the collapses from the routes.js
  const renderCollapse = (collapses) =>
    collapses.map(({ name, collapse, route, href, key }) => {
      let returnValue;
      if (collapse) {
        returnValue = (
          <SidenavItem
            key={key}
            color={color}
            name={name}
            active={key === pathname.split("/").slice(2)[0] ? "isParent" : false}
            open={openNestedCollapse === key}
            onClick={({ currentTarget }) =>
              openNestedCollapse === key &&
              currentTarget.classList.contains("MuiListItem-root")
                ? setOpenNestedCollapse(false)
                : setOpenNestedCollapse(key)
            }
          >
            {renderNestedCollapse(collapse)}
          </SidenavItem>
        );
      } else {
        returnValue = href ? (
          <MuiLink
            href={href}
            key={key}
            target="_blank"
            rel="noreferrer"
            sx={{ textDecoration: "none" }}
          >
            <SidenavItem color={color} name={name} active={key === pathname.split("/").slice(2)[1]} />
          </MuiLink>
        ) : (
          <Link href={route} key={key} passHref>
            <SidenavItem color={color} name={name} active={key === pathname.split("/").slice(2)[1]} />
          </Link>
        );
      }
      return <SidenavList key={key}>{returnValue}</SidenavList>;
    });

  // Render all the routes from the routes.js
  const renderRoutes = processedRoutes.map(
    ({ type, name, icon, title, collapse, noCollapse, key, href, route }) => {
      let returnValue;
      if (type === "collapse") {
        if (href) {
          returnValue = (
            <MuiLink
              href={href}
              key={key}
              target="_blank"
              rel="noreferrer"
              sx={{ textDecoration: "none" }}
            >
              <SidenavCollapse
                name={name}
                icon={icon}
                active={key === pathname.split("/").slice(2)[0]}
                noCollapse={noCollapse}
              />
            </MuiLink>
          );
        } else if (noCollapse && route) {
          returnValue = (
            <Link href={route} key={key} passHref>
              <SidenavCollapse
                name={name}
                icon={icon}
                noCollapse={noCollapse}
                active={key === pathname.split("/").slice(2)[0]}
              >
                {collapse ? renderCollapse(collapse) : null}
              </SidenavCollapse>
            </Link>
          );
        } else {
          returnValue = (
            <SidenavCollapse
              key={key}
              name={name}
              icon={icon}
              active={key === pathname.split("/").slice(2)[0]}
              open={openCollapse === key}
              onClick={() =>
                openCollapse === key
                  ? setOpenCollapse(false)
                  : setOpenCollapse(key)
              }
            >
              {collapse ? renderCollapse(collapse) : null}
            </SidenavCollapse>
          );
        }
      } else if (type === "title") {
        returnValue = (
          <MDTypography
            key={key}
            color={textColor}
            display="block"
            variant="caption"
            fontWeight="bold"
            textTransform="uppercase"
            pl={3}
            mt={2}
            mb={1}
            ml={1}
          >
            {title}
          </MDTypography>
        );
      } else if (type === "divider") {
        returnValue = (
          <Divider
            key={key}
            light={
              (!darkMode && !whiteSidenav && !transparentSidenav) ||
              (darkMode && !transparentSidenav && whiteSidenav)
            }
          />
        );
      }
      return returnValue;
    }
  );

  return (
    <SidenavRoot
      {...rest}
      variant="permanent"
      ownerState={{ transparentSidenav, whiteSidenav, miniSidenav, darkMode }}
    >
      <MDBox pt={3} pb={1} px={4} textAlign="center">
        <MDBox
          display={{ xs: "block", xl: "none" }}
          position="absolute"
          top={0}
          right={0}
          p={1.625}
          onClick={closeSidenav}
          sx={{ cursor: "pointer" }}
        >
          <MDTypography variant="h6" color="secondary">
            <Icon sx={{ fontWeight: "bold" }}>close</Icon>
          </MDTypography>
        </MDBox>
        <Link href="/">
          <MDBox display="flex" alignItems="center">
            {brand && brand.src ? (
              <MDBox
                component="img"
                src={brand.src}
                alt={brandName}
                width="1.75rem"
              />
            ) : (
              brand
            )}
            <MDBox
              width={!brandName && "100%"}
              sx={(theme) => sidenavLogoLabel(theme, { miniSidenav })}
            >
              <MDTypography
                component="h6"
                variant="button"
                fontWeight="medium"
                color={textColor}
              >
                {brandName}
              </MDTypography>
            </MDBox>
          </MDBox>
        </Link>
      </MDBox>
      <Divider
        light={
          (!darkMode && !whiteSidenav && !transparentSidenav) ||
          (darkMode && !transparentSidenav && whiteSidenav)
        }
      />
      <List>
        {user && (
          <SidenavCollapse
            name={user.profile.name || "User"}
            icon={
              <MDAvatar
                src={user.profile.avatar || "/assets/images/default-avatar.png"}
                alt={user.profile.name || "User"}
                size="sm"
              />
            }
            active={pathname.startsWith("/dashboards/profile") || pathname.startsWith("/dashboards/settings")}
            open={openCollapse === "user-profile"}
            onClick={() =>
              openCollapse === "user-profile"
                ? setOpenCollapse(false)
                : setOpenCollapse("user-profile")
            }
          >
            {renderCollapse(
              routes().find((route) => route.key === "user-profile")?.collapse || []
            )}
          </SidenavCollapse>
        )}
        {renderRoutes}
      </List>
    </SidenavRoot>
  );
}

// Setting default values for the props of Sidenav
Sidenav.defaultProps = {
  color: "dark",
  brand: "",
};

// Typechecking props for the Sidenav
Sidenav.propTypes = {
  color: PropTypes.oneOf([
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "error",
    "dark",
  ]),
  brand: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  brandName: PropTypes.string.isRequired,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Sidenav;