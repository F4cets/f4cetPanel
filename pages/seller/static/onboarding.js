/**
 * Seller Onboarding Page for f4cetPanel
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useWallet } from "@solana/wallet-adapter-react";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import MDBox from "/components/MDBox";
import MDInput from "/components/MDInput";
import MDButton from "/components/MDButton";
import DashboardLayout from "/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "/examples/Navbars/DashboardNavbar";
import { db, storage } from "/lib/firebase";

export default function SellerOnboarding({ walletId }) {
  const router = useRouter();
  const { publicKey } = useWallet();
  const [form, setForm] = useState({ storeName: "", storeDescription: "", shopEmail: "" });
  const [image, setImage] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debug wallet and role
  useEffect(() => {
    console.log("Onboarding: Starting role fetch - Wallet ID from props:", walletId, "PublicKey:", publicKey?.toString());
    const checkRole = async () => {
      try {
        if (!walletId) {
          throw new Error("Wallet ID is missing from props");
        }
        if (!publicKey) {
          throw new Error("PublicKey is missing - wallet not connected");
        }
        if (publicKey.toString() !== walletId) {
          throw new Error("Connected wallet does not match the wallet ID in the URL");
        }

        console.log("Onboarding: Fetching user role for wallet:", walletId);
        const userDoc = await getDoc(doc(db, "users", walletId));
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
  }, [walletId, publicKey]);

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

  if (!publicKey || publicKey.toString() !== walletId) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox p={3}>
          <h2>Connect your wallet to continue</h2>
          <p>Expected Wallet ID: {walletId}</p>
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
        const imageRef = ref(storage, `stores/${walletId}/${image.name}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }
      await setDoc(doc(db, "sellers", walletId), {
        storeName: form.storeName,
        storeDescription: form.storeDescription,
        shopEmail: form.shopEmail,
        storeImage: imageUrl,
        createdAt: new Date(),
      });
      await setDoc(doc(db, "users", walletId), { role: "seller" }, { merge: true });
      router.push(`/seller/${walletId}`);
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
        <p>Debug: Wallet ID: {walletId}, Role: {userRole || "Loading..."}</p>
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

export async function getServerSideProps({ params }) {
  console.log("getServerSideProps: Params:", params);
  if (!params || !params.walletId) {
    return {
      notFound: true,
    };
  }
  return {
    props: {
      walletId: params.walletId,
    },
  };
}