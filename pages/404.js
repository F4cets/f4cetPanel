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

import { useEffect } from "react";
import Router from "next/router";

export default function Custom404() {
  useEffect(() => {
    Router.push("/"); // Redirect to base page instead of /dashboards/analytics
  }, []);

  return <div />;
}