import { useCallback } from "react";
import { db, ref, push, set } from "../firebaseConfig";

export default function useAuditTrail(currentUser = "Unknown") {
  const logAction = useCallback(
    async (actionType, details = {}) => {
      try {
        const auditRef = push(ref(db, "auditTrail"));
        await set(auditRef, {
          user: currentUser,
          action: actionType,
          timestamp: new Date().toISOString(),
          details,
        });
        console.log(`🧾 AuditTrail logged: ${actionType}`, details);
      } catch (err) {
        console.error("Gagal mencatat audit trail:", err);
      }
    },
    [currentUser]
  );

  return { logAction };
}
