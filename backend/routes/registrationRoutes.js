const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Registration = require('../models/Registration');
const path = require('path');
const fs = require('fs');

// Get all registrations (admin)
router.get('/', auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const registrations = await Registration.find({}).sort({ createdAt: -1 });
    const mapped = registrations.map((r) => {
      const obj = r.toObject();
      return {
        // Common/vendor-compatible props for existing table visuals
        id: r._id.toString(),
        businessName: r.businessName || '',
        ownerName: r.ownerName || '',
        email: r.email || '',
        phone: r.contactNumber || '',
        status: 'inactive',
        isVerified: false,
        isOpen: false,
        address: { street: r.storeAddress || '', pinCode: r.pinCode || '' },
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,

        // Full registration details
        contactNumber: r.contactNumber || '',
        storeAddress: r.storeAddress || '',
        pinCode: r.pinCode || '',
        productType: r.productType || '',
        bankAccountNumber: r.bankAccountNumber || '',
        ifscCode: r.ifscCode || '',
        accountHolderName: r.accountHolderName || '',
        aadhaarNumber: r.aadhaarNumber || '',
        panNumber: r.panNumber || '',
        employeeReferral: r.employeeReferral || '',
        agreeToTerms: !!r.agreeToTerms,
        documents: obj.documents || {},
      };
    });
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching registrations', error: error.message });
  }
});

module.exports = router;

// Serve or redirect to a registration document
router.get('/:id/documents/:docKey', auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { id, docKey } = req.params;
    const registration = await Registration.findById(id);
    if (!registration) return res.status(404).json({ message: 'Registration not found' });
    const doc = registration.documents?.[docKey];
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    // Prefer external fileUrl
    if (doc.fileUrl) {
      return res.redirect(302, doc.fileUrl);
    }

    // Fallback to local file path if available
    if (doc.path) {
      const absolutePath = path.isAbsolute(doc.path)
        ? doc.path
        : path.resolve(process.cwd(), doc.path);
      if (fs.existsSync(absolutePath)) {
        return res.sendFile(absolutePath);
      }
    }

    return res.status(404).json({ message: 'Document file not available' });
  } catch (error) {
    res.status(500).json({ message: 'Error serving document', error: error.message });
  }
});


