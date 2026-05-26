import { useState } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PaperView from "./pages/PaperView";
import "./index.css";

function AppInner() {
  const { user, loading } = useAuth();
  const [activePaper, setActivePaper] = useState(null);

  if (loading) {
    return (
      <div className="loader-screen">
        <div className="loader-dot" />
      </div>
    );
  }

  if (!user) return <Login />;

  if (activePaper)
    return <PaperView paper={activePaper} onBack={() => setActivePaper(null)} />;

  return <Dashboard onOpenPaper={setActivePaper} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}