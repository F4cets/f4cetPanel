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
        roles: ["buyer"],
      },
    ],
  },
  {
    type: "collapse",
    name: "Seller Onboarding",
    key: "onboarding",
    icon: <Icon fontSize="medium">storefront</Icon>,
    route: "/dashboards/onboarding",
    noCollapse: true,
    roles: ["seller"],
  },
  {
    type: "collapse",
    name: "Seller Dashboard",
    key: "seller-dashboard",
    icon: <Icon fontSize="medium">store</Icon>,
    route: "/dashboards/seller",
    noCollapse: true,
    roles: ["seller"],
    collapse: [
      {
        name: "Onboarding",
        key: "onboarding",
        route: "/dashboards/seller/onboarding",
        roles: ["seller"],
      },
    ],
  },
  {
    type: "collapse",
    name: "God Dashboard",
    key: "god-dashboard",
    icon: <Icon fontSize="medium">admin_panel_settings</Icon>,
    route: "/dashboards/god",
    noCollapse: true,
    roles: ["god"],
  },
  { type: "title", title: "Admin", key: "title-admin", roles: ["god"] },
  {
    type: "collapse",
    name: "Analytics",
    key: "analytics",
    icon: <Icon fontSize="medium">analytics</Icon>,
    route: "/dashboards/god/analytics",
    noCollapse: true,
    roles: ["god"],
  },
  {
    type: "collapse",
    name: "User Management",
    key: "user-management",
    icon: <Icon fontSize="medium">people</Icon>,
    route: "/dashboards/god/users",
    noCollapse: true,
    roles: ["god"],
  },
  {
    type: "collapse",
    name: "Pages",
    key: "pages",
    icon: <Icon fontSize="medium">image</Icon>,
    collapse: [
      {
        name: "Projects",
        key: "projects",
        collapse: [
          {
            name: "Timeline",
            key: "timeline",
            route: "/dashboards/god/projects/timeline",
          },
        ],
      },
      {
        name: "Pricing Page",
        key: "pricing-page",
        route: "/dashboards/god/pricing",
      },
      { name: "RTL", key: "rtl", route: "/dashboards/god/rtl" },
      {
        name: "Widgets",
        key: "widgets",
        route: "/dashboards/god/widgets",
      },
      {
        name: "Charts",
        key: "charts",
        route: "/dashboards/god/charts",
      },
      {
        name: "Notifications",
        key: "notifications",
        route: "/dashboards/god/notifications",
      },
    ],
    roles: ["god"],
  },
  {
    type: "collapse",
    name: "Applications",
    key: "applications",
    icon: <Icon fontSize="medium">apps</Icon>,
    collapse: [
      {
        name: "Kanban",
        key: "kanban",
        route: "/dashboards/god/kanban",
      },
      {
        name: "Wizard",
        key: "wizard",
        route: "/dashboards/god/wizard",
      },
      {
        name: "Data Tables",
        key: "data-tables",
        route: "/dashboards/god/data-tables",
      },
      {
        name: "Calendar",
        key: "calendar",
        route: "/dashboards/god/calendar",
      },
    ],
    roles: ["god"],
  },
  {
    type: "collapse",
    name: "Ecommerce",
    key: "ecommerce",
    icon: <Icon fontSize="medium">shopping_basket</Icon>,
    collapse: [
      {
        name: "Products",
        key: "products",
        collapse: [
          {
            name: "New Product",
            key: "new-product",
            route: "/dashboards/god/ecommerce/products/new-product",
          },
          {
            name: "Edit Product",
            key: "edit-product",
            route: "/dashboards/god/ecommerce/products/edit-product",
          },
          {
            name: "Product Page",
            key: "product-page",
            route: "/dashboards/god/ecommerce/products/product-page",
          },
        ],
      },
      {
        name: "Orders",
        key: "orders",
        collapse: [
          {
            name: "Order List",
            key: "order-list",
            route: "/dashboards/god/ecommerce/orders/order-list",
          },
          {
            name: "Order Details",
            key: "order-details",
            route: "/dashboards/god/ecommerce/orders/order-details",
          },
        ],
      },
    ],
    roles: ["god"],
  },
  {
    type: "collapse",
    name: "Authentication",
    key: "authentication",
    icon: <Icon fontSize="medium">content_paste</Icon>,
    collapse: [
      {
        name: "Sign In",
        key: "sign-in",
        collapse: [
          {
            name: "Basic",
            key: "basic",
            route: "/dashboards/god/authentication/sign-in/basic",
          },
          {
            name: "Cover",
            key: "cover",
            route: "/dashboards/god/authentication/sign-in/cover",
          },
          {
            name: "Illustration",
            key: "illustration",
            route: "/dashboards/god/authentication/sign-in/illustration",
          },
        ],
      },
      {
        name: "Sign Up",
        key: "sign-up",
        collapse: [
          {
            name: "Cover",
            key: "cover",
            route: "/dashboards/god/authentication/sign-up/cover",
          },
        ],
      },
      {
        name: "Reset Password",
        key: "reset-password",
        collapse: [
          {
            name: "Cover",
            key: "cover",
            route: "/dashboards/god/authentication/reset-password/cover",
          },
        ],
      },
    ],
    roles: ["god"],
  },
  { type: "divider", key: "divider-1", roles: ["god"] },
  { type: "title", title: "Docs", key: "title-docs", roles: ["god"] },
  {
    type: "collapse",
    name: "Basic",
    key: "basic",
    icon: <Icon fontSize="medium">upcoming</Icon>,
    collapse: [
      {
        name: "Getting Started",
        key: "getting-started",
        collapse: [
          {
            name: "Overview",
            key: "overview",
            href: "https://www.creative-tim.com/learning-lab/nextjs/overview/material-dashboard/",
          },
          {
            name: "License",
            key: "license",
            href: "https://www.creative-tim.com/learning-lab/nextjs/license/material-dashboard/",
          },
          {
            name: "Quick Start",
            key: "quick-start",
            href: "https://www.creative-tim.com/learning-lab/nextjs/quick-start/material-dashboard/",
          },
          {
            name: "Build Tools",
            key: "build-tools",
            href: "https://www.creative-tim.com/learning-lab/nextjs/build-tools/material-dashboard/",
          },
        ],
      },
      {
        name: "Foundation",
        key: "foundation",
        collapse: [
          {
            name: "Colors",
            key: "colors",
            href: "https://www.creative-tim.com/learning-lab/nextjs/colors/material-dashboard/",
          },
          {
            name: "Grid",
            key: "grid",
            href: "https://www.creative-tim.com/learning-lab/nextjs/grid/material-dashboard/",
          },
          {
            name: "Typography",
            key: "base-typography",
            href: "https://www.creative-tim.com/learning-lab/nextjs/base-typography/material-dashboard/",
          },
          {
            name: "Borders",
            key: "borders",
            href: "https://www.creative-tim.com/learning-lab/nextjs/borders/material-dashboard/",
          },
          {
            name: "Box Shadows",
            key: "box-shadows",
            href: "https://www.creative-tim.com/learning-lab/nextjs/box-shadows/material-dashboard/",
          },
          {
            name: "Functions",
            key: "functions",
            href: "https://www.creative-tim.com/learning-lab/nextjs/functions/material-dashboard/",
          },
          {
            name: "Routing System",
            key: "routing-system",
            href: "https://www.creative-tim.com/learning-lab/nextjs/routing-system/material-dashboard/",
          },
        ],
      },
    ],
    roles: ["god"],
  },
  {
    type: "collapse",
    name: "Components",
    key: "components",
    icon: <Icon fontSize="medium">view_in_ar</Icon>,
    collapse: [
      {
        name: "Alerts",
        key: "alerts",
        href: "https://www.creative-tim.com/learning-lab/nextjs/alerts/material-dashboard/",
      },
      {
        name: "Avatar",
        key: "avatar",
        href: "https://www.creative-tim.com/learning-lab/nextjs/avatar/material-dashboard/",
      },
      {
        name: "Badge",
        key: "badge",
        href: "https://www.creative-tim.com/learning-lab/nextjs/badge/material-dashboard/",
      },
      {
        name: "Badge Dot",
        key: "badge-dot",
        href: "https://www.creative-tim.com/learning-lab/nextjs/badge-dot/material-dashboard/",
      },
      {
        name: "Box",
        key: "box",
        href: "https://www.creative-tim.com/learning-lab/nextjs/box/material-dashboard/",
      },
      {
        name: "Buttons",
        key: "buttons",
        href: "https://www.creative-tim.com/learning-lab/nextjs/buttons/material-dashboard/",
      },
      {
        name: "Date Picker",
        key: "date-picker",
        href: "https://www.creative-tim.com/learning-lab/nextjs/datepicker/material-dashboard/",
      },
      {
        name: "Dropzone",
        key: "dropzone",
        href: "https://www.creative-tim.com/learning-lab/nextjs/dropzone/material-dashboard/",
      },
      {
        name: "Editor",
        key: "editor",
        href: "https://www.creative-tim.com/learning-lab/nextjs/quill/material-dashboard/",
      },
      {
        name: "Input",
        key: "input",
        href: "https://www.creative-tim.com/learning-lab/nextjs/input/material-dashboard/",
      },
      {
        name: "Pagination",
        key: "pagination",
        href: "https://www.creative-tim.com/learning-lab/nextjs/pagination/material-dashboard/",
      },
      {
        name: "Progress",
        key: "progress",
        href: "https://www.creative-tim.com/learning-lab/nextjs/progress/material-dashboard/",
      },
      {
        name: "Snackbar",
        key: "snackbar",
        href: "https://www.creative-tim.com/learning-lab/nextjs/snackbar/material-dashboard/",
      },
      {
        name: "Social Button",
        key: "social-button",
        href: "https://www.creative-tim.com/learning-lab/nextjs/social-buttons/material-dashboard/",
      },
      {
        name: "Typography",
        key: "typography",
        href: "https://www.creative-tim.com/learning-lab/nextjs/typography/material-dashboard/",
      },
    ],
    roles: ["god"],
  },
  {
    type: "collapse",
    name: "Change Log",
    key: "changelog",
    href: "https://github.com/creativetimofficial/ct-nextjs-material-dashboard-pro/blob/main/CHANGELOG.md",
    icon: <Icon fontSize="medium">receipt_long</Icon>,
    noCollapse: true,
    roles: ["god"],
  },
];

export default routes;