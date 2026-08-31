const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  variantId: { type: String, required: true },
  size: { type: String, required: true },
  color: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  price: { type: Number, required: true },
  sku: { type: String },
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      index: true,
    },
    subcategory: {
      type: String,
      default: 'General',
      index: true,
    },
    gender: {
      type: String,
      enum: ['Women', 'Men', 'Kids', 'Unisex'],
      default: 'Unisex',
      index: true,
    },
    brand: {
      type: String,
      default: 'Elevance',
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
      index: true,
    },
    originalPrice: {
      type: Number,
    },
    discountPercentage: {
      type: Number,
      default: 0,
      index: true,
    },
    discountPrice: {
      type: Number,
      default: null,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    images: [{ type: String }],
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
      index: true,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    salesCount: {
      type: Number,
      default: 0,
      index: true,
    },
    popularity: {
      type: Number,
      default: 0,
      index: true,
    },
    isTrending: {
      type: Boolean,
      default: false,
      index: true,
    },
    material: {
      type: String,
      default: 'Cotton',
    },
    tags: [{ type: String }],
    variants: [variantSchema],
  },
  { timestamps: true }
);

productSchema.index({ category: 1, subcategory: 1, gender: 1 });
productSchema.index({ category: 1, isTrending: -1, rating: -1 });
productSchema.index({ brand: 1, price: 1 });
productSchema.index({ salesCount: -1, popularity: -1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
