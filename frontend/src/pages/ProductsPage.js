import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Package, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

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

export default function ProductsPage({ user }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const res = await fetch(`${API}/products?${params}`);
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    if (category !== 'all') {
      setSearchParams({ category });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F0]" data-testid="products-page">
      {/* Navigation */}
      <nav className="bg-white border-b border-[#D1D1D1]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
              <Package className="w-8 h-8 text-[#2A5934]" />
              <span className="text-2xl font-bold">ECOTRADE GLOBAL</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link to="/products" className="text-[#1A1A1A] hover:text-[#2A5934] font-medium transition-colors">Products</Link>
              <Link to="/rfqs" className="text-[#595959] hover:text-[#1A1A1A] font-medium transition-colors">RFQs</Link>
              {user ? (
                <Link 
                  to={user.role === 'buyer' ? '/buyer/dashboard' : '/shipper/dashboard'} 
                  className="btn-primary"
                  data-testid="dashboard-button"
                >
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
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4" data-testid="page-title">Browse Products</h1>
          <p className="text-[#595959]" data-testid="page-subtitle">Discover scrap materials from verified shippers worldwide</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-4 mb-6" data-testid="search-form">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#595959]" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-industrial pl-10"
                data-testid="search-input"
              />
            </div>
            <Button type="submit" className="btn-primary" data-testid="search-button">
              Search
            </Button>
          </form>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2" data-testid="category-filter">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
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
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12" data-testid="loading-state">
            <p className="text-[#595959]">Loading products...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="products-grid">
            {products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                data-testid={`product-card-${product.id}`}
              >
                <Card className="group industrial-card p-0 overflow-hidden h-full hover:shadow-lg transition-all">
                  <div className="h-48 bg-gradient-to-br from-[#E8E8E4] to-[#D1D1D1] flex items-center justify-center">
                    <Package className="w-16 h-16 text-[#8C8C8C]" />
                  </div>
                  <div className="p-6">
                    <span className="text-xs uppercase text-[#595959] mb-2 block">{product.category}</span>
                    <h3 className="font-bold text-lg mb-2 group-hover:text-[#2A5934] transition-colors">{product.name}</h3>
                    <p className="text-sm text-[#595959] mb-4 line-clamp-2">{product.description}</p>
                    <div className="space-y-1 mb-4">
                      <p className="text-sm"><span className="text-[#595959]">Quantity:</span> <span className="font-medium mono">{product.quantity} {product.unit}</span></p>
                      <p className="text-sm"><span className="text-[#595959]">Price:</span> <span className="font-bold mono text-[#2A5934]">{product.price_per_unit} {product.currency}/{product.unit}</span></p>
                      <p className="text-sm"><span className="text-[#595959]">Location:</span> {product.location}</p>
                    </div>
                    <Button className="w-full btn-secondary text-sm py-2" data-testid={`view-details-${product.id}`}>
                      View Details
                    </Button>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12" data-testid="no-products">
            <Package className="w-16 h-16 mx-auto mb-4 text-[#8C8C8C]" />
            <p className="text-[#595959]">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
}
