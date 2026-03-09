import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, FileText, MessageSquare, LogOut, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORIES = [
  { id: 'paper', name: 'Paper & Cardboard' },
  { id: 'metal', name: 'Metals' },
  { id: 'plastic', name: 'Plastic' },
  { id: 'textile', name: 'Textiles' },
  { id: 'rubber', name: 'Rubber' },
  { id: 'glass', name: 'Glass' },
  { id: 'electronics', name: 'E-Waste' },
  { id: 'other', name: 'Other' }
];

export default function ShipperDashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productForm, setProductForm] = useState({
    category: 'paper',
    name: '',
    description: '',
    quantity: '',
    unit: 'ton',
    price_per_unit: '',
    currency: 'USD',
    location: '',
    images: [],
    specifications: {}
  });
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, productsRes] = await Promise.all([
        fetch(`${API}/stats/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API}/products/shipper/${user.id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (productsRes.ok) setProducts(await productsRes.json());
    } catch (error) {
      toast.error('Failed to load dashboard');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...productForm,
          quantity: parseFloat(productForm.quantity),
          price_per_unit: parseFloat(productForm.price_per_unit)
        })
      });

      if (res.ok) {
        toast.success('Product added successfully');
        setShowAddProduct(false);
        setProductForm({
          category: 'paper',
          name: '',
          description: '',
          quantity: '',
          unit: 'ton',
          price_per_unit: '',
          currency: 'USD',
          location: '',
          images: [],
          specifications: {}
        });
        fetchDashboardData();
      } else {
        toast.error('Failed to add product');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`${API}/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Product deleted');
        fetchDashboardData();
      } else {
        toast.error('Failed to delete product');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-[#F4F4F0]" data-testid="shipper-dashboard">
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
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2" data-testid="dashboard-title">Shipper Dashboard</h1>
            <p className="text-[#595959]" data-testid="welcome-message">Welcome back, {user?.contact_person}</p>
          </div>
          <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="add-product-button">
                <Plus className="w-4 h-4 mr-2" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="space-y-4" data-testid="add-product-form">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="input-industrial w-full"
                    data-testid="product-category-select"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    required
                    data-testid="product-name-input"
                    className="input-industrial"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    required
                    rows={3}
                    data-testid="product-description-input"
                    className="input-industrial"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      value={productForm.quantity}
                      onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                      required
                      data-testid="product-quantity-input"
                      className="input-industrial"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <select
                      id="unit"
                      value={productForm.unit}
                      onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                      className="input-industrial w-full"
                      data-testid="product-unit-select"
                    >
                      <option value="ton">Ton</option>
                      <option value="kg">Kilogram</option>
                      <option value="pound">Pound</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price per Unit</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={productForm.price_per_unit}
                      onChange={(e) => setProductForm({ ...productForm, price_per_unit: e.target.value })}
                      required
                      data-testid="product-price-input"
                      className="input-industrial"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <select
                      id="currency"
                      value={productForm.currency}
                      onChange={(e) => setProductForm({ ...productForm, currency: e.target.value })}
                      className="input-industrial w-full"
                      data-testid="product-currency-select"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={productForm.location}
                    onChange={(e) => setProductForm({ ...productForm, location: e.target.value })}
                    required
                    data-testid="product-location-input"
                    className="input-industrial"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full btn-primary" data-testid="product-submit-button">
                  {loading ? 'Adding...' : 'Add Product'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12" data-testid="stats-section">
            <Card className="industrial-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#595959] text-sm mb-1">Total Products</p>
                  <p className="text-3xl font-bold mono" data-testid="total-products">{stats.total_products}</p>
                </div>
                <Package className="w-12 h-12 text-[#2A5934]" />
              </div>
            </Card>
            <Card className="industrial-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#595959] text-sm mb-1">Total Orders</p>
                  <p className="text-3xl font-bold mono" data-testid="total-orders">{stats.total_orders}</p>
                </div>
                <FileText className="w-12 h-12 text-[#2A5934]" />
              </div>
            </Card>
            <Card className="industrial-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#595959] text-sm mb-1">Unread Messages</p>
                  <p className="text-3xl font-bold mono" data-testid="unread-messages">{stats.unread_messages}</p>
                </div>
                <MessageSquare className="w-12 h-12 text-[#2A5934]" />
              </div>
            </Card>
          </div>
        )}

        {/* Products List */}
        <div>
          <h2 className="text-2xl font-bold mb-6">My Products</h2>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="products-grid">
              {products.map((product) => (
                <Card key={product.id} className="industrial-card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-xs uppercase text-[#595959] mb-1 block">{product.category}</span>
                      <h3 className="font-bold text-lg">{product.name}</h3>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${
                      product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>{product.status}</span>
                  </div>
                  <p className="text-sm text-[#595959] mb-4 line-clamp-2">{product.description}</p>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm"><span className="text-[#595959]">Quantity:</span> <span className="font-medium mono">{product.quantity} {product.unit}</span></p>
                    <p className="text-sm"><span className="text-[#595959]">Price:</span> <span className="font-medium mono">{product.price_per_unit} {product.currency}/{product.unit}</span></p>
                    <p className="text-sm"><span className="text-[#595959]">Location:</span> {product.location}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate(`/products/${product.id}`)}
                      className="flex-1"
                      data-testid={`view-product-${product.id}`}
                    >
                      View
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                      data-testid={`delete-product-${product.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12" data-testid="no-products">
              <Package className="w-16 h-16 mx-auto mb-4 text-[#8C8C8C]" />
              <p className="text-[#595959] mb-4">No products listed yet</p>
              <Button onClick={() => setShowAddProduct(true)} className="btn-primary" data-testid="add-first-product-button">
                <Plus className="w-4 h-4 mr-2" /> Add Your First Product
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}