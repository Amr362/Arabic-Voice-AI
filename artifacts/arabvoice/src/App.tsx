import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import "@/lib/auth";

// Pages
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import GeneratePage from "@/pages/dashboard/GeneratePage";
import ClonePage from "@/pages/dashboard/ClonePage";
import HistoryPage from "@/pages/dashboard/HistoryPage";
import SubscriptionPage from "@/pages/dashboard/SubscriptionPage";
import ProfilePage from "@/pages/dashboard/ProfilePage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />

      <Route path="/dashboard">
        {() => <ProtectedRoute component={DashboardHome} />}
      </Route>
      <Route path="/dashboard/generate">
        {() => <ProtectedRoute component={GeneratePage} />}
      </Route>
      <Route path="/dashboard/clone">
        {() => <ProtectedRoute component={ClonePage} />}
      </Route>
      <Route path="/dashboard/history">
        {() => <ProtectedRoute component={HistoryPage} />}
      </Route>
      <Route path="/dashboard/subscription">
        {() => <ProtectedRoute component={SubscriptionPage} />}
      </Route>
      <Route path="/dashboard/profile">
        {() => <ProtectedRoute component={ProfilePage} />}
      </Route>
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminPage} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
