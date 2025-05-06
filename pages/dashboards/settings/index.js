/**
=========================================================
* F4cetPanel - Account Settings Page
=========================================================

* Copyright 2023 F4cets Team
*/

// React imports
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

// User context
import { useUser } from "/contexts/UserContext";

// Firebase imports
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "/lib/firebase";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDTypography from "/components/MDTypography";
import MDInput from "/components/MDInput";
import MDButton from "/components/MDButton";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import Footer from "/examples/Footer";

function AccountSettings() {
  const { user, setUser } = useUser();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
  });
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Redirect to home if no user or walletId
  useEffect(() => {
    if (!user || !user.walletId) {
      router.replace("/");
    } else {
      // Initialize form with user data
      setForm({
        name: user.profile.name || "",
        email: user.profile.email || "",
      });
    }
  }, [user, router]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      let avatarUrl = user.profile.avatar || "/assets/images/default-avatar.png";
      if (avatar) {
        const avatarRef = ref(storage, `avatars/${user.walletId}/${avatar.name}`);
        await uploadBytes(avatarRef, avatar);
        avatarUrl = await getDownloadURL(avatarRef);
      }

      // Update Firebase
      await setDoc(
        doc(db, "users", user.walletId),
        {
          name: form.name,
          email: form.email,
          avatar: avatarUrl,
        },
        { merge: true }
      );

      // Update UserContext
      setUser({
        ...user,
        profile: {
          ...user.profile,
          name: form.name,
          email: form.email,
          avatar: avatarUrl,
        },
      });

      setSuccess("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile: " + err.message);
    }
  };

  // Ensure user is loaded before rendering
  if (!user || !user.walletId) {
    return null; // Or a loading spinner
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} md={6}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h5" mb={3}>
                  Account Settings
                </MDTypography>
                {error && (
                  <MDTypography variant="body2" color="error" mb={2}>
                    {error}
                  </MDTypography>
                )}
                {success && (
                  <MDTypography variant="body2" color="success" mb={2}>
                    {success}
                  </MDTypography>
                )}
                <form onSubmit={handleSubmit}>
                  <MDBox mb={2}>
                    <MDInput
                      label="Full Name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      fullWidth
                      required
                    />
                  </MDBox>
                  <MDBox mb={2}>
                    <MDInput
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      fullWidth
                      required
                    />
                  </MDBox>
                  <MDBox mb={2}>
                    <MDInput
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatar(e.target.files[0])}
                      fullWidth
                    />
                  </MDBox>
                  <MDBox display="flex" justifyContent="center">
                    <MDButton type="submit" color="primary" variant="gradient">
                      Save Changes
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