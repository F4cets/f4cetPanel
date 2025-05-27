/**
=========================================================
* F4cetPanel - Account Settings Page
=========================================================

* Copyright 2025 F4cets Team
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

// Data (Replace with Firestore data later)
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
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUserData((prev) => ({ ...prev, avatar: file }));
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
      <MDBox py={3} px={{ xs: 2, sm: 3, md: 4 }}>
        <Grid container justifyContent="center">
          <Grid item xs={12} md={8} lg={6}>
            <Card sx={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", borderRadius: "12px" }}>
              <MDBox
                pt={4}
                pb={3}
                px={3}
                component="form"
                role="form"
                onSubmit={handleSubmit}
              >
                <MDBox mb={3} textAlign="center">
                  <MDTypography variant="h4" color="dark" fontWeight="bold">
                    Account Settings
                  </MDTypography>
                  <MDTypography variant="body2" color="text">
                    Add / Update your profile information
                  </MDTypography>
                </MDBox>
                <MDBox mb={3}>
                  <Grid container spacing={3}>
                    {/* Username */}
                    <Grid item xs={12} sm={6}>
                      <MDBox>
                        <MDTypography variant="button" color="dark" fontWeight="medium" mb={1}>
                          Username
                        </MDTypography>
                        <MDInput
                          type="text"
                          name="username"
                          value={userData.username}
                          onChange={handleInputChange}
                          fullWidth
                          placeholder="Enter your username"
                          variant="outlined"
                          sx={{ backgroundColor: "#f9fafb", borderRadius: "8px" }}
                        />
                      </MDBox>
                    </Grid>
                    {/* Email */}
                    <Grid item xs={12} sm={6}>
                      <MDBox>
                        <MDTypography variant="button" color="dark" fontWeight="medium" mb={1}>
                          Email Address
                        </MDTypography>
                        <MDInput
                          type="email"
                          name="email"
                          value={userData.email}
                          onChange={handleInputChange}
                          fullWidth
                          placeholder="Enter your email"
                          variant="outlined"
                          sx={{ backgroundColor: "#f9fafb", borderRadius: "8px" }}
                        />
                      </MDBox>
                    </Grid>
                    {/* Shipping Address */}
                    <Grid item xs={12}>
                      <MDBox>
                        <MDTypography variant="button" color="dark" fontWeight="medium" mb={1}>
                          Shipping Address
                        </MDTypography>
                        <MDInput
                          type="text"
                          name="shippingAddress"
                          value={userData.shippingAddress}
                          onChange={handleInputChange}
                          fullWidth
                          placeholder="Enter your global shipping address"
                          variant="outlined"
                          multiline
                          rows={4}
                          sx={{ backgroundColor: "#f9fafb", borderRadius: "8px" }}
                        />
                        <MDTypography variant="caption" color="text" mt={1}>
                          Example:<br />
                          1234 Main St.<br />
                          Portland OR 97103<br />
                          United States
                        </MDTypography>
                      </MDBox>
                    </Grid>
                    {/* Avatar Upload */}
                    <Grid item xs={12}>
                      <MDBox>
                        <MDTypography variant="button" color="dark" fontWeight="medium" mb={1}>
                          Avatar Picture
                        </MDTypography>
                        <MDInput
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          fullWidth
                          variant="outlined"
                          sx={{ backgroundColor: "#f9fafb", borderRadius: "8px" }}
                        />
                        {avatarPreview && (
                          <MDBox mt={2} textAlign="center">
                            <img
                              src={avatarPreview}
                              alt="Avatar Preview"
                              style={{
                                width: "120px",
                                height: "120px",
                                borderRadius: "50%",
                                border: "2px solid #e0e0e0",
                              }}
                            />
                          </MDBox>
                        )}
                      </MDBox>
                    </Grid>
                  </Grid>
                </MDBox>
                <MDBox display="flex" justifyContent="center">
                  <MDButton
                    type="submit"
                    color="info"
                    variant="gradient"
                    size="large"
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontWeight: "bold",
                      borderRadius: "10px",
                      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                      "&:hover": { boxShadow: "0 6px 15px rgba(0, 0, 0, 0.2)" },
                    }}
                  >
                    Save Settings
                  </MDButton>
                </MDBox>
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