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

import MDAvatar from "/components/MDAvatar";
import Icon from "@mui/material/Icon";
import profilePicture from "/assets/images/seanofdefi.png"; // Placeholder, will be dynamic later

const routes = () => [
  {
    collapse: [
      {
        name: "My Profile",
        key: "my-profile",
        route: "/dashboards/profile",
        roles: ["buyer", "seller", "god"],
      },
      {
        name: "Account Settings",
        key: "account-settings",
        route: "/dashboards/settings",
        roles: ["buyer", "seller", "god"],
      },
      {
        name: "Logout",
        key: "logout",
        route: "https://www.f4cets.market/marketplace",
        roles: ["buyer", "seller", "god"],
      },
    ],
    roles: ["buyer", "seller", "god"],
  },
  { type: "divider", key: "divider-0", roles: ["buyer", "seller", "god"] },
  {
    type: "collapse",
    name: "Buyer Dashboard",
    key: "buyer-dashboard",
    icon: <Icon fontSize="medium">dashboard</Icon>,
    route: "/dashboards/buyer",
    noCollapse: true,
    roles: ["buyer"],
    collapse: [
      {
        name: "Sell on F4cet",
        key: "sell-on-f4cet",
        route: "/dashboards/buyer/sell-on-f4cet",
        roles: ["buyer"],
      },
    ],
  },
  {
    type: "collapse",
    name: "Affiliate Activity",
    key: "affiliate",
    icon: <Icon fontSize="medium">currency_exchange</Icon>,
    route: "/dashboards/buyer/affiliate",
    noCollapse: true,
    roles: ["buyer"],
    collapse: [
      {
        name: "Details",
        key: "affiliate-details",
        route: "/dashboards/buyer/affiliate/details/[orderId]",
        roles: ["buyer"],
      },
    ],
  },
  {
    type: "collapse",
    name: "Marketplace Orders",
    key: "marketplace",
    icon: <Icon fontSize="medium">shopping_cart</Icon>,
    route: "/dashboards/buyer/marketplace",
    noCollapse: true,
    roles: ["buyer"],
    collapse: [
      {
        name: "Details",
        key: "marketplace-details",
        route: "/dashboards/buyer/marketplace/details/[orderId]",
        roles: ["buyer", "seller"],
      },
    ],
  },
  {
    type: "collapse",
    name: "Seller Dashboard",
    key: "seller-dashboard",
    icon: <Icon fontSize="medium">dashboard</Icon>,
    route: "/dashboards/seller",
    noCollapse: true,
    roles: ["seller"],
    collapse: [
      {
        name: "Sales Dashboard",
        key: "sales-dashboard",
        route: "/dashboards/seller/sales/dashboard",
        roles: ["seller"],
      },
      {
        name: "Sales Details",
        key: "sales-details",
        route: "/dashboards/seller/sales/details/[salesId]",
        roles: ["seller"],
      },
    ],
  },
  {
    type: "collapse",
    name: "Onboarding/Settings",
    key: "onboarding",
    icon: <Icon fontSize="medium">storefront</Icon>,
    route: "/dashboards/onboarding",
    noCollapse: true,
    roles: ["seller"],
  },
  {
    type: "collapse",
    name: "Create Inventory",
    key: "create",
    icon: <Icon fontSize="medium">editor</Icon>,
    route: "/dashboards/seller/createinv",
    noCollapse: true,
    roles: ["seller"],
  },
  {
    type: "collapse",
    name: "Inventory",
    key: "inventory",
    icon: <Icon fontSize="medium">inventory</Icon>,
    route: "/dashboards/seller/inventory",
    noCollapse: true,
    roles: ["seller"],
  },
  {
    type: "collapse",
    name: "Sales",
    key: "sales",
    icon: <Icon fontSize="medium">receipt</Icon>,
    route: "/dashboards/seller/sales/dashboard",
    noCollapse: true,
    roles: ["seller"],
  },
  {
    type: "collapse",
    name: "Escrow",
    key: "escrow",
    icon: <Icon fontSize="medium">lock</Icon>,
    route: "/dashboards/seller/escrow",
    noCollapse: true,
    roles: ["seller"],
  },
  { type: "title", title: "Admin", key: "title-admin", roles: ["god"] },
  {
    type: "collapse",
    name: "God Dashboard",
    key: "god-dashboard",
    icon: <Icon fontSize="medium">admin_panel_settings</Icon>,
    route: "/dashboards/god",
    noCollapse: true,
    roles: ["god"],
  },
  {
    type: "collapse",
    name: "Stores",
    key: "stores",
    icon: <Icon fontSize="medium">store</Icon>,
    route: "/dashboards/god/stores",
    noCollapse: true,
    roles: ["god"],
    collapse: [
      {
        name: "Edit Store",
        key: "edit-store",
        route: "/dashboards/god/stores/edit/[storeId]",
        roles: ["god"],
      },
    ],
  },
  {
    type: "collapse",
    name: "Products",
    key: "products",
    icon: <Icon fontSize="medium">inventory_2</Icon>,
    route: "/dashboards/god/products",
    noCollapse: true,
    roles: ["god"],
    collapse: [
      {
        name: "Edit Product",
        key: "edit-product",
        route: "/dashboards/god/products/edit/[productId]",
        roles: ["god"],
      },
    ],
  },
  {
    type: "collapse",
    name: "Affiliates",
    key: "affiliates",
    icon: <Icon fontSize="medium">group</Icon>,
    route: "/dashboards/god/affiliates",
    noCollapse: true,
    roles: ["god"],
    collapse: [
      {
        name: "Edit Affiliate",
        key: "edit-affiliate",
        route: "/dashboards/god/affiliates/edit/[affiliateId]",
        roles: ["god"],
      },
    ],
  },
  {
    type: "collapse",
    name: "Transactions",
    key: "transactions",
    icon: <Icon fontSize="medium">money</Icon>,
    route: "/dashboards/god/transactions",
    noCollapse: true,
    roles: ["god"],
    collapse: [
      {
        name: "view-transactions",
        key: "view-transactions",
        route: "/dashboards/god/affiliates/details/[txId]",
        roles: ["god"],
      },
    ],
  },
  {
    type: "collapse",
    name: "Escrow Accounts",
    key: "escrow-accounts",
    icon: <Icon fontSize="medium">account_balance_wallet</Icon>,
    route: "/dashboards/god/escrow",
    noCollapse: true,
    roles: ["god"],
    collapse: [
      {
        name: "View Escrow",
        key: "view-escrow",
        route: "/dashboards/god/escrow/view/[escrowId]",
        roles: ["god"],
      },
    ],
  },
];

export default routes;