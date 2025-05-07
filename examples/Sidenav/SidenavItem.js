/**
=========================================================
* NextJS Material Dashboard 2 PRO - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/nextjs-material-dashboard-pro
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui material components
import Collapse from "@mui/material/Collapse";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Icon from "@mui/material/Icon";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";

// Custom styles for the SidenavItem
import {
  item,
  itemContent,
  itemArrow,
} from "/examples/Sidenav/styles/sidenavItem";

// NextJS Material Dashboard 2 PRO contexts
import { useMaterialUIController } from "/context";

function SidenavItem({ color, name, active, nested, children, open, icon, ...rest }) {
  const [controller] = useMaterialUIController();
  const { miniSidenav, transparentSidenav, whiteSidenav, darkMode } =
    controller;

  // Debug the icon prop
  console.log(`SidenavItem: ${name}, Icon: ${icon ? 'Present' : 'Missing'}`, icon);

  return (
    <>
      <ListItem
        {...rest}
        component="li"
        sx={(theme) =>
          item(theme, {
            active,
            color,
            transparentSidenav,
            whiteSidenav,
            darkMode,
          })
        }
      >
        <MDBox
          sx={(theme) =>
            itemContent(theme, {
              active,
              miniSidenav,
              name,
              open,
              nested,
              transparentSidenav,
              whiteSidenav,
              darkMode,
            })
          }
        >
          <MDBox display="flex" alignItems="center">
            {icon && (
              <MDBox mr={1} display="flex" alignItems="center">
                {icon}
              </MDBox>
            )}
            <ListItemText primary={name} />
          </MDBox>
          {children && (
            <Icon
              component="i"
              sx={(theme) =>
                itemArrow(theme, {
                  open,
                  miniSidenav,
                  transparentSidenav,
                  whiteSidenav,
                  darkMode,
                })
              }
            >
              expand_less
            </Icon>
          )}
        </MDBox>
      </ListItem>
      {children && (
        <Collapse in={open} timeout="auto" unmountOnExit {...rest}>
          {children}
        </Collapse>
      )}
    </>
  );
}

// Setting default values for the props of SidenavItem
SidenavItem.defaultProps = {
  color: "dark",
  active: false,
  nested: false,
  children: false,
  open: false,
  icon: null, // Default to null if no icon is provided
};

// Typechecking props for the SidenavItem
SidenavItem.propTypes = {
  color: PropTypes.oneOf([
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "error",
    "dark",
  ]),
  name: PropTypes.string.isRequired,
  active: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  nested: PropTypes.bool,
  children: PropTypes.node,
  open: PropTypes.bool,
  icon: PropTypes.node, // Add icon prop type
};

export default SidenavItem;