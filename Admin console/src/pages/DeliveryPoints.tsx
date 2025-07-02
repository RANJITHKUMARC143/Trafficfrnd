import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';
import { GoogleMap, Marker, useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Share2, Copy, ExternalLink } from 'lucide-react';

interface DeliveryPoint {
  _id?: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  route?: string;
}

const defaultCenter = { lat: 13.0827, lng: 80.2707 }; // Chennai as default
const mapContainerStyle = { width: '100%', height: '100%', borderRadius: '8px' };
const modalMapStyle = { width: '100%', height: 220 };
const GOOGLE_MAPS_API_KEY = 'AIzaSyAJX6Yjwz2DiEHjWE_0HIBvEkiYpS5TXAU';
const API_BASE = '/api/delivery-points';

const DeliveryPoints: React.FC = () => {
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<DeliveryPoint>({ name: '', latitude: 0, longitude: 0, address: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mapLocation, setMapLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [autoAddress, setAutoAddress] = useState('');
  const [addressMode, setAddressMode] = useState<'auto' | 'manual'>('auto');
  const [modalMapCenter, setModalMapCenter] = useState<{ lat: number; lng: number }>(defaultCenter);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<DeliveryPoint | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  // Fetch all delivery points
  const fetchDeliveryPoints = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(API_BASE);
      console.log('Fetched delivery points:', res.data); // Debugging line
      setDeliveryPoints(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch (err: any) {
      setError('Failed to load delivery points');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveryPoints();
  }, [fetchDeliveryPoints]);

  // Reverse geocode using Google Maps Geocoding API
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`);
      const data = await res.json();
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return '';
    } catch {
      return '';
    }
  }, []);

  const openModal = (point?: DeliveryPoint) => {
    if (point) {
      setForm(point);
      setMapLocation({ latitude: point.latitude, longitude: point.longitude });
      setEditingId(point._id || null);
      setAutoAddress(point.address);
      setAddressMode('auto');
      setModalMapCenter({ lat: point.latitude, lng: point.longitude });
    } else {
      setForm({ name: '', latitude: 0, longitude: 0, address: '' });
      setMapLocation(null);
      setEditingId(null);
      setAutoAddress('');
      setAddressMode('auto');
      setModalMapCenter(defaultCenter);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm({ name: '', latitude: 0, longitude: 0, address: '' });
    setMapLocation(null);
    setEditingId(null);
    setAutoAddress('');
    setAddressMode('auto');
    setModalMapCenter(defaultCenter);
  };

  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMapLocation({ latitude: lat, longitude: lng });
    setForm(f => ({ ...f, latitude: lat, longitude: lng }));
    if (addressMode === 'auto') {
      const addr = await reverseGeocode(lat, lng);
      setAutoAddress(addr);
      setForm(f => ({ ...f, address: addr }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === 'address') setAutoAddress(e.target.value);
  };

  const handleAddressModeChange = (mode: 'auto' | 'manual') => {
    setAddressMode(mode);
    if (mode === 'auto' && mapLocation) {
      reverseGeocode(mapLocation.latitude, mapLocation.longitude).then(addr => {
        setAutoAddress(addr);
        setForm(f => ({ ...f, address: addr }));
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.latitude || !form.longitude || !form.address) {
      toast.error('Please fill all fields and select a location on the map.');
      return;
    }
    try {
      if (editingId) {
        // Update
        const res = await axios.put(`${API_BASE}/${editingId}`, form);
        setDeliveryPoints(points => points.map(p => p._id === editingId ? res.data : p));
        toast.success('Delivery point updated!');
      } else {
        // Add
        const res = await axios.post(API_BASE, form);
        setDeliveryPoints(points => [...points, res.data]);
        toast.success('Delivery point added!');
      }
      closeModal();
    } catch (err: any) {
      toast.error('Failed to save delivery point');
    }
  };

  const handleEdit = (point: DeliveryPoint) => {
    openModal(point);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_BASE}/${id}`);
      setDeliveryPoints(points => points.filter(p => p._id !== id));
      toast.success('Delivery point deleted!');
    } catch (err: any) {
      toast.error('Failed to delete delivery point');
    }
  };

  const handleShare = (point: DeliveryPoint) => {
    setSelectedPoint(point);
    setShareModalOpen(true);
  };

  const generateShareLink = (point: DeliveryPoint) => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/delivery-point/${point._id}`;
    return shareUrl;
  };

  const generateMapLink = (point: DeliveryPoint) => {
    return `https://www.google.com/maps?q=${point.latitude},${point.longitude}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const closeShareModal = () => {
    setShareModalOpen(false);
    setSelectedPoint(null);
  };

  const onLoadAutocomplete = (ac: google.maps.places.Autocomplete) => {
    setAutocomplete(ac);
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setMapLocation({ latitude: lat, longitude: lng });
        setForm(f => ({ ...f, latitude: lat, longitude: lng }));
        const address = place.formatted_address || '';
        setAutoAddress(address);
        setForm(f => ({ ...f, address }));
      }
    }
  };

  return (
    <div>
      <PageHeader title="Delivery Points" description="Manage delivery checkpoints for routes." />
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">All Delivery Points</h2>
          <Button onClick={() => openModal()} variant="primary">+ Add Delivery Point</Button>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center text-blue-600 py-4">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-600 py-4">{error}</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="py-2">Name</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveryPoints.map(point => (
                  <tr key={point._id} className="border-t">
                    <td className="py-2 font-medium">{point.name}</td>
                    <td>{point.latitude}</td>
                    <td>{point.longitude}</td>
                    <td className="truncate max-w-xs">{point.address}</td>
                    <td>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleShare(point)} 
                          className="flex items-center gap-1"
                          variant="secondary"
                        >
                          <Share2 size={14} />
                          Share
                        </Button>
                        <Button size="sm" onClick={() => handleEdit(point)}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(point._id!)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {deliveryPoints.length === 0 && !loading && !error && (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-4">No delivery points yet.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Map Section */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Map View</h3>
            <div className="text-sm text-gray-500">
              Click on markers to share delivery points
            </div>
          </div>
          <div style={{ height: 400, width: '100%' }}>
            {isLoaded && (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={deliveryPoints.length > 0 ? { lat: deliveryPoints[0].latitude, lng: deliveryPoints[0].longitude } : defaultCenter}
                zoom={12}
              >
                {deliveryPoints.map((point, idx) => (
                  <Marker
                    key={point._id}
                    position={{ lat: point.latitude, lng: point.longitude }}
                    label={point.name}
                    onClick={() => handleShare(point)}
                    cursor="pointer"
                  />
                ))}
              </GoogleMap>
            )}
          </div>
        </div>
      </Card>
      {/* Modal for Add/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg relative animate-fadeIn">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={closeModal}>&times;</button>
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit' : 'Add'} Delivery Point</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Search Address</label>
                {isLoaded && (
                  <Autocomplete onLoad={onLoadAutocomplete} onPlaceChanged={onPlaceChanged}>
                    <input
                      type="text"
                      placeholder="Search for a place or address"
                      className="border p-2 rounded w-full mb-2"
                      style={{ fontSize: 16 }}
                    />
                  </Autocomplete>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location (Pin on Map)</label>
                <div style={modalMapStyle} className="mb-2 rounded overflow-hidden border">
                  {isLoaded && (
                    <GoogleMap
                      mapContainerStyle={modalMapStyle}
                      center={mapLocation ? { lat: mapLocation.latitude, lng: mapLocation.longitude } : modalMapCenter}
                      zoom={16}
                      onClick={handleMapClick}
                    >
                      {mapLocation && (
                        <Marker position={{ lat: mapLocation.latitude, lng: mapLocation.longitude }} />
                      )}
                    </GoogleMap>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" onClick={closeModal} variant="secondary">Cancel</Button>
                <Button type="submit" variant="primary">{editingId ? 'Update' : 'Add'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalOpen && selectedPoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative animate-fadeIn">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={closeShareModal}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Share Delivery Point</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedPoint.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{selectedPoint.address}</p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Direct Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={generateShareLink(selectedPoint)}
                      readOnly
                      className="flex-1 border p-2 rounded text-sm bg-gray-50"
                    />
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(generateShareLink(selectedPoint))}
                      className="flex items-center gap-1"
                    >
                      <Copy size={14} />
                      Copy
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Google Maps Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={generateMapLink(selectedPoint)}
                      readOnly
                      className="flex-1 border p-2 rounded text-sm bg-gray-50"
                    />
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(generateMapLink(selectedPoint))}
                      className="flex items-center gap-1"
                    >
                      <Copy size={14} />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.open(generateMapLink(selectedPoint), '_blank')}
                      className="flex items-center gap-1"
                    >
                      <ExternalLink size={14} />
                      Open
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Coordinates</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={`${selectedPoint.latitude}, ${selectedPoint.longitude}`}
                      readOnly
                      className="flex-1 border p-2 rounded text-sm bg-gray-50"
                    />
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(`${selectedPoint.latitude}, ${selectedPoint.longitude}`)}
                      className="flex items-center gap-1"
                    >
                      <Copy size={14} />
                      Copy
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button onClick={closeShareModal} variant="secondary">Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryPoints; 