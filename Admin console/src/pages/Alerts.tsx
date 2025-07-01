import React, { useState, useEffect } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Select, { components } from 'react-select';
import ClipLoader from 'react-spinners/ClipLoader';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ALERT_TYPES = [
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'success', label: 'Success' },
  { value: 'error', label: 'Error' },
];

const RECIPIENT_TYPES = [
  { value: 'user', label: 'User' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'delivery', label: 'Delivery Boy' },
];

const API_URL = 'http://localhost:3000';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const Option = (props) => {
  const { data } = props;
  return (
    <components.Option {...props}>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
          {data.avatar}
        </div>
        <div>
          <div className="font-medium">{data.label}</div>
          {data.subtext && <div className="text-xs text-gray-500">{data.subtext}</div>}
        </div>
      </div>
    </components.Option>
  );
};

const MultiValueLabel = (props) => {
  const { data } = props;
  return (
    <components.MultiValueLabel {...props}>
      <div className="flex items-center gap-1">
        <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs mr-1">{data.avatar}</span>
        {data.label}
      </div>
    </components.MultiValueLabel>
  );
};

export default function AlertsAdmin() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [recipientType, setRecipientType] = useState('user');
  const [recipients, setRecipients] = useState([]);
  const [recipientOptions, setRecipientOptions] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/alerts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch alerts');
      const data = await res.json();
      setAlerts(data);
    } catch (err) {
      setError('Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    // Fetch recipients based on type
    const fetchRecipients = async () => {
      setRecipients([]);
      setRecipientOptions([]);
      setSelectedRecipients([]);
      setLoadingRecipients(true);
      const token = localStorage.getItem('token');
      let url = '';
      if (recipientType === 'user') url = `${API_URL}/api/users`;
      if (recipientType === 'vendor') url = `${API_URL}/api/vendors`;
      if (recipientType === 'delivery') url = `${API_URL}/api/delivery`;
      if (!url) return;
      try {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to fetch recipients');
        const data = await res.json();
        setRecipients(data);
        setRecipientOptions(data.map(r => ({
          value: r._id,
          label:
            recipientType === 'user' ? `${r.name || r.username} (${r.email})` :
            recipientType === 'vendor' ? `${r.businessName} (${r.email})` :
            recipientType === 'delivery' ? `${r.fullName} (${r.email})` :
            r._id,
          subtext:
            recipientType === 'user' ? r.username :
            recipientType === 'vendor' ? r.businessName :
            recipientType === 'delivery' ? r.fullName : '',
          avatar:
            recipientType === 'user' ? getInitials(r.name || r.username) :
            recipientType === 'vendor' ? getInitials(r.businessName) :
            recipientType === 'delivery' ? getInitials(r.fullName) : '?',
        })));
      } catch (err) {
        setError('Failed to fetch recipients');
        toast.error('Failed to fetch recipients');
      } finally {
        setLoadingRecipients(false);
      }
    };
    fetchRecipients();
  }, [recipientType]);

  const groupedOptions = [
    {
      label: RECIPIENT_TYPES.find(t => t.value === recipientType)?.label,
      options: recipientOptions
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      // Send alert to each selected recipient
      for (const recipient of selectedRecipients) {
        const res = await fetch(`${API_URL}/api/alerts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            message,
            type,
            userId: recipient.value,
          }),
        });
        if (!res.ok) throw new Error('Failed to create alert');
      }
      setSuccess('Alert(s) created successfully');
      toast.success('Alert(s) created successfully');
      setTitle('');
      setMessage('');
      setType('info');
      setRecipientType('user');
      setSelectedRecipients([]);
      fetchAlerts();
    } catch (err) {
      setError('Failed to create alert(s)');
      toast.error('Failed to create alert(s)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Alerts" description="Create and manage system alerts" />
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded p-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} className="w-full border rounded p-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full border rounded p-2">
              {ALERT_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Recipient Type</label>
            <select value={recipientType} onChange={e => setRecipientType(e.target.value)} className="w-full border rounded p-2">
              {RECIPIENT_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Recipients</label>
            <Select
              value={selectedRecipients}
              onChange={setSelectedRecipients}
              options={groupedOptions}
              isClearable
              isSearchable
              isMulti
              isLoading={loadingRecipients}
              placeholder={loadingRecipients ? 'Loading...' : 'Select recipients...'}
              noOptionsMessage={() => loadingRecipients ? 'Loading...' : 'No recipients found'}
              classNamePrefix="react-select"
              components={{ Option, MultiValueLabel }}
              formatGroupLabel={data => (
                <div className="font-semibold text-blue-700 text-xs uppercase tracking-wide px-2 py-1 bg-blue-50 rounded mb-1">{data.label}</div>
              )}
              styles={{
                option: (provided, state) => ({
                  ...provided,
                  backgroundColor: state.isFocused ? '#e0e7ff' : 'white',
                  color: '#222',
                  cursor: 'pointer',
                }),
                control: (provided) => ({ ...provided, minHeight: 44 }),
                groupHeading: (provided) => ({ ...provided, marginBottom: 0 }),
              }}
            />
          </div>
          <Button type="submit" variant="primary" isLoading={loading || loadingRecipients} disabled={loading || loadingRecipients || !title || !message || !type || !selectedRecipients.length}>Create Alert</Button>
        </form>
      </Card>
      <Card className="mt-6">
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2">Recent Alerts</h3>
          {loading ? (
            <div className="flex justify-center py-8"><ClipLoader size={32} color="#2563eb" /></div>
          ) : alerts.length === 0 ? (
            <div className="text-gray-500">No alerts found.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {alerts.slice(0, 10).map((alert) => (
                <li key={alert._id} className="py-2">
                  <div className="font-medium">{alert.title}</div>
                  <div className="text-sm text-gray-600">{alert.message}</div>
                  <div className="text-xs text-gray-400">{alert.type} | {new Date(alert.createdAt).toLocaleString()}</div>
                  {alert.userId && <div className="text-xs text-blue-500">User: {alert.userId}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
}

// To use this, run:
// npm install react-select react-spinners react-toastify 