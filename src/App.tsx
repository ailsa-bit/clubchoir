import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import ThisWeek from "./pages/ThisWeek";
import Community from "./pages/Community";
import Events from "./pages/Events";
import Corporate from "./pages/Corporate";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import TryASession from "./pages/TryASession";
import BringAFriend from "./pages/BringAFriend";
import NotFound from "./pages/NotFound";
import LocationSchedule from "./pages/LocationSchedule";
import Resources from "./pages/Resources";
import SendEmail from "./pages/SendEmail";
import LocationChat from "./pages/LocationChat";
import ManageMembers from "./pages/ManageMembers";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/this-week" element={<ThisWeek />} />
            <Route path="/schedule/:locationSlug" element={<LocationSchedule />} />
            <Route path="/community" element={<Community />} />
            <Route path="/events" element={<Events />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/corporate" element={<Corporate />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/try" element={<TryASession />} />
            <Route path="/bring-a-friend" element={<BringAFriend />} />
            <Route path="/send-email" element={<SendEmail />} />
            <Route path="/chat" element={<LocationChat />} />
            <Route path="/manage-members" element={<ManageMembers />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
