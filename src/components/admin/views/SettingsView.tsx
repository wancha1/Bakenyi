import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Database, 
  Save, 
  HelpCircle, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  Check, 
  Store,
  Wallet,
  Globe,
  Loader2
} from 'lucide-react';
import { getSupabaseConfig } from '../../../lib/supabaseClient';

export default function SettingsView() {
  const { url, key, isConfigured } = getSupabaseConfig();
  
  // Shop Settings
  const [shopName, setShopName] = useState('Bakenye Artisan Store');
  const [supportEmail, setSupportEmail] = useState('support@bakenye.com');
  const [currency, setCurrency] = useState('USD');
  const [shippingFee, setShippingFee] = useState('4.99');
  const [taxRate, setTaxRate] = useState('18.0');
  
  // Saving Indicator
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Copy Schema Indicator
  const [copiedSchema, setCopiedSchema] = useState(false);

  useEffect(() => {
    // Load persisted settings if any
    const stored = localStorage.getItem('bakenye_shop_settings');
    if (stored) {
      try {
        const config = JSON.parse(stored);
        setShopName(config.shopName || '');
        setSupportEmail(config.supportEmail || '');
        setCurrency(config.currency || '');
        setShippingFee(config.shippingFee || '');
        setTaxRate(config.taxRate || '');
      } catch (e) {}
    }
  }, []);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    
    const config = {
      shopName,
      supportEmail,
      currency,
      shippingFee,
      taxRate
    };

    setTimeout(() => {
      localStorage.setItem('bakenye_shop_settings', JSON.stringify(config));
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  }

  // Schema Boilerplate for Supabase SQL Editor
  const sqlSchema = `-- BAKENYE E-COMMERCE DATABASE BOOTSTRAP SCHEMA
-- Open the SQL Editor in your Supabase dashboard and run this script.

-- 1. Create Products Table
create table if nulls distinct products (
  id text primary key,
  name text not null,
  description text,
  price numeric not null,
  image_url text,
  category text,
  stock integer not null default 0,
  status text check (status in ('active', 'draft', 'out_of_stock')) not null default 'draft',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Orders Table
create table if nulls distinct orders (
  id text primary key,
  customer_name text not null,
  customer_email text not null,
  total_amount numeric not null,
  status text check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')) not null default 'pending',
  items_count integer not null default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Profiles Table (Sync with auth.users)
create table if nulls distinct profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  role text check (role in ('admin', 'staff', 'customer')) not null default 'customer',
  status text check (status in ('active', 'suspended')) not null default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) or setup policies as needed!`;

  function handleCopySchema() {
    navigator.clipboard.writeText(sqlSchema).then(() => {
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 3000);
    });
  }

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">
          Configure storefront metrics and verify Supabase API credentials.
        </p>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shop Settings Form */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700/50 pb-4">
            <Store className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white font-sans">Storefront Configurations</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-5 text-xs">
            {/* Shop Name */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 dark:text-slate-400 block">Shop Name</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-semibold"
              />
            </div>

            {/* Support Email */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 dark:text-slate-400 block">Customer Support Email</label>
              <input
                type="email"
                required
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-semibold"
              />
            </div>

            {/* Row: Currency, Shipping, Tax */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Currency */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-600 dark:text-slate-400 block">Base Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-bold"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="UGX">UGX (USh)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              {/* Shipping */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-600 dark:text-slate-400 block">Flat Rate Shipping (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={shippingFee}
                  onChange={(e) => setShippingFee(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-bold"
                />
              </div>

              {/* Tax */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-600 dark:text-slate-400 block">Standard Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-bold"
                />
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-600/10 cursor-pointer transition-all active:scale-95"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save Storefront Settings</span>
              </button>
              
              {saveSuccess && (
                <div className="text-emerald-500 font-bold flex items-center gap-1.5 animate-fade-in text-[11px]">
                  <CheckCircle className="w-4 h-4" />
                  <span>Settings updated successfully!</span>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Supabase Status Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          {/* Status Box */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/50 pb-4">
              <Database className="w-5 h-5 text-indigo-500" />
              <h3 className="text-base font-bold text-slate-800 dark:text-white font-sans">Supabase Sync</h3>
            </div>

            <div className="space-y-4 text-xs">
              {isConfigured ? (
                <div className="p-3.5 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                    <CheckCircle className="w-4 h-4" />
                    <span>CONNECTED & ACTIVE</span>
                  </div>
                  <p className="font-semibold leading-relaxed text-slate-600 dark:text-slate-300 text-[11px]">
                    Your database is linked with live Supabase environment metrics at:
                  </p>
                  <code className="font-mono bg-white dark:bg-slate-900 border dark:border-slate-850 px-1.5 py-1 rounded block text-[10px] break-all truncate" title={url}>
                    {url}
                  </code>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                    <AlertCircle className="w-4 h-4" />
                    <span>SANDBOX MODE ACTIVE</span>
                  </div>
                  <p className="font-semibold leading-relaxed text-slate-600 dark:text-slate-300 text-[11px]">
                    Running in offline safe mode. To link your database, click the **Settings** panel in the AI Studio editor sidebar, and fill in:
                  </p>
                  <div className="space-y-1 font-mono text-[9px] text-slate-500 font-bold">
                    <div>🗝️ VITE_SUPABASE_URL</div>
                    <div>🗝️ VITE_SUPABASE_ANON_KEY</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Copy SQL Schema Box */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-3">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Quick SQL Schema</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                Copy and run this SQL in your Supabase Editor to create products, orders, and profiles tables instantly.
              </p>
            </div>

            <button
              onClick={handleCopySchema}
              className={`w-full py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all border ${
                copiedSchema 
                  ? 'bg-emerald-500 border-emerald-500 text-white' 
                  : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-100/50 dark:border-indigo-900/30 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400'
              }`}
            >
              {copiedSchema ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied Successfully!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy SQL Schema</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
