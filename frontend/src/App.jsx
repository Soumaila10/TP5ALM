import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CataloguePage from './pages/CataloguePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OTPPage from './pages/OTPPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import MatchDetailsPage from './pages/MatchDetailsPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import TicketPage from './pages/TicketPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/admin/DashboardPage';
import MatchManagementPage from './pages/admin/MatchManagementPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Catalogue / Home */}
        <Route path="/" element={<CataloguePage />} />
        
        {/* Authentication Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<OTPPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* User Profile */}
        <Route path="/profile" element={<ProfilePage />} />

        {/* Match Details & Seat selection */}
        <Route path="/matches/:id" element={<MatchDetailsPage />} />

        {/* Checkout & Payment */}
        <Route path="/checkout" element={<CheckoutPage />} />

        {/* Order History & Tickets */}
        <Route path="/orders" element={<OrderHistoryPage />} />
        <Route path="/orders/:id" element={<TicketPage />} />

        {/* Administration Routes */}
        <Route path="/admin" element={<DashboardPage />} />
        <Route path="/admin/matches" element={<MatchManagementPage />} />

        {/* Fallback to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

