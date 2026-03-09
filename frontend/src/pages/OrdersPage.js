import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, FileText, CreditCard, Eye, Ship } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import PaymentGatewaySelector from '@/components/PaymentGatewaySelector';
import ShipmentDetailsForm from '@/components/ShipmentDetailsForm';
import ShipmentTracking from '@/components/ShipmentTracking';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function OrdersPage({ user }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [showShipmentDialog, setShowShipmentDialog] = useState(false);
  const [orderToPay, setOrderToPay] = useState(null);
  const [selectedGateway, setSelectedGateway] = useState('paypal');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const endpoint = user.role === 'buyer' ? 'buyer/my-orders' : 'shipper/my-orders';
      const res = await fetch(`${API}/orders/${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (order) => {
    setOrderToPay(order);
    setShowPaymentSelector(true);
  };

  const processPayment = async () => {
    if (!orderToPay) return;
    
    try {
      const res = await fetch(`${API}/payments/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_id: orderToPay.id,
          origin_url: window.location.origin,
          payment_gateway: selectedGateway
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else if (data.razorpay_order_id) {
          // Handle Razorpay payment
          const options = {
            key: data.razorpay_key_id,
            amount: data.amount,
            currency: data.currency,
            order_id: data.razorpay_order_id,
            handler: async function (response) {
              try {
                const verifyRes = await fetch(`${API}/payments/razorpay/verify`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature
                  })
                });
                
                if (verifyRes.ok) {
                  toast.success('Payment successful!');
                  fetchOrders();
                  setShowPaymentSelector(false);
                } else {
                  toast.error('Payment verification failed');
                }
              } catch (error) {
                toast.error('Payment verification error');
              }
            },
            prefill: {
              name: user.contact_person,
              email: user.email
            },
            theme: {
              color: '#2A5934'
            }
          };
          
          const rzp = new window.Razorpay(options);
          rzp.open();
          setShowPaymentSelector(false);
        }
      } else {
        toast.error('Failed to initiate payment');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      const res = await fetch(`${API}/orders/${orderId}/status?status=${status}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Order status updated');
        fetchOrders();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    return status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed');
  const completedOrders = orders.filter(o => o.status === 'shipped' || o.status === 'delivered');

  return (
    <div className="min-h-screen bg-[#F4F4F0]" data-testid="orders-page">
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
              <Link to="/orders" className="text-[#1A1A1A] hover:text-[#2A5934] font-medium transition-colors">Orders</Link>
              <Link to="/messages" className="text-[#595959] hover:text-[#1A1A1A] font-medium transition-colors">Messages</Link>
              <Link to={user.role === 'buyer' ? '/buyer/dashboard' : '/shipper/dashboard'} className="btn-primary" data-testid="dashboard-button">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4" data-testid="page-title">My Orders</h1>
          <p className="text-[#595959]" data-testid="page-subtitle">Track and manage your orders</p>
        </div>

        <Card className="border border-[#D1D1D1] rounded-sm">
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="w-full justify-start border-b border-[#D1D1D1] rounded-none p-0">
              <TabsTrigger value="active" className="data-[state=active]:border-b-2 data-[state=active]:border-[#2A5934] rounded-none" data-testid="active-tab">
                Active Orders ({pendingOrders.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:border-b-2 data-[state=active]:border-[#2A5934] rounded-none" data-testid="completed-tab">
                Completed ({completedOrders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="p-0">
              {loading ? (
                <div className="p-8 text-center" data-testid="loading-state">Loading...</div>
              ) : pendingOrders.length > 0 ? (
                <div className="overflow-x-auto" data-testid="active-orders-table">
                  <table className="w-full table-zebra">
                    <thead className="bg-[#1B365D] text-white">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-bold uppercase">Order ID</th>
                        <th className="px-6 py-3 text-left text-sm font-bold uppercase">Material</th>
                        <th className="px-6 py-3 text-left text-sm font-bold uppercase">Quantity</th>
                        <th className="px-6 py-3 text-left text-sm font-bold uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-sm font-bold uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-bold uppercase">Payment</th>
                        <th className="px-6 py-3 text-left text-sm font-bold uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingOrders.map((order) => (
                        <tr key={order.id} data-testid={`order-row-${order.id}`}>
                          <td className="px-6 py-4 mono text-sm">{order.id.slice(0, 8)}</td>
                          <td className="px-6 py-4">{order.material_name}</td>
                          <td className="px-6 py-4">{order.quantity} {order.unit}</td>
                          <td className="px-6 py-4 mono">{order.total_amount} {order.currency}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${getStatusColor(order.status)}`}>{order.status}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${getPaymentStatusColor(order.payment_status)}`}>
                              {order.payment_status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedOrder(order)}
                                data-testid={`view-order-${order.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {user.role === 'buyer' && order.payment_status !== 'paid' && (
                                <Button 
                                  size="sm" 
                                  className="btn-primary"
                                  onClick={() => handlePayment(order)}
                                  data-testid={`pay-order-${order.id}`}
                                >
                                  <CreditCard className="w-4 h-4 mr-1" /> Pay
                                </Button>
                              )}
                              {user.role === 'shipper' && order.status === 'confirmed' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    className="btn-secondary"
                                    onClick={() => {
                                      setSelectedOrder(order);
                                      setShowShipmentDialog(true);
                                    }}
                                    data-testid={`manage-shipment-${order.id}`}
                                  >
                                    <Ship className="w-4 h-4 mr-1" /> Manage Shipment
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="btn-secondary"
                                    onClick={() => handleUpdateStatus(order.id, 'shipped')}
                                    data-testid={`ship-order-${order.id}`}
                                  >
                                    Mark Shipped
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center" data-testid="no-active-orders">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-[#8C8C8C]" />
                  <p className="text-[#595959]">No active orders</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="p-0">
              {loading ? (
                <div className="p-8 text-center" data-testid="loading-state">Loading...</div>
              ) : completedOrders.length > 0 ? (
                <div className="overflow-x-auto" data-testid="completed-orders-table">
                  <table className="w-full table-zebra">
                    <thead className="bg-[#1B365D] text-white">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-bold uppercase">Order ID</th>
                        <th className="px-6 py-3 text-left text-sm font-bold uppercase">Material</th>
                        <th className="px-6 py-3 text-left text-sm font-bold uppercase">Quantity</th>
                        <th className="px-6 py-3 text-left text-sm font-bold uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-sm font-bold uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-bold uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedOrders.map((order) => (
                        <tr key={order.id} data-testid={`completed-order-row-${order.id}`}>
                          <td className="px-6 py-4 mono text-sm">{order.id.slice(0, 8)}</td>
                          <td className="px-6 py-4">{order.material_name}</td>
                          <td className="px-6 py-4">{order.quantity} {order.unit}</td>
                          <td className="px-6 py-4 mono">{order.total_amount} {order.currency}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${getStatusColor(order.status)}`}>{order.status}</span>
                          </td>
                          <td className="px-6 py-4">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedOrder(order)}
                              data-testid={`view-completed-order-${order.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" /> View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center" data-testid="no-completed-orders">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-[#8C8C8C]" />
                  <p className="text-[#595959]">No completed orders</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder && !showShipmentDialog} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4" data-testid="order-detail">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#595959]">Order ID</p>
                  <p className="font-bold mono">{selectedOrder.id.slice(0, 16)}</p>
                </div>
                <div>
                  <p className="text-sm text-[#595959]">Created</p>
                  <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="border-t border-[#D1D1D1] pt-4">
                <h3 className="font-bold mb-3">Order Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#595959]">Material:</span>
                    <span className="font-medium">{selectedOrder.material_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#595959]">Quantity:</span>
                    <span className="font-medium">{selectedOrder.quantity} {selectedOrder.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#595959]">Price per Unit:</span>
                    <span className="font-medium mono">{selectedOrder.price_per_unit} {selectedOrder.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#595959]">Delivery Location:</span>
                    <span className="font-medium">{selectedOrder.delivery_location}</span>
                  </div>
                  {selectedOrder.delivery_port && (
                    <div className="flex justify-between">
                      <span className="text-[#595959]">Delivery Port:</span>
                      <span className="font-medium">{selectedOrder.delivery_port}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-[#D1D1D1]">
                    <span className="font-bold">Total Amount:</span>
                    <span className="font-bold mono text-[#2A5934]">{selectedOrder.total_amount} {selectedOrder.currency}</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-[#D1D1D1] pt-4">
                <h3 className="font-bold mb-3">Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#595959]">Order Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#595959]">Payment Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${getPaymentStatusColor(selectedOrder.payment_status)}`}>
                      {selectedOrder.payment_status}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Shipment Tracking for Buyers */}
              {user.role === 'buyer' && (
                <div className="border-t border-[#D1D1D1] pt-4">
                  <h3 className="font-bold mb-4">Shipment Tracking</h3>
                  <ShipmentTracking order={selectedOrder} />
                </div>
              )}
              
              {/* Shipment Management Button for Shippers */}
              {user.role === 'shipper' && selectedOrder.payment_status === 'paid' && (
                <div className="border-t border-[#D1D1D1] pt-4">
                  <Button 
                    onClick={() => {
                      setShowShipmentDialog(true);
                    }}
                    className="w-full btn-primary"
                    data-testid="manage-shipment-detail-button"
                  >
                    <Ship className="w-4 h-4 mr-2" /> Manage Shipment Details
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Shipment Management Dialog (Shippers Only) */}
      <Dialog open={showShipmentDialog} onOpenChange={setShowShipmentDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Shipment - Order {selectedOrder?.id.slice(0, 8)}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <ShipmentDetailsForm 
              order={selectedOrder} 
              onUpdate={() => {
                fetchOrders();
                setShowShipmentDialog(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Gateway Selector Dialog */}
      <Dialog open={showPaymentSelector} onOpenChange={setShowPaymentSelector}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Choose Payment Method</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <PaymentGatewaySelector 
              onSelect={setSelectedGateway} 
              selectedGateway={selectedGateway} 
            />
            {orderToPay && (
              <div className="bg-gray-50 p-4 rounded-sm">
                <p className="text-sm text-[#595959] mb-2">Order Summary</p>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{orderToPay.material_name} - {orderToPay.quantity} {orderToPay.unit}</span>
                  <span className="text-xl font-bold text-[#2A5934]">{orderToPay.total_amount} {orderToPay.currency}</span>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowPaymentSelector(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={processPayment}
                className="flex-1 btn-primary"
                data-testid="confirm-payment-button"
              >
                Proceed to Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
