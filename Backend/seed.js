const mongoose = require('mongoose');
const Product = require('./models/product');
const User = require('./models/user');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/luxe_fashion';

const sampleProducts = [
    {
        name: "Cashmere Blend Coat",
        category: "womens-fashion",
        price: 445.5,
        stock: true,
        rating: 4.8,
        isNew: true,
        isSale: true,
        imageUrl: "https://images.unsplash.com/photo-1715408153725-186c6c77fb45?w=600&auto=format&fit=crop&q=60",
        description: "Luxurious cashmere blend coat perfect for winter elegance"
    },
    {
        name: "Silk Midi Dress",
        category: "womens-fashion",
        price: 745.5,
        stock: false,
        rating: 4.5,
        isNew: false,
        isSale: false,
        imageUrl: "https://images.unsplash.com/photo-1700748910972-1978af2203d3?w=1000&auto=format&fit=crop&q=60",
        description: "Elegant silk midi dress for special occasions"
    },
    {
        name: "Premium Leather Jacket",
        category: "mens-fashion",
        price: 500,
        stock: true,
        rating: 4.9,
        isNew: true,
        isSale: false,
        imageUrl: "https://images.unsplash.com/photo-1637696468103-99df968d27ef?w=600&auto=format&fit=crop&q=60",
        description: "Classic leather jacket with modern styling"
    },
    {
        name: "ALDO Handbag",
        category: "bags",
        price: 250,
        stock: true,
        rating: 4.7,
        isNew: false,
        isSale: false,
        imageUrl: "https://d31j7ucw3xqus1.cloudfront.net/media/catalog/product/cache/22545e4e11acb100c5f247182ec9b42f/a/l/al_brugu_238_cognac_ss25_plp.jpg",
        description: "Stylish ALDO handbag with premium finish"
    },
    {
        name: "Italian Leather Shoes",
        category: "footwear",
        price: 1000,
        stock: true,
        rating: 4.6,
        isNew: true,
        isSale: false,
        imageUrl: "https://images.unsplash.com/photo-1628370996561-889d842058bb?w=600&auto=format&fit=crop&q=60",
        description: "Handcrafted Italian leather shoes"
    },
    {
        name: "Rolex Watch",
        category: "accessories",
        price: 4000,
        stock: false,
        rating: 4.8,
        isNew: false,
        isSale: true,
        imageUrl: "https://images.unsplash.com/photo-1730757679771-b53e798846cf?w=600&auto=format&fit=crop&q=60",
        description: "Luxury timepiece with precision engineering"
    },
    {
        name: "Diamond Earrings",
        category: "jewelry",
        price: 3500,
        stock: false,
        rating: 4.5,
        isNew: false,
        isSale: false,
        imageUrl: "https://plus.unsplash.com/premium_photo-1681276169450-4504a2442173?q=80&w=687&auto=format&fit=crop",
        description: "Stunning diamond earrings with 18k gold"
    },
    {
        name: "Rayban Sunglasses",
        category: "accessories",
        price: 150,
        stock: true,
        rating: 4.7,
        isNew: false,
        isSale: false,
        imageUrl: "https://images.unsplash.com/photo-1732139637065-1088495050db?w=600&auto=format&fit=crop&q=60",
        description: "Classic Rayban aviator sunglasses"
    },
    {
        name: "Adidas Sport Shoe Pro",
        category: "footwear",
        price: 2000,
        stock: true,
        rating: 4.5,
        isNew: true,
        isSale: false,
        imageUrl: "https://images.unsplash.com/photo-1691067951700-138ca8f4841f?q=80&w=687&auto=format&fit=crop",
        description: "Professional sports shoes with advanced cushioning"
    },
    {
        name: "Timex Watch",
        category: "accessories",
        price: 7000,
        stock: false,
        rating: 4.9,
        isNew: false,
        isSale: true,
        imageUrl: "https://images.unsplash.com/photo-1695345272166-4efd76dd7a21?q=80&w=735&auto=format&fit=crop",
        description: "Premium Timex chronograph watch"
    },
    {
        name: "Silver Bracelet",
        category: "jewelry",
        price: 4000,
        stock: false,
        rating: 4.6,
        isNew: false,
        isSale: false,
        imageUrl: "https://plus.unsplash.com/premium_photo-1673285097459-2d980192ce04?q=80&w=687&auto=format&fit=crop",
        description: "Elegant sterling silver bracelet"
    },
    {
        name: "Cazal Men Sunglasses",
        category: "accessories",
        price: 230,
        stock: false,
        rating: 4.8,
        isNew: false,
        isSale: false,
        imageUrl: "https://images.unsplash.com/photo-1732139637220-15346842a9fd?q=80&w=736&auto=format&fit=crop",
        description: "Designer Cazal sunglasses for men"
    },
    {
        name: "Adidas Fitness Summer",
        category: "mens-fashion",
        price: 1500,
        stock: true,
        rating: 4.7,
        isNew: true,
        isSale: false,
        imageUrl: "https://images.unsplash.com/photo-1656005947976-233c377e89fc?w=600&auto=format&fit=crop&q=60",
        description: "Breathable summer fitness wear"
    },
    {
        name: "Gucci Outfit Fashion",
        category: "womens-fashion",
        price: 5000,
        stock: false,
        rating: 4.9,
        isNew: false,
        isSale: true,
        imageUrl: "https://images.unsplash.com/photo-1616847220575-31b062a4cd05?q=80&w=687&auto=format&fit=crop",
        description: "Exclusive Gucci designer outfit"
    },
    {
        name: "Qatar Hijab OUTFIT",
        category: "womens-fashion",
        price: 2300,
        stock: false,
        rating: 4.6,
        isNew: false,
        isSale: false,
        imageUrl: "https://images.unsplash.com/photo-1752794674411-b4ed671cbc2e?q=80&w=687&auto=format&fit=crop",
        description: "Traditional Qatar-style hijab outfit"
    },
    {
        name: "ALDO Crossbody Bag",
        category: "bags",
        price: 3000,
        stock: false,
        rating: 4.7,
        isNew: false,
        isSale: false,
        imageUrl: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcRZWftBj_mTA3yXxJxR3YkhNf6K5nqZV-RTitn28jpzFD5cwBNLCVeg85FhV2uJfwOZo81FJCX5uDeUqzwL3w9-Upql14srjKtXnBEE1BzqmHPYaaXIKHO2apls",
        description: "Versatile ALDO crossbody bag"
    }
];

const createAdminUser = async () => {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    return {
        name: "Admin User",
        email: "admin@luxe.com",
        password: hashedPassword,
        role: "admin",
        status: "active"
    };
};

async function seedDatabase() {
    try {
        console.log('========================================');
        console.log(' LUXE FASHION DATABASE SEEDER');
        console.log('========================================');
        console.log('');

        // Connect to MongoDB
        console.log(' Connecting to MongoDB...');
        console.log(`   URI: ${MONGO_URI.split('@')[1] || 'Local MongoDB'}`);
        
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log(' Connected to MongoDB successfully');
        console.log('');

        // Clear existing data
        console.log('  Clearing existing data...');
        const deletedProducts = await Product.deleteMany({});
        const deletedUsers = await User.deleteMany({});
        console.log(`   Deleted ${deletedProducts.deletedCount} products`);
        console.log(`   Deleted ${deletedUsers.deletedCount} users`);
        console.log('');

        // Seed products
        console.log(' Seeding products...');
        const insertedProducts = await Product.insertMany(sampleProducts);
        console.log(` Successfully added ${insertedProducts.length} products`);
        
        // List first 3 products
        console.log('');
        console.log(' Sample products added:');
        insertedProducts.slice(0, 3).forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.name} - ${p.price} DHS (${p.category})`);
        });
        console.log(`   ... and ${insertedProducts.length - 3} more products`);
        console.log('');

        // Create admin user
        console.log(' Creating admin user...');
        const adminUser = await createAdminUser();
        const createdAdmin = await User.create(adminUser);
        console.log(' Admin user created successfully');
        console.log(`   Email: ${createdAdmin.email}`);
        console.log(`   Password: admin123`);
        console.log(`   Role: ${createdAdmin.role}`);
        console.log('');

        // Final count
        const productCount = await Product.countDocuments();
        const userCount = await User.countDocuments();

        console.log('========================================');
        console.log(' SEEDING SUMMARY');
        console.log('========================================');
        console.log(` Total Products: ${productCount}`);
        console.log(` Total Users: ${userCount}`);
        console.log('========================================');
        console.log('');
        console.log('🎉 Database seeding completed successfully!');
        console.log('');
        console.log(' Next steps:');
        console.log('   1. Start backend: npm run dev');
        console.log('   2. Test products: http://localhost:5001/api/products');
        console.log('   3. Login as admin: admin@luxe.com / admin123');
        console.log('');

        // Close connection
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('');
        console.error('========================================');
        console.error(' ERROR DURING SEEDING');
        console.error('========================================');
        console.error('Error:', error.message);
        console.error('');
        
        if (error.message.includes('ECONNREFUSED')) {
            console.error(' Possible cause: MongoDB is not running');
            console.error('   Solutions:');
            console.error('   - Start MongoDB locally');
            console.error('   - OR use MongoDB Atlas (cloud)');
        } else if (error.message.includes('authentication failed')) {
            console.error(' Possible cause: Wrong MongoDB credentials');
            console.error('   Solution: Check MONGO_URI in .env file');
        }
        
        console.error('========================================');
        console.error('');
        
        await mongoose.connection.close();
        process.exit(1);
    }
}

seedDatabase();