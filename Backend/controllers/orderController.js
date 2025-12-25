const Order = require('../models/order');

// @desc    Create new order
// @route   POST /api/orders
const createOrder = async (req, res) => {
    try {
        const {
            items,
            shippingAddress,
            totalAmount,
            customerName,
            customerEmail
        } = req.body;

        // Validation
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'No order items included' });
        }

        // Ensure User ID exists (from Auth Middleware)
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: 'User not authenticated properly' });
        }

        const order = new Order({
            user: req.user._id,
            // Fallback to Request Body names if User object missing name/email
            customerName: req.user.name || customerName || "Guest", 
            customerEmail: req.user.email || customerEmail,
            items,
            shippingAddress,
            totalAmount
        });

        const createdOrder = await order.save();
        console.log(`Order Created: ${createdOrder._id}`); // Log success
        res.status(201).json(createdOrder);

    } catch (error) {
        console.error('Order Creation Failed:', error.message);
        // Return exact validation error to frontend
        res.status(400).json({ 
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? null : error.stack
        });
    }
};


// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
const getMyOrders = async (req, res) => {
    try {
        // Fallback: check param email if user ID lookup fails or logic differs
        const query = { user: req.user._id };
        
        // OR allow fetching by email if that's how your frontend logic works
        // const query = { customerEmail: req.user.email };

        const orders = await Order.find(query).sort({ date: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get orders by specific email (legacy support for your frontend)
// @route   GET /api/orders/user/:email
const getUserOrdersByEmail = async (req, res) => {
    try {
        // Security check: User can only view their own email unless Admin
        if (req.user.role !== 'admin' && req.user.email !== req.params.email) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const orders = await Order.find({ customerEmail: req.params.email }).sort({ date: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get all orders
// @route   GET /api/orders (Admin only)
const getOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate('user', 'id name').sort({ date: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id
const updateOrderToDelivered = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.status = req.body.status || order.status;
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getUserOrdersByEmail,
    getOrders,
    updateOrderToDelivered
};