import React, { useEffect, useMemo, useState } from 'react';
import { ShoppingBag, Search, Filter, RefreshCw, X, Clock } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Card, { CardContent } from '../components/ui/Card';

type Vendor = { _id: string; businessName: string };
type Item = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  isAvailable: boolean;
  image?: string;
  vendorId?: string | { _id: string; businessName: string };
  vendorName?: string;
};

// Predefined categories from vendor app
const PREDEFINED_CATEGORIES = [
  'main_course',
  'starters',
  'appetizers',
  'desserts',
  'beverages',
  'sides',
  'specials',
  'breakfast',
  'lunch',
  'dinner',
];

const Items: React.FC = () => {
  const API = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';
  const [items, setItems] = useState<Item[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [itemOrders, setItemOrders] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [form, setForm] = useState<{ vendorId: string; name: string; description: string; price: string; image: string; category: string; isAvailable: boolean }>({ vendorId: '', name: '', description: '', price: '', image: '', category: '', isAvailable: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const [itemsRes, vendorsRes] = await Promise.all([
        fetch(`${API}/api/vendors/menu/public/explore/all`),
        fetch(`${API}/api/vendors`, { headers: { Authorization: token ? `Bearer ${token}` : '' } })
      ]);
      const itemsData = await itemsRes.json();
      const vendorsData = vendorsRes.ok ? await vendorsRes.json() : [];
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setVendors(Array.isArray(vendorsData) ? vendorsData : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Cleanup image preview URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => { if (i.category) set.add(i.category); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return items.filter(i => {
      const vendorName = i.vendorName || (typeof i.vendorId === 'object' && i.vendorId?.businessName) || '';
      const bySearch = !s || (
        i.name?.toLowerCase().includes(s) ||
        (i.description || '').toLowerCase().includes(s) ||
        (i.category || '').toLowerCase().includes(s) ||
        vendorName.toLowerCase().includes(s)
      );
      const byVendor = !vendorFilter || (i.vendorName === vendorFilter || (typeof i.vendorId === 'object' && i.vendorId?.businessName === vendorFilter) || i.vendorId === vendorFilter);
      const byCategory = !categoryFilter || i.category === categoryFilter;
      return bySearch && byVendor && byCategory;
    });
  }, [items, search, vendorFilter, categoryFilter]);

  const groupedByCategory = useMemo(() => {
    const map: Record<string, Item[]> = {};
    filtered.forEach(i => {
      const key = i.category || 'Uncategorized';
      if (!map[key]) map[key] = [];
      map[key].push(i);
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const getVendorDisplay = (item: Item) => item.vendorName || (typeof item.vendorId === 'object' && (item.vendorId as any)?.businessName) || '';
  const getVendorId = (item: Item) => (typeof item.vendorId === 'object' ? (item.vendorId as any)?._id : item.vendorId) as string | undefined;
  const toAbsoluteUrl = (u?: string) => {
    if (!u) return '';
    if (u.startsWith('data:')) return u;
    if (u.startsWith('http')) return u;
    const base = (API || '').replace(/\/$/, '');
    const path = u.startsWith('/') ? u : `/${u}`;
    return `${base}${path}`;
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setAddError('Please select a valid image file');
      return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setAddError('Image size must be less than 5MB');
      return;
    }
    
    setUploadingImage(true);
    setAddError('');
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload image');
      }
      
      setForm(f => ({ ...f, image: data.url }));
      setImageFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
    } catch (error: any) {
      setAddError(error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const clearImage = () => {
    setForm(f => ({ ...f, image: '' }));
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview('');
    }
  };

  const openDetails = async (item: Item) => {
    setSelectedItem(item);
    setDetailsOpen(true);
    setOrdersLoading(true);
    setOrdersError('');
    setItemOrders([]);
    try {
      const token = localStorage.getItem('token');
      const vendorId = getVendorId(item);
      const url = vendorId ? `${API}/api/orders/admin?vendorId=${encodeURIComponent(vendorId)}` : `${API}/api/orders/admin`;
      const res = await fetch(url, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      const data = await res.json();
      const orders = Array.isArray(data) ? data : [];
      const name = (item.name || '').toLowerCase();
      const matched = orders.filter((o: any) => Array.isArray(o.items) && o.items.some((it: any) => (it.name || '').toLowerCase() === name));
      setItemOrders(matched);
    } catch (e: any) {
      setOrdersError(e.message || 'Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Items"
        description="Browse all items across vendors, organized by category"
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="secondary" size="md" icon={<RefreshCw size={16} />} onClick={fetchData}>Refresh</Button>
            <Button variant="primary" size="md" onClick={() => setAddOpen(true)}>Add Item</Button>
          </div>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Search items, categories, vendors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center">
            <Filter className="w-4 h-4 text-gray-400 mr-2" />
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={vendorFilter}
              onChange={e => setVendorFilter(e.target.value)}
            >
              <option value="">All Vendors</option>
              {vendors.map(v => (
                <option key={v._id} value={v._id}>{v.businessName}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading items...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 text-red-600">{error}</div>
      ) : groupedByCategory.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-600">No items found</div>
      ) : (
        <div className="space-y-6">
          {groupedByCategory.map(([category, list]) => (
            <div key={category}>
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 mr-2 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShoppingBag size={16} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{category} <span className="text-sm text-gray-500">({list.length})</span></h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {list.map(item => {
                  const vendorName = getVendorDisplay(item);
                  return (
                    <Card key={item._id} className="h-full cursor-pointer" onClick={() => openDetails(item)}>
                      <CardContent className="p-0">
                        <div className="w-full aspect-video bg-gray-100 overflow-hidden rounded-t-lg">
                          {item.image ? (
                            <img src={toAbsoluteUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 truncate">{item.name}</div>
                              {item.description && (
                                <div className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</div>
                              )}
                              <div className="mt-2 text-sm text-gray-500 truncate">{vendorName}</div>
                            </div>
                            <div className="ml-3 text-green-600 font-bold whitespace-nowrap">₹{item.price}</div>
                          </div>
                          <div className="mt-3">
                            <span className={`px-2 py-0.5 rounded text-xs ${item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {item.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {detailsOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
              <div>
                <div className="text-xl font-semibold text-gray-900">{selectedItem.name}</div>
                <div className="text-sm text-gray-500">{getVendorDisplay(selectedItem)} • {selectedItem.category || 'Uncategorized'}</div>
              </div>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => { setDetailsOpen(false); setSelectedItem(null); }} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <div className="w-full aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    { /* eslint-disable-next-line @next/next/no-img-element */ }
                    {/* Use optional chaining; some public items might lack image */}
                    { (selectedItem as any).image ? (
                      <img src={toAbsoluteUrl((selectedItem as any).image)} alt={selectedItem.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-gray-400">No Image</div>
                    )}
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl font-bold text-green-600">₹{selectedItem.price}</div>
                    <div className="mt-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${selectedItem.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {selectedItem.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Description</div>
                    <div className="text-gray-800">{selectedItem.description || '—'}</div>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Order Summary</div>
                    {ordersLoading ? (
                      <div className="flex items-center text-gray-600"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></span> Loading orders…</div>
                    ) : ordersError ? (
                      <div className="text-red-600">{ordersError}</div>
                    ) : (
                      <div className="text-gray-800">
                        Total Orders: <span className="font-semibold">{itemOrders.length}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-2">Recent Orders</div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {ordersLoading ? (
                        <div className="text-gray-600">Loading…</div>
                      ) : itemOrders.length === 0 ? (
                        <div className="text-gray-500">No orders found for this item.</div>
                      ) : (
                        itemOrders.slice(0, 25).map((o: any) => {
                          const line = (o.items || []).find((it: any) => (it.name || '').toLowerCase() === (selectedItem.name || '').toLowerCase());
                          const qty = line?.quantity || 0;
                          const unit = line?.price || 0;
                          return (
                            <div key={o._id} className="border rounded p-3 bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="font-medium">Order <span className="font-mono">{o._id}</span></div>
                                <span className={`px-2 py-0.5 rounded text-xs ${o.status === 'completed' ? 'bg-green-100 text-green-700' : o.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{o.status}</span>
                              </div>
                              <div className="text-sm text-gray-600 mt-1 flex items-center"><Clock className="w-4 h-4 mr-1 text-gray-400" /> {new Date(o.timestamp).toLocaleString()}</div>
                              <div className="text-sm text-gray-700 mt-1">Customer: {o.customerName || '—'}</div>
                              <div className="text-sm text-gray-700">Qty: {qty} • Unit: ₹{unit} • Line Total: ₹{qty * unit}</div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
              <div className="text-lg font-semibold">Add Item</div>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setAddOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {addError && <div className="text-red-600 text-sm">{addError}</div>}
              <div>
                <label className="block text-sm text-gray-700 mb-1">Vendor</label>
                <select className="w-full border rounded p-2" value={form.vendorId} onChange={e => setForm(f => ({ ...f, vendorId: e.target.value }))}>
                  <option value="">Select vendor</option>
                  {vendors.map(v => <option key={v._id} value={v._id}>{v.businessName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Name</label>
                <input className="w-full border rounded p-2" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Description</label>
                <textarea className="w-full border rounded p-2" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Price</label>
                  <input type="number" className="w-full border rounded p-2" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Category</label>
                  <select 
                    className="w-full border rounded p-2" 
                    value={form.category} 
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  >
                    <option value="">Select a category</option>
                    {PREDEFINED_CATEGORIES.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Image</label>
                <div className="space-y-3">
                  {/* Image Preview */}
                  {(imagePreview || form.image) && (
                    <div className="relative">
                      <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={imagePreview || toAbsoluteUrl(form.image)} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  <div className="flex items-center space-x-3">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                      <div className={`w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors ${uploadingImage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                        {uploadingImage ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-sm text-gray-600">Uploading...</span>
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Click to upload image</div>
                            <div className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</div>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                  
                  {/* Fallback URL Input */}
                  <div className="text-xs text-gray-500">
                    Or enter image URL manually:
                  </div>
                  <input 
                    className="w-full border rounded p-2 text-sm" 
                    value={form.image} 
                    onChange={e => setForm(f => ({ ...f, image: e.target.value }))} 
                    placeholder="https://... or /public/..." 
                  />
                </div>
              </div>
              <label className="inline-flex items-center space-x-2">
                <input type="checkbox" checked={form.isAvailable} onChange={e => setForm(f => ({ ...f, isAvailable: e.target.checked }))} />
                <span className="text-sm">Available</span>
              </label>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex-shrink-0">
              <div className="flex justify-end space-x-2">
                <Button variant="secondary" size="md" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button variant="primary" size="md" isLoading={adding} onClick={async () => {
                  setAddError('');
                  if (!form.vendorId || !form.name || !form.description || (!form.image && !imageFile) || !form.category || !form.price) {
                    setAddError('Please fill all required fields');
                    return;
                  }
                  const payload = {
                    vendorId: form.vendorId,
                    name: form.name,
                    description: form.description,
                    price: Number(form.price),
                    image: form.image,
                    category: form.category,
                    isAvailable: form.isAvailable
                  };
                  try {
                    setAdding(true);
                    const token = localStorage.getItem('token');
                    const res = await fetch(`${API}/api/vendors/menu/admin`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
                      body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || 'Failed to add item');
                    setAddOpen(false);
                    setForm({ vendorId: '', name: '', description: '', price: '', image: '', category: '', isAvailable: true });
                    setImageFile(null);
                    if (imagePreview) {
                      URL.revokeObjectURL(imagePreview);
                      setImagePreview('');
                    }
                    fetchData();
                  } catch (e: any) {
                    setAddError(e.message || 'Failed to add item');
                  } finally {
                    setAdding(false);
                  }
                }}>Save</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Items;


