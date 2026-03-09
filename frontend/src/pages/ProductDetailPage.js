import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Package, MapPin, Calendar, ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductDetailPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [shipper, setShipper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState('');
  const [messageForm, setMessageForm] = useState({ subject: '', content: '' });
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`${API}/products/${id}`);
      if (res.ok) {
        const productData = await res.json();
        setProduct(productData);
        
        const shipperRes = await fetch(`${API}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (shipperRes.ok) {
          setShipper(await shipperRes.json());
        }
      } else {
        toast.error('Product not found');
        navigate('/products');
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to place an order');
      navigate('/auth');
      return;
    }
    if (user.role !== 'buyer') {
      toast.error('Only buyers can place orders');
      return;
    }

    try {
      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shipper_id: product.shipper_id,
          product_id: product.id,
          material_name: product.name,
          quantity: parseFloat(orderQuantity),
          unit: product.unit,
          price_per_unit: product.price_per_unit,
          delivery_location: user.country
        })
      });

      if (res.ok) {
        toast.success('Order created successfully');
        setShowOrderDialog(false);
        navigate('/orders');
      } else {
        toast.error('Failed to create order');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to send messages');
      navigate('/auth');
      return;
    }

    try {
      const res = await fetch(`${API}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiver_id: product.shipper_id,
          ...messageForm
        })
      });

      if (res.ok) {
        toast.success('Message sent');
        setShowMessageDialog(false);
        setMessageForm({ subject: '', content: '' });
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" data-testid="loading-state">Loading...</div>;
  }

  if (!product) {
    return null;
  }

  const totalAmount = orderQuantity ? (parseFloat(orderQuantity) * product.price_per_unit).toFixed(2) : '0.00';

  return (
    <div className="min-h-screen bg-[#F4F4F0]" data-testid="product-detail-page">
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
              {user ? (
                <Link to={user.role === 'buyer' ? '/buyer/dashboard' : '/shipper/dashboard'} className="btn-primary" data-testid="dashboard-button">
                  Dashboard
                </Link>
              ) : (
                <Link to="/auth" className="btn-primary" data-testid="get-started-button">Get Started</Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-12">
        <Button onClick={() => navigate(-1)} variant="ghost" className="mb-6" data-testid="back-button">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Info */}
          <div className="lg:col-span-2">
            <Card className="industrial-card p-8">
              <div className="h-96 bg-gradient-to-br from-[#E8E8E4] to-[#D1D1D1] rounded-sm mb-6 flex items-center justify-center">
                <Package className="w-32 h-32 text-[#8C8C8C]" />
              </div>

              <span className="inline-block px-3 py-1 bg-[#2A5934] text-white text-xs uppercase rounded-sm mb-4">{product.category}</span>
              <h1 className="text-4xl font-bold mb-4" data-testid="product-name">{product.name}</h1>
              
              <div className="flex items-center gap-6 mb-6 text-[#595959]">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span data-testid="product-location">{product.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Listed {new Date(product.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-3">Description</h2>
                <p className="text-[#595959]" data-testid="product-description">{product.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-[#595959] mb-1">Available Quantity</p>
                  <p className="text-2xl font-bold mono" data-testid="product-quantity">{product.quantity} {product.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-[#595959] mb-1">Price per Unit</p>
                  <p className="text-2xl font-bold mono text-[#2A5934]" data-testid="product-price">{product.price_per_unit} {product.currency}</p>
                </div>
              </div>

              {Object.keys(product.specifications || {}).length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-3">Specifications</h2>
                  <div className="space-y-2">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-[#E8E8E4]">
                        <span className="text-[#595959]">{key}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Action Panel */}
          <div>
            <Card className="industrial-card p-6 sticky top-6">
              <h3 className="text-2xl font-bold mb-6">Actions</h3>
              
              {user && user.role === 'buyer' && (
                <>
                  <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full btn-primary mb-4" data-testid="place-order-button">
                        Place Order
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Place Order</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateOrder} className="space-y-4" data-testid="order-form">
                        <div>
                          <Label htmlFor="quantity">Quantity ({product.unit})</Label>
                          <Input
                            id="quantity"
                            type="number"
                            step="0.01"
                            value={orderQuantity}
                            onChange={(e) => setOrderQuantity(e.target.value)}
                            required
                            max={product.quantity}
                            data-testid="order-quantity-input"
                            className="input-industrial"
                          />
                          <p className="text-xs text-[#595959] mt-1">Max: {product.quantity} {product.unit}</p>
                        </div>
                        <div className="bg-[#F4F4F0] p-4 rounded-sm">
                          <div className="flex justify-between mb-2">
                            <span>Price per {product.unit}:</span>
                            <span className="mono">{product.price_per_unit} {product.currency}</span>
                          </div>
                          <div className="flex justify-between mb-2">
                            <span>Quantity:</span>
                            <span className="mono">{orderQuantity || 0} {product.unit}</span>
                          </div>
                          <div className="border-t border-[#D1D1D1] pt-2 mt-2 flex justify-between font-bold">
                            <span>Total Amount:</span>
                            <span className="mono text-[#2A5934]" data-testid="total-amount">{totalAmount} {product.currency}</span>
                          </div>
                        </div>
                        <Button type="submit" className="w-full btn-primary" data-testid="confirm-order-button">
                          Confirm Order
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full btn-secondary" data-testid="contact-shipper-button">
                        <MessageSquare className="w-4 h-4 mr-2" /> Contact Shipper
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Send Message to Shipper</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSendMessage} className="space-y-4" data-testid="message-form">
                        <div>
                          <Label htmlFor="subject">Subject</Label>
                          <Input
                            id="subject"
                            value={messageForm.subject}
                            onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                            required
                            placeholder="Inquiry about product"
                            data-testid="message-subject-input"
                            className="input-industrial"
                          />
                        </div>
                        <div>
                          <Label htmlFor="content">Message</Label>
                          <Textarea
                            id="content"
                            value={messageForm.content}
                            onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
                            required
                            rows={5}
                            placeholder="Your message..."
                            data-testid="message-content-input"
                            className="input-industrial"
                          />
                        </div>
                        <Button type="submit" className="w-full btn-primary" data-testid="send-message-button">
                          Send Message
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </>
              )}

              {!user && (
                <div className="text-center">
                  <p className="text-[#595959] mb-4">Login to place orders</p>
                  <Button onClick={() => navigate('/auth')} className="w-full btn-primary" data-testid="login-to-order-button">
                    Login / Register
                  </Button>
                </div>
              )}

              {user && user.role === 'shipper' && (
                <p className="text-center text-[#595959]" data-testid="shipper-notice">Shippers cannot place orders</p>
              )}

              <div className="mt-8 pt-6 border-t border-[#E8E8E4]">
                <h4 className="font-bold mb-3">Product Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#595959]">Product ID:</span>
                    <span className="mono text-xs">{product.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#595959]">Status:</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs uppercase">{product.status}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
