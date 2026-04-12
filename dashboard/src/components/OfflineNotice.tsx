import { useState, useEffect } from "react";

/**
 * Offline-indikator — vises når netværksforbindelsen mistes.
 * Vigtigt for klinisk brug: klinikeren skal vide hvis data ikke kan synkroniseres.
 */
export default function OfflineNotice() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 text-sm z-50">
      Ingen internetforbindelse — data kan ikke synkroniseres
    </div>
  );
}
