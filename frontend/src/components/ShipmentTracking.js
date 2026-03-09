import { Ship, Calendar, MapPin, Package, FileText, Truck } from 'lucide-react';
import { Card } from '@/components/ui/card';

const SHIPMENT_STATUS_CONFIG = {
  not_shipped: { label: 'Not Shipped', color: 'bg-gray-100 text-gray-800', icon: Package },
  in_transit: { label: 'In Transit', color: 'bg-blue-100 text-blue-800', icon: Ship },
  arrived: { label: 'Arrived at Port', color: 'bg-yellow-100 text-yellow-800', icon: MapPin },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: Truck }
};

const DOCUMENT_TYPE_LABELS = {
  invoice: 'Commercial Invoice',
  packing_list: 'Packing List',
  bill_of_lading: 'Bill of Lading',
  certificate: 'Certificate of Origin',
  inspection: 'Inspection Report',
  other: 'Other Document'
};

export default function ShipmentTracking({ order }) {
  const hasShipmentInfo = order.sales_order_number || order.shipment_date || order.port_of_loading;
  
  if (!hasShipmentInfo) {
    return (
      <Card className="p-6 bg-gray-50 text-center" data-testid="no-shipment-info">
        <Ship className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-[#595959]">Shipment details not yet available</p>
        <p className="text-sm text-[#595959] mt-1">The shipper will update shipping information soon</p>
      </Card>
    );
  }

  const statusConfig = SHIPMENT_STATUS_CONFIG[order.shipment_status] || SHIPMENT_STATUS_CONFIG.not_shipped;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Status Timeline */}
      <Card className="p-6 industrial-card" data-testid="shipment-status-card">
        <div className="flex items-center gap-3 mb-6">
          <StatusIcon className="w-8 h-8 text-[#2A5934]" />
          <div>
            <h3 className="text-2xl font-bold">Shipment Status</h3>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium uppercase mt-1 ${statusConfig.color}`} data-testid="shipment-status">
              {statusConfig.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {order.sales_order_number && (
            <div>
              <p className="text-sm text-[#595959] mb-1">Sales Order Number</p>
              <p className="font-bold mono text-lg" data-testid="sales-order-number">{order.sales_order_number}</p>
            </div>
          )}

          {order.container_number && (
            <div>
              <p className="text-sm text-[#595959] mb-1">Container Number</p>
              <p className="font-bold mono text-lg" data-testid="container-number">{order.container_number}</p>
            </div>
          )}

          {order.shipment_date && (
            <div>
              <p className="text-sm text-[#595959] mb-1">Shipment Date</p>
              <p className="font-medium" data-testid="shipment-date">{new Date(order.shipment_date).toLocaleDateString()}</p>
            </div>
          )}

          {order.estimated_arrival && (
            <div>
              <p className="text-sm text-[#595959] mb-1">Estimated Arrival</p>
              <p className="font-medium" data-testid="estimated-arrival">{new Date(order.estimated_arrival).toLocaleDateString()}</p>
            </div>
          )}

          {order.shipping_line && (
            <div>
              <p className="text-sm text-[#595959] mb-1">Shipping Line</p>
              <p className="font-medium" data-testid="shipping-line">{order.shipping_line}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Port Information */}
      {(order.port_of_loading || order.port_of_arrival) && (
        <Card className="p-6 industrial-card" data-testid="port-info-card">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-6 h-6 text-[#2A5934]" />
            <h3 className="text-xl font-bold">Port Information</h3>
          </div>
          
          <div className="flex items-center justify-between">
            {order.port_of_loading && (
              <div className="flex-1">
                <p className="text-sm text-[#595959] mb-1">Port of Loading</p>
                <p className="font-medium text-lg" data-testid="port-of-loading">{order.port_of_loading}</p>
              </div>
            )}
            
            {order.port_of_loading && order.port_of_arrival && (
              <div className="px-6">
                <Ship className="w-8 h-8 text-[#2A5934]" />
              </div>
            )}
            
            {order.port_of_arrival && (
              <div className="flex-1 text-right">
                <p className="text-sm text-[#595959] mb-1">Port of Arrival</p>
                <p className="font-medium text-lg" data-testid="port-of-arrival">{order.port_of_arrival}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Shipment Notes */}
      {order.shipment_notes && (
        <Card className="p-6 bg-blue-50 border-blue-200" data-testid="shipment-notes-card">
          <h4 className="font-bold mb-2">Shipment Notes</h4>
          <p className="text-[#595959]" data-testid="shipment-notes">{order.shipment_notes}</p>
        </Card>
      )}

      {/* Shipment Documents */}
      {order.shipment_documents && order.shipment_documents.length > 0 && (
        <Card className="p-6 industrial-card" data-testid="documents-card">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-6 h-6 text-[#2A5934]" />
            <h3 className="text-xl font-bold">Shipment Documents</h3>
          </div>
          
          <div className="space-y-2">
            {order.shipment_documents.map((doc, idx) => (
              <a
                key={idx}
                href={doc.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors"
                data-testid={`document-${idx}`}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#2A5934]" />
                  <div>
                    <p className="font-medium">{doc.document_name}</p>
                    <p className="text-xs text-[#595959]">{DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}</p>
                  </div>
                </div>
                <span className="text-[#2A5934] text-sm font-medium">View →</span>
              </a>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
