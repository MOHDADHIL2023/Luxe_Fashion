const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Name is required'],
        trim: true
    },
    email: { 
        type: String, 
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: { 
        type: String, 
        required: function() {
            return !this.googleId;
        }
    },
    role: { 
        type: String, 
        enum: ['customer', 'admin'],
        default: 'customer'
    },
    status: { 
        type: String, 
        enum: ['active', 'inactive'],
        default: 'inactive'
    },
    googleId: { 
        type: String,
        sparse: true
    },
    joined: { 
        type: Date, 
        default: Date.now 
    }
}, {
    timestamps: true
});

UserSchema.index({ email: 1 });

module.exports = mongoose.model('User', UserSchema);