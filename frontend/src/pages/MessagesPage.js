import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, MessageSquare, Send, Inbox, MailOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MessagesPage({ user }) {
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const [inboxRes, sentRes] = await Promise.all([
        fetch(`${API}/messages/inbox`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API}/messages/sent`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (inboxRes.ok) setInbox(await inboxRes.json());
      if (sentRes.ok) setSent(await sentRes.json());
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (messageId) => {
    try {
      await fetch(`${API}/messages/${messageId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchMessages();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const openMessage = (message) => {
    setSelectedMessage(message);
    if (!message.read && message.receiver_id === user.id) {
      handleMarkRead(message.id);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F0]" data-testid="messages-page">
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
              <Link to="/messages" className="text-[#1A1A1A] hover:text-[#2A5934] font-medium transition-colors">Messages</Link>
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
          <h1 className="text-4xl font-bold mb-4" data-testid="page-title">Messages</h1>
          <p className="text-[#595959]" data-testid="page-subtitle">Communicate with buyers and shippers</p>
        </div>

        <Card className="border border-[#D1D1D1] rounded-sm">
          <Tabs defaultValue="inbox" className="w-full">
            <TabsList className="w-full justify-start border-b border-[#D1D1D1] rounded-none p-0">
              <TabsTrigger value="inbox" className="data-[state=active]:border-b-2 data-[state=active]:border-[#2A5934] rounded-none" data-testid="inbox-tab">
                <Inbox className="w-4 h-4 mr-2" /> Inbox ({inbox.filter(m => !m.read).length})
              </TabsTrigger>
              <TabsTrigger value="sent" className="data-[state=active]:border-b-2 data-[state=active]:border-[#2A5934] rounded-none" data-testid="sent-tab">
                <Send className="w-4 h-4 mr-2" /> Sent
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inbox" className="p-0">
              {loading ? (
                <div className="p-8 text-center" data-testid="loading-state">Loading...</div>
              ) : inbox.length > 0 ? (
                <div className="divide-y divide-[#D1D1D1]" data-testid="inbox-list">
                  {inbox.map((message) => (
                    <div
                      key={message.id}
                      onClick={() => openMessage(message)}
                      className={`p-6 cursor-pointer hover:bg-[#F4F4F0] transition-colors ${
                        !message.read ? 'bg-green-50' : ''
                      }`}
                      data-testid={`inbox-message-${message.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {!message.read && <div className="w-2 h-2 bg-[#2A5934] rounded-full"></div>}
                          <h3 className="font-bold">{message.subject}</h3>
                        </div>
                        <span className="text-sm text-[#595959]">{new Date(message.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-[#595959] line-clamp-2">{message.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center" data-testid="no-inbox-messages">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-[#8C8C8C]" />
                  <p className="text-[#595959]">No messages in inbox</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="sent" className="p-0">
              {loading ? (
                <div className="p-8 text-center" data-testid="loading-state">Loading...</div>
              ) : sent.length > 0 ? (
                <div className="divide-y divide-[#D1D1D1]" data-testid="sent-list">
                  {sent.map((message) => (
                    <div
                      key={message.id}
                      onClick={() => openMessage(message)}
                      className="p-6 cursor-pointer hover:bg-[#F4F4F0] transition-colors"
                      data-testid={`sent-message-${message.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold">{message.subject}</h3>
                        <span className="text-sm text-[#595959]">{new Date(message.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-[#595959] line-clamp-2">{message.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center" data-testid="no-sent-messages">
                  <Send className="w-16 h-16 mx-auto mb-4 text-[#8C8C8C]" />
                  <p className="text-[#595959]">No sent messages</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4" data-testid="message-detail">
              <div className="flex items-center justify-between text-sm text-[#595959]">
                <span>From: {selectedMessage.sender_id.slice(0, 8)}</span>
                <span>{new Date(selectedMessage.created_at).toLocaleString()}</span>
              </div>
              <div className="p-4 bg-[#F4F4F0] rounded-sm">
                <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
