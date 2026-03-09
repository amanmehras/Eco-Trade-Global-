# Railway Deployment Fix Guide

## ✅ Configuration Files Added!

I've created the necessary Railway configuration files for you:

**Backend:**
- `railway.json` - Railway deployment config
- `Procfile` - Start command
- `nixpacks.toml` - Build configuration

**Frontend:**
- `railway.json` - Railway deployment config  
- `nixpacks.toml` - Build configuration

---

## 🚀 How to Deploy (Correct Way):

### Method 1: Deploy Backend & Frontend Separately (RECOMMENDED)

**Step 1: Deploy Backend First**

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. **IMPORTANT:** In the service settings:
   - Set **Root Directory:** `backend`
   - This tells Railway to only deploy the backend folder

**Add Environment Variables (Backend):**
```
MONGO_URL=mongodb+srv://...  (get from MongoDB Atlas)
DB_NAME=ecotrade_production
JWT_SECRET=your-secret-key-here-minimum-32-chars
CORS_ORIGINS=*
STRIPE_API_KEY=sk_test_emergent
RAZORPAY_KEY_ID=rzp_test_placeholder
RAZORPAY_KEY_SECRET=secret_placeholder
PAYPAL_CLIENT_ID=paypal_placeholder
PAYPAL_CLIENT_SECRET=paypal_placeholder
PAYPAL_MODE=sandbox
```

**Step 2: Add MongoDB**

1. In Railway dashboard, click **"+ New"**
2. Select **"Database" → "Add MongoDB"**
3. Copy the MongoDB connection string
4. Update `MONGO_URL` in backend environment variables

**Step 3: Deploy Frontend**

1. In same Railway project, click **"+ New"**
2. Select **"GitHub Repo"** (same repo)
3. **IMPORTANT:** In service settings:
   - Set **Root Directory:** `frontend`

**Add Environment Variables (Frontend):**
```
REACT_APP_BACKEND_URL=https://your-backend-url.railway.app
```

*(Railway will give you the backend URL after backend deploys)*

---

### Method 2: Deploy as Monorepo (Advanced)

If Railway tries to deploy both together, it may fail. Use Method 1 instead.

---

## 🔧 Common Errors & Fixes:

### Error 1: "No build command specified"
**Fix:** Railway configuration files are now added. Re-deploy.

### Error 2: "Module not found"
**Fix:** Make sure Root Directory is set correctly:
- Backend service → Root Directory: `backend`
- Frontend service → Root Directory: `frontend`

### Error 3: "Port already in use"
**Fix:** Railway automatically sets `$PORT`. Our configs use it correctly.

### Error 4: "MongoDB connection failed"
**Fix:** 
1. Create MongoDB in Railway
2. Copy the connection string
3. Add to backend environment variables

### Error 5: "Frontend can't reach backend"
**Fix:**
1. Wait for backend to deploy first
2. Copy backend URL from Railway
3. Add as `REACT_APP_BACKEND_URL` in frontend environment

---

## ⚠️ IMPORTANT Railway Tips:

1. **Deploy in Order:**
   - MongoDB first
   - Backend second (needs MongoDB URL)
   - Frontend last (needs Backend URL)

2. **Root Directory is Critical:**
   - Each service must point to correct folder
   - Backend service → `backend` folder
   - Frontend service → `frontend` folder

3. **Environment Variables:**
   - Add them BEFORE deploying
   - Click service → Variables tab
   - Add all variables listed above

4. **Check Logs:**
   - Click service → View Logs
   - Look for actual error messages
   - Share full error with me if stuck

---

## 🆘 If Still Failing:

**Share with me:**
1. Full deployment logs (not just first line)
2. Which step failed? (Backend or Frontend?)
3. Error message shown

**Or try Alternative:**

### Use Render.com Instead (Also Free):

**Backend on Render:**
1. Go to https://render.com
2. New → Web Service
3. Connect GitHub
4. Select repo, root directory: `backend`
5. Build: `pip install -r requirements.txt`
6. Start: `uvicorn server:app --host 0.0.0.0 --port $PORT`

**Frontend on Vercel:**
1. Go to https://vercel.com
2. Import GitHub repo
3. Root directory: `frontend`
4. Auto-detects React
5. Add environment variable: `REACT_APP_BACKEND_URL`

---

## 📦 Updated Download:

I've updated your download package with Railway config files. 

**Re-download or add these files manually:**
- Copy the configuration files I created
- Push to GitHub again
- Try Railway deployment

---

## ✅ Expected Result:

After successful deployment:
- Backend: `https://ecotrade-backend-xxxx.railway.app`
- Frontend: `https://ecotrade-frontend-xxxx.railway.app`
- MongoDB: Running in Railway
- **Your app is LIVE!** 🎉

---

**Need more help? Share the full deployment logs!**
