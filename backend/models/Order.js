const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: false,
    default: null
  },
  customerName: {
    type: String,
    required: true
  },
  items: [{
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  // Delivery fee and transparent breakdown (Traffic Frnd model)
  deliveryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  feeBreakdown: {
    baseFare: { type: Number, default: 0 },
    distanceMeters: { type: Number, default: 0 },
    timeMinutes: { type: Number, default: 0 },
    timeFreeMinutes: { type: Number, default: 20 },
    timeAdjustment: { type: Number, default: 0 },
    surgePercent: { type: Number, default: 0 }, // e.g., 0.2 for 20%
    surgeReasons: { type: [String], default: [] },
    finalFee: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'enroute', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  deliveryAddress: {
    type: String
  },
  specialInstructions: {
    type: String
  },
  vehicleNumber: {
    type: String,
    required: false,
    default: ''
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: false,
    default: null
  },
  // Location information at the time of order
  locations: {
    user: {
      latitude: {
        type: Number,
        default: null
      },
      longitude: {
        type: Number,
        default: null
      },
      address: {
        type: String,
        default: ''
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    },
    vendor: {
      latitude: {
        type: Number,
        default: null
      },
      longitude: {
        type: Number,
        default: null
      },
      address: {
        type: String,
        default: ''
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    },
    deliveryBoy: {
      latitude: {
        type: Number,
        default: null
      },
      longitude: {
        type: Number,
        default: null
      },
      address: {
        type: String,
        default: ''
      },
      timestamp: {
        type: Date,
        default: null
      }
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  deliveryBoyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryBoy',
    required: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  selectedDeliveryPoint: {
    id: { type: String },
    name: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String }
  },
  // Payment information
  payment: {
    method: { type: String, enum: ['cod', 'online'], default: 'cod' },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    amount: { type: Number, default: 0 },
    gateway: { type: String, enum: ['razorpay', 'stripe', null], default: null },
    gatewayOrderId: { type: String },
    gatewayPaymentId: { type: String },
    signature: { type: String },
    paidAt: { type: Date },
    refund: {
      amount: { type: Number, default: 0 },
      id: { type: String },
      at: { type: Date }
    }
  }
}, {
  collection: 'food_orders'
});

// Update the updatedAt timestamp before saving
orderSchema.pre('save', function(next) {
  if (this.status === 'preparing' && !this.deliveryBoyId) {
    return next(new Error('Cannot set status to preparing without a delivery boy assigned.'));
  }
  this.updatedAt = Date.now();
  next();
});

function checkPreparing(next) {
  if (this.getUpdate) {
    const update = this.getUpdate();
    const status = update.status || (update.$set && update.$set.status);
    const deliveryBoyId = update.deliveryBoyId || (update.$set && update.$set.deliveryBoyId);
    if (status === 'preparing' && !deliveryBoyId) {
      return next(new Error('Cannot set status to preparing without a delivery boy assigned.'));
    }
  }
  next();
}

orderSchema.pre('findOneAndUpdate', checkPreparing);
orderSchema.pre('updateOne', checkPreparing);
orderSchema.pre('updateMany', checkPreparing);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order; 