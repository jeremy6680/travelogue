import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import AtlasPage from "@/pages/atlas";
import DataVizPage from "@/pages/dataviz";
import PostsPage from "@/pages/posts/index";
import PostDetail from "@/pages/posts/detail";
import TripsPage from "@/pages/trips/index";
import EventsPage from "@/pages/events";
import AdminPage from "@/pages/admin";
import GalleryPage from "@/pages/gallery";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/atlas" component={AtlasPage} />
      <Route path="/dataviz" component={DataVizPage} />
      <Route path="/posts" component={PostsPage} />
      <Route path="/posts/:slug" component={PostDetail} />
      <Route path="/trips" component={TripsPage} />
      <Route path="/events" component={EventsPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/galeries/:slug" component={GalleryPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
