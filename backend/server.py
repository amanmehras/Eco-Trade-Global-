from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
import razorpay
from paypalserversdk.http.auth.o_auth_2 import ClientCredentialsAuthCredentials
from paypalserversdk.paypal_serversdk_client import PaypalServersdkClient
from paypalserversdk.controllers.orders_controller import OrdersController
from paypalserversdk.models.order_request import OrderRequest
from paypalserversdk.models.amount_with_breakdown import AmountWithBreakdown
from paypalserversdk.models.purchase_unit_request import PurchaseUnitRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 7
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# Razorpay Configuration
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', 'rzp_test_placeholder')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', 'secret_placeholder')
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# PayPal Configuration  
PAYPAL_CLIENT_ID = os.environ.get('PAYPAL_CLIENT_ID', 'paypal_client_id_placeholder')
PAYPAL_CLIENT_SECRET = os.environ.get('PAYPAL_CLIENT_SECRET', 'paypal_secret_placeholder')
PAYPAL_MODE = os.environ.get('PAYPAL_MODE', 'sandbox')
paypal_client = PaypalServersdkClient(
    client_credentials_auth_credentials=ClientCredentialsAuthCredentials(
        o_auth_client_id=PAYPAL_CLIENT_ID,
        o_auth_client_secret=PAYPAL_CLIENT_SECRET
    ),
    environment=PAYPAL_MODE
)

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ============ MODELS ============
class UserRole(BaseModel):
    name: str = Field(..., description="buyer or shipper")

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    role: str
    company_name: str
    contact_person: str
    phone: str
    country: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: str
    company_name: str
    contact_person: str
    phone: str
    country: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    shipper_id: str
    category: str
    name: str
    description: str
    quantity: float
    unit: str
    price_per_unit: float
    currency: str = "USD"
    location: str
    images: List[str] = []
    specifications: Dict[str, str] = {}
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    category: str
    name: str
    description: str
    quantity: float
    unit: str
    price_per_unit: float
    currency: str = "USD"
    location: str
    images: List[str] = []
    specifications: Dict[str, str] = {}

class RFQ(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    buyer_id: str
    category: str
    material_name: str
    quantity: float
    unit: str
    target_price: Optional[float] = None
    delivery_location: str
    delivery_deadline: Optional[str] = None
    description: str
    status: str = "open"
    quotes: List[Dict] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RFQCreate(BaseModel):
    category: str
    material_name: str
    quantity: float
    unit: str
    target_price: Optional[float] = None
    delivery_location: str
    delivery_deadline: Optional[str] = None
    description: str

class QuoteSubmit(BaseModel):
    price_per_unit: float
    currency: str = "USD"
    notes: str
    valid_until: Optional[str] = None

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    receiver_id: str
    subject: str
    content: str
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MessageCreate(BaseModel):
    receiver_id: str
    subject: str
    content: str

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    buyer_id: str
    shipper_id: str
    product_id: Optional[str] = None
    rfq_id: Optional[str] = None
    material_name: str
    quantity: float
    unit: str
    price_per_unit: float
    total_amount: float
    currency: str = "USD"
    delivery_location: str
    delivery_port: Optional[str] = None
    status: str = "pending"
    payment_status: str = "pending"
    payment_session_id: Optional[str] = None
    # Shipment details
    sales_order_number: Optional[str] = None
    shipment_date: Optional[str] = None
    estimated_arrival: Optional[str] = None
    port_of_loading: Optional[str] = None
    port_of_arrival: Optional[str] = None
    shipping_line: Optional[str] = None
    container_number: Optional[str] = None
    shipment_documents: List[Dict] = []
    shipment_status: str = "not_shipped"  # not_shipped, in_transit, arrived, delivered
    shipment_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    shipper_id: str
    product_id: Optional[str] = None
    rfq_id: Optional[str] = None
    material_name: str
    quantity: float
    unit: str
    price_per_unit: float
    delivery_location: str
    delivery_port: Optional[str] = None

class ShipmentUpdate(BaseModel):
    sales_order_number: Optional[str] = None
    shipment_date: Optional[str] = None
    estimated_arrival: Optional[str] = None
    port_of_loading: Optional[str] = None
    port_of_arrival: Optional[str] = None
    shipping_line: Optional[str] = None
    container_number: Optional[str] = None
    shipment_status: Optional[str] = None
    shipment_notes: Optional[str] = None

class ShipmentDocument(BaseModel):
    document_type: str  # invoice, packing_list, bill_of_lading, certificate, other
    document_name: str
    document_url: str
    uploaded_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    shipper_id: str
    product_id: Optional[str] = None
    rfq_id: Optional[str] = None
    material_name: str
    quantity: float
    unit: str
    price_per_unit: float
    delivery_location: str

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    user_id: str
    session_id: str
    amount: float
    currency: str
    payment_status: str = "pending"
    metadata: Dict = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CheckoutRequest(BaseModel):
    order_id: str
    origin_url: str
    payment_gateway: str = "stripe"  # stripe, razorpay, or paypal

# ============ AUTH HELPERS ============
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ AUTH ROUTES ============
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    existing = await db.users.find_one({'email': user_data.email}, {'_id': 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user_data.model_dump(exclude={'password'})
    user_obj = User(**user_dict)
    doc = user_obj.model_dump()
    doc['password'] = hash_password(user_data.password)
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    token = create_token(user_obj.id, user_obj.email, user_obj.role)
    
    return {'token': token, 'user': user_obj}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({'email': credentials.email}, {'_id': 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['id'], user['email'], user['role'])
    user.pop('password', None)
    
    return {'token': token, 'user': user}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({'id': current_user['user_id']}, {'_id': 0, 'password': 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ============ PRODUCT ROUTES ============
@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'shipper':
        raise HTTPException(status_code=403, detail="Only shippers can create products")
    
    product_dict = product.model_dump()
    product_obj = Product(shipper_id=current_user['user_id'], **product_dict)
    doc = product_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.products.insert_one(doc)
    return product_obj

@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None, search: Optional[str] = None):
    query = {'status': 'active'}
    if category:
        query['category'] = category
    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'description': {'$regex': search, '$options': 'i'}}
        ]
    
    products = await db.products.find(query, {'_id': 0}).to_list(100)
    for p in products:
        if isinstance(p['created_at'], str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({'id': product_id}, {'_id': 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(product['created_at'], str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    return product

@api_router.get("/products/shipper/{shipper_id}", response_model=List[Product])
async def get_shipper_products(shipper_id: str):
    products = await db.products.find({'shipper_id': shipper_id}, {'_id': 0}).to_list(100)
    for p in products:
        if isinstance(p['created_at'], str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    return products

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, updates: dict, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({'id': product_id}, {'_id': 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product['shipper_id'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.products.update_one({'id': product_id}, {'$set': updates})
    return {'message': 'Product updated'}

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({'id': product_id}, {'_id': 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product['shipper_id'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.products.update_one({'id': product_id}, {'$set': {'status': 'deleted'}})
    return {'message': 'Product deleted'}

# ============ RFQ ROUTES ============
@api_router.post("/rfqs", response_model=RFQ)
async def create_rfq(rfq: RFQCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'buyer':
        raise HTTPException(status_code=403, detail="Only buyers can create RFQs")
    
    rfq_dict = rfq.model_dump()
    rfq_obj = RFQ(buyer_id=current_user['user_id'], **rfq_dict)
    doc = rfq_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.rfqs.insert_one(doc)
    return rfq_obj

@api_router.get("/rfqs", response_model=List[RFQ])
async def get_rfqs(category: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if category:
        query['category'] = category
    if status:
        query['status'] = status
    else:
        query['status'] = 'open'
    
    rfqs = await db.rfqs.find(query, {'_id': 0}).to_list(100)
    for r in rfqs:
        if isinstance(r['created_at'], str):
            r['created_at'] = datetime.fromisoformat(r['created_at'])
    return rfqs

@api_router.get("/rfqs/{rfq_id}", response_model=RFQ)
async def get_rfq(rfq_id: str):
    rfq = await db.rfqs.find_one({'id': rfq_id}, {'_id': 0})
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    if isinstance(rfq['created_at'], str):
        rfq['created_at'] = datetime.fromisoformat(rfq['created_at'])
    return rfq

@api_router.post("/rfqs/{rfq_id}/quote")
async def submit_quote(rfq_id: str, quote: QuoteSubmit, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'shipper':
        raise HTTPException(status_code=403, detail="Only shippers can submit quotes")
    
    rfq = await db.rfqs.find_one({'id': rfq_id}, {'_id': 0})
    if not rfq or rfq['status'] != 'open':
        raise HTTPException(status_code=400, detail="RFQ not available")
    
    quote_dict = quote.model_dump()
    quote_dict['shipper_id'] = current_user['user_id']
    quote_dict['submitted_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.rfqs.update_one(
        {'id': rfq_id},
        {'$push': {'quotes': quote_dict}}
    )
    return {'message': 'Quote submitted'}

@api_router.get("/rfqs/buyer/my-rfqs", response_model=List[RFQ])
async def get_my_rfqs(current_user: dict = Depends(get_current_user)):
    rfqs = await db.rfqs.find({'buyer_id': current_user['user_id']}, {'_id': 0}).to_list(100)
    for r in rfqs:
        if isinstance(r['created_at'], str):
            r['created_at'] = datetime.fromisoformat(r['created_at'])
    return rfqs

# ============ MESSAGE ROUTES ============
@api_router.post("/messages", response_model=Message)
async def send_message(message: MessageCreate, current_user: dict = Depends(get_current_user)):
    message_dict = message.model_dump()
    message_obj = Message(sender_id=current_user['user_id'], **message_dict)
    doc = message_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.messages.insert_one(doc)
    return message_obj

@api_router.get("/messages/inbox", response_model=List[Message])
async def get_inbox(current_user: dict = Depends(get_current_user)):
    messages = await db.messages.find(
        {'receiver_id': current_user['user_id']},
        {'_id': 0}
    ).sort('created_at', -1).to_list(100)
    for m in messages:
        if isinstance(m['created_at'], str):
            m['created_at'] = datetime.fromisoformat(m['created_at'])
    return messages

@api_router.get("/messages/sent", response_model=List[Message])
async def get_sent(current_user: dict = Depends(get_current_user)):
    messages = await db.messages.find(
        {'sender_id': current_user['user_id']},
        {'_id': 0}
    ).sort('created_at', -1).to_list(100)
    for m in messages:
        if isinstance(m['created_at'], str):
            m['created_at'] = datetime.fromisoformat(m['created_at'])
    return messages

@api_router.put("/messages/{message_id}/read")
async def mark_read(message_id: str, current_user: dict = Depends(get_current_user)):
    await db.messages.update_one(
        {'id': message_id, 'receiver_id': current_user['user_id']},
        {'$set': {'read': True}}
    )
    return {'message': 'Marked as read'}

# ============ ORDER ROUTES ============
@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'buyer':
        raise HTTPException(status_code=403, detail="Only buyers can create orders")
    
    order_dict = order.model_dump()
    total_amount = order.quantity * order.price_per_unit
    order_obj = Order(
        buyer_id=current_user['user_id'],
        total_amount=total_amount,
        **order_dict
    )
    doc = order_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.orders.insert_one(doc)
    return order_obj

@api_router.get("/orders/buyer/my-orders", response_model=List[Order])
async def get_buyer_orders(current_user: dict = Depends(get_current_user)):
    orders = await db.orders.find({'buyer_id': current_user['user_id']}, {'_id': 0}).to_list(100)
    for o in orders:
        if isinstance(o['created_at'], str):
            o['created_at'] = datetime.fromisoformat(o['created_at'])
    return orders

@api_router.get("/orders/shipper/my-orders", response_model=List[Order])
async def get_shipper_orders(current_user: dict = Depends(get_current_user)):
    orders = await db.orders.find({'shipper_id': current_user['user_id']}, {'_id': 0}).to_list(100)
    for o in orders:
        if isinstance(o['created_at'], str):
            o['created_at'] = datetime.fromisoformat(o['created_at'])
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({'id': order_id}, {'_id': 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order['buyer_id'] != current_user['user_id'] and order['shipper_id'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    if isinstance(order['created_at'], str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    return order

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({'id': order_id}, {'_id': 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order['shipper_id'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.orders.update_one({'id': order_id}, {'$set': {'status': status}})
    return {'message': 'Order status updated'}

# ============ SHIPMENT ROUTES ============
@api_router.put("/orders/{order_id}/shipment")
async def update_shipment_details(
    order_id: str, 
    shipment_data: ShipmentUpdate, 
    current_user: dict = Depends(get_current_user)
):
    order = await db.orders.find_one({'id': order_id}, {'_id': 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order['shipper_id'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Only shipper can update shipment details")
    
    update_data = {k: v for k, v in shipment_data.model_dump().items() if v is not None}
    
    await db.orders.update_one(
        {'id': order_id},
        {'$set': update_data}
    )
    
    return {'message': 'Shipment details updated successfully'}

@api_router.post("/orders/{order_id}/shipment/documents")
async def add_shipment_document(
    order_id: str,
    document: ShipmentDocument,
    current_user: dict = Depends(get_current_user)
):
    order = await db.orders.find_one({'id': order_id}, {'_id': 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order['shipper_id'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Only shipper can add documents")
    
    doc_data = document.model_dump()
    
    await db.orders.update_one(
        {'id': order_id},
        {'$push': {'shipment_documents': doc_data}}
    )
    
    return {'message': 'Document added successfully', 'document': doc_data}

@api_router.delete("/orders/{order_id}/shipment/documents/{document_name}")
async def delete_shipment_document(
    order_id: str,
    document_name: str,
    current_user: dict = Depends(get_current_user)
):
    order = await db.orders.find_one({'id': order_id}, {'_id': 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order['shipper_id'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.orders.update_one(
        {'id': order_id},
        {'$pull': {'shipment_documents': {'document_name': document_name}}}
    )
    
    return {'message': 'Document deleted successfully'}

# ============ PAYMENT ROUTES ============
@api_router.post("/payments/checkout")
async def create_checkout(checkout_req: CheckoutRequest, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({'id': checkout_req.order_id}, {'_id': 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order['buyer_id'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    if order['payment_status'] == 'paid':
        raise HTTPException(status_code=400, detail="Order already paid")
    
    payment_gateway = checkout_req.payment_gateway.lower()
    
    # STRIPE PAYMENT
    if payment_gateway == "stripe":
        webhook_url = f"{checkout_req.origin_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        success_url = f"{checkout_req.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}&gateway=stripe"
        cancel_url = f"{checkout_req.origin_url}/payment/cancel"
        
        checkout_request = CheckoutSessionRequest(
            amount=float(order['total_amount']),
            currency=order['currency'].lower(),
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                'order_id': order['id'],
                'buyer_id': order['buyer_id'],
                'shipper_id': order['shipper_id']
            }
        )
        
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        transaction = PaymentTransaction(
            order_id=order['id'],
            user_id=current_user['user_id'],
            session_id=session.session_id,
            amount=float(order['total_amount']),
            currency=order['currency'],
            payment_status='pending',
            metadata={'order_id': order['id'], 'gateway': 'stripe'}
        )
        doc = transaction.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.payment_transactions.insert_one(doc)
        
        await db.orders.update_one(
            {'id': order['id']},
            {'$set': {'payment_session_id': session.session_id, 'payment_gateway': 'stripe'}}
        )
        
        return {'url': session.url, 'session_id': session.session_id, 'gateway': 'stripe'}
    
    # RAZORPAY PAYMENT
    elif payment_gateway == "razorpay":
        # Create Razorpay order
        razorpay_order = razorpay_client.order.create({
            "amount": int(float(order['total_amount']) * 100),  # Convert to paise
            "currency": order['currency'],
            "receipt": order['id'][:40],  # Max 40 chars
            "notes": {
                "order_id": order['id'],
                "buyer_id": order['buyer_id'],
                "shipper_id": order['shipper_id']
            }
        })
        
        transaction = PaymentTransaction(
            order_id=order['id'],
            user_id=current_user['user_id'],
            session_id=razorpay_order['id'],
            amount=float(order['total_amount']),
            currency=order['currency'],
            payment_status='pending',
            metadata={'order_id': order['id'], 'gateway': 'razorpay'}
        )
        doc = transaction.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.payment_transactions.insert_one(doc)
        
        await db.orders.update_one(
            {'id': order['id']},
            {'$set': {'payment_session_id': razorpay_order['id'], 'payment_gateway': 'razorpay'}}
        )
        
        return {
            'razorpay_order_id': razorpay_order['id'],
            'razorpay_key_id': RAZORPAY_KEY_ID,
            'amount': razorpay_order['amount'],
            'currency': razorpay_order['currency'],
            'gateway': 'razorpay'
        }
    
    # PAYPAL PAYMENT
    elif payment_gateway == "paypal":
        # Create PayPal order
        order_request = OrderRequest(
            intent="CAPTURE",
            purchase_units=[
                PurchaseUnitRequest(
                    reference_id=order['id'],
                    amount=AmountWithBreakdown(
                        currency_code=order['currency'],
                        value=str(float(order['total_amount']))
                    )
                )
            ],
            application_context={
                "return_url": f"{checkout_req.origin_url}/payment/success?gateway=paypal",
                "cancel_url": f"{checkout_req.origin_url}/payment/cancel"
            }
        )
        
        try:
            paypal_order = paypal_client.orders.orders_create({"body": order_request})
            
            # Get approval URL
            approval_url = next((link.href for link in paypal_order.body.links if link.rel == "approve"), None)
            
            transaction = PaymentTransaction(
                order_id=order['id'],
                user_id=current_user['user_id'],
                session_id=paypal_order.body.id,
                amount=float(order['total_amount']),
                currency=order['currency'],
                payment_status='pending',
                metadata={'order_id': order['id'], 'gateway': 'paypal'}
            )
            doc = transaction.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            doc['updated_at'] = doc['updated_at'].isoformat()
            await db.payment_transactions.insert_one(doc)
            
            await db.orders.update_one(
                {'id': order['id']},
                {'$set': {'payment_session_id': paypal_order.body.id, 'payment_gateway': 'paypal'}}
            )
            
            return {'url': approval_url, 'session_id': paypal_order.body.id, 'gateway': 'paypal'}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PayPal error: {str(e)}")
    
    else:
        raise HTTPException(status_code=400, detail="Invalid payment gateway")

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    transaction = await db.payment_transactions.find_one({'session_id': session_id}, {'_id': 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction['payment_status'] == 'paid':
        return {
            'status': 'complete',
            'payment_status': 'paid',
            'amount_total': transaction['amount'],
            'currency': transaction['currency']
        }
    
    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        if checkout_status.payment_status == 'paid' and transaction['payment_status'] != 'paid':
            await db.payment_transactions.update_one(
                {'session_id': session_id},
                {'$set': {
                    'payment_status': 'paid',
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }}
            )
            await db.orders.update_one(
                {'id': transaction['order_id']},
                {'$set': {'payment_status': 'paid', 'status': 'confirmed'}}
            )
        
        return {
            'status': checkout_status.status,
            'payment_status': checkout_status.payment_status,
            'amount_total': checkout_status.amount_total,
            'currency': checkout_status.currency
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    body = await request.body()
    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, stripe_signature)
        
        if webhook_response.payment_status == 'paid':
            session_id = webhook_response.session_id
            transaction = await db.payment_transactions.find_one({'session_id': session_id}, {'_id': 0})
            
            if transaction and transaction['payment_status'] != 'paid':
                await db.payment_transactions.update_one(
                    {'session_id': session_id},
                    {'$set': {
                        'payment_status': 'paid',
                        'updated_at': datetime.now(timezone.utc).isoformat()
                    }}
                )
                await db.orders.update_one(
                    {'id': transaction['order_id']},
                    {'$set': {'payment_status': 'paid', 'status': 'confirmed'}}
                )
        
        return {'status': 'success'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============ RAZORPAY VERIFICATION ============
@api_router.post("/payments/razorpay/verify")
async def verify_razorpay_payment(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Verify signature
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        })
        
        # Update transaction and order
        await db.payment_transactions.update_one(
            {'session_id': razorpay_order_id},
            {'$set': {
                'payment_status': 'paid',
                'updated_at': datetime.now(timezone.utc).isoformat(),
                'metadata.payment_id': razorpay_payment_id
            }}
        )
        
        transaction = await db.payment_transactions.find_one({'session_id': razorpay_order_id}, {'_id': 0})
        if transaction:
            await db.orders.update_one(
                {'id': transaction['order_id']},
                {'$set': {'payment_status': 'paid', 'status': 'confirmed'}}
            )
        
        return {'status': 'success', 'message': 'Payment verified'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Payment verification failed: {str(e)}")

# ============ PAYPAL CAPTURE ============
@api_router.post("/payments/paypal/capture/{order_id}")
async def capture_paypal_payment(order_id: str, current_user: dict = Depends(get_current_user)):
    try:
        # Capture the PayPal order
        capture_response = paypal_client.orders.orders_capture({"id": order_id})
        
        if capture_response.body.status == "COMPLETED":
            # Update transaction and order
            await db.payment_transactions.update_one(
                {'session_id': order_id},
                {'$set': {
                    'payment_status': 'paid',
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }}
            )
            
            transaction = await db.payment_transactions.find_one({'session_id': order_id}, {'_id': 0})
            if transaction:
                await db.orders.update_one(
                    {'id': transaction['order_id']},
                    {'$set': {'payment_status': 'paid', 'status': 'confirmed'}}
                )
            
            return {'status': 'success', 'message': 'Payment captured'}
        else:
            raise HTTPException(status_code=400, detail="Payment not completed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PayPal capture error: {str(e)}")

# ============ STATS ROUTES ============
@api_router.get("/stats/categories")
async def get_categories():
    return {
        'categories': [
            {'id': 'paper', 'name': 'Paper & Cardboard', 'icon': '📄'},
            {'id': 'metal', 'name': 'Metals (Steel, Aluminum, Copper)', 'icon': '🔩'},
            {'id': 'plastic', 'name': 'Plastic', 'icon': '♻️'},
            {'id': 'textile', 'name': 'Textiles & Cloth', 'icon': '👕'},
            {'id': 'rubber', 'name': 'Rubber', 'icon': '⚫'},
            {'id': 'glass', 'name': 'Glass', 'icon': '🪟'},
            {'id': 'electronics', 'name': 'E-Waste', 'icon': '💻'},
            {'id': 'other', 'name': 'Other Materials', 'icon': '📦'}
        ]
    }

@api_router.get("/stats/dashboard")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    if current_user['role'] == 'buyer':
        orders_count = await db.orders.count_documents({'buyer_id': current_user['user_id']})
        rfqs_count = await db.rfqs.count_documents({'buyer_id': current_user['user_id']})
        messages_count = await db.messages.count_documents({'receiver_id': current_user['user_id'], 'read': False})
        return {
            'total_orders': orders_count,
            'active_rfqs': rfqs_count,
            'unread_messages': messages_count
        }
    else:
        products_count = await db.products.count_documents({'shipper_id': current_user['user_id'], 'status': 'active'})
        orders_count = await db.orders.count_documents({'shipper_id': current_user['user_id']})
        messages_count = await db.messages.count_documents({'receiver_id': current_user['user_id'], 'read': False})
        return {
            'total_products': products_count,
            'total_orders': orders_count,
            'unread_messages': messages_count
        }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()