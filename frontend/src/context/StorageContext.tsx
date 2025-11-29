// frontend/src/context/StorageContext.tsx
/**
 * Context para manejar el estado del almacenamiento del usuario.
 *
 * IMPORTANTE: Permite que QuotaWidget se actualice automáticamente cuando:
 * - El usuario sube un documento
 * - El usuario elimina un documento
 * - Cualquier operación que afecte el almacenamiento
 */
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { getStorageInfo } from "@/services/api";
import type { StorageInfo } from "@/types";

interface StorageContextType {
  storageInfo: StorageInfo | null;
  isLoading: boolean;
  error: string | null;
  refreshStorage: () => Promise<void>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function StorageProvider({ children }: { children: ReactNode }) {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStorage = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getStorageInfo();
      setStorageInfo(data);
    } catch (err) {
      console.error("Error loading storage info:", err);
      setError("Error al cargar información de almacenamiento");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <StorageContext.Provider value={{ storageInfo, isLoading, error, refreshStorage }}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error("useStorage must be used within a StorageProvider");
  }
  return context;
}
