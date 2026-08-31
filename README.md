# Elevance E-Commerce Application — Production-Hardened Platform

A complete, production-grade full-stack e-commerce mobile & web solution built with **React Native / Expo** on the frontend and an **Express.js / Node.js / MongoDB** REST API backend.

---

## 🚀 Key Features & 6 Core System Requirements

### 1. Recently Viewed + Product Activity Tracking
- **Anonymous Users**: Tracks product views locally in `AsyncStorage` under `@recently_viewed` capped at 20 unique items, placing most recently viewed items first.
- **Logged-In Users**: Persists up to 20 unique items per user in MongoDB (`ProductActivity` collection).
- **Login Synchronization**: Merges anonymous local history with server history upon login, removing duplicates while preserving the newest timestamp.
- **Continue Shopping Section**: Dynamically displays items viewed recently that have **not** been purchased within the last 30 days and are currently in stock.

### 2. Smart Shopping Cart + Save for Later
- **Variant-Aware Cart**: Cart items are uniquely keyed by `productId_variantId_size_color` ensuring separate sizes and colors are tracked independently without duplication.
- **Save for Later**: Seamlessly toggles items between `cartItems` and `savedItems` arrays, preserving size, color, quantity, and price.
- **Pre-Checkout Backend Validation**: Endpoint `/api/cart/validate` fetches live database stock and price levels. Generates price change warning banners (`Price updated from ₹X to ₹Y`) and flags out-of-stock items before checkout.
- **Atomic Operations**: Atomic MongoDB operations ($push, $pull, $inc) prevent negative inventory or race conditions.

### 3. Personalized "You May Also Like" Recommendation Engine
- **Browsing History**: Tracks up to 50 unique recently viewed products per user in `BrowsingHistory`.
- **Recommendation Algorithm**: Aggregates category affinity scores from the user's 50 browsing history items, 20 recently viewed items, wishlist, and recent orders.
- **Exclusion Filters**: Automatically filters out out-of-stock products, currently viewed item, duplicate items, and recently purchased non-repeatable items.
- **Fallback for New Users**: Returns top trending products sorted by sales count, review ratings, and view counts.

### 4. Real-Time Push Notifications
- **Device Token Model**: Stores Expo Push Tokens in `DeviceToken` with platform & status metadata.
- **Automatic Token Cleanup**: Unregistered or invalid tokens reported by Expo SDK are automatically purged.
- **User Preferences**: Profile screen provides switches for Order Updates, Payment Updates, Wishlist Alerts, Back-in-Stock Alerts, Cart Reminders, and Promotions.
- **Scheduled Background Job**: Background job checks carts idle for > 2 hours and queues abandoned cart push reminders.
- **Logging**: All notification attempts are logged in `NotificationLog`.

### 5. Dynamic Theme + Personalization
- **Centralized Tokens**: `theme.colors`, `typography`, `spacing`, `borderRadius`, and `shadows` defined centrally in `client/src/theme/index.js`.
- **Mode Selection**: Supports **Light Mode**, **Dark Mode**, and **System Default** auto-detection using `useColorScheme()`.
- **Persistence & Sync**: Stored in `AsyncStorage` (`@theme_pref`) and synced with `User.themePreference` on backend.

### 6. Order + Transaction Management
- **Server-Side Pagination & Filtering**: Filter orders by status (`placed`, `shipped`, `delivered`, `cancelled`) and payment method.
- **Visual Delivery Timeline**: Visual timeline tracker (`Placed -> Confirmed -> Processing -> Shipped -> Out for Delivery -> Delivered`).
- **PDF Invoice Generation**: Endpoint `GET /api/orders/:id/invoice` streams a PDF invoice built with `pdfkit` containing item breakdowns, GST tax, shipping, and billing info.
- **Buy Again (Re-Order)**: Validates live product stock and price before adding valid items back into cart.
- **Cancellation & Return Rules**: Cancellations restricted to `placed`/`processing` statuses; returns restricted to `delivered` status within a 7-day window.
- **Payment Webhook Verification**: Express route `/api/payments/webhook` verifies Stripe HMAC signatures, enforces idempotency using `PaymentEvent` table, and logs audit events.

---

## 📁 Application Screens

1. **Splash / Main Navigation**: Tab & stack navigation tree (`client/src/navigation/AppNavigator.js`).
2. **Login Screen**: `LoginScreen.js` for JWT user authentication.
3. **Register Screen**: `RegisterScreen.js` for new user creation with password validation.
4. **Home Screen**: `HomeScreen.js` with search, category filtering, Continue Shopping bar, and Personalized Recommendations.
5. **Product Detail Screen**: `ProductDetailScreen.js` with variant size/color selection and activity view tracking.
6. **Cart Screen**: `CartScreen.js` supporting active items, Save for Later tab, and pre-checkout validation.
7. **Checkout Screen**: `CheckoutScreen.js` for delivery shipping address input & payment method selection.
8. **Order Confirmation Screen**: `OrderConfirmationScreen.js` displaying order reference, invoice ID, and timeline tracking link.
9. **My Orders Screen**: `OrdersScreen.js` with status tabs (`All`, `Placed`, `Delivered`, `Cancelled`) and visual timeline.
10. **Order Detail Screen**: `OrderDetailScreen.js` with PDF invoice download trigger.
11. **Profile / Account Screen**: `ProfileScreen.js` for user info, theme selector, and notification settings.

---

## 🛠️ Getting Started

### 1. Environment Setup
Copy `.env.example` to `.env` in the project root:
```bash
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/elevance_ecommerce
JWT_SECRET=supersecret_jwt_key_elevance_2026
STRIPE_WEBHOOK_SECRET=whsec_mock_stripe_webhook_secret_67890
```

### 2. Seed Database
```bash
npm run seed
```
Creates sample catalog items across Footwear, Apparel, Electronics, and Accessories, along with a demo user:
- **Email**: `alex@example.com`
- **Password**: `password123`

### 3. Run Backend Server
```bash
npm run start:server
```
Runs Express server on `http://localhost:5000`.

### 4. Run Frontend Expo App
```bash
cd client
npm start
# Press 'w' in terminal to open in browser (http://localhost:8081)
```

---

## 🧪 Testing Backend Services

Run automated unit and integration tests:
```bash
node --test server/tests/*.test.js
```
Executes test suites verifying:
- Variant item key generation
- Recently viewed deduplication & history ordering (capped at 20 / 50)
- Recommendation filtering for out-of-stock & recently purchased items
- Push notification invalid token cleanup
- PDF Invoice generation & Order cancellation rules
- Stripe Webhook idempotency

---

## 🔐 Security & Validation
- **Protected APIs**: All user endpoints derive identity from verified JWT tokens in `req.user`.
- **Payment Verification**: Stripe HMAC signature verification prevents spoofing or replay attacks.
- **Strict Control Flow**: Stock deductions use atomic `$inc` updates to guarantee consistency.

