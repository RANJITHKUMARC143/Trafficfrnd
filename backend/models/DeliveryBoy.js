const mongoose = require('mongoose');

const deliveryBoySchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['delivery'],
    default: 'delivery'
  },
  vehicleType: {
    type: String,
    required: true,
    enum: ['Walker', 'Bike']
  },
  vehicleNumber: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalDeliveries: {
    type: Number,
    default: 0
  },
  onTimeRate: {
    type: Number,
    default: 0
  },
  acceptanceRate: {
    type: Number,
    default: 0
  },
  cancellationRate: {
    type: Number,
    default: 0
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  documents: {
    license: {
      number: String,
      expiryDate: Date,
      verified: {
        type: Boolean,
        default: false
      }
    },
    insurance: {
      policyNumber: String,
      expiryDate: Date,
      verified: {
        type: Boolean,
        default: false
      }
    },
    idProof: {
      type: String,
      number: String,
      verified: {
        type: Boolean,
        default: false
      }
    }
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    bankName: String,
    verified: {
      type: Boolean,
      default: false
    }
  },
  preferences: {
    language: {
      type: String,
      default: 'English'
    },
    notifications: {
      type: Boolean,
      default: true
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  // Surge preference controlled by driver
  surge: {
    enabled: { type: Boolean, default: false },
    lastToggledAt: { type: Date }
  },
  earnings: {
    total: {
      type: Number,
      default: 0
    },
    monthly: {
      type: Number,
      default: 0
    },
    weekly: {
      type: Number,
      default: 0
    },
    lastPayout: {
      amount: Number,
      date: Date
    }
  },
  activityLog: [{
    action: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: mongoose.Schema.Types.Mixed
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for geospatial queries
deliveryBoySchema.index({ currentLocation: '2dsphere' });

// Update the updatedAt timestamp before saving
deliveryBoySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to get public profile (excluding sensitive data)
deliveryBoySchema.methods.getPublicProfile = function() {
  const deliveryBoyObject = this.toObject();
  delete deliveryBoyObject.password;
  delete deliveryBoyObject.__v;
  return deliveryBoyObject;
};

// Method to log activity
deliveryBoySchema.methods.logActivity = async function(action, details) {
  this.activityLog.push({
    action,
    details,
    timestamp: new Date()
  });
  await this.save();
};

const DeliveryBoy = mongoose.model('DeliveryBoy', deliveryBoySchema);

module.exports = DeliveryBoy; 