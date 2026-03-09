import { useState } from 'react';
import { CreditCard, Globe, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';

const PAYMENT_GATEWAYS = [
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Global payments - Accepts all countries',
    icon: Globe,
    color: 'bg-blue-50 border-blue-200',
    best: 'Best for International'
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    description: 'UPI, Cards, Net Banking',
    icon: MapPin,
    color: 'bg-green-50 border-green-200',
    best: 'Best for India'
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Credit/Debit Cards',
    icon: CreditCard,
    color: 'bg-purple-50 border-purple-200',
    best: 'International Cards'
  }
];

export default function PaymentGatewaySelector({ onSelect, selectedGateway }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg mb-4">Select Payment Method</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PAYMENT_GATEWAYS.map((gateway) => (
          <Card
            key={gateway.id}
            onClick={() => onSelect(gateway.id)}
            className={`p-4 cursor-pointer transition-all border-2 ${
              selectedGateway === gateway.id
                ? 'border-[#2A5934] bg-green-50'
                : gateway.color
            } hover:shadow-md`}
            data-testid={`payment-gateway-${gateway.id}`}
          >
            <div className="flex items-start gap-3">
              <gateway.icon className={`w-8 h-8 ${selectedGateway === gateway.id ? 'text-[#2A5934]' : 'text-gray-600'}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold">{gateway.name}</h4>
                  {selectedGateway === gateway.id && (
                    <span className="text-xs bg-[#2A5934] text-white px-2 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#595959] mt-1">{gateway.description}</p>
                <p className="text-xs text-[#2A5934] font-medium mt-2">{gateway.best}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
