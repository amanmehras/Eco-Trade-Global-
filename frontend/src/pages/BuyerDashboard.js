import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, FileText, MessageSquare, LogOut, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function BuyerDashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentRFQs, setRecentRFQs] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, ordersRes, rfqsRes] = await Promise.all([
        fetch(`${API}/stats/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API}/orders/buyer/my-orders`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API}/rfqs/buyer/my-rfqs`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (ordersRes.ok) setRecentOrders((await ordersRes.json()).slice(0, 5));
      if (rfqsRes.ok) setRecentRFQs((await rfqsRes.json()).slice(0, 5));
    } catch (error) {
      toast.error('Failed to load dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-[#F4F4F0]" data-testid="buyer-dashboard">
      {/* Navigation */}
      <nav className="bg-white border-b border-[#D1D1D1]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
              <Package className="w-8 h-8 text-[#2A5934]" />
              <span className="text-2xl font-bold">ECOTRADE GLOBAL</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link to="/products" className="text-[#595959] hover:text-[#1A1A1A] font-medium transition-colors">Products</Link>
              <Link to="/rfqs" className="text-[#595959] hover:text-[#1A1A1A] font-medium transition-colors">RFQs</Link>
              <Link to="/orders" className="text-[#595959] hover:text-[#1A1A1A] font-medium transition-colors">Orders</Link>
              <Link to="/messages" className="text-[#595959] hover:text-[#1A1A1A] font-medium transition-colors">Messages</Link>
              <Button onClick={handleLogout} variant="ghost" size="sm" data-testid="logout-button">
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2" data-testid="dashboard-title">Buyer Dashboard</h1>
          <p className="text-[#595959]" data-testid="welcome-message">Welcome back, {user?.contact_person}</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12" data-testid="stats-section">
            <Card className="industrial-card p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#595959] text-sm mb-1">Total Orders</p>
                  <p className="text-3xl font-bold mono text-[#1A1A1A]" data-testid="total-orders">{stats.total_orders}</p>
                </div>
                <Package className="w-12 h-12 text-[#2A5934]" />
              </div>
            </Card>
            <Card className="industrial-card p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#595959] text-sm mb-1">Active RFQs</p>
                  <p className="text-3xl font-bold mono text-[#1A1A1A]" data-testid="active-rfqs">{stats.active_rfqs}</p>
                </div>
                <FileText className="w-12 h-12 text-[#2A5934]" />
              </div>
            </Card>
            <Card className="industrial-card p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#595959] text-sm mb-1">Unread Messages</p>
                  <p className="text-3xl font-bold mono text-[#1A1A1A]" data-testid="unread-messages">{stats.unread_messages}</p>
                </div>
                <MessageSquare className="w-12 h-12 text-[#2A5934]" />
              </div>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/products" className="industrial-card bg-white p-6 border border-[#D1D1D1] rounded-sm hover:shadow-lg transition-all" data-testid="browse-products-action">
              <Package className="w-8 h-8 text-[#FF6B35] mb-3" />
              <h3 className="font-bold text-lg">Browse Products</h3>
              <p className="text-sm text-[#595959]">Find materials you need</p>
            </Link>
            <Link to="/rfqs?action=create" className="industrial-card bg-white p-6 border border-[#D1D1D1] rounded-sm hover:shadow-lg transition-all" data-testid="create-rfq-action">
              <Plus className="w-8 h-8 text-[#FF6B35] mb-3" />
              <h3 className="font-bold text-lg">Create RFQ</h3>
              <p className="text-sm text-[#595959]">Request quotations</p>
            </Link>
            <Link to="/orders" className="industrial-card bg-white p-6 border border-[#D1D1D1] rounded-sm hover:shadow-lg transition-all" data-testid="view-orders-action">
              <FileText className="w-8 h-8 text-[#FF6B35] mb-3" />
              <h3 className="font-bold text-lg">View Orders</h3>
              <p className="text-sm text-[#595959]">Track your orders</p>
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent Orders</h2>
            <Link to="/orders" className="text-[#2A5934] hover:underline font-medium">View All</Link>
          </div>
          {recentOrders.length > 0 ? (
            <Card className="border border-[#D1D1D1] rounded-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full table-zebra" data-testid="recent-orders-table">
                  <thead className="bg-[#1B365D] text-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-bold uppercase">Order ID</th>
                      <th className="px-6 py-3 text-left text-sm font-bold uppercase">Material</th>
                      <th className="px-6 py-3 text-left text-sm font-bold uppercase">Quantity</th>
                      <th className="px-6 py-3 text-left text-sm font-bold uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-sm font-bold uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 mono text-sm">{order.id.slice(0, 8)}</td>
                        <td className="px-6 py-4">{order.material_name}</td>
                        <td className="px-6 py-4">{order.quantity} {order.unit}</td>
                        <td className="px-6 py-4 mono">{order.total_amount} {order.currency}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${
                            order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>{order.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <p className="text-[#595959]" data-testid="no-orders">No orders yet</p>
          )}
        </div>

        {/* Recent RFQs */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">My RFQs</h2>
            <Link to="/rfqs" className="text-[#2A5934] hover:underline font-medium">View All</Link>
          </div>
          {recentRFQs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="recent-rfqs-grid">
              {recentRFQs.map((rfq) => (
                <Card key={rfq.id} className="industrial-card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-bold text-lg">{rfq.material_name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${
                      rfq.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>{rfq.status}</span>
                  </div>
                  <p className="text-sm text-[#595959] mb-2">Quantity: {rfq.quantity} {rfq.unit}</p>
                  <p className="text-sm text-[#595959] mb-2">Category: {rfq.category}</p>
                  <p className="text-sm text-[#595959]">Quotes received: {rfq.quotes?.length || 0}</p>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-[#595959]" data-testid="no-rfqs">No RFQs created yet</p>
          )}
        </div>
      </div>
    </div>
  );
}