import { useCallback } from "react";
import { db, ref, push, set } from "../firebaseConfig";

export default function useAuditTrail(currentUser = "Tidak Diketahui") {
  const logAction = useCallback(
    async (actionType, details = {}) => {
      try {
        const auditRef = push(ref(db, "auditTrail"));
        await set(auditRef, {
          user: currentUser || "Tidak Diketahui",
          action: actionType,
          timestamp: new Date().toISOString(),
          details,
        });
      } catch (err) {
        console.error("Audit trail gagal:", err);
      }
    },
    [currentUser]
  );

  return { logAction };
}
