import { AppProvider } from "@/context/AppContext";
import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
}
