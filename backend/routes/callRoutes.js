const express = require('express');
const router = express.Router();
const CallLog = require('../models/CallLog');
const auth = require('../middleware/auth');

// Helper to get last 10 digits (provider expects local 10-digit numbers)
const toLocal10Digits = (value = '') => {
  const digits = (value.match(/\d+/g) || []).join('');
  return digits.slice(-10);
};

// POST /api/call
router.post('/', auth, async (req, res) => {
  try {
    const { from_number, to_number } = req.body || {};

    if (!from_number || !to_number) {
      return res.status(400).json({ message: 'Both from_number and to_number are required' });
    }

    const formattedFrom = toLocal10Digits(from_number);
    const formattedTo = toLocal10Digits(to_number);

    if (formattedFrom.length !== 10 || formattedTo.length !== 10) {
      return res.status(400).json({ message: 'Numbers must contain at least 10 digits' });
    }

    const authToken = process.env.CLOUDSHOPE_API_TOKEN;
    if (!authToken) {
      return res.status(500).json({ message: 'CloudShope token not configured on server' });
    }

    const providerUrl = 'https://apiv1.cloudshope.com/api/sendClickToCall';

    const response = await fetch(providerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        from_number: formattedFrom,
        to_number: formattedTo,
      }),
    });

    let data = {};
    try {
      data = await response.json();
    } catch (_) {
      try {
        data = { message: await response.text() };
      } catch {}
    }

    // Save log
    try {
      await CallLog.create({
        fromNumber: formattedFrom,
        toNumber: formattedTo,
        campaignId: data?.data?.campaignId?.toString?.() || undefined,
        providerStatus: data?.status || response.status,
        providerMessage: data?.message || undefined,
        success: response.ok,
        error: response.ok ? undefined : (data?.message || 'Provider error'),
        requestedBy: req.user?._id || undefined,
      });
    } catch (e) {
      console.error('Failed to save CallLog:', e);
    }

    if (!response.ok) {
      return res.status(response.status).json(data || { message: 'Provider error' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Click-to-call proxy error:', error);
    return res.status(500).json({ message: 'Server error initiating call', error: error.message });
  }
});

// GET /api/call/logs - recent logs
router.get('/logs', auth, async (req, res) => {
  try {
    const logs = await CallLog.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ logs });
  } catch (error) {
    console.error('Error fetching CallLog:', error);
    res.status(500).json({ message: 'Error fetching call logs' });
  }
});

module.exports = router;


