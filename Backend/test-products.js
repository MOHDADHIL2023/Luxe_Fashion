const mongoose = require('mongoose');
const Product = require('./models/product');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/luxe_fashion';

async function testProducts() {
    try {
        console.log('');
        console.log(' Testing Product Database...');
        console.log('========================================');
        
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log(' Connected to MongoDB');
        console.log('');

        // Count products
        const count = await Product.countDocuments();
        console.log(` Total products in database: ${count}`);
        console.log('');

        if (count === 0) {
            console.log(' No products found!');
            console.log(' Run: npm run seed');
            console.log('');
        } else {
            console.log(' Products found! Showing first 5:');
            console.log('');
            
            const products = await Product.find().limit(5);
            products.forEach((p, i) => {
                console.log(`${i + 1}. ${p.name}`);
                console.log(`   Category: ${p.category}`);
                console.log(`   Price: ${p.price} DHS`);
                console.log(`   Stock: ${p.stock ? 'In Stock' : 'Out of Stock'}`);
                console.log(`   ID: ${p._id}`);
                console.log('');
            });
        }

        console.log('========================================');
        console.log('');
        console.log(' Test API endpoint:');
        console.log('   http://localhost:5001/api/products');
        console.log('');
        console.log('🔧 If backend shows products but frontend doesn\'t:');
        console.log('   1. Check browser console (F12)');
        console.log('   2. Check CORS settings in app.js');
        console.log('   3. Verify API_URL in config.js');
        console.log('');

        await mongoose.connection.close();
        console.log(' Test complete');
        process.exit(0);

    } catch (error) {
        console.error('');
        console.error(' Error:', error.message);
        console.error('');
        
        await mongoose.connection.close();
        process.exit(1);
    }
}

testProducts();