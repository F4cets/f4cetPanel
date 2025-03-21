/**
=========================================================
* F4cetPanel - Account Settings Page
=========================================================

* Copyright 2023 F4cets Team
*/

// React imports
import { useState } from "react";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
import MDInput from "/components/MDInput";
import MDButton from "/components/MDButton";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";

// Mock Data (Replace with Firestore data later)
const initialUserData = {
  username: "",
  shippingAddress: "",
  email: "",
  avatar: null,
};

function AccountSettings() {
  const [userData, setUserData] = useState(initialUserData);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUserData(prev => ({ ...prev, avatar: file }));
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock save action (Replace with Firestore update later)
    console.log("Saving user data:", userData);
    alert("Settings saved successfully! (Mock action)");
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
              >
                <MDTypography variant="h6" color="white">
                  Account Settings
                </MDTypography>
              </MDBox>
              <MDBox p={3}>
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    {/* Username */}
                    <Grid item xs={12} md={6}>
                      <MDBox mb={2}>
                        <MDTypography variant="button" color="dark" fontWeight="medium">
                          Username
                        </MDTypography>
                        <MDInput
                          type="text"
                          name="username"
                          value={userData.username}
                          onChange={handleInputChange}
                          fullWidth
                          placeholder="Enter your username"
                          variant="standard"
                        />
                      </MDBox>
                    </Grid>
                    {/* Email */}
                    <Grid item xs={12} md={6}>
                      <MDBox mb={2}>
                        <MDTypography variant="button" color="dark" fontWeight="medium">
                          Email Address
                        </MDTypography>
                        <MDInput
                          type="email"
                          name="email"
                          value={userData.email}
                          onChange={handleInputChange}
                          fullWidth
                          placeholder="Enter your email"
                          variant="standard"
                        />
                      </MDBox>
                    </Grid>
                    {/* Shipping Address */}
                    <Grid item xs={12}>
                      <MDBox mb={2}>
                        <MDTypography variant="button" color="dark" fontWeight="medium">
                          Shipping Address
                        </MDTypography>
                        <MDInput
                          type="text"
                          name="shippingAddress"
                          value={userData.shippingAddress}
                          onChange={handleInputChange}
                          fullWidth
                          placeholder="Enter your global shipping address"
                          variant="standard"
                          multiline
                          rows={3}
                        />
                      </MDBox>
                    </Grid>
                    {/* Avatar Upload */}
                    <Grid item xs={12}>
                      <MDBox mb={2}>
                        <MDTypography variant="button" color="dark" fontWeight="medium">
                          Avatar Picture
                        </MDTypography>
                        <MDBox mt={1}>
                          <MDInput
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            fullWidth
                            variant="standard"
                          />
                          {avatarPreview && (
                            <MDBox mt={2}>
                              <img
                                src={avatarPreview}
                                alt="Avatar Preview"
                                style={{ width: "100px", height: "100px", borderRadius: "50%" }}
                              />
                            </MDBox>
                          )}
                        </MDBox>
                      </MDBox>
                    </Grid>
                  </Grid>
                  <MDBox mt={4} mb={1}>
                    <MDButton type="submit" variant="gradient" color="info" fullWidth>
                      Save Settings
                    </MDButton>
                  </MDBox>
                </form>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default AccountSettings;