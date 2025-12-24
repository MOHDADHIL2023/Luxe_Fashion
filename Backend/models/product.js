const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Product name is required'],
        trim: true
    },
    category: { 
        type: String, 
        required: [true, 'Category is required'],
        enum: {
            values: ['mens-fashion', 'womens-fashion', 'accessories', 'footwear', 'bags', 'jewelry'],
            message: '{VALUE} is not a valid category'
        }
    },
    price: { 
        type: Number, 
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    stock: { 
        type: Boolean, 
        default: true 
    },
    imageUrl: { 
        type: String, 
        required: [true, 'Image URL is required'],
        trim: true
    },
    rating: { 
        type: Number, 
        default: 4.5,
        min: [0, 'Rating must be at least 0'],
        max: [5, 'Rating cannot exceed 5']
    },
    isNew: { 
        type: Boolean, 
        default: false 
    },
    isSale: { 
        type: Boolean, 
        default: false 
    },
    description: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

ProductSchema.index({ category: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ name: 'text' });

module.exports = mongoose.model('Product', ProductSchema);