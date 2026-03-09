import { Link } from 'react-router-dom';
import { Package, Globe, Shield, TrendingUp, Search, MessageSquare, FileText, CreditCard } from 'lucide-react';

export default function LandingPage({ user }) {
  const categories = [
    { id: 'paper', name: 'Paper & Cardboard', image: 'https://images.unsplash.com/photo-1711885417467-6eac5cb81607' },
    { id: 'metal', name: 'Metals', image: 'https://images.unsplash.com/photo-1679207751072-aa076562a4f6' },
    { id: 'plastic', name: 'Plastic', image: 'https://images.unsplash.com/photo-1768796372882-8b67936af681' },
    { id: 'textile', name: 'Textiles', image: 'https://images.unsplash.com/photo-1622127739239-1905bbaa21b8' }
  ];

  const features = [
    { icon: Search, title: 'Global Product Catalog', description: 'Browse thousands of scrap materials from verified suppliers worldwide' },
    { icon: FileText, title: 'Request for Quotation', description: 'Post your requirements and receive competitive quotes from multiple shippers' },
    { icon: MessageSquare, title: 'Direct Communication', description: 'Connect directly with buyers and suppliers through our messaging system' },
    { icon: CreditCard, title: 'Secure Payments', description: 'Safe and encrypted payment processing for B2B transactions' }
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-[#D1D1D1]" data-testid="main-navigation">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
              <Package className="w-8 h-8 text-[#2A5934]" />
              <span className="text-2xl font-bold text-[#1A1A1A]">ECOTRADE GLOBAL</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link to="/products" className="text-[#595959] hover:text-[#1A1A1A] font-medium transition-colors" data-testid="nav-products">Products</Link>
              <Link to="/rfqs" className="text-[#595959] hover:text-[#1A1A1A] font-medium transition-colors" data-testid="nav-rfqs">RFQs</Link>
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

      {/* Hero Section */}
      <section 
        className="relative pt-32 pb-24 md:pt-40 md:pb-32" 
        style={{ 
          backgroundImage: 'url(https://images.unsplash.com/photo-1765206257996-9b4a5d886a2c)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        data-testid="hero-section"
      >
        <div className="absolute inset-0 hero-overlay"></div>
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <div className="max-w-3xl">
            <div className="inline-block badge-new mb-6" data-testid="hero-badge">Global B2B Marketplace</div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl text-white mb-6" data-testid="hero-title">
              Trade Scrap Materials <br />Across Borders
            </h1>
            <p className="text-lg text-white/90 mb-8 max-w-2xl" data-testid="hero-description">
              Connect buyers and shippers globally. Source paper, metals, plastics, textiles, rubber, and more scrap materials with confidence.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products" className="btn-primary" data-testid="hero-browse-button">Browse Products</Link>
              <Link to="/rfqs" className="btn-secondary text-white border-white hover:bg-white hover:text-[#1B365D]" data-testid="hero-rfq-button">View RFQs</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white" data-testid="stats-section">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <Globe className="w-12 h-12 mx-auto mb-4 text-[#2A5934]" />
              <div className="stat-number" data-testid="stat-countries">150+</div>
              <div className="text-[#595959] mt-2">Countries</div>
            </div>
            <div className="text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-[#2A5934]" />
              <div className="stat-number" data-testid="stat-products">50K+</div>
              <div className="text-[#595959] mt-2">Products Listed</div>
            </div>
            <div className="text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-[#2A5934]" />
              <div className="stat-number" data-testid="stat-suppliers">10K+</div>
              <div className="text-[#595959] mt-2">Verified Suppliers</div>
            </div>
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-[#2A5934]" />
              <div className="stat-number" data-testid="stat-transactions">$2B+</div>
              <div className="text-[#595959] mt-2">Transaction Value</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-[#F4F4F0]" data-testid="categories-section">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-4" data-testid="categories-title">Material Categories</h2>
            <p className="text-lg text-[#595959]" data-testid="categories-subtitle">Source scrap materials from every major category</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link 
                key={cat.id} 
                to={`/products?category=${cat.id}`}
                className="category-card group relative overflow-hidden rounded-sm bg-white border border-[#D1D1D1] hover:border-[#2A5934] transition-all duration-300 h-64"
                data-testid={`category-${cat.id}`}
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundImage: `url(${cat.image})` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl text-white font-bold">{cat.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-4" data-testid="features-title">Why Choose EcoTrade Global</h2>
            <p className="text-lg text-[#595959]" data-testid="features-subtitle">Everything you need for B2B scrap trading</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="industrial-card bg-white p-8 border border-[#D1D1D1] rounded-sm" data-testid={`feature-${idx}`}>
                <feature.icon className="w-12 h-12 text-[#FF6B35] mb-4" />
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-[#595959]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#1B365D]" data-testid="cta-section">
        <div className="max-w-4xl mx-auto px-4 md:px-8 lg:px-12 text-center">
          <h2 className="text-4xl lg:text-5xl text-white mb-6" data-testid="cta-title">Ready to Start Trading?</h2>
          <p className="text-lg text-white/90 mb-8" data-testid="cta-description">Join thousands of buyers and shippers already using EcoTrade Global</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/auth" className="btn-primary" data-testid="cta-buyer-button">Join as Buyer</Link>
            <Link to="/auth" className="btn-secondary text-white border-white hover:bg-white hover:text-[#1B365D]" data-testid="cta-shipper-button">Join as Shipper</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] text-white py-12" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-6 h-6" />
                <span className="font-bold text-lg">ECOTRADE GLOBAL</span>
              </div>
              <p className="text-sm text-gray-400">Connecting the world's scrap material traders</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Platform</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div><Link to="/products">Browse Products</Link></div>
                <div><Link to="/rfqs">View RFQs</Link></div>
                <div><Link to="/auth">Get Started</Link></div>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Categories</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div>Paper & Cardboard</div>
                <div>Metals</div>
                <div>Plastics</div>
                <div>Textiles</div>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div>Help Center</div>
                <div>Contact Us</div>
                <div>Terms of Service</div>
                <div>Privacy Policy</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2026 EcoTrade Global. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}