# R. MAHAJAN ENTERPRISE
## Grain Trading ERP & Billing System

A complete web and mobile application for grain merchants, commission agents, and APMC traders, pre-configured with **R. Mahajan Enterprise** business rules, Mandi "Padta" calculations, and official APMC billing statements.

---

## 🚀 How to Run the App on Your Computer (In 1 Command)

Open your terminal or PowerShell in this folder (`d:\Mahajan enterprise`) and run:

```bash
npm run dev
```

Then open your browser at **`http://localhost:3000`** (it will also open automatically).

---

## 🔑 Admin Login Credentials

* **Mobile / Phone:** `9850020793`
* **4-Digit Quick Mandi PIN:** `1234`
* **Password:** `admin` (or `mahajan123`)

---

## 🌟 Key Features Included

1. **Live Mandi Dashboard:**
   - Daily inward procurement summary (Bags, Metric Tonnes).
   - Real-time **Net Padta** vs. **Gross Padta** landed cost monitor.
   - Total billed sales and outstanding Dal Mill receivables.
2. **Buying & Padta Sheet (Mandi Statement):**
   - Excel-like broker lot entry table.
   - Auto-calculates `Bill Amount = Weight × Rate`.
   - Auto-calculates `Brokerage (1.5%)` and `Total Bill Amount`.
   - Auto-calculates `Net Padta = Total Bill ÷ Total Weight`.
   - Complete Mandi Expenses Engine:
     - **Bardana Tare:** 0.6 kg/bag.
     - **Mandi Shesh (Market Cess):** 1.05%.
     - **Commission (Aadath):** 1.50%.
     - **Worker Charges (Hamali):** ₹14/bag.
     - **Transportation Charges (Bhada):** ₹40/unit.
     - **Gross Padta:** Grand Total ÷ Gross Weight.
   - **1-Click Actions:** Save to cloud/local storage, Print Slip, Export to Excel.
3. **Official Sale Bill / Tax Invoice Generator:**
   - Matches your exact APMC Saoner bill format.
   - Auto-deducts bag tare weight (`Gross Wt - 0.6 kg/bag`).
   - Automatically converts totals into **Indian Rupees in Words** (e.g., *"Rupees Two Lakh Ninety-Eight Thousand..."*).
   - Pre-filled **AXIS BANK SAONER** bank details (A/c: `924020061268613`, IFSC: `UTIB0003817`).
   - Standard 10-day payment term and 24% p.a. default interest clause.
   - **1-Click Actions:** Print A4 Bill / PDF, Share directly to WhatsApp, Export to Excel.
4. **Date-Wise Historical Records Archive:**
   - Filter by date range (e.g., *from 01-Aug-2026 to 31-Oct-2026*).
   - Search by Mill name, Broker name, Vehicle number, or Bill reference.
   - 1-Click Excel backup of filtered records.
5. **Admin Control Center:**
   - Update firm profile, PAN number (`IKGPK7086G`), and Maharashtra state code (`27`).
   - Update Axis Bank account number and IFSC code anytime without touching code.
   - Configure default Mandi Shesh %, Commission %, Hamali rate, and Bhada rate.
   - Add new Dal Mills and Brokers to the master list.

---

## ☁️ How to Host Online & Access from Anywhere (Mobile / PC)

### Step 1: Connect Cloud Database (Supabase - Free)
1. Go to **[supabase.com](https://supabase.com)** and create a free account.
2. Create project `mahajan-enterprise`.
3. Open the **SQL Editor**, paste all the code from `schema.sql`, and click **Run**.

### Step 2: Deploy to Vercel (Free)
1. Create a free account on **[vercel.com](https://vercel.com)**.
2. Click **"Import Project"**, select your GitHub repository containing this folder, and click **Deploy**.
3. Your app is now live online at `https://your-app-name.vercel.app` (or your custom domain like `mahajanenterprise.in`).

### Step 3: Install on Mobile (PWA)
1. Open the website link on your phone in Chrome (Android) or Safari (iPhone).
2. Tap the browser menu $\rightarrow$ **"Add to Home Screen"**.
3. The app is installed on your mobile home screen with the R. Mahajan Enterprise icon. Open it anytime at the APMC yard.
