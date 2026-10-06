import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Admin from "./pages/Admin";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminPasswordResetPage from "./pages/AdminPasswordResetPage";
import AdminInvitationPage from "./pages/AdminInvitationPage";
import BusinessCheck from "./pages/BusinessCheck";
import Home from "./pages/Home";
import Schedule from "./pages/Schedule";
import ParticipantDashboard from "./pages/ParticipantDashboard";
import ParticipantPasswordPage from "./pages/ParticipantPasswordPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/check" component={BusinessCheck} />
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin/reset" component={AdminPasswordResetPage} />
      <Route path="/admin/invite" component={AdminInvitationPage} />
      <Route path="/admin" component={Admin} />
      <Route path="/schedule" component={Schedule} />
      <Route path="/portal/password" component={ParticipantPasswordPage} />
      <Route path="/portal" component={ParticipantDashboard} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
