const { getUniqueSubcategoryImage, clearUsedImages } = require('./imagePools');
const { getPhotoIdPool, subcategoryPhotoPools } = require('./distinctFashionImages');

const brands = [
  'StyleAura',
  'UrbanMuse',
  'Trendora',
  'VibeWear',
  'ModaCraft',
  'LuxeLane',
  'StreetMode',
  'FashionNest',
  'Glamora',
  'TrendVerse',
  'EliteWalk',
  'DailyDrip',
  'UrbanEdge',
  'Eleganza',
  'ModeVista',
  'AuraCraft',
  'VogueVille',
  'SilkStitch',
];

const colorsList = [
  'Black',
  'White',
  'Navy Blue',
  'Crimson Red',
  'Emerald Green',
  'Mustard Yellow',
  'Blush Pink',
  'Lavender',
  'Beige Khaki',
  'Charcoal Grey',
  'Olive Green',
  'Gold',
  'Silver',
  'Rose Gold',
  'Tan Brown',
  'Floral Print',
  'Burgundy',
  'Teal',
];

const styleAdjectives = [
  'Classic',
  'Modern Fit',
  'Vibrant Printed',
  'Minimalist',
  'Premium Silk',
  'Vintage Wash',
  'Urban Street',
  'Chic Elegant',
  'Breathable Cotton',
  'Designer',
  'Handcrafted',
  'Luxury Satin',
  'Casual Soft',
  'Structured',
  'Bohemian',
  'Tailored Fit',
  'Slim Fit',
  'Oversized',
  'Embroidered',
  'Pleated',
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let masterId = 101;

function generateSectionProducts(category, gender, subcategories) {
  const products = [];

  for (const sub of subcategories) {
    const photoPool = getPhotoIdPool(category, sub);
    for (let i = 0; i < photoPool.length; i++) {
      const currentId = masterId++;
      const brand = brands[currentId % brands.length];
      const color = colorsList[(currentId * 3) % colorsList.length];
      const styleAdj = styleAdjectives[(currentId * 7) % styleAdjectives.length];

      // Genuinely unique product name combining Brand + Style + Subcategory + Color
      const name = `${brand} ${styleAdj} ${sub} (${color})`;
      const slug = `${category}-${sub}-${brand}-${color}-${currentId}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const originalPrice = getRandomInt(12, 120) * 100 - 1; // e.g. 1199 to 11999
      const discountPct = getRandomElement([20, 30, 40, 45, 50, 55, 60]);
      const price = Math.round(originalPrice * (1 - discountPct / 100));

      const rating = +(4.0 + Math.random() * 1.0).toFixed(1);
      const numReviews = getRandomInt(40, 650);
      const salesCount = getRandomInt(50, 1500);
      const stock = getRandomInt(15, 60);

      const sizes =
        category === 'Footwear'
          ? ['US 7', 'US 8', 'US 9', 'US 10']
          : category === 'Jewellery' || category === 'Accessories' || category === 'Beauty'
          ? ['Free Size']
          : ['XS', 'S', 'M', 'L', 'XL'];

      const images = getUniqueSubcategoryImage(category, sub, i);

      // Color and Size variations belong inside VARIANTS array of THIS product document
      const colorVariants = [color, getRandomElement(colorsList), getRandomElement(colorsList)];
      const uniqueColors = Array.from(new Set(colorVariants));

      const variants = [];
      let varIdx = 1;
      for (const col of uniqueColors) {
        for (const sz of sizes) {
          variants.push({
            variantId: `v${varIdx}`,
            size: sz,
            color: col,
            stock: Math.floor(stock / (uniqueColors.length * sizes.length)) || 5,
            price,
            sku: `SKU-${category.substring(0, 3).toUpperCase()}-${sub.substring(0, 3).toUpperCase()}-${currentId}-${varIdx}`,
          });
          varIdx++;
        }
      }

      products.push({
        name,
        slug,
        brand,
        category,
        subcategory: sub,
        gender,
        description: `High-quality ${name}. Crafted from premium materials designed for comfort, longevity, and modern fashion aesthetics.`,
        price,
        originalPrice,
        discountPercentage: discountPct,
        discountPrice: price < originalPrice ? price : null,
        stock,
        rating,
        numReviews,
        salesCount,
        popularity: salesCount * rating,
        isTrending: salesCount > 700 || rating >= 4.8,
        images,
        tags: [category, sub, brand, color, styleAdj],
        material: getRandomElement(['Cotton', 'Silk', 'Linen', 'Denim', 'Leather', 'Fleece', 'Polyester']),
        variants,
        createdAt: new Date(Date.now() - getRandomInt(0, 120) * 86400000).toISOString(),
      });
    }
  }

  return products;
}

function generate2400Products() {
  console.log('[Generator] Building genuinely distinct fashion catalog items across ALL 8 categories...');
  clearUsedImages();
  masterId = 101;

  const womenProds = generateSectionProducts(
    'Women',
    'Women',
    ['Dresses', 'Tops', 'T-Shirts', 'Shirts', 'Jeans', 'Trousers', 'Skirts', 'Shorts', 'Kurtis', 'Sarees', 'Anarkali', 'Lehengas', 'Jumpsuits', 'Sweaters']
  );

  const menProds = generateSectionProducts(
    'Men',
    'Men',
    ['T-Shirts', 'Polo T-Shirts', 'Casual Shirts', 'Formal Shirts', 'Jeans', 'Chinos', 'Cargo Pants', 'Shorts', 'Joggers', 'Hoodies', 'Jackets', 'Kurtas', 'Blazers']
  );

  const footwearProds = generateSectionProducts(
    'Footwear',
    'Unisex',
    ['Heels', 'Flats', 'Sandals', 'Wedges', 'Boots', 'Sneakers', 'Running Shoes', 'Formal Shoes', 'Loafers', 'Slippers']
  );

  const jewelleryProds = generateSectionProducts(
    'Jewellery',
    'Women',
    ['Earrings', 'Studs', 'Hoops', 'Jhumkas', 'Chandbali', 'Necklaces', 'Chains', 'Pendants', 'Bracelets', 'Bangles', 'Rings', 'Anklets']
  );

  const accessoriesProds = generateSectionProducts(
    'Accessories',
    'Unisex',
    ['Handbags', 'Shoulder Bags', 'Sling Bags', 'Tote Bags', 'Backpacks', 'Wallets', 'Belts', 'Sunglasses', 'Watches', 'Caps', 'Scarves']
  );

  const beautyProds = generateSectionProducts(
    'Beauty',
    'Women',
    ['Lipsticks', 'Lip Gloss', 'Foundation', 'Concealer', 'Compact', 'Blush', 'Mascara', 'Eyeliner', 'Face Wash', 'Moisturizer', 'Sunscreen', 'Serum', 'Shampoo', 'Perfume']
  );

  const kidsProds = generateSectionProducts(
    'Kids',
    'Kids',
    ['Girls Dresses', 'Girls Tops', 'Girls Skirts', 'Boys T-Shirts', 'Boys Shirts', 'Boys Jeans', 'Boys Shorts', 'Boys Ethnic Wear', 'Kids Shoes']
  );

  const sportsProds = generateSectionProducts(
    'Sports & Activewear',
    'Unisex',
    ['Sports T-Shirts', 'Track Pants', 'Athletic Shorts', 'Leggings', 'Sports Bras', 'Running Shoes', 'Training Shoes', 'Gym Bags', 'Sports Caps']
  );

  const allProducts = [
    ...womenProds,
    ...menProds,
    ...footwearProds,
    ...jewelleryProds,
    ...accessoriesProds,
    ...beautyProds,
    ...kidsProds,
    ...sportsProds,
  ];

  console.log(`[Generator] Created ${allProducts.length} total products across all 8 major departments.`);

  return {
    women: womenProds.length,
    men: menProds.length,
    footwear: footwearProds.length,
    jewellery: jewelleryProds.length,
    accessories: accessoriesProds.length,
    beauty: beautyProds.length,
    kids: kidsProds.length,
    sports: sportsProds.length,
    total: allProducts.length,
    allProducts,
  };
}

module.exports = {
  generate2400Products,
};
