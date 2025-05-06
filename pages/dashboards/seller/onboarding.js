/**
=========================================================
* F4cetPanel - Seller Onboarding Page
=========================================================

* Copyright 2023 F4cets Team
*/

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useWallet } from "@solana/wallet-adapter-react";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// User context
import { useUser } from "/contexts/UserContext";

// NextJS Material Dashboard 2 PRO components
import MDBox from "/components/MDBox";
import MDInput from "/components/MDInput";
import MDButton from "/components/MDButton";

// NextJS Material Dashboard 2 PRO examples
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";

import { db, storage } from "/lib/firebase";

export default function SellerOnboarding() {
  const { user, setUser } = useUser();
  const router = useRouter();
  const { publicKey } = useWallet();
  const [form, setForm] = useState({ storeName: "", storeDescription: "", shopEmail: "" });
  const [image, setImage] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debug wallet and role
  useEffect(() => {
    console.log("Onboarding: Starting role fetch - Wallet ID from user:", user?.walletId, "PublicKey:", publicKey?.toString());
    const checkRole = async () => {
      try {
        if (!user || !user.walletId) {
          throw new Error("Wallet ID is missing from user context");
        }
        if (!publicKey) {
          throw new Error("PublicKey is missing - wallet not connected");
        }
        if (publicKey.toString() !== user.walletId) {
          throw new Error("Connected wallet does not match the wallet ID in user context");
        }

        console.log("Onboarding: Fetching user role for wallet:", user.walletId);
        const userDoc = await getDoc(doc(db, "users", user.walletId));
        if (userDoc.exists()) {
          const role = userDoc.data().role || "buyer";
          console.log("Onboarding: User Role:", role);
          setUserRole(role);
        } else {
          console.log("Onboarding: No user found in Firestore");
          setUserRole("buyer");
        }
        setLoading(false);
      } catch (err) {
        console.error("Onboarding: Error fetching role:", err.message);
        setError(err.message);
        setLoading(false);
      }
    };
    checkRole();
  }, [user, publicKey]);

  if (error) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox p={3}>
          <h2>Error in Seller Onboarding</h2>
          <p>{error}</p>
        </MDBox>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox p={3}>
          <h2>Loading Seller Onboarding...</h2>
        </MDBox>
      </DashboardLayout>
    );
  }

  if (!publicKey || !user || publicKey.toString() !== user.walletId) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox p={3}>
          <h2>Connect your wallet to continue</h2>
          <p>Expected Wallet ID: {user?.walletId || "Unknown"}</p>
          <p>Connected Wallet: {publicKey ? publicKey.toString() : "Not connected"}</p>
        </MDBox>
      </DashboardLayout>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = "";
      if (image) {
        const imageRef = ref(storage, `stores/${user.walletId}/${image.name}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }
      await setDoc(doc(db, "sellers", user.walletId), {
        storeName: form.storeName,
        storeDescription: form.storeDescription,
        shopEmail: form.shopEmail,
        storeImage: imageUrl,
        createdAt: new Date(),
      });
      await setDoc(doc(db, "users", user.walletId), { role: "seller" }, { merge: true });
      // Update UserContext with new role
      setUser({ ...user, role: "seller" });
      router.push("/dashboards/seller");
    } catch (error) {
      console.error("Error creating seller profile:", error);
      setError("Failed to create seller profile: " + error.message);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox p={3}>
        <h2>Seller Onboarding</h2>
        <p>Debug: Wallet ID: {user.walletId}, Role: {userRole || "Loading..."}</p>
        <form onSubmit={handleSubmit}>
          <MDInput
            label="Store Name"
            value={form.storeName}
            onChange={(e) => setForm({ ...form, storeName: e.target.value })}
            fullWidth
            required
          />
          <MDInput
            label="Store Description"
            value={form.storeDescription}
            onChange={(e) => setForm({ ...form, storeDescription: e.target.value })}
            multiline
            rows={4}
            fullWidth
            required
          />
          <MDInput
            label="Shop Email"
            type="email"
            value={form.shopEmail}
            onChange={(e) => setForm({ ...form, shopEmail: e.target.value })}
            fullWidth
            required
          />
          <MDInput
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
          />
          <MDButton type="submit" color="primary">Create Store</MDButton>
        </form>
      </MDBox>
    </DashboardLayout>
  );
}