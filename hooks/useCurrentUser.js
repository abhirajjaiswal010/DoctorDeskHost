// hooks/useCurrentUser.js
"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export function useCurrentUser() {
  const { user, isLoaded } = useUser();
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const roleFromMetadata =
      user.publicMetadata?.role ||
      user.privateMetadata?.role ||
      null;

    setRole(roleFromMetadata);
  }, [isLoaded, user]);

  return {
    user,
    role,
    isLoaded,
  };
}
