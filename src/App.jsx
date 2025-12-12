import React from "react";
import { SessionProvider, useSession } from "./context/SessionContext";
import LoginScreen from "./components/LoginScreen";
import MainLayout from "./components/layout/MainLayout";

const Root = () => {
  const { isAuthenticated } = useSession();

  if (!isAuthenticated) return <LoginScreen />;
  return <MainLayout />;
};

export default function App() {
  return (
    <SessionProvider>
      <Root />
    </SessionProvider>
  );
}
