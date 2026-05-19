import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Layout from "./components/Layout";
import ActiveMemberGate from "./components/ActiveMemberGate";
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
import FallSongs from "./pages/FallSongs";
import SendEmail from "./pages/SendEmail";
import LocationChat from "./pages/LocationChat";
import ManageMembers from "./pages/ManageMembers";
import MemberDetail from "./pages/MemberDetail";
import PaymentSuccess from "./pages/PaymentSuccess";
import ResetPassword from "./pages/ResetPassword";
import SignedUpUsers from "./pages/SignedUpUsers";
import Subscribe from "./pages/Subscribe";

import PopupStudio77 from "./pages/PopupStudio77";
import PopupReservations from "./pages/PopupReservations";
import CheckIn from "./pages/CheckIn";
import About from "./pages/About";
import Register from "./pages/Register";

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
            <Route path="/this-week" element={<ActiveMemberGate><ThisWeek /></ActiveMemberGate>} />
            <Route path="/schedule/:locationSlug" element={<ActiveMemberGate><LocationSchedule /></ActiveMemberGate>} />
            <Route path="/community" element={<ActiveMemberGate><Community /></ActiveMemberGate>} />
            <Route path="/events" element={<Events />} />
            <Route path="/register" element={<Register />} />
            <Route path="/resources" element={<ActiveMemberGate><Resources /></ActiveMemberGate>} />
            <Route path="/resources/fall-2026" element={<ActiveMemberGate><FallSongs /></ActiveMemberGate>} />
            <Route path="/corporate" element={<Corporate />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/try" element={<TryASession />} />
            <Route path="/bring-a-friend" element={<BringAFriend />} />
            <Route path="/send-email" element={<SendEmail />} />
            <Route path="/chat" element={<ActiveMemberGate><LocationChat /></ActiveMemberGate>} />
            <Route path="/manage-members" element={<ManageMembers />} />
            <Route path="/manage-members/:memberId" element={<MemberDetail />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/signed-up-users" element={<SignedUpUsers />} />
            <Route path="/subscribe" element={<Subscribe />} />
            
            <Route path="/popup/studio-77" element={<PopupStudio77 />} />
            <Route path="/popup-reservations" element={<PopupReservations />} />
            <Route path="/checkin/:token" element={<CheckIn />} />
            <Route path="/about" element={<About />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
