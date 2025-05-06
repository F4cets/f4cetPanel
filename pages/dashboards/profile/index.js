/**
=========================================================
* F4cetPanel - User Profile Page
=========================================================

* Copyright 2023 F4cets Team
*/

// React imports
import { useEffect } from "react";
import { useRouter } from "next/router";

// User context
import { useUser } from "/contexts/UserContext";

// @mui material components
import Grid from "@mui/material/Grid";

// @mui icons
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";
import ProfileInfoCard from "/examples/Cards/InfoCards/ProfileInfoCard";

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

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mb={2} />
      <MDBox mt={5} mb={3}>
        <Grid container spacing={1} justifyContent="center">
          <Grid item xs={12} md={6} xl={4}>
            <ProfileInfoCard
              title="profile information"
              description="Manage your wallet and personal details for the F4cet platform."
              info={{
                fullName: profile.name || "User",
                wallet: `${walletId.slice(0, 6)}...${walletId.slice(-4)}`,
                email: profile.email || "Not set",
                location: "Web3",
              }}
              social={[
                {
                  link: "https://twitter.com/f4cets",
                  icon: <TwitterIcon />,
                  color: "twitter",
                },
                {
                  link: "https://www.instagram.com/f4cets/",
                  icon: <InstagramIcon />,
                  color: "instagram",
                },
              ]}
              action={{
                route: "/dashboards/settings",
                tooltip: "Edit Profile",
                label: "Edit",
              }}
              shadow={false}
            />
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Profile;