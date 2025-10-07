import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Import models
import Transaction from './models/Transaction.js';
import Receipt from './models/Receipt.js';
import User from './models/User.js';

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected for seeding');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Demo user ID provided by user
const DEMO_USER_ID = '68e4147278a2203588e1b5b8';

// Demo receipt image URLs (free to use)
const DEMO_RECEIPT_URLS = [
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=600&fit=crop'
];

// Categories for transactions
const CATEGORIES = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Travel',
    'Income',
    'Other'
];

// Sample transaction descriptions
const TRANSACTION_DESCRIPTIONS = {
    'Food & Dining': [
        'Starbucks Coffee',
        'McDonald\'s Lunch',
        'Pizza Hut Dinner',
        'Local Restaurant',
        'Grocery Shopping',
        'Food Delivery',
        'Cafe Visit',
        'Fine Dining'
    ],
    'Transportation': [
        'Uber Ride',
        'Gas Station',
        'Metro Card',
        'Taxi Fare',
        'Bus Ticket',
        'Parking Fee',
        'Auto Rickshaw',
        'Bike Rental'
    ],
    'Shopping': [
        'Amazon Purchase',
        'Clothing Store',
        'Electronics Shop',
        'Online Shopping',
        'Bookstore',
        'Home Decor',
        'Pharmacy',
        'Department Store'
    ],
    'Entertainment': [
        'Movie Tickets',
        'Netflix Subscription',
        'Concert Tickets',
        'Gaming Purchase',
        'Sports Event',
        'Theatre Show',
        'Music Streaming',
        'Books & Magazines'
    ],
    'Bills & Utilities': [
        'Electricity Bill',
        'Internet Bill',
        'Mobile Recharge',
        'Water Bill',
        'Gas Bill',
        'Insurance Premium',
        'Property Tax',
        'Maintenance Fee'
    ],
    'Healthcare': [
        'Doctor Visit',
        'Pharmacy Purchase',
        'Medical Test',
        'Dental Care',
        'Health Insurance',
        'Eye Checkup',
        'Medicine',
        'Hospital Bill'
    ],
    'Education': [
        'Course Fee',
        'Book Purchase',
        'Online Course',
        'Certification',
        'Workshop Fee',
        'Training Program',
        'Educational App',
        'Language Class'
    ],
    'Travel': [
        'Flight Ticket',
        'Hotel Booking',
        'Travel Insurance',
        'Visa Fee',
        'Tour Package',
        'Car Rental',
        'Travel Gear',
        'Foreign Exchange'
    ],
    'Income': [
        'Salary',
        'Freelance Payment',
        'Bonus',
        'Investment Return',
        'Rental Income',
        'Part-time Job',
        'Commission',
        'Gift Money'
    ],
    'Other': [
        'Miscellaneous',
        'Cash Withdrawal',
        'Bank Charges',
        'Gift Purchase',
        'Charity Donation',
        'Emergency Expense',
        'Unexpected Cost',
        'General Expense'
    ]
};

// Generate random date within last 30 days
const getRandomDate = () => {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * 30);
    const randomDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    return randomDate;
};

// Generate random amount based on category
const getRandomAmount = (category, type) => {
    const ranges = {
        'Food & Dining': [50, 2000],
        'Transportation': [30, 1500],
        'Shopping': [100, 5000],
        'Entertainment': [200, 3000],
        'Bills & Utilities': [500, 8000],
        'Healthcare': [300, 10000],
        'Education': [1000, 25000],
        'Travel': [2000, 50000],
        'Income': [15000, 100000],
        'Other': [100, 5000]
    };

    const [min, max] = ranges[category] || [100, 2000];
    const amount = Math.floor(Math.random() * (max - min + 1)) + min;
    return type === 'income' ? amount : amount;
};

// Generate receipt items for a transaction
const generateReceiptItems = (category, totalAmount) => {
    if (category === 'Income') return [];

    const itemTemplates = {
        'Food & Dining': ['Coffee', 'Sandwich', 'Salad', 'Pizza', 'Burger', 'Pasta', 'Dessert'],
        'Shopping': ['T-Shirt', 'Jeans', 'Shoes', 'Accessories', 'Electronics', 'Books'],
        'Transportation': ['Fuel', 'Toll Fee', 'Parking'],
        'Entertainment': ['Movie Ticket', 'Popcorn', 'Drinks'],
        'Bills & Utilities': ['Service Charge', 'Usage Fee', 'Tax'],
        'Healthcare': ['Consultation', 'Medicine', 'Test'],
        'Education': ['Course Material', 'Registration Fee'],
        'Travel': ['Ticket', 'Accommodation', 'Meals'],
        'Other': ['Item 1', 'Item 2', 'Service Fee']
    };

    const items = itemTemplates[category] || ['Item'];
    const numItems = Math.floor(Math.random() * 3) + 1;
    const selectedItems = [];

    let remainingAmount = totalAmount;

    for (let i = 0; i < numItems; i++) {
        const itemName = items[Math.floor(Math.random() * items.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;

        let price;
        if (i === numItems - 1) {
            price = remainingAmount; // Last item gets remaining amount
        } else {
            price = Math.floor(remainingAmount * (0.2 + Math.random() * 0.6));
            remainingAmount -= price;
        }

        selectedItems.push({
            name: itemName,
            quantity: quantity,
            price: price
        });
    }

    return selectedItems;
};

// Create sample receipts
const createSampleReceipts = async () => {
    const receipts = [];

    for (let i = 0; i < 15; i++) {
        const receipt = new Receipt({
            userId: DEMO_USER_ID,
            originalFilename: `Receipt_${i + 1}.jpg`,
            filename: `demo_receipt_${i + 1}.jpg`,
            filepath: DEMO_RECEIPT_URLS[i % DEMO_RECEIPT_URLS.length],
            mimetype: 'image/jpeg',
            size: Math.floor(Math.random() * 500000) + 100000, // Random size between 100KB-600KB
            status: 'completed',
            ocrText: `Demo receipt text for receipt ${i + 1}`,
            extractedData: {
                merchant: `Demo Store ${i + 1}`,
                amount: 0, // Will be updated with transaction amount
                date: getRandomDate(),
                category: '',
                items: [] // Will be populated later
            }
        });

        receipts.push(receipt);
    }

    return await Receipt.insertMany(receipts);
};// Create sample transactions
const createSampleTransactions = async (receipts) => {
    const transactions = [];

    // Create 50 sample transactions
    for (let i = 0; i < 50; i++) {
        const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
        const type = category === 'Income' ? 'income' : 'expense';
        const amount = getRandomAmount(category, type);
        const descriptions = TRANSACTION_DESCRIPTIONS[category];
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];
        const date = getRandomDate();

        // Some transactions will have receipts (about 30%)
        const hasReceipt = Math.random() < 0.3 && type === 'expense';
        let receiptId = null;
        let metadata = {};

        if (hasReceipt && receipts.length > 0) {
            const receipt = receipts[Math.floor(Math.random() * receipts.length)];
            receiptId = receipt._id;

            // Generate receipt items
            const items = generateReceiptItems(category, amount);

            metadata = {
                merchant: receipt.extractedData.merchant,
                total: amount,
                items: items
            };

            // Update receipt with this transaction's data
            await Receipt.findByIdAndUpdate(receiptId, {
                'extractedData.amount': amount,
                'extractedData.items': items,
                'extractedData.date': date,
                'extractedData.category': category
            });
        }

        const transaction = new Transaction({
            userId: DEMO_USER_ID,
            description: description,
            amount: amount,
            category: category,
            type: type,
            date: date,
            receiptId: receiptId,
            source: hasReceipt ? 'receipt' : 'manual',
            metadata: metadata
        });

        transactions.push(transaction);
    }

    return await Transaction.insertMany(transactions);
};

// Verify user exists
const verifyUser = async () => {
    try {
        const user = await User.findById(DEMO_USER_ID);
        if (!user) {
            console.log('⚠️  User not found. Creating demo user...');
            const demoUser = new User({
                _id: DEMO_USER_ID,
                name: 'Demo User',
                email: 'demo@example.com',
                password: 'hashedpassword123' // This should be properly hashed in real scenario
            });
            await demoUser.save();
            console.log('✅ Demo user created');
        } else {
            console.log('✅ User found:', user.name || user.email);
        }
    } catch (error) {
        console.error('❌ Error verifying user:', error);
    }
};

// Main seeding function
const seedDatabase = async () => {
    try {
        await connectDB();

        // Verify user exists
        await verifyUser();

        // Clear existing data for this user
        console.log('🧹 Cleaning existing data...');
        await Transaction.deleteMany({ userId: DEMO_USER_ID });
        await Receipt.deleteMany({ userId: DEMO_USER_ID });

        // Create sample data
        console.log('📝 Creating sample receipts...');
        const receipts = await createSampleReceipts();
        console.log(`✅ Created ${receipts.length} sample receipts`);

        console.log('💰 Creating sample transactions...');
        const transactions = await createSampleTransactions(receipts);
        console.log(`✅ Created ${transactions.length} sample transactions`);

        // Display summary
        const incomeTransactions = transactions.filter(t => t.type === 'income');
        const expenseTransactions = transactions.filter(t => t.type === 'expense');
        const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

        console.log('\n📊 Summary:');
        console.log(`💵 Total Income: ₹${totalIncome.toLocaleString('en-IN')}`);
        console.log(`💸 Total Expenses: ₹${totalExpenses.toLocaleString('en-IN')}`);
        console.log(`📈 Net: ₹${(totalIncome - totalExpenses).toLocaleString('en-IN')}`);
        console.log(`🧾 Transactions with receipts: ${transactions.filter(t => t.receiptId).length}`);

        console.log('\n🎉 Database seeded successfully!');
        console.log('🌐 You can now view the dashboard and analytics with demo data');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
};

// Run the seeding
seedDatabase();