/**
=========================================================
* F4cetPanel - User Profile Page
=========================================================

* Copyright 2025 F4cets Team
*/

// React imports
import { useEffect } from "react";
import { useRouter } from "next/router";

// User context
import { useUser } from "/contexts/UserContext";

// Firebase imports
import { db } from "/lib/firebase";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
import MDButton from "/components/MDButton";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";

function Profile() {
  const { user } = useUser();
  const router = useRouter();

  // Redirect to home if no user or walletId
  useEffect(() => {
    if (!user || !user.walletId) {
      router.replace("/");
    }
  }, [user, router]);

  // Ensure user is loaded before rendering
  if (!user || !user.walletId) {
    return null; // Or a loading spinner
  }

  const { profile, walletId } = user;

  // Handle Edit Profile navigation
  const handleEditProfile = () => {
    router.push("/dashboards/settings");
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={{ xs: 2, md: 3 }}>
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                overflow: "hidden",
              }}
            >
              <MDBox p={{ xs: 2, md: 3 }}>
                <MDTypography
                  variant="h5"
                  mb={{ xs: 2, md: 3 }}
                  sx={{
                    fontWeight: 600,
                    color: "#344767",
                    textAlign: { xs: "center", md: "left" },
                  }}
                >
                  Profile Information
                </MDTypography>
                <MDBox mb={3} display="flex" justifyContent="center">
                  <Avatar
                    src={profile.avatar || "/assets/images/default-avatar.png"}
                    sx={{
                      width: { xs: 80, md: 100 },
                      height: { xs: 80, md: 100 },
                      border: "3px solid #fff",
                      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                </MDBox>
                <Divider sx={{ mb: 3, backgroundColor: "rgba(0, 0, 0, 0.1)" }} />
                <MDBox mb={2}>
                  <MDTypography
                    variant="body2"
                    sx={{
                      color: "#344767",
                      fontWeight: 500,
                      mb: 1,
                      textAlign: { xs: "center", md: "left" },
                    }}
                  >
                    Full Name
                  </MDTypography>
                  <MDTypography
                    variant="body2"
                    sx={{
                      color: "#344767",
                      textAlign: { xs: "center", md: "left" },
                    }}
                  >
                    {profile.name || "Not set"}
                  </MDTypography>
                </MDBox>
                <MDBox mb={2}>
                  <MDTypography
                    variant="body2"
                    sx={{
                      color: "#344767",
                      fontWeight: 500,
                      mb: 1,
                      textAlign: { xs: "center", md: "left" },
                    }}
                  >
                    Email
                  </MDTypography>
                  <MDTypography
                    variant="body2"
                    sx={{
                      color: "#344767",
                      textAlign: { xs: "center", md: "left" },
                    }}
                  >
                    {profile.email || "Not set"}
                  </MDTypography>
                </MDBox>
                <MDBox mb={2}>
                  <MDTypography
                    variant="body2"
                    sx={{
                      color: "#344767",
                      fontWeight: 500,
                      mb: 1,
                      textAlign: { xs: "center", md: "left" },
                    }}
                  >
                    Wallet
                  </MDTypography>
                  <MDTypography
                    variant="body2"
                    sx={{
                      color: "#344767",
                      textAlign: { xs: "center", md: "left" },
                    }}
                  >
                    {`${walletId.slice(0, 6)}...${walletId.slice(-4)}`}
                  </MDTypography>
                </MDBox>
                <MDBox mb={3}>
                  <MDTypography
                    variant="body2"
                    sx={{
                      color: "#344767",
                      fontWeight: 500,
                      mb: 1,
                      textAlign: { xs: "center", md: "left" },
                    }}
                  >
                    Location
                  </MDTypography>
                  <MDTypography
                    variant="body2"
                    sx={{
                      color: "#344767",
                      textAlign: { xs: "center", md: "left" },
                    }}
                  >
                    Web3
                  </MDTypography>
                </MDBox>
                <Divider sx={{ mb: 3, backgroundColor: "rgba(0, 0, 0, 0.1)" }} />
                <MDBox mb={3} display="flex" justifyContent={{ xs: "center", md: "start" }}>
                  <MDButton
                    href="https://x.com/f4cetmarket"
                    target="_blank"
                    color="dark"
                    variant="outlined"
                    justIcon
                    sx={{
                      padding: { xs: "8px", md: "10px" }, // Reduced padding for icon-only
                      borderRadius: "8px",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                      },
                    }}
                  >
                    <img
                      src="/assets/images/x-logo.png"
                      alt="X"
                      style={{ width: "24px" }} // Increased size for visibility
                    />
                  </MDButton>
                </MDBox>
                <MDBox display="flex" justifyContent={{ xs: "center", md: "start" }}>
                  <MDButton
                    onClick={handleEditProfile}
                    color="primary"
                    variant="gradient"
                    sx={{
                      padding: { xs: "8px 24px", md: "10px 32px" },
                      borderRadius: "8px",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 12px rgba(63, 81, 181, 0.3)",
                      },
                    }}
                  >
                    Edit Profile
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

export default Profile;