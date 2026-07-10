"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/db";

/**
 * Checks if the user is authenticated.
 * Redirects to /login if not.
 * Returns { isAuthorized, isChecking }.
 */
export function useRequireAuth() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    auth.getSession().then((loggedIn) => {
      if (!loggedIn) {
        router.replace("/login");
      } else {
        setIsAuthorized(true);
      }
      setIsChecking(false);
    });
  }, [router]);

  return { isAuthorized, isChecking };
}
