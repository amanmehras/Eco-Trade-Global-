# Payment Gateway Setup Guide - EcoTrade Global

## 🌐 Your app now supports 3 payment gateways!

Your B2B marketplace is configured to accept payments through:
1. **PayPal** (Global - Best for international transactions)
2. **Razorpay** (India - UPI, Cards, Net Banking)
3. **Stripe** (International Cards - Already configured)

---

## 📋 Setup Instructions

### 1. PayPal Setup (RECOMMENDED FOR GLOBAL)

**Step 1: Create PayPal Business Account**
- Go to: https://www.paypal.com/in/business
- Click "Sign Up" and choose "Business Account"
- Complete registration with your business details

**Step 2: Get API Credentials**
- Log in to PayPal Dashboard
- Go to: https://developer.paypal.com/dashboard
- Navigate to: Apps & Credentials
- Create a new app or use existing
- Copy your credentials:
  - **Client ID**: `paypal_client_id_xxxxxxx`
  - **Secret**: `paypal_secret_xxxxxxx`

**Step 3: Update Your App**
Update `/app/backend/.env`:
```
PAYPAL_CLIENT_ID="your_actual_client_id_here"
PAYPAL_CLIENT_SECRET="your_actual_secret_here"
PAYPAL_MODE="sandbox"  # Use "live" for production
```

**Step 4: Test Mode**
- Use `sandbox` mode for testing
- PayPal provides test accounts for buyers/sellers
- Switch to `live` mode when ready for production

---

### 2. Razorpay Setup (FOR INDIA)

**Step 1: Create Razorpay Account**
- Go to: https://razorpay.com
- Click "Sign Up" - It's free and instant!
- No invite needed (unlike Stripe)

**Step 2: Complete KYC**
- Business details
- Bank account information
- PAN/GST details
- This takes 1-2 business days for approval

**Step 3: Get API Keys**
- Log in to Razorpay Dashboard
- Go to Settings → API Keys
- Click "Generate Test Keys" (for testing)
- Copy your credentials:
  - **Key ID**: `rzp_test_xxxxxxx`
  - **Key Secret**: `secret_xxxxxxx`

**Step 4: Update Your App**
Update `/app/backend/.env`:
```
RAZORPAY_KEY_ID="rzp_test_your_actual_key_id"
RAZORPAY_KEY_SECRET="your_actual_secret"
```

**Step 5: Test Cards**
For testing, use Razorpay test cards:
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date
- Name: Any name

**Step 6: Go Live**
- When ready for production:
  - Generate "Live Keys" from dashboard
  - Replace test keys with live keys in `.env`
  - Restart backend: `sudo supervisorctl restart backend`

---

### 3. Stripe Setup (ALREADY CONFIGURED)

Currently using test mode: `sk_test_emergent`

**To use your own Stripe:**
- Get Stripe invite OR use Stripe Atlas
- Once approved, update `STRIPE_API_KEY` in `/app/backend/.env`

---

## 🚀 How It Works for Users

**When a buyer places an order:**

1. **Click "Pay" button** on Orders page
2. **Select Payment Gateway**:
   - PayPal (if international or prefer PayPal)
   - Razorpay (if in India, want UPI/NetBanking)
   - Stripe (if have international card)
3. **Proceed to Payment**
4. **Complete payment** on gateway's secure page
5. **Auto-redirect back** to your app
6. **Order status updates** to "Confirmed"

---

## 💰 Transaction Fees

| Gateway | Domestic (India) | International | Settlement Time |
|---------|------------------|---------------|-----------------|
| **Razorpay** | 2% + GST | 3% + GST | T+3 days |
| **PayPal** | 2.5% + fixed fee | 3.9% + $0.30 | 1-3 days |
| **Stripe** | N/A (needs setup) | 2.9% + $0.30 | 2-7 days |

---

## 🔒 Security Notes

1. **Never expose secrets in frontend**
   - All API keys stay in backend `.env` file
   - Frontend only gets public keys

2. **Use HTTPS in production**
   - Required for payment gateways
   - Already configured on Emergent deployment

3. **Webhook Security**
   - Razorpay: Signature verification enabled
   - PayPal: OAuth2 authentication
   - Stripe: Webhook signature verification

---

## 🧪 Testing Your Integration

**Test each gateway:**

1. **Create test order** in your app
2. **Click Pay** and select gateway
3. **Use test credentials**:
   - Razorpay: 4111 1111 1111 1111
   - PayPal: Use sandbox test accounts
   - Stripe: 4242 4242 4242 4242

4. **Verify payment** completes successfully
5. **Check order status** updates to "Confirmed"

---

## 📝 After You Get Credentials

**Steps to activate:**

1. Update `/app/backend/.env` with your keys
2. Restart backend: `sudo supervisorctl restart backend`
3. Test with real credentials
4. Go live!

---

## 🆘 Need Help?

**Common Issues:**

1. **"Invalid API Key" error**
   - Check if you copied keys correctly
   - Ensure no extra spaces
   - Verify you're using test/live keys consistently

2. **Payment not completing**
   - Check backend logs: `tail -f /var/log/supervisor/backend.err.log`
   - Verify webhook URLs are accessible
   - Ensure CORS is configured correctly

3. **Razorpay popup not opening**
   - Check if Razorpay script is loaded in HTML
   - Verify browser doesn't block popups
   - Check browser console for errors

---

## 🎯 Recommended Setup for Your Business

**Phase 1: Testing (NOW)**
- ✅ PayPal Sandbox (test mode)
- ✅ Razorpay Test Keys
- Test all flows thoroughly

**Phase 2: Soft Launch (India)**
- ✅ Razorpay Live Keys (after KYC approval)
- ✅ PayPal Live for international
- Start with small transactions

**Phase 3: Full Production**
- ✅ All gateways live
- ✅ Monitor transactions
- ✅ Scale up as needed

---

## 📞 Support Contacts

**Razorpay Support:** support@razorpay.com
**PayPal Support:** https://www.paypal.com/in/smarthelp/contact-us
**Stripe Support:** https://support.stripe.com

---

**Your app is ready! Just add your payment credentials and start accepting payments globally! 🚀**
