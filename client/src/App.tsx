import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { BusinessProvider } from "./contexts/BusinessContext";
import { ProductProvider } from "./contexts/ProductContext";
import { SalesProvider } from "./contexts/SalesContext";
import { ExpensesProvider } from "./contexts/ExpensesContext";

// Auth Pages
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import Setup from "./pages/Auth/Setup";

// Dashboard Pages
import DashboardHome from "./pages/Dashboard/Home";
import Inventory from "./pages/Dashboard/Inventory";
import Sales from "./pages/Dashboard/Sales";
import Expenses from "./pages/Dashboard/Expenses";
import Reports from "./pages/Dashboard/Reports";
import Staff from "./pages/Dashboard/Staff";
import Settings from "./pages/Dashboard/Settings";

// Placeholder Pages
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/setup" component={Setup} />

      {/* Dashboard Routes */}
      <Route path="/dashboard" component={DashboardHome} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/sales" component={Sales} />
      <Route path="/expenses" component={Expenses} />
      <Route path="/reports" component={Reports} />
      <Route path="/staff" component={Staff} />
      <Route path="/settings" component={Settings} />

      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={Login} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <BusinessProvider>
            <ProductProvider>
              <SalesProvider>
                <ExpensesProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Router />
                  </TooltipProvider>
                </ExpensesProvider>
              </SalesProvider>
            </ProductProvider>
          </BusinessProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
