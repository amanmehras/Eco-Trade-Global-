import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import BuyerDashboard from "@/pages/BuyerDashboard";
import ShipperDashboard from "@/pages/ShipperDashboard";
import ProductsPage from "@/pages/ProductsPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import RFQsPage from "@/pages/RFQsPage";
import MessagesPage from "@/pages/MessagesPage";
import OrdersPage from "@/pages/OrdersPage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import PaymentCancelPage from "@/pages/PaymentCancelPage";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            setUser(data);
          }
        })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const ProtectedRoute = ({ children, role }) => {
    if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    if (!user) return <Navigate to="/auth" />;
    if (role && user.role !== role) return <Navigate to="/" />;
    return children;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage user={user} />} />
          <Route path="/auth" element={<AuthPage setUser={setUser} />} />
          <Route path="/products" element={<ProductsPage user={user} />} />
          <Route path="/products/:id" element={<ProductDetailPage user={user} />} />
          <Route path="/rfqs" element={<RFQsPage user={user} />} />
          <Route path="/messages" element={
            <ProtectedRoute><MessagesPage user={user} /></ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute><OrdersPage user={user} /></ProtectedRoute>
          } />
          <Route path="/buyer/dashboard" element={
            <ProtectedRoute role="buyer"><BuyerDashboard user={user} /></ProtectedRoute>
          } />
          <Route path="/shipper/dashboard" element={
            <ProtectedRoute role="shipper"><ShipperDashboard user={user} setUser={setUser} /></ProtectedRoute>
          } />
          <Route path="/payment/success" element={
            <ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>
          } />
          <Route path="/payment/cancel" element={
            <ProtectedRoute><PaymentCancelPage /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
