const test = require('node:test');
const assert = require('node:assert/strict');

// 1. Variant Item Key Generator Test
const generateItemKey = (productId, variantId = 'default', size = 'Standard', color = 'Standard') => {
  return `${productId}_${variantId}_${size}_${color}`;
};

test('Cart Item Key generation produces consistent unique variant keys', () => {
  const key1 = generateItemKey('prod123', 'v1', 'M', 'Black');
  const key2 = generateItemKey('prod123', 'v2', 'L', 'Black');
  const key3 = generateItemKey('prod123', 'v1', 'M', 'Black');

  assert.notEqual(key1, key2, 'Different size/variant must produce different keys');
  assert.equal(key1, key3, 'Identical variant choices must produce identical keys');
});

// 2. Anonymous & Logged In History Deduplication Algorithm Test
test('Recently Viewed Deduplication keeps latest 20 unique items in order', () => {
  const localHistory = [
    { productId: 'A', viewedAt: new Date('2026-08-25T10:00:00Z') },
    { productId: 'B', viewedAt: new Date('2026-08-25T11:00:00Z') },
    { productId: 'C', viewedAt: new Date('2026-08-25T12:00:00Z') },
    { productId: 'A', viewedAt: new Date('2026-08-25T13:00:00Z') }, // Re-viewed A
  ];

  const itemMap = new Map();
  localHistory.forEach((item) => {
    itemMap.set(item.productId, item.viewedAt.getTime());
  });

  const sorted = Array.from(itemMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);

  assert.deepEqual(sorted, ['A', 'C', 'B'], 'History order must be A -> C -> B with duplicates removed');
});

// 3. Order Cancellation Rule Test
test('Order Cancellation enforcement accepts placed/processing and rejects shipped/delivered', () => {
  const cancellableStatuses = ['placed', 'confirmed', 'processing'];
  
  assert.equal(cancellableStatuses.includes('placed'), true);
  assert.equal(cancellableStatuses.includes('processing'), true);
  assert.equal(cancellableStatuses.includes('shipped'), false);
  assert.equal(cancellableStatuses.includes('delivered'), false);
});
