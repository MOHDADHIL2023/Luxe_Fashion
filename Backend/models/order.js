const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    },
    customerName: { 
        type: String, 
        required: [true, 'Customer name is required'],
        trim: true
    },
    customerEmail: {
        type: String,
        trim: true,
        lowercase: true
    },
    totalAmount: { 
        type: Number, 
        required: [true, 'Total amount is required'],
        min: [0, 'Total amount cannot be negative']
    },
    status: { 
        type: String,
        enum: {
            values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
            message: '{VALUE} is not a valid status'
        },
        default: 'processing'
    },
    date: { 
        type: Date, 
        default: Date.now 
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product'
            },
            name: {
                type: String,
                required: true
            },
            qty: {
                type: Number,
                required: true,
                min: [1, 'Quantity must be at least 1']
            },
            price: {
                type: Number,
                required: true,
                min: [0, 'Price cannot be negative']
            }
        }
    ],
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    }
}, {
    timestamps: true
});

OrderSchema.index({ customerEmail: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ date: -1 });

module.exports = mongoose.model('Order', OrderSchema);