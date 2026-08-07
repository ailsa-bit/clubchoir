import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { captureAttribution } from "@/lib/attribution";

/**
 * Captures UTM / referrer attribution on first load and on every route change.
 * Mounted once inside the router (see App.tsx).
 */
const AttributionTracker = () => {
  const location = useLocation();

  useEffect(() => {
    captureAttribution();
  }, [location.pathname, location.search]);

  return null;
};

export default AttributionTracker;
