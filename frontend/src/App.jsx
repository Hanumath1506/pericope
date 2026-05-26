import { useState } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PaperView from "./pages/PaperView";
import DemoView from "./pages/DemoView";
import "./index.css";

function AppInner() {
  const { user, loading } = useAuth();
  const [activePaper, setActivePaper] = useState(null);
  const [demoMode, setDemoMode] = useState(false);

  if (loading) {
    return (
      <div className="loader-screen">
        <div className="loader-dot" />
      </div>
    );
  }

  if (!user && demoMode) {
    return <DemoView onSignIn={() => setDemoMode(false)} />;
  }

  if (!user) {
    return <Login onTryDemo={() => setDemoMode(true)} />;
  }

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