import { useEffect, useState } from "react";

import { health } from "./services/api";

function App() {
  const [status, setStatus] = useState("cargando...");

  useEffect(() => {
    health()
      .then((r) => setStatus(r.status))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <main className="min-h-screen grid place-items-center">
      <div className="p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-bold mb-2">StudyForge</h1>
        <p>API status: {status}</p>
      </div>
    </main>
  );
}
export default App;

