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

// Sales dashboard components
import ProductCell from "/pagesComponents/dashboards/sales/components/ProductCell";
import RefundsCell from "/pagesComponents/dashboards/sales/components/RefundsCell";
import DefaultCell from "/pagesComponents/dashboards/sales/components/DefaultCell";

// Images
import nikeV22 from "/assets/images/ecommerce/blue-shoe.jpeg";
import businessKit from "/assets/images/ecommerce/black-mug.jpeg";
import blackChair from "/assets/images/ecommerce/black-chair.jpeg";
import wirelessCharger from "/assets/images/ecommerce/bang-sound.jpeg";
import tripKit from "/assets/images/ecommerce/photo-tools.jpeg";

const dataTableData = {
  columns: [
    { Header: "product", accessor: "product", width: "55%" },
    { Header: "value", accessor: "value" },
    { Header: "ads spent", accessor: "adsSpent", align: "center" },
    { Header: "refunds", accessor: "refunds", align: "center" },
  ],

  rows: [
    {
      product: (
        <ProductCell image={nikeV22} name="Nike v22 Running" orders={8.0} />
      ),
      value: <DefaultCell>$130.99</DefaultCell>,
      adsSpent: <DefaultCell>$9.50</DefaultCell>,
      refunds: (
        <RefundsCell
          value={1}
          icon={{ color: "success", name: "keyboard_arrow_up" }}
        />
      ),
    },
    {
      product: (
        <ProductCell
          image={businessKit}
          name="Business Kit (Mug + Notebook)"
          orders={13.0}
        />
      ),
      value: <DefaultCell>$80.25</DefaultCell>,
      adsSpent: <DefaultCell>$4.20</DefaultCell>,
      refunds: (
        <RefundsCell
          value={4}
          icon={{ color: "error", name: "keyboard_arrow_down" }}
        />
      ),
    },
    {
      product: (
        <ProductCell image={blackChair} name="Black Chair" orders={3.0} />
      ),
      value: <DefaultCell>$40.60</DefaultCell>,
      adsSpent: <DefaultCell>$9.43</DefaultCell>,
      refunds: (
        <RefundsCell
          value={1}
          icon={{ color: "success", name: "keyboard_arrow_up" }}
        />
      ),
    },
    {
      product: (
        <ProductCell
          image={wirelessCharger}
          name="Wireless Charger"
          orders={5.0}
        />
      ),
      value: <DefaultCell>$91.30</DefaultCell>,
      adsSpent: <DefaultCell>$7.36</DefaultCell>,
      refunds: (
        <RefundsCell
          value={5}
          icon={{ color: "error", name: "keyboard_arrow_down" }}
        />
      ),
    },
    {
      product: (
        <ProductCell
          image={tripKit}
          name="Mountain Trip Kit (Camera + Backpack)"
          orders={921}
        />
      ),
      value: <DefaultCell>$140.92</DefaultCell>,
      adsSpent: <DefaultCell>$20.53</DefaultCell>,
      refunds: (
        <RefundsCell
          value={2}
          icon={{ color: "success", name: "keyboard_arrow_up" }}
        />
      ),
    },
  ],
};

export default dataTableData;
