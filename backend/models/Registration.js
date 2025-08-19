const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    storeAddress: { type: String, required: true, trim: true },
    pinCode: { type: String, required: true, trim: true },
    productType: { type: String, required: true, trim: true },
    bankAccountNumber: { type: String, required: true, trim: true },
    ifscCode: { type: String, required: true, trim: true },
    accountHolderName: { type: String, required: true, trim: true },
    aadhaarNumber: { type: String, required: true, trim: true },
    panNumber: { type: String, required: true, trim: true },
    employeeReferral: { type: String, trim: true },
    agreeToTerms: { type: Boolean, required: true },
    documents: {
      gstCertificate: {
        originalName: String,
        mimeType: String,
        path: String,
        size: Number,
        gridFsFileId: String,
        fileUrl: String,
      },
      fssaiLicense: {
        originalName: String,
        mimeType: String,
        path: String,
        size: Number,
        gridFsFileId: String,
        fileUrl: String,
      },
      agreement: {
        originalName: String,
        mimeType: String,
        path: String,
        size: Number,
        gridFsFileId: String,
        fileUrl: String,
      },
      aadhaarCard: {
        originalName: String,
        mimeType: String,
        path: String,
        size: Number,
        gridFsFileId: String,
        fileUrl: String,
      },
      panCard: {
        originalName: String,
        mimeType: String,
        path: String,
        size: Number,
        gridFsFileId: String,
        fileUrl: String,
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Registration', RegistrationSchema);


