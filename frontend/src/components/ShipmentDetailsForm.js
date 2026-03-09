import { useState } from 'react';
import { Truck, Ship, Package, Calendar, FileText, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DOCUMENT_TYPES = [
  { value: 'invoice', label: 'Commercial Invoice' },
  { value: 'packing_list', label: 'Packing List' },
  { value: 'bill_of_lading', label: 'Bill of Lading' },
  { value: 'certificate', label: 'Certificate of Origin' },
  { value: 'inspection', label: 'Inspection Report' },
  { value: 'other', label: 'Other Document' }
];

export default function ShipmentDetailsForm({ order, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [shipmentData, setShipmentData] = useState({
    sales_order_number: order.sales_order_number || '',
    shipment_date: order.shipment_date || '',
    estimated_arrival: order.estimated_arrival || '',
    port_of_loading: order.port_of_loading || '',
    port_of_arrival: order.port_of_arrival || '',
    shipping_line: order.shipping_line || '',
    container_number: order.container_number || '',
    shipment_status: order.shipment_status || 'not_shipped',
    shipment_notes: order.shipment_notes || ''
  });

  const [newDocument, setNewDocument] = useState({
    document_type: 'invoice',
    document_name: '',
    document_url: ''
  });

  const token = localStorage.getItem('token');

  const handleUpdateShipment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/orders/${order.id}/shipment`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(shipmentData)
      });

      if (res.ok) {
        toast.success('Shipment details updated!');
        onUpdate();
      } else {
        toast.error('Failed to update shipment');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocument = async () => {
    if (!newDocument.document_name || !newDocument.document_url) {
      toast.error('Please fill document name and URL');
      return;
    }

    try {
      const res = await fetch(`${API}/orders/${order.id}/shipment/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newDocument)
      });

      if (res.ok) {
        toast.success('Document added!');
        setNewDocument({ document_type: 'invoice', document_name: '', document_url: '' });
        onUpdate();
      } else {
        toast.error('Failed to add document');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const handleDeleteDocument = async (docName) => {
    if (!confirm('Delete this document?')) return;

    try {
      const res = await fetch(`${API}/orders/${order.id}/shipment/documents/${encodeURIComponent(docName)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Document deleted');
        onUpdate();
      } else {
        toast.error('Failed to delete document');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Shipment Details Form */}
      <Card className="p-6 industrial-card">
        <div className="flex items-center gap-2 mb-6">
          <Ship className="w-6 h-6 text-[#2A5934]" />
          <h3 className="text-2xl font-bold">Shipment Details</h3>
        </div>

        <form onSubmit={handleUpdateShipment} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sales_order_number">Sales Order Number</Label>
              <Input
                id="sales_order_number"
                value={shipmentData.sales_order_number}
                onChange={(e) => setShipmentData({...shipmentData, sales_order_number: e.target.value})}
                placeholder="SO-2026-001"
                className="input-industrial"
                data-testid="sales-order-input"
              />
            </div>

            <div>
              <Label htmlFor="shipment_date">Shipment Date</Label>
              <Input
                id="shipment_date"
                type="date"
                value={shipmentData.shipment_date}
                onChange={(e) => setShipmentData({...shipmentData, shipment_date: e.target.value})}
                className="input-industrial"
                data-testid="shipment-date-input"
              />
            </div>

            <div>
              <Label htmlFor="estimated_arrival">Estimated Arrival</Label>
              <Input
                id="estimated_arrival"
                type="date"
                value={shipmentData.estimated_arrival}
                onChange={(e) => setShipmentData({...shipmentData, estimated_arrival: e.target.value})}
                className="input-industrial"
                data-testid="arrival-date-input"
              />
            </div>

            <div>
              <Label htmlFor="shipment_status">Shipment Status</Label>
              <select
                id="shipment_status"
                value={shipmentData.shipment_status}
                onChange={(e) => setShipmentData({...shipmentData, shipment_status: e.target.value})}
                className="input-industrial w-full"
                data-testid="shipment-status-select"
              >
                <option value="not_shipped">Not Shipped</option>
                <option value="in_transit">In Transit</option>
                <option value="arrived">Arrived at Port</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>

            <div>
              <Label htmlFor="port_of_loading">Port of Loading</Label>
              <Input
                id="port_of_loading"
                value={shipmentData.port_of_loading}
                onChange={(e) => setShipmentData({...shipmentData, port_of_loading: e.target.value})}
                placeholder="Mumbai Port, India"
                className="input-industrial"
                data-testid="port-loading-input"
              />
            </div>

            <div>
              <Label htmlFor="port_of_arrival">Port of Arrival</Label>
              <Input
                id="port_of_arrival"
                value={shipmentData.port_of_arrival}
                onChange={(e) => setShipmentData({...shipmentData, port_of_arrival: e.target.value})}
                placeholder="Los Angeles Port, USA"
                className="input-industrial"
                data-testid="port-arrival-input"
              />
            </div>

            <div>
              <Label htmlFor="shipping_line">Shipping Line</Label>
              <Input
                id="shipping_line"
                value={shipmentData.shipping_line}
                onChange={(e) => setShipmentData({...shipmentData, shipping_line: e.target.value})}
                placeholder="Maersk, MSC, etc."
                className="input-industrial"
                data-testid="shipping-line-input"
              />
            </div>

            <div>
              <Label htmlFor="container_number">Container Number</Label>
              <Input
                id="container_number"
                value={shipmentData.container_number}
                onChange={(e) => setShipmentData({...shipmentData, container_number: e.target.value})}
                placeholder="MSCU1234567"
                className="input-industrial"
                data-testid="container-number-input"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="shipment_notes">Shipment Notes</Label>
            <Textarea
              id="shipment_notes"
              value={shipmentData.shipment_notes}
              onChange={(e) => setShipmentData({...shipmentData, shipment_notes: e.target.value})}
              placeholder="Any special instructions or notes..."
              rows={3}
              className="input-industrial"
              data-testid="shipment-notes-input"
            />
          </div>

          <Button type="submit" disabled={loading} className="btn-primary" data-testid="update-shipment-button">
            {loading ? 'Updating...' : 'Update Shipment Details'}
          </Button>
        </form>
      </Card>

      {/* Shipment Documents */}
      <Card className="p-6 industrial-card">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-6 h-6 text-[#2A5934]" />
          <h3 className="text-2xl font-bold">Shipment Documents</h3>
        </div>

        {/* Add Document Form */}
        <div className="bg-gray-50 p-4 rounded-sm mb-6">
          <h4 className="font-bold mb-4">Add New Document</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="document_type">Document Type</Label>
              <select
                id="document_type"
                value={newDocument.document_type}
                onChange={(e) => setNewDocument({...newDocument, document_type: e.target.value})}
                className="input-industrial w-full"
                data-testid="document-type-select"
              >
                {DOCUMENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="document_name">Document Name</Label>
              <Input
                id="document_name"
                value={newDocument.document_name}
                onChange={(e) => setNewDocument({...newDocument, document_name: e.target.value})}
                placeholder="Invoice-2026-001.pdf"
                className="input-industrial"
                data-testid="document-name-input"
              />
            </div>
            <div>
              <Label htmlFor="document_url">Document URL</Label>
              <div className="flex gap-2">
                <Input
                  id="document_url"
                  value={newDocument.document_url}
                  onChange={(e) => setNewDocument({...newDocument, document_url: e.target.value})}
                  placeholder="https://..."
                  className="input-industrial"
                  data-testid="document-url-input"
                />
                <Button 
                  type="button" 
                  onClick={handleAddDocument}
                  className="btn-secondary"
                  data-testid="add-document-button"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Document List */}
        {order.shipment_documents && order.shipment_documents.length > 0 ? (
          <div className="space-y-2" data-testid="documents-list">
            {order.shipment_documents.map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-sm">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#2A5934]" />
                  <div>
                    <p className="font-medium">{doc.document_name}</p>
                    <p className="text-xs text-[#595959]">{DOCUMENT_TYPES.find(t => t.value === doc.document_type)?.label}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a 
                    href={doc.document_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#2A5934] hover:underline text-sm"
                    data-testid={`view-document-${idx}`}
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleDeleteDocument(doc.document_name)}
                    className="text-red-600 hover:underline text-sm"
                    data-testid={`delete-document-${idx}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#595959] text-center py-4" data-testid="no-documents">No documents uploaded yet</p>
        )}
      </Card>
    </div>
  );
}
