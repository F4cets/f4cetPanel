/**
=========================================================
* F4cetPanel - User Context for Managing Wallet and Role
=========================================================

* Copyright 2023 F4cets Team
*/

import { createContext, useContext, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { db } from "/lib/firebase";

const UserContext = createContext(null);

export function UserContextProvider({ children }) {
  const { publicKey, connected } = useWallet();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (connected && publicKey) {
        const walletId = publicKey.toString();
        console.log("UserContext: Fetching user data for wallet:", walletId);
        try {
          const userDoc = await getDoc(doc(db, "users", walletId));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({
              walletId,
              role: data.role || "buyer",
              profile: {
                name: data.name || "User",
                avatar: data.avatar || "/assets/images/default-avatar.png",
                email: data.email || "",
              },
            });
            console.log("UserContext: User data fetched:", { walletId, role: data.role });
          } else {
            console.log("UserContext: No user found, defaulting to buyer");
            setUser({
              walletId,
              role: "buyer",
              profile: {
                name: "User",
                avatar: "/assets/images/default-avatar.png",
                email: "",
              },
            });
          }
        } catch (error) {
          console.error("UserContext: Error fetching user data:", error);
          setUser(null);
        }
      } else {
        console.log("UserContext: No wallet connected, clearing user data");
        setUser(null);
      }
    };
    fetchUser();
  }, [connected, publicKey]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}