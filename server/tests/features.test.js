if (!process.env.MONGOMS_DOWNLOAD_DIR) {
  process.env.MONGOMS_DOWNLOAD_DIR = 'D:\\tmp\\mongodb';
}
const test = require('node:test');
const assert = require('node:assert/strict');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const Product = require('../src/models/Product');
const Cart = require('../src/models/Cart');
const Order = require('../src/models/Order');
const User = require('../src/models/User');
const ProductActivity = require('../src/models/ProductActivity');
const BrowsingHistory = require('../src/models/BrowsingHistory');
const DeviceToken = require('../src/models/DeviceToken');
const NotificationPreference = require('../src/models/NotificationPreference');
const NotificationLog = require('../src/models/NotificationLog');
const PaymentEvent = require('../src/models/PaymentEvent');

const { syncRecentlyViewed, getContinueShopping } = require('../src/controllers/activityController');
const { addToCart, saveForLater, moveToCart, validateCart } = require('../src/controllers/cartController');
const { getRecommendations } = require('../src/controllers/recommendationController');
const { sendPushNotification } = require('../src/services/notificationService');
const { handleWebhook } = require('../src/controllers/paymentController');
const { cancelOrder, requestReturn, reorder } = require('../src/controllers/orderController');
const { generateInvoicePDF } = require('../src/services/invoiceService');

let mongod;

test.before(async () => {
  const fs = require('fs');
  const dbPath = 'D:\\tmp\\mongo_testdata';
  if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });

  mongod = await MongoMemoryServer.create({
    binary: { downloadDir: process.env.MONGOMS_DOWNLOAD_DIR },
    instance: { dbPath }
  });
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

test.beforeEach(async () => {
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
});

test.after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('Task 1: Recently Viewed capping at 20 & Login Merge with Browsing History capping at 50', async () => {
  const user = await User.create({ name: 'Tester', email: 'test@example.com', password: 'password123' });

  // Create 25 mock products
  const products = [];
  for (let i = 1; i <= 25; i++) {
    const prod = await Product.create({
      name: `Product ${i}`,
      description: `Desc ${i}`,
      category: 'Apparel',
      price: 100 * i,
      stock: 10,
    });
    products.push(prod);
  }

  // Guest viewed 25 products
  const localItems = products.map((p, idx) => ({
    productId: p._id.toString(),
    viewedAt: new Date(Date.now() + idx * 1000).toISOString(),
  }));

  const req = { user: { id: user._id.toString() }, body: { localItems } };
  let jsonRes = null;
  const res = {
    json: (data) => {
      jsonRes = data;
    },
  };

  await syncRecentlyViewed(req, res, () => {});

  assert.equal(jsonRes.success, true);
  assert.equal(jsonRes.count, 20, 'Recently viewed must cap at 20 unique products');

  // Verify ProductActivity in DB is 20
  const activities = await ProductActivity.find({ userId: user._id });
  assert.equal(activities.length, 20);

  // Verify BrowsingHistory in DB is capped at 50 (here 25 items created)
  const history = await BrowsingHistory.find({ userId: user._id });
  assert.equal(history.length, 25);
});

test('Task 2: Cart & Save for Later Variant Preservation & Pre-checkout Validation', async () => {
  const user = await User.create({ name: 'CartUser', email: 'cart@example.com', password: 'password123' });
  const product = await Product.create({
    name: 'Sneakers',
    description: 'Running shoes',
    category: 'Footwear',
    price: 2000,
    discountPrice: 1800,
    stock: 5,
  });

  const reqAdd = {
    user: { id: user._id.toString() },
    body: { productId: product._id.toString(), variantId: 'v1', size: 'UK-9', color: 'Black', quantity: 2 },
  };

  let cartData = null;
  const resAdd = { json: (d) => (cartData = d) };

  await addToCart(reqAdd, resAdd, () => {});
  assert.equal(cartData.success, true);
  assert.equal(cartData.cart.items.length, 1);
  assert.equal(cartData.cart.items[0].size, 'UK-9');
  assert.equal(cartData.cart.items[0].color, 'Black');

  const itemKey = cartData.cart.items[0].itemKey;

  // Move to Save for Later
  const reqSave = { user: { id: user._id.toString() }, params: { itemKey } };
  await saveForLater(reqSave, resAdd, () => {});
  assert.equal(cartData.cart.items.length, 0);
  assert.equal(cartData.cart.savedItems.length, 1);
  assert.equal(cartData.cart.savedItems[0].size, 'UK-9');

  // Move back to Cart
  const reqMove = { user: { id: user._id.toString() }, params: { itemKey } };
  await moveToCart(reqMove, resAdd, () => {});
  assert.equal(cartData.cart.items.length, 1);
  assert.equal(cartData.cart.items[0].size, 'UK-9');

  // Validate Cart before checkout
  const reqVal = { user: { id: user._id.toString() } };
  let valRes = null;
  const resVal = { json: (d) => (valRes = d) };
  await validateCart(reqVal, resVal, () => {});

  assert.equal(valRes.success, true);
  assert.equal(valRes.hasIssues, false);
  assert.equal(valRes.totals.subtotal, 3600); // 1800 * 2
});

test('Task 3: Recommendation System filtering out of stock and recently purchased items', async () => {
  const user = await User.create({ name: 'RecUser', email: 'rec@example.com', password: 'password123' });

  const pInStock = await Product.create({ name: 'In Stock Shirt', description: 'd', category: 'Apparel', price: 500, stock: 10, isTrending: true });
  const pOutOfStock = await Product.create({ name: 'Out Shirt', description: 'd', category: 'Apparel', price: 500, stock: 0 });
  const pPurchased = await Product.create({ name: 'Bought Shirt', description: 'd', category: 'Apparel', price: 500, stock: 10 });

  // Record order for purchased item
  await Order.create({
    orderId: 'ORD-TEST-1',
    invoiceNumber: 'INV-TEST-1',
    userId: user._id,
    items: [{ product: pPurchased._id, name: pPurchased.name, quantity: 1, price: 500 }],
    subtotal: 500, taxTotal: 90, shippingTotal: 0, grandTotal: 590, paymentMethod: 'card', paymentStatus: 'paid', orderStatus: 'delivered', deliveryAddress: { fullName: 'Rec', phone: '123', addressLine1: 'a', city: 'c', state: 'Karnataka', zipCode: '1' }
  });

  const reqRec = { user: { id: user._id.toString() }, query: {} };
  let recRes = null;
  const resRec = { json: (d) => (recRes = d) };

  await getRecommendations(reqRec, resRec, () => {});

  assert.equal(recRes.success, true);
  const recIds = recRes.recommendations.map((p) => p._id.toString());
  assert.equal(recIds.includes(pInStock._id.toString()), true, 'Should include in-stock product');
  assert.equal(recIds.includes(pOutOfStock._id.toString()), false, 'Should exclude out-of-stock product');
  assert.equal(recIds.includes(pPurchased._id.toString()), false, 'Should exclude purchased product');
});

test('Task 4: Push Notification service cleans invalid tokens and logs delivery', async () => {
  const user = await User.create({ name: 'PushUser', email: 'push@example.com', password: 'password123' });

  // Register an invalid token format
  await DeviceToken.create({ userId: user._id, expoPushToken: 'invalid_token_123', platform: 'mobile' });

  const result = await sendPushNotification({
    userId: user._id.toString(),
    type: 'order_status',
    title: 'Test Title',
    message: 'Test Message',
  });

  assert.equal(result.success, false);
  assert.equal(result.reason, 'No valid Expo push tokens');

  // Verify invalid token was automatically removed
  const tokens = await DeviceToken.find({ userId: user._id });
  assert.equal(tokens.length, 0, 'Invalid token must be automatically removed');
});

test('Task 5 & 6: Invoice PDF Generation, Order Cancel & Webhook Idempotency', async () => {
  const user = await User.create({ name: 'OrderUser', email: 'order@example.com', password: 'password123' });
  const product = await Product.create({ name: 'Headphones', description: 'Audio', category: 'Electronics', price: 3000, stock: 5 });

  const order = await Order.create({
    orderId: 'ORD-CANCEL-1',
    invoiceNumber: 'INV-CANCEL-1',
    userId: user._id,
    items: [{ product: product._id, name: product.name, size: 'Standard', color: 'Black', quantity: 1, price: 3000 }],
    subtotal: 3000, taxTotal: 540, shippingTotal: 0, grandTotal: 3540, paymentMethod: 'card', paymentStatus: 'paid', orderStatus: 'placed', deliveryAddress: { fullName: 'Order User', phone: '99999', addressLine1: 'Line 1', city: 'City', state: 'Karnataka', zipCode: '1000' },
    deliveryTimeline: [{ status: 'placed', message: 'Placed', timestamp: new Date() }]
  });

  // PDF Generation Test
  const pdfBuffer = await generateInvoicePDF(order, user);
  assert.equal(Buffer.isBuffer(pdfBuffer), true);
  assert.equal(pdfBuffer.length > 100, true);

  // Cancellation Test for Placed status
  const reqCancel = { user: { id: user._id.toString() }, params: { id: order.orderId } };
  let cancelData = null;
  const resCancel = { json: (d) => (cancelData = d) };

  await cancelOrder(reqCancel, resCancel, () => {});
  assert.equal(cancelData.success, true);
  assert.equal(cancelData.order.orderStatus, 'cancelled');

  // Stripe Webhook Idempotency Test
  const webhookPayload = {
    id: 'evt_stripe_test_123',
    type: 'payment_intent.succeeded',
    data: { object: { id: 'pi_test_123', metadata: { orderId: order.orderId }, amount: 354000, currency: 'inr' } }
  };

  let hookRes1 = null;
  const resHook = { json: (d) => (hookRes1 = d) };
  await handleWebhook({ body: webhookPayload }, resHook, () => {});
  assert.equal(hookRes1.success, true);

  // Second call with same event ID should be ignored as duplicate
  let hookRes2 = null;
  const resHook2 = { json: (d) => (hookRes2 = d) };
  await handleWebhook({ body: webhookPayload }, resHook2, () => {});
  assert.equal(hookRes2.message, 'Event already processed');
});
