const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const Product = require('./models/product');
const Order = require('./models/order');
const User = require('./models/user');
const userRoutes = require('./routes/users');
const { auth, adminOnly } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5001;

// =============================================
// MIDDLEWARE
// =============================================
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// =============================================
// DATABASE CONNECTION
// =============================================
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/luxe_fashion';

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Successfully connected to MongoDB');
    console.log(`Database: luxe_fashion`);
})
.catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
});

// =============================================
// ROUTES
// =============================================

// Health check - Public
app.get('/', (req, res) => {
    res.json({ 
        status: 'LUXE Fashion API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            users: '/users',
            products: '/api/products',
            orders: '/api/orders',
            stats: '/api/stats'
        }
    });
});

// User routes (includes auth)
app.use('/users', userRoutes);

// Logout endpoint - Protected
app.post('/logout', auth, async (req, res) => {
    try {
        req.user.status = 'inactive';
        await req.user.save();
        
        res.json({ 
            success: true, 
            message: 'Logged out successfully' 
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// PRODUCT ROUTES
// =============================================

// Get all products - Public
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get single product - Public
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create product - Admin only
app.post('/api/products', auth, adminOnly, async (req, res) => {
    try {
        console.log('Creating product:', req.body);
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(400).json({ error: error.message });
    }
});

// Update product - Admin only
app.put('/api/products/:id', auth, adminOnly, async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(400).json({ error: error.message });
    }
});

// Delete product - Admin only
app.delete('/api/products/:id', auth, adminOnly, async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// ORDER ROUTES
// =============================================

// Get all orders - Admin only
app.get('/api/orders', auth, adminOnly, async (req, res) => {
    try {
        const orders = await Order.find().sort({ date: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user's orders - Protected (user can see their own orders)
app.get('/api/orders/user/:email', auth, async (req, res) => {
    try {
        // Users can only see their own orders unless they're admin
        if (req.user.role !== 'admin' && req.user.email !== req.params.email) {
            return res.status(403).json({ 
                error: 'Access denied',
                message: 'You can only view your own orders'
            });
        }

        const orders = await Order.find({ 
            customerEmail: req.params.email 
        }).sort({ date: -1 });
        
        res.json(orders);
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create order - Protected
app.post('/api/orders', auth, async (req, res) => {
    try {
        console.log('Creating order:', req.body);
        
        // Ensure the order belongs to the authenticated user
        const orderData = {
            ...req.body,
            user: req.user._id,
            customerEmail: req.user.email,
            customerName: req.user.name
        };

        const newOrder = new Order(orderData);
        const savedOrder = await newOrder.save();
        res.status(201).json(savedOrder);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(400).json({ error: error.message });
    }
});

// Update order status - Admin only
app.put('/api/orders/:id', auth, adminOnly, async (req, res) => {
    try {
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        if (!updatedOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(updatedOrder);
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(400).json({ error: error.message });
    }
});

// Delete order - Admin only
app.delete('/api/orders/:id', auth, adminOnly, async (req, res) => {
    try {
        const deletedOrder = await Order.findByIdAndDelete(req.params.id);
        if (!deletedOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// STATS ROUTE - Admin only
// =============================================
app.get('/api/stats', auth, adminOnly, async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const orderCount = await Order.countDocuments();
        const productCount = await Product.countDocuments();
        
        const orders = await Order.find();
        const revenue = orders.reduce((total, order) => {
            return total + (order.totalAmount || 0);
        }, 0);

        res.json({ 
            userCount, 
            orderCount, 
            productCount, 
            revenue: revenue.toFixed(2)
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// ERROR HANDLERS
// =============================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        path: req.path,
        method: req.method
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err.stack);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

// =============================================
// START SERVER
// =============================================
app.listen(PORT, () => {
    console.log('');
    console.log('================================');
    console.log('LUXE FASHION BACKEND SERVER');
    console.log('================================');
    console.log(` Server: http://localhost:${PORT}`);
    console.log(` Health: http://localhost:${PORT}/`);
    console.log(` Users: http://localhost:${PORT}/users`);
    console.log(` Products: http://localhost:${PORT}/api/products`);
    console.log(` Orders: http://localhost:${PORT}/api/orders`);
    console.log('================================');
    console.log('');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n Shutting down gracefully...');
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
});