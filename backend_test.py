import requests
import sys
import json
from datetime import datetime

class ScrapMarketplaceAPITester:
    def __init__(self, base_url="https://supplier-network-5.preview.emergentagent.com"):
        self.base_url = base_url
        self.buyer_token = None
        self.shipper_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.buyer_user_id = None
        self.shipper_user_id = None
        self.test_product_id = None
        self.test_rfq_id = None
        self.test_order_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        if params:
            url += f"?{params}"
        
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.text else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.text}")
                except:
                    pass
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_flow(self):
        """Test authentication endpoints"""
        print("\n=== TESTING AUTHENTICATION ===")
        
        # Test registration for buyer
        buyer_data = {
            "email": "buyer@test.com",
            "password": "password123",
            "role": "buyer",
            "company_name": "Test Buyer Corp",
            "contact_person": "John Buyer",
            "phone": "+1234567890",
            "country": "USA"
        }
        
        success, response = self.run_test("Buyer Registration", "POST", "auth/register", 200, buyer_data)
        if success and 'token' in response:
            self.buyer_token = response['token']
            self.buyer_user_id = response['user']['id']
            print(f"Buyer registered with ID: {self.buyer_user_id}")
        else:
            # Try login if already registered
            login_data = {"email": buyer_data["email"], "password": buyer_data["password"]}
            success, response = self.run_test("Buyer Login", "POST", "auth/login", 200, login_data)
            if success and 'token' in response:
                self.buyer_token = response['token']
                self.buyer_user_id = response['user']['id']

        # Test registration for shipper
        shipper_data = {
            "email": "shipper@test.com", 
            "password": "password123",
            "role": "shipper",
            "company_name": "Test Shipper Inc",
            "contact_person": "Jane Shipper",
            "phone": "+1234567891",
            "country": "India"
        }
        
        success, response = self.run_test("Shipper Registration", "POST", "auth/register", 200, shipper_data)
        if success and 'token' in response:
            self.shipper_token = response['token']
            self.shipper_user_id = response['user']['id']
            print(f"Shipper registered with ID: {self.shipper_user_id}")
        else:
            # Try login if already registered
            login_data = {"email": shipper_data["email"], "password": shipper_data["password"]}
            success, response = self.run_test("Shipper Login", "POST", "auth/login", 200, login_data)
            if success and 'token' in response:
                self.shipper_token = response['token']
                self.shipper_user_id = response['user']['id']

        # Test get current user
        if self.buyer_token:
            self.run_test("Get Buyer Profile", "GET", "auth/me", 200, token=self.buyer_token)

        return self.buyer_token and self.shipper_token

    def test_product_endpoints(self):
        """Test product CRUD operations"""
        print("\n=== TESTING PRODUCT ENDPOINTS ===")
        
        if not self.shipper_token:
            print("❌ Skipping product tests - no shipper token")
            return False

        # Test creating a product
        product_data = {
            "category": "paper",
            "name": "High Quality Cardboard Scrap",
            "description": "Premium cardboard scrap material suitable for recycling",
            "quantity": 500,
            "unit": "ton", 
            "price_per_unit": 150.0,
            "currency": "USD",
            "location": "Mumbai, India",
            "images": [],
            "specifications": {"grade": "A", "moisture": "< 5%"}
        }
        
        success, response = self.run_test("Create Product", "POST", "products", 200, product_data, self.shipper_token)
        if success and 'id' in response:
            self.test_product_id = response['id']
            print(f"Product created with ID: {self.test_product_id}")

        # Test getting all products
        self.run_test("Get All Products", "GET", "products", 200)
        
        # Test getting products by category
        self.run_test("Get Products by Category", "GET", "products", 200, params="category=paper")
        
        # Test search functionality
        self.run_test("Search Products", "GET", "products", 200, params="search=cardboard")
        
        # Test getting single product
        if self.test_product_id:
            self.run_test("Get Single Product", "GET", f"products/{self.test_product_id}", 200)
            
            # Test getting shipper's products
            self.run_test("Get Shipper Products", "GET", f"products/shipper/{self.shipper_user_id}", 200)

        return True

    def test_rfq_endpoints(self):
        """Test RFQ endpoints"""
        print("\n=== TESTING RFQ ENDPOINTS ===")
        
        if not self.buyer_token:
            print("❌ Skipping RFQ tests - no buyer token")
            return False

        # Test creating an RFQ
        rfq_data = {
            "category": "metal",
            "material_name": "Aluminum Scrap",
            "quantity": 100,
            "unit": "ton",
            "target_price": 1200.0,
            "delivery_location": "New York, USA",
            "delivery_deadline": "2026-12-31",
            "description": "Looking for high quality aluminum scrap for production"
        }
        
        success, response = self.run_test("Create RFQ", "POST", "rfqs", 200, rfq_data, self.buyer_token)
        if success and 'id' in response:
            self.test_rfq_id = response['id']
            print(f"RFQ created with ID: {self.test_rfq_id}")

        # Test getting all RFQs
        self.run_test("Get All RFQs", "GET", "rfqs", 200)
        
        # Test getting RFQs by category
        self.run_test("Get RFQs by Category", "GET", "rfqs", 200, params="category=metal")
        
        # Test getting single RFQ
        if self.test_rfq_id:
            self.run_test("Get Single RFQ", "GET", f"rfqs/{self.test_rfq_id}", 200)

        # Test buyer's RFQs
        self.run_test("Get Buyer RFQs", "GET", "rfqs/buyer/my-rfqs", 200, token=self.buyer_token)

        # Test submitting quote (as shipper)
        if self.test_rfq_id and self.shipper_token:
            quote_data = {
                "price_per_unit": 1100.0,
                "currency": "USD",
                "notes": "Best quality aluminum scrap available",
                "valid_until": "2026-01-31"
            }
            self.run_test("Submit Quote", "POST", f"rfqs/{self.test_rfq_id}/quote", 200, quote_data, self.shipper_token)

        return True

    def test_message_endpoints(self):
        """Test messaging functionality"""
        print("\n=== TESTING MESSAGE ENDPOINTS ===")
        
        if not (self.buyer_token and self.shipper_token):
            print("❌ Skipping message tests - missing tokens")
            return False

        # Test sending message from buyer to shipper
        message_data = {
            "receiver_id": self.shipper_user_id,
            "subject": "Inquiry about your product",
            "content": "Hi, I'm interested in your cardboard scrap. Can you provide more details?"
        }
        
        self.run_test("Send Message", "POST", "messages", 200, message_data, self.buyer_token)
        
        # Test getting inbox
        self.run_test("Get Inbox", "GET", "messages/inbox", 200, token=self.shipper_token)
        
        # Test getting sent messages
        self.run_test("Get Sent Messages", "GET", "messages/sent", 200, token=self.buyer_token)

        return True

    def test_order_endpoints(self):
        """Test order management"""
        print("\n=== TESTING ORDER ENDPOINTS ===")
        
        if not (self.buyer_token and self.shipper_token and self.test_product_id):
            print("❌ Skipping order tests - missing prerequisites")
            return False

        # Test creating an order
        order_data = {
            "shipper_id": self.shipper_user_id,
            "product_id": self.test_product_id,
            "material_name": "High Quality Cardboard Scrap",
            "quantity": 10.0,
            "unit": "ton",
            "price_per_unit": 150.0,
            "delivery_location": "New York, USA"
        }
        
        success, response = self.run_test("Create Order", "POST", "orders", 200, order_data, self.buyer_token)
        if success and 'id' in response:
            self.test_order_id = response['id']
            print(f"Order created with ID: {self.test_order_id}")

        # Test getting buyer orders
        self.run_test("Get Buyer Orders", "GET", "orders/buyer/my-orders", 200, token=self.buyer_token)
        
        # Test getting shipper orders  
        self.run_test("Get Shipper Orders", "GET", "orders/shipper/my-orders", 200, token=self.shipper_token)
        
        # Test getting single order
        if self.test_order_id:
            self.run_test("Get Single Order", "GET", f"orders/{self.test_order_id}", 200, token=self.buyer_token)

        return True

    def test_payment_endpoints(self):
        """Test payment functionality"""
        print("\n=== TESTING PAYMENT ENDPOINTS ===")
        
        if not (self.buyer_token and self.test_order_id):
            print("❌ Skipping payment tests - missing prerequisites")
            return False

        # Test creating checkout session
        checkout_data = {
            "order_id": self.test_order_id,
            "origin_url": "https://supplier-network-5.preview.emergentagent.com"
        }
        
        self.run_test("Create Checkout Session", "POST", "payments/checkout", 200, checkout_data, self.buyer_token)

        return True

    def test_stats_endpoints(self):
        """Test statistics endpoints"""
        print("\n=== TESTING STATISTICS ENDPOINTS ===")
        
        # Test categories endpoint
        self.run_test("Get Categories", "GET", "stats/categories", 200)
        
        # Test dashboard stats
        if self.buyer_token:
            self.run_test("Get Buyer Dashboard Stats", "GET", "stats/dashboard", 200, token=self.buyer_token)
        
        if self.shipper_token:
            self.run_test("Get Shipper Dashboard Stats", "GET", "stats/dashboard", 200, token=self.shipper_token)

        return True

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting B2B Scrap Marketplace API Tests")
        print(f"📍 Base URL: {self.base_url}")
        
        # Test authentication first
        auth_success = self.test_auth_flow()
        if not auth_success:
            print("❌ Authentication failed, stopping tests")
            return False

        # Test all endpoints
        self.test_product_endpoints()
        self.test_rfq_endpoints() 
        self.test_message_endpoints()
        self.test_order_endpoints()
        self.test_payment_endpoints()
        self.test_stats_endpoints()

        # Print final results
        print(f"\n📊 Test Results:")
        print(f"✅ Tests passed: {self.tests_passed}/{self.tests_run}")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = ScrapMarketplaceAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())