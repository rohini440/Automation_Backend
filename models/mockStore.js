const bcrypt = require('bcryptjs');

// Pre-populated mock collections
const mockUsers = [];

const mockSuppliers = [
  {
    _id: 'sup_1',
    name: 'Silicon Display Labs',
    contactPerson: 'Mark Ruther',
    email: 'sales@silicondisplays.com',
    phone: '+1 (555) 012-3456',
    address: '404 Hardware Way, San Jose, CA',
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
  },
  {
    _id: 'sup_2',
    name: 'ErgoComfort Keyboards',
    contactPerson: 'Emma Stone',
    email: 'emma@ergocomfort.com',
    phone: '+1 (555) 019-8765',
    address: '12 Keyboard Ave, Austin, TX',
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
  },
  {
    _id: 'sup_3',
    name: 'AcousticTech Ltd',
    contactPerson: 'Neil Diamond',
    email: 'contracts@acoustictech.co.uk',
    phone: '+44 20 7946 0958',
    address: '88 Sound Wave Lane, London, UK',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  }
];

const mockProducts = [
  {
    _id: 'prod_1',
    name: 'Retina Studio Display Pro',
    sku: 'RSD-PRO-09',
    price: 1599.99,
    stock: 24,
    description: 'High-fidelity 27-inch 5K Retina display with nano-texture glass and spatial audio support.',
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  },
  {
    _id: 'prod_2',
    name: 'Mechanical Ergonomic Keyboard',
    sku: 'MEK-RGB-45',
    price: 189.50,
    stock: 142,
    description: 'Hot-swappable mechanical keyboard with premium silent tactile switches and vibrant per-key RGB.',
    imageUrl: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
  },
  {
    _id: 'prod_3',
    name: 'Noise Cancelling Headphones',
    sku: 'NCH-ANC-99',
    price: 349.00,
    stock: 65,
    description: 'Active noise-cancelling headphones featuring hybrid driver architecture and 40-hour battery life.',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
  },
  {
    _id: 'prod_4',
    name: 'Ultra-Wide Curved Monitor 34"',
    sku: 'UWM-34C-12',
    price: 699.99,
    stock: 18,
    description: 'Immersive curved monitor with 144Hz refresh rate, HDR400, and fully adjustable ergonomic stand.',
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
  },
  {
    _id: 'prod_5',
    name: 'Minimalist Walnut Desk Organizer',
    sku: 'WDO-MIN-02',
    price: 79.99,
    stock: 98,
    description: 'Handcrafted walnut wood organizer designed to hold keys, writing tools, phone, and standard stationery.',
    imageUrl: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  }
];

const mockInvoices = [
  {
    _id: 'inv_1',
    invoiceNumber: 'INV-2026-001',
    clientName: 'Alice Johnson',
    clientEmail: 'alice@example.com',
    items: [
      { name: 'Retina Studio Display Pro', quantity: 1, price: 1599.99 },
      { name: 'Mechanical Ergonomic Keyboard', quantity: 2, price: 189.50 }
    ],
    subtotal: 1978.99,
    tax: 158.32,
    total: 2137.31,
    status: 'paid',
    pdfUrl: null,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
  },
  {
    _id: 'inv_2',
    invoiceNumber: 'INV-2026-002',
    clientName: 'Modern Design Studios',
    clientEmail: 'billing@moderndesign.co',
    items: [
      { name: 'Ultra-Wide Curved Monitor 34"', quantity: 3, price: 699.99 }
    ],
    subtotal: 2099.97,
    tax: 167.99,
    total: 2267.96,
    status: 'paid',
    pdfUrl: null,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  },
  {
    _id: 'inv_3',
    invoiceNumber: 'INV-2026-003',
    clientName: 'David Lee',
    clientEmail: 'david@leeconsulting.com',
    items: [
      { name: 'Noise Cancelling Headphones', quantity: 1, price: 349.00 },
      { name: 'Minimalist Walnut Desk Organizer', quantity: 1, price: 79.99 }
    ],
    subtotal: 428.99,
    tax: 34.32,
    total: 463.31,
    status: 'pending',
    pdfUrl: null,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
  },
  {
    _id: 'inv_4',
    invoiceNumber: 'INV-2026-004',
    clientName: 'Techno Systems Inc.',
    clientEmail: 'procurement@technosys.net',
    items: [
      { name: 'Mechanical Ergonomic Keyboard', quantity: 10, price: 189.50 }
    ],
    subtotal: 1895.00,
    tax: 151.60,
    total: 2046.60,
    status: 'unpaid',
    pdfUrl: null,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  }
];

// Initialize a default mock user for easy testing out of the box
const initializeMockData = async () => {
  const hashedPassword = await bcrypt.hash('password123', 10);
  mockUsers.push({
    _id: 'user_1',
    name: 'Admin Developer',
    email: 'admin@inventory.com',
    password: hashedPassword,
    createdAt: new Date(),
    setupCompleted: true
  });
  console.log('\x1b[35m%s\x1b[0m', '🛡️  Mock Database initialized with default user: admin@inventory.com (password: password123)');
};

initializeMockData();

module.exports = {
  mockUsers,
  mockSuppliers,
  mockProducts,
  mockInvoices
};
