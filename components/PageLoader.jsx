"use client";
import { useState, useEffect } from "react";
import { HashLoader } from "react-spinners";

export default function PageLoader({ children }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading or wait for data
    const timer = setTimeout(() => setLoading(false), 1500); // 1.5s
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-background z-50">
        <HashLoader color="#6ba49f" size={60} />
      </div>
    );
  }

  return children;
}
