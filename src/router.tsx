import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import Pricing from "./pages/Pricing";
import Account from "./pages/Account";
import Legal from "./pages/Legal";

export const routers = [
    {
      path: "/",
      name: 'home',
      element: <Home />,
    },
    {
      path: "/create",
      name: 'create',
      element: <Index />,
    },
    {
      path: "/pricing",
      name: 'pricing',
      element: <Pricing />,
    },
    {
      path: "/account",
      name: 'account',
      element: <Account />,
    },
    {
      path: "/terms",
      name: 'terms',
      element: <Legal />,
    },
    {
      path: "/privacy",
      name: 'privacy',
      element: <Legal />,
    },
    {
      path: "/refund",
      name: 'refund',
      element: <Legal />,
    },
    /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
    {
      path: "*",
      name: '404',
      element: <NotFound />,
    },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
