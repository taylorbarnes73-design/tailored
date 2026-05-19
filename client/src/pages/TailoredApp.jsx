import React, { useEffect } from "react";
import { useLocation } from "wouter";
import Landing from "./Landing";

// The /app route used to be a full app shell. The product is now a website
// tool — there is no app dashboard. Redirect any /app traffic to the main
// site and render the same website content so links don't 404.
export default function TailoredApp() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/");
  }, [setLocation]);
  return <Landing />;
}
