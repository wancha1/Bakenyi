import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  AlertTriangle, 
  ArrowUpRight,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { fetchProducts, fetchOrders, Product, Order } from '../../../lib/supabaseClient';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [pData, oData] = await Promise.all([
          fetchProducts(),
          fetchOrders()
        ]);
        setProducts(pData);
        setOrders(oData);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute stats
  const totalSales = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total_amount, 0);

  const completedOrders = orders.filter(o => o.status === 'delivered').length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const lowStockProducts = products.filter(p => p.status === 'active' && p.stock < 15);
  
  // Custom SVG line chart calculations
  const salesHistory = [
    { label: 'Jan', value: 1200 },
    { label: 'Feb', value: 1900 },
    { label: 'Mar', value: 1600 },
    { label: 'Apr', value: 2400 },
    { label: 'May', value: 3200 },
    { label: 'Jun', value: 2900 },
    { label: 'Jul', value: totalSales || 3500 }
  ];

  const maxVal = Math.max(...salesHistory.map(h => h.value), 4000);
  const chartHeight = 160;
  const chartWidth = 500;
  const points = salesHistory.map((h, i) => {
    const x = (i / (salesHistory.length - 1)) * chartWidth;
    const y = chartHeight - (h.value / maxVal) * (chartHeight - 20);
    return `${x},${y}`;
  }).join(' ');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">
          Welcome back! Here is an overview of the Bakenye E-Commerce metrics.
        </p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Sales Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Sales</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white font-sans">${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <span className="flex items-center text-xs font-semibold text-emerald-500 gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+14.2% from last month</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Orders</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white font-sans">{orders.length}</h3>
            <span className="flex items-center text-xs font-semibold text-emerald-500 gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+8.4% from last month</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Products Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Active Products</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white font-sans">{activeProducts}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Total: {products.length} products</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Alert/Low Stock Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Low Stock Alerts</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white font-sans">{lowStockProducts.length}</h3>
            <span className={`flex items-center text-xs font-semibold gap-0.5 ${lowStockProducts.length > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{lowStockProducts.length > 0 ? 'Requires attention soon' : 'Inventory healthy'}</span>
            </span>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            lowStockProducts.length > 0 
              ? 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' 
              : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts & Analytics Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white font-sans">Sales Performance</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Visual trend overview for the last 7 months</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-sans block">Current Month Target</span>
              <span className="text-sm font-bold text-indigo-500">$5,000.00</span>
            </div>
          </div>

          {/* Interactive Custom SVG Line Chart */}
          <div className="relative pt-4">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => (
                <line 
                  key={idx}
                  x1="0" 
                  y1={chartHeight * p} 
                  x2={chartWidth} 
                  y2={chartHeight * p} 
                  className="stroke-slate-100 dark:stroke-slate-700/40" 
                  strokeWidth="1"
                />
              ))}

              {/* Gradient Area under line */}
              <path
                d={`M 0,${chartHeight} L ${points} L ${chartWidth},${chartHeight} Z`}
                fill="url(#salesGradient)"
              />

              {/* Sparkline Path */}
              <polyline
                fill="none"
                stroke="#4f46e5"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />

              {/* Chart Nodes / Dots */}
              {salesHistory.map((h, i) => {
                const x = (i / (salesHistory.length - 1)) * chartWidth;
                const y = chartHeight - (h.value / maxVal) * (chartHeight - 20);
                return (
                  <g key={i} className="group cursor-pointer">
                    <circle 
                      cx={x} 
                      cy={y} 
                      r="5.5" 
                      className="fill-white dark:fill-slate-800 stroke-indigo-600 dark:stroke-indigo-400" 
                      strokeWidth="2.5"
                    />
                    <circle 
                      cx={x} 
                      cy={y} 
                      r="10" 
                      className="fill-transparent stroke-transparent hover:fill-indigo-500/10 hover:stroke-indigo-500/10" 
                      strokeWidth="1"
                    />
                    {/* Tooltip on Hover */}
                    <title>{`${h.label}: $${h.value.toLocaleString()}`}</title>
                  </g>
                );
              })}
            </svg>

            {/* X-Axis labels */}
            <div className="flex justify-between mt-2 px-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {salesHistory.map((h, i) => <span key={i}>{h.label}</span>)}
            </div>
          </div>
        </div>

        {/* Secondary Category / Conversion Stats */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white font-sans mb-1">Categories Share</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Highest performing business verticals</p>
            
            <div className="space-y-3.5">
              {/* Beverages */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-400">Beverages & Coffee</span>
                  <span className="text-slate-900 dark:text-white">45%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>

              {/* Cosmetics */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-400">Cosmetics & Oils</span>
                  <span className="text-slate-900 dark:text-white">30%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>

              {/* Decor */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-400">Handmade Decor</span>
                  <span className="text-slate-900 dark:text-white">15%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>

              {/* Fashion */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-400">Sustainable Fashion</span>
                  <span className="text-slate-900 dark:text-white">10%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-rose-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/40 mt-4 flex items-center justify-between text-xs">
            <span className="text-slate-400 dark:text-slate-500 font-semibold">Live conversion index</span>
            <span className="font-bold text-emerald-500 flex items-center gap-0.5">3.48% (Good)</span>
          </div>
        </div>
      </div>

      {/* Grid Lower Details - Recent Orders & Stock Levels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white font-sans">Recent Orders</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Monitor order flow activities</p>
            </div>
            <button 
              onClick={() => onNavigate('orders')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/40 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <th className="py-2.5">ID</th>
                  <th className="py-2.5">Customer</th>
                  <th className="py-2.5">Amount</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-700/30 text-xs">
                {orders.slice(0, 4).map((order) => {
                  const statusColors = {
                    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
                    processing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
                    shipped: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                    delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
                    cancelled: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                  };

                  return (
                    <tr key={order.id} className="text-slate-600 dark:text-slate-300">
                      <td className="py-3 font-semibold text-slate-900 dark:text-white uppercase font-mono">{order.id}</td>
                      <td className="py-3">
                        <div className="font-semibold">{order.customer_name}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">{order.customer_email}</div>
                      </td>
                      <td className="py-3 font-bold">${order.total_amount.toFixed(2)}</td>
                      <td className="py-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-[10px] text-slate-400 dark:text-slate-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Inventory Warnings list */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <h3 className="text-base font-bold text-slate-800 dark:text-white font-sans">Stock Alerts</h3>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Stock levels below 15 units require replenishment</p>

            <div className="space-y-3">
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs">
                  All active items are well stocked.
                </div>
              ) : (
                lowStockProducts.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <img 
                        src={p.image_url} 
                        alt={p.name} 
                        className="w-9 h-9 object-cover rounded-lg border dark:border-slate-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="overflow-hidden">
                        <div className="font-semibold text-xs text-slate-800 dark:text-white truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">{p.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.stock === 0 
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button 
            onClick={() => onNavigate('products')}
            className="w-full mt-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-xl text-xs font-semibold cursor-pointer text-center"
          >
            Manage Inventory
          </button>
        </div>
      </div>
    </div>
  );
}
