import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider} from "react-router-dom";
import { routers } from "./router";
import { CommerceProvider } from "./contexts/CommerceContext";
import AuthDialog from "./components/commerce/AuthDialog";

const queryClient = new QueryClient();

// Must be outside the component — creating a new router on every render
// causes React Router to reset its state and corrupts the DOM (appendChild errors).
const router = createBrowserRouter(routers);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <CommerceProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <RouterProvider router={router} />
          <AuthDialog />
        </TooltipProvider>
      </CommerceProvider>
    </QueryClientProvider>
  )
};

export default App;
