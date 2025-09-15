import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';

type Vendor = { _id: string; businessName: string };
type Route = { _id: string; name: string };

const OrderCreate: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [userId, setUserId] = useState('');
  const [phoneLookup, setPhoneLookup] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [vendorId, setVendorId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<{ name: string; price: number; quantity: number }[]>([{ name: '', price: 0, quantity: 1 }]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [typingIdx, setTypingIdx] = useState<number | null>(0);
  const [selectedPoint, setSelectedPoint] = useState<{ id: string; name: string; latitude: number; longitude: number; address: string } | null>(null);
  const [points, setPoints] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [customerPhone, setCustomerPhone] = useState('');
  const [sendPaymentLink, setSendPaymentLink] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [paymentLink, setPaymentLink] = useState('');
  const [generatingPaymentLink, setGeneratingPaymentLink] = useState(false);

  const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const fetchData = async () => {
      const [vRes, rRes, pRes] = await Promise.all([
        fetch(`${API}/api/partners/vendors`, { headers: { Authorization: token ? `Bearer ${token}` : '' } }).catch(() => ({ ok: false, json: async () => ({}) })),
        fetch(`${API}/api/routes`, { headers: { Authorization: token ? `Bearer ${token}` : '' } }).catch(() => ({ ok: false, json: async () => ({}) })),
        fetch(`${API}/api/delivery-points`, { headers: { Authorization: token ? `Bearer ${token}` : '' } }).catch(() => ({ ok: false, json: async () => ({}) })),
      ]);
      if (vRes && vRes.ok) {
        const vs = await vRes.json();
        setVendors(vs);
        if (vs && vs.length && !vendorId) setVendorId(vs[0]._id);
      }
      if (rRes && rRes.ok) {
        const rs = await rRes.json();
        setRoutes(rs);
        if (rs && rs.length && !routeId) setRouteId(rs[0]._id);
      }
      if (pRes && pRes.ok) setPoints(await pRes.json());
    };
    fetchData();
  }, []);

  // Admin-created orders: delivery fee is fixed at ₹45
  const itemsSubtotal = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
  const deliveryFee = 45;
  const totalAmount = Math.max(0, itemsSubtotal + deliveryFee);

  const addItem = () => setItems(prev => [...prev, { name: '', price: 0, quantity: 1 }]);
  // Debounced fetch for suggestions
  useEffect(() => {
    const idx = typingIdx;
    if (idx === null) return;
    const q = items[idx]?.name || '';
    if (!q || q.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/api/vendors/menu/public/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        let list = Array.isArray(data) ? data : [];
        // Fallback: client-side filter from all items if API returns empty
        if ((!list || list.length === 0)) {
          const allRes = await fetch(`${API}/api/vendors/menu/public/explore/all`);
          const allData = await allRes.json();
          const ql = q.toLowerCase();
          list = (Array.isArray(allData) ? allData : []).filter((it: any) => (
            (it.name || '').toLowerCase().includes(ql) ||
            (it.description || '').toLowerCase().includes(ql) ||
            (it.category || '').toLowerCase().includes(ql)
          )).slice(0, 10).map((it: any) => ({ name: it.name, price: it.price }));
        }
        setSuggestions(list);
      } catch {
        setSuggestions([]);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [items, typingIdx]);
  const updateItem = (idx: number, key: 'name' | 'price' | 'quantity', value: string) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [key]: key === 'name' ? value : Number(value) } : it));
    if (key === 'name') {
      setTypingIdx(idx);
    }
  };
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!selectedPoint) return alert('Please select a Delivery Point');
    if (paymentMethod === 'online' && !customerPhone) return alert('Please enter customer phone number for online payment');
    
    // If vendor/route not set, try default to first available
    const vId = vendorId || (vendors[0]?._id || '');
    const rId = routeId || (routes[0]?._id || '');
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      // Prepare payment information
      const paymentInfo = {
        method: paymentMethod,
        status: 'pending',
        amount: totalAmount,
        gateway: paymentMethod === 'online' ? 'cashfree' : null
      };
      
      const res = await fetch(`${API}/api/orders/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ 
          vendorId: vId, 
          routeId: rId, 
          items, 
          totalAmount, 
          selectedDeliveryPoint: selectedPoint, 
          userId: userId || undefined, 
          customerName: customerName || undefined, 
          customerPhone: customerPhone || undefined,
          vehicleNumber: '',
          payment: paymentInfo
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create order');
      
      setCreatedOrder(data);
      
      // If online payment is selected, generate payment link
      if (paymentMethod === 'online') {
        await generatePaymentLink(data._id);
      } else {
        alert('Order created successfully');
        window.location.href = '/orders';
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const generatePaymentLink = async (orderId: string) => {
    setGeneratingPaymentLink(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/payments/payment-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ 
          orderId,
          amount: totalAmount,
          customerDetails: {
            name: customerName,
            phone: customerPhone,
            email: 'customer@example.com'
          },
          purpose: `Order Payment - ${orderId}`
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to generate payment link');
      
      setPaymentLink(data.link_url || data.linkUrl || '');
      alert('Order created and payment link generated successfully!');
    } catch (e: any) {
      alert(`Order created but failed to generate payment link: ${e.message}`);
    } finally {
      setGeneratingPaymentLink(false);
    }
  };

  const sendPaymentLinkViaSMS = async () => {
    if (!paymentLink || !customerPhone) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/sms/send-payment-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ 
          phone: customerPhone, 
          paymentLink, 
          orderId: createdOrder?._id,
          customerName: customerName || 'Customer'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send SMS');
      
      alert('Payment link sent successfully via SMS!');
    } catch (e: any) {
      alert(`Failed to send SMS: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Create Order" description="Create an order on behalf of a user" />
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID (optional)</label>
            <input className="w-full border rounded p-2" value={userId} onChange={e => setUserId(e.target.value)} placeholder="68244cb4f2df..." />
            <div className="text-xs text-gray-500 mt-1">Or search by phone below</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name (optional)</label>
            <input className="w-full border rounded p-2" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
            <input className="w-full border rounded p-2" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="9899090909" />
            <div className="text-xs text-gray-500 mt-1">Required for online payments</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select className="w-full border rounded p-2" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as 'cod' | 'online')}>
              <option value="cod">Cash on Delivery</option>
              <option value="online">Online Payment</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Find User by Phone</label>
            <div className="flex gap-2">
              <input className="flex-1 border rounded p-2" value={phoneLookup} onChange={e => setPhoneLookup(e.target.value)} placeholder="e.g., 9899090909" />
              <Button variant="secondary" size="sm" isLoading={phoneLoading} onClick={async () => {
                if (!phoneLookup) return;
                setPhoneLoading(true);
                try {
                  const token = localStorage.getItem('token');
                  const res = await fetch(`${API}/api/users/by-phone/${encodeURIComponent(phoneLookup)}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.message || 'User not found');
                  setUserId(data._id || data.id);
                  setCustomerName(data.name || data.username || '');
                  alert(`User selected: ${data.name || data.username} (${data._id || data.id})`);
                } catch (e: any) {
                  alert(e.message);
                } finally {
                  setPhoneLoading(false);
                }
              }}>Find</Button>
            </div>
          </div>
          {/* Vendor and Route inputs removed from UI; defaults are auto-selected */}
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-2">Items</h3>
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-2 relative">
              <input
                className="md:col-span-6 border rounded p-2"
                placeholder="Item name"
                value={it.name}
                onChange={e => updateItem(idx, 'name', e.target.value)}
                onFocus={() => setTypingIdx(idx)}
                onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                autoComplete="off"
              />
              <input className="md:col-span-3 border rounded p-2" placeholder="Price" type="number" value={it.price} onChange={e => updateItem(idx, 'price', e.target.value)} />
              <input className="md:col-span-2 border rounded p-2" placeholder="Qty" type="number" value={it.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
              <Button variant="secondary" size="sm" onClick={() => removeItem(idx)}>Remove</Button>
              {typingIdx === idx && suggestions.length > 0 && it.name && (
                <div className="absolute z-20 bg-white border border-gray-200 rounded shadow-md top-full left-0 w-full md:w-[50%] max-h-64 overflow-auto">
                  {suggestions.map((s, sidx) => (
                    <button
                      key={s._id || sidx}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-50"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setItems(prev => prev.map((it2, i2) => i2 === idx ? { ...it2, name: s.name, price: s.price } : it2));
                        setSuggestions([]);
                        setTypingIdx(null);
                      }}
                    >
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-gray-500">₹{s.price}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={addItem}>Add Item</Button>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-2">Select Delivery Point</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {points.slice(0, 9).map((p: any) => {
              const isSel = selectedPoint && selectedPoint.id === (p.id || p._id);
              return (
                <button key={p.id || p._id} className={`text-left border rounded p-3 ${isSel ? 'border-green-600 bg-green-50' : 'border-gray-200'}`} onClick={() => setSelectedPoint({ id: p.id || p._id, name: p.name, latitude: p.latitude, longitude: p.longitude, address: p.address })}>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.address}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            <div>Subtotal (Items): <span className="font-semibold">₹{itemsSubtotal}</span></div>
            <div>Delivery Fee: <span className="font-semibold">₹{deliveryFee}</span></div>
            <div className="mt-1">Total Amount: <span className="font-bold text-green-700">₹{totalAmount}</span></div>
          </div>
          <Button variant="primary" size="md" onClick={handleSubmit} isLoading={submitting || generatingPaymentLink}>
            {generatingPaymentLink ? 'Generating Payment Link...' : 'Create Order'}
          </Button>
        </div>

        {/* Payment Link Section */}
        {paymentLink && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-3">Payment Link Generated</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Link</label>
                <div className="flex gap-2">
                  <input 
                    className="flex-1 border rounded p-2 bg-gray-50 text-sm" 
                    value={paymentLink} 
                    readOnly 
                  />
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => navigator.clipboard.writeText(paymentLink)}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              
              {customerPhone && (
                <div className="flex gap-2">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={sendPaymentLinkViaSMS}
                  >
                    Send via SMS
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => window.open(paymentLink, '_blank')}
                  >
                    Open Link
                  </Button>
                </div>
              )}
              
              <div className="text-xs text-gray-600">
                Order ID: {createdOrder?._id}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCreate;


