import React, { useEffect, useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Eye, 
  Check, 
  X, 
  Calendar, 
  DollarSign, 
  ChevronRight,
  TrendingUp,
  Clock,
  Truck,
  AlertCircle,
  FileText
} from 'lucide-react';
import { fetchOrders, updateOrderStatus, Order } from '../../../lib/supabaseClient';

export default function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredProducts] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, search, statusFilter]);

  async function loadOrders() {
    setIsLoading(true);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setIsLoading(false);
    }
  }

  function filterOrders() {
    let result = [...orders];

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        o => o.customer_name.toLowerCase().includes(query) || 
             o.customer_email.toLowerCase().includes(query) ||
             o.id.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter(o => o.status === statusFilter);
    }

    setFilteredProducts(result);
  }

  // Update Status handler
  async function handleStatusChange(id: string, newStatus: Order['status']) {
    try {
      const updated = await updateOrderStatus(id, newStatus);
      if (updated) {
        setOrders(prev => prev.map(o => o.id === id ? updated : o));
        if (selectedOrder?.id === id) {
          setSelectedOrder(updated);
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  }

  // Stats
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const processingCount = orders.filter(o => o.status === 'processing').length;
  const shippedCount = orders.filter(o => o.status === 'shipped').length;
  
  return (
    <div className="space-y-6">
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">Orders</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">
          Track purchases, process receipts, and manage shipment milestones.
        </p>
      </div>

      {/* Quick Status Count Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pending Card */}
        <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 dark:border-amber-500/20 p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Awaiting Confirmation</span>
            <div className="text-lg font-bold text-slate-800 dark:text-white">{pendingCount} pending orders</div>
          </div>
        </div>

        {/* Processing Card */}
        <div className="bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 dark:border-indigo-500/20 p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Fullfillment Pipeline</span>
            <div className="text-lg font-bold text-slate-800 dark:text-white">{processingCount} processing</div>
          </div>
        </div>

        {/* Shipped Card */}
        <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/20 p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Transit Logistics</span>
            <div className="text-lg font-bold text-slate-800 dark:text-white">{shippedCount} dispatched</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order ID, customer name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Status select */}
        <div className="w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-44 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300"
          >
            <option value="All">All Order Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Orders Table & Inspector Details Side by Side if selected */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Table Panel */}
        <div className={`${selectedOrder ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden`}>
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-64 space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
              <span className="text-xs text-slate-400">Loading order log...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <ShoppingBag className="w-8 h-8 mx-auto opacity-50" />
              <p className="text-xs font-semibold">No matching orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/40 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <th className="p-4">ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Items</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50 dark:divide-slate-700/30 text-xs">
                  {filteredOrders.map((o) => {
                    const statusColors = {
                      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300',
                      processing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300',
                      shipped: 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300',
                      delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300',
                      cancelled: 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-400'
                    };

                    const isSelected = selectedOrder?.id === o.id;

                    return (
                      <tr 
                        key={o.id} 
                        className={`text-slate-600 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 cursor-pointer ${
                          isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/10' : ''
                        }`}
                        onClick={() => setOrders(prev => prev.map(item => item.id === o.id ? o : item)) || setSelectedOrder(o)}
                      >
                        <td className="p-4 font-bold text-slate-900 dark:text-white uppercase font-mono">{o.id}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{o.customer_name}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">{o.customer_email}</div>
                        </td>
                        <td className="p-4 font-semibold">{o.items_count} items</td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">${o.total_amount.toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${statusColors[o.status]}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Order Inspector Details Panel */}
        {selectedOrder && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-lg flex flex-col justify-between space-y-5 h-fit relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title */}
            <div className="space-y-1.5 pr-6 text-xs">
              <div className="flex items-center gap-1.5 text-indigo-500 font-bold uppercase tracking-wider text-[10px]">
                <FileText className="w-3.5 h-3.5" />
                <span>Order Summary</span>
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white font-mono uppercase leading-none">
                #{selectedOrder.id}
              </h3>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Placed on {new Date(selectedOrder.created_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Customer Details Block */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl space-y-2 text-xs">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Customer Data</h4>
              <div className="space-y-1 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-400">Name:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{selectedOrder.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{selectedOrder.customer_email}</span>
                </div>
              </div>
            </div>

            {/* Status Flow Control */}
            <div className="space-y-2.5 text-xs">
              <h4 className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">Modify Order Status</h4>
              <div className="grid grid-cols-2 gap-1.5">
                {(['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as Order['status'][]).map((st) => {
                  const isActive = selectedOrder.status === st;
                  return (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(selectedOrder.id, st)}
                      className={`py-1.5 px-2 rounded-lg font-bold uppercase text-[9px] tracking-wider text-center cursor-pointer transition-all border ${
                        isActive 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                          : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary lines */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 space-y-2 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-slate-400">Total items count:</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{selectedOrder.items_count} items</span>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-slate-400 font-medium">Total invoiced value:</span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">${selectedOrder.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
