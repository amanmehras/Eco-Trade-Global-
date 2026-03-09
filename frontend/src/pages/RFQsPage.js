import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Package, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORIES = [
  { id: 'all', name: 'All Categories' },
  { id: 'paper', name: 'Paper & Cardboard' },
  { id: 'metal', name: 'Metals' },
  { id: 'plastic', name: 'Plastic' },
  { id: 'textile', name: 'Textiles' },
  { id: 'rubber', name: 'Rubber' },
  { id: 'glass', name: 'Glass' },
  { id: 'electronics', name: 'E-Waste' },
  { id: 'other', name: 'Other' }
];

export default function RFQsPage({ user }) {
  const [searchParams] = useSearchParams();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRFQ, setShowCreateRFQ] = useState(searchParams.get('action') === 'create');
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [rfqForm, setRfqForm] = useState({
    category: 'paper',
    material_name: '',
    quantity: '',
    unit: 'ton',
    target_price: '',
    delivery_location: '',
    delivery_deadline: '',
    description: ''
  });
  const [quoteForm, setQuoteForm] = useState({
    price_per_unit: '',
    currency: 'USD',
    notes: '',
    valid_until: ''
  });
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchRFQs();
  }, [selectedCategory]);

  const fetchRFQs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: 'open' });
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      const res = await fetch(`${API}/rfqs?${params}`);
      if (res.ok) {
        setRfqs(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch RFQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRFQ = async (e) => {
    e.preventDefault();
    if (!user || user.role !== 'buyer') {
      toast.error('Only buyers can create RFQs');
      return;
    }

    try {
      const res = await fetch(`${API}/rfqs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...rfqForm,
          quantity: parseFloat(rfqForm.quantity),
          target_price: rfqForm.target_price ? parseFloat(rfqForm.target_price) : null
        })
      });

      if (res.ok) {
        toast.success('RFQ created successfully');
        setShowCreateRFQ(false);
        setRfqForm({
          category: 'paper',
          material_name: '',
          quantity: '',
          unit: 'ton',
          target_price: '',
          delivery_location: '',
          delivery_deadline: '',
          description: ''
        });
        fetchRFQs();
      } else {
        toast.error('Failed to create RFQ');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    if (!user || user.role !== 'shipper') {
      toast.error('Only shippers can submit quotes');
      return;
    }

    try {
      const res = await fetch(`${API}/rfqs/${selectedRFQ.id}/quote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...quoteForm,
          price_per_unit: parseFloat(quoteForm.price_per_unit)
        })
      });

      if (res.ok) {
        toast.success('Quote submitted successfully');
        setShowQuoteDialog(false);
        setQuoteForm({
          price_per_unit: '',
          currency: 'USD',
          notes: '',
          valid_until: ''
        });
        fetchRFQs();
      } else {
        toast.error('Failed to submit quote');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const openQuoteDialog = (rfq) => {
    setSelectedRFQ(rfq);
    setShowQuoteDialog(true);
  };

  return (
    <div className="min-h-screen bg-[#F4F4F0]" data-testid="rfqs-page">
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
              <Link to="/rfqs" className="text-[#1A1A1A] hover:text-[#2A5934] font-medium transition-colors">RFQs</Link>
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
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-4" data-testid="page-title">Request for Quotations</h1>
            <p className="text-[#595959]" data-testid="page-subtitle">Browse open RFQs or create your own</p>
          </div>
          {user && user.role === 'buyer' && (
            <Button onClick={() => setShowCreateRFQ(true)} className="btn-primary" data-testid="create-rfq-button">
              <Plus className="w-4 h-4 mr-2" /> Create RFQ
            </Button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8" data-testid="category-filter">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-sm border transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-[#2A5934] text-white border-[#2A5934]'
                  : 'bg-white text-[#595959] border-[#D1D1D1] hover:border-[#2A5934]'
              }`}
              data-testid={`category-filter-${cat.id}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* RFQs List */}
        {loading ? (
          <div className="text-center py-12" data-testid="loading-state">Loading RFQs...</div>
        ) : rfqs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="rfqs-grid">
            {rfqs.map((rfq) => (
              <Card key={rfq.id} className="industrial-card p-6" data-testid={`rfq-card-${rfq.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <span className="text-xs uppercase text-[#595959]">{rfq.category}</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs uppercase">{rfq.status}</span>
                </div>
                <h3 className="font-bold text-lg mb-3" data-testid="rfq-material-name">{rfq.material_name}</h3>
                <p className="text-sm text-[#595959] mb-4 line-clamp-2">{rfq.description}</p>
                <div className="space-y-2 mb-4">
                  <p className="text-sm"><span className="text-[#595959]">Quantity:</span> <span className="font-medium mono">{rfq.quantity} {rfq.unit}</span></p>
                  {rfq.target_price && (
                    <p className="text-sm"><span className="text-[#595959]">Target Price:</span> <span className="font-medium mono">{rfq.target_price}</span></p>
                  )}
                  <p className="text-sm"><span className="text-[#595959]">Location:</span> {rfq.delivery_location}</p>
                  <p className="text-sm"><span className="text-[#595959]">Quotes:</span> {rfq.quotes?.length || 0}</p>
                </div>
                {user && user.role === 'shipper' && (
                  <Button onClick={() => openQuoteDialog(rfq)} className="w-full btn-secondary" data-testid={`submit-quote-${rfq.id}`}>
                    Submit Quote
                  </Button>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12" data-testid="no-rfqs">
            <Package className="w-16 h-16 mx-auto mb-4 text-[#8C8C8C]" />
            <p className="text-[#595959]">No open RFQs found</p>
          </div>
        )}
      </div>

      {/* Create RFQ Dialog */}
      <Dialog open={showCreateRFQ} onOpenChange={setShowCreateRFQ}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Request for Quotation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRFQ} className="space-y-4" data-testid="create-rfq-form">
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={rfqForm.category}
                onChange={(e) => setRfqForm({ ...rfqForm, category: e.target.value })}
                className="input-industrial w-full"
                data-testid="rfq-category-select"
              >
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="material_name">Material Name</Label>
              <Input
                id="material_name"
                value={rfqForm.material_name}
                onChange={(e) => setRfqForm({ ...rfqForm, material_name: e.target.value })}
                required
                data-testid="rfq-material-input"
                className="input-industrial"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={rfqForm.description}
                onChange={(e) => setRfqForm({ ...rfqForm, description: e.target.value })}
                required
                rows={3}
                data-testid="rfq-description-input"
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
                  value={rfqForm.quantity}
                  onChange={(e) => setRfqForm({ ...rfqForm, quantity: e.target.value })}
                  required
                  data-testid="rfq-quantity-input"
                  className="input-industrial"
                />
              </div>
              <div>
                <Label htmlFor="unit">Unit</Label>
                <select
                  id="unit"
                  value={rfqForm.unit}
                  onChange={(e) => setRfqForm({ ...rfqForm, unit: e.target.value })}
                  className="input-industrial w-full"
                  data-testid="rfq-unit-select"
                >
                  <option value="ton">Ton</option>
                  <option value="kg">Kilogram</option>
                  <option value="pound">Pound</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="target_price">Target Price (Optional)</Label>
              <Input
                id="target_price"
                type="number"
                step="0.01"
                value={rfqForm.target_price}
                onChange={(e) => setRfqForm({ ...rfqForm, target_price: e.target.value })}
                data-testid="rfq-price-input"
                className="input-industrial"
              />
            </div>
            <div>
              <Label htmlFor="delivery_location">Delivery Location</Label>
              <Input
                id="delivery_location"
                value={rfqForm.delivery_location}
                onChange={(e) => setRfqForm({ ...rfqForm, delivery_location: e.target.value })}
                required
                data-testid="rfq-location-input"
                className="input-industrial"
              />
            </div>
            <div>
              <Label htmlFor="delivery_deadline">Delivery Deadline (Optional)</Label>
              <Input
                id="delivery_deadline"
                type="date"
                value={rfqForm.delivery_deadline}
                onChange={(e) => setRfqForm({ ...rfqForm, delivery_deadline: e.target.value })}
                data-testid="rfq-deadline-input"
                className="input-industrial"
              />
            </div>
            <Button type="submit" className="w-full btn-primary" data-testid="rfq-submit-button">
              Create RFQ
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Submit Quote Dialog */}
      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Quote</DialogTitle>
          </DialogHeader>
          {selectedRFQ && (
            <div className="mb-4 p-4 bg-[#F4F4F0] rounded-sm">
              <p className="font-bold">{selectedRFQ.material_name}</p>
              <p className="text-sm text-[#595959]">Quantity: {selectedRFQ.quantity} {selectedRFQ.unit}</p>
            </div>
          )}
          <form onSubmit={handleSubmitQuote} className="space-y-4" data-testid="quote-form">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price per Unit</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={quoteForm.price_per_unit}
                  onChange={(e) => setQuoteForm({ ...quoteForm, price_per_unit: e.target.value })}
                  required
                  data-testid="quote-price-input"
                  className="input-industrial"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={quoteForm.currency}
                  onChange={(e) => setQuoteForm({ ...quoteForm, currency: e.target.value })}
                  className="input-industrial w-full"
                  data-testid="quote-currency-select"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={quoteForm.notes}
                onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                required
                rows={3}
                data-testid="quote-notes-input"
                className="input-industrial"
              />
            </div>
            <div>
              <Label htmlFor="valid_until">Valid Until (Optional)</Label>
              <Input
                id="valid_until"
                type="date"
                value={quoteForm.valid_until}
                onChange={(e) => setQuoteForm({ ...quoteForm, valid_until: e.target.value })}
                data-testid="quote-validity-input"
                className="input-industrial"
              />
            </div>
            <Button type="submit" className="w-full btn-primary" data-testid="quote-submit-button">
              Submit Quote
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
