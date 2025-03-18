// f4cetPanel/lib/useWalletRedirect.js
import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useWallet } from "@solana/wallet-adapter-react";

export function useWalletRedirect() {
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const lastPathRef = useRef(null);

  useEffect(() => {
    const currentPath = router.pathname;

    // Avoid redirect if already on the correct page
    if (!connected || !publicKey) {
      if (currentPath !== "/" && lastPathRef.current !== "/") {
        router.replace("/");
        lastPathRef.current = "/";
      }
    } else if (currentPath === "/") {
      router.replace("/dashboard/analytics");
      lastPathRef.current = "/dashboard/analytics";
    } else {
      lastPathRef.current = currentPath; // Update last path only if no redirect
    }
  }, [connected, publicKey, router]); // Dependencies only on wallet state
}