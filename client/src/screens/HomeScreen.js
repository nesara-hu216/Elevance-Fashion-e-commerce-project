import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import ProductCard from '../components/ProductCard';
import ProductCarousel from '../components/ProductCarousel';
import CategoryTabs from '../components/CategoryTabs';
import SearchBar from '../components/SearchBar';
import Header from '../components/Header';
import api from '../services/api';

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const { recentlyViewed } = useRecentlyViewed();

  const [products, setProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [bestsellerProducts, setBestsellerProducts] = useState([]);
  const [womenFashion, setWomenFashion] = useState([]);
  const [menFashion, setMenFashion] = useState([]);
  const [footwearProducts, setFootwearProducts] = useState([]);
  const [jewelleryProducts, setJewelleryProducts] = useState([]);
  const [accessoriesProducts, setAccessoriesProducts] = useState([]);
  const [beautyProducts, setBeautyProducts] = useState([]);
  const [sportsProducts, setSportsProducts] = useState([]);

  const [recommendations, setRecommendations] = useState([]);
  const [continueShopping, setContinueShopping] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const categories = [
    'All',
    'Women',
    'Men',
    'Footwear',
    'Jewellery',
    'Accessories',
    'Beauty',
    'Kids',
    'Sports & Activewear',
  ];

  const subcategoryMap = {
    Women: ['All', 'Dresses', 'Tops', 'T-Shirts', 'Shirts', 'Jeans', 'Trousers', 'Skirts', 'Shorts', 'Kurtis', 'Sarees', 'Anarkali', 'Lehengas', 'Jumpsuits', 'Sweaters'],
    Men: ['All', 'T-Shirts', 'Polo T-Shirts', 'Casual Shirts', 'Formal Shirts', 'Jeans', 'Chinos', 'Cargo Pants', 'Shorts', 'Joggers', 'Hoodies', 'Jackets', 'Kurtas', 'Blazers'],
    Footwear: ['All', 'Heels', 'Flats', 'Sandals', 'Wedges', 'Boots', 'Sneakers', 'Running Shoes', 'Formal Shoes', 'Loafers', 'Slippers'],
    Jewellery: ['All', 'Earrings', 'Studs', 'Hoops', 'Jhumkas', 'Chandbali', 'Necklaces', 'Chains', 'Pendants', 'Bracelets', 'Bangles', 'Rings', 'Anklets'],
    Accessories: ['All', 'Handbags', 'Shoulder Bags', 'Sling Bags', 'Tote Bags', 'Backpacks', 'Wallets', 'Belts', 'Sunglasses', 'Watches', 'Caps', 'Scarves'],
    Beauty: ['All', 'Lipsticks', 'Lip Gloss', 'Foundation', 'Concealer', 'Compact', 'Blush', 'Mascara', 'Eyeliner', 'Face Wash', 'Moisturizer', 'Sunscreen', 'Serum', 'Shampoo', 'Perfume'],
    Kids: ['All', 'Girls Dresses', 'Girls Tops', 'Girls Skirts', 'Boys T-Shirts', 'Boys Shirts', 'Boys Jeans', 'Boys Shorts', 'Boys Ethnic Wear', 'Kids Shoes'],
    'Sports & Activewear': ['All', 'Sports T-Shirts', 'Track Pants', 'Athletic Shorts', 'Leggings', 'Sports Bras', 'Running Shoes', 'Training Shoes', 'Gym Bags', 'Sports Caps'],
  };

  useEffect(() => {
    fetchHomeData(1);
  }, [selectedCategory, selectedSubcategory]);

  const fetchHomeData = async (pageNum = 1) => {
    try {
      setLoading(true);
      let catParam = '';
      if (selectedCategory !== 'All') {
        catParam += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      if (selectedSubcategory !== 'All') {
        catParam += `&subcategory=${encodeURIComponent(selectedSubcategory)}`;
      }
      if (searchQuery && searchQuery.trim()) {
        catParam += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const requests = [
        api.get(`/products?page=${pageNum}&limit=24${catParam}`).catch((err) => {
          console.error('[HomeScreen Error]', err);
          return { data: { products: [], total: 0, pages: 1 } };
        }),
        api.get('/recommendations').catch(() => ({ data: { recommendations: [] } })),
        api.get('/users/me/continue-shopping').catch(() => ({ data: { products: [] } })),
      ];

      if (selectedCategory === 'All' && selectedSubcategory === 'All' && pageNum === 1) {
        requests.push(
          api.get('/products?trending=true&limit=8').catch(() => ({ data: { products: [] } })),
          api.get('/products?sort=popularity&limit=8').catch(() => ({ data: { products: [] } })),
          api.get('/products?category=Women&limit=8').catch(() => ({ data: { products: [] } })),
          api.get('/products?category=Men&limit=8').catch(() => ({ data: { products: [] } })),
          api.get('/products?category=Footwear&limit=8').catch(() => ({ data: { products: [] } })),
          api.get('/products?category=Jewellery&limit=8').catch(() => ({ data: { products: [] } })),
          api.get('/products?category=Accessories&limit=8').catch(() => ({ data: { products: [] } })),
          api.get('/products?category=Beauty&limit=8').catch(() => ({ data: { products: [] } })),
          api.get(`/products?category=${encodeURIComponent('Sports & Activewear')}&limit=8`).catch(() => ({ data: { products: [] } }))
        );
      }

      const results = await Promise.all(requests);
      const [prodRes, recRes, csRes] = results;

      if (prodRes.data && prodRes.data.products) {
        setProducts(prodRes.data.products);
        setTotalPages(prodRes.data.pages || 1);
        setTotalItems(prodRes.data.total || prodRes.data.products.length);
        setPage(pageNum);
      }
      if (recRes.data && recRes.data.recommendations) {
        setRecommendations(recRes.data.recommendations);
      }
      if (csRes.data && csRes.data.products) {
        setContinueShopping(csRes.data.products);
      }

      if (selectedCategory === 'All' && selectedSubcategory === 'All' && pageNum === 1 && results.length > 3) {
        setTrendingProducts(results[3].data?.products || []);
        setBestsellerProducts(results[4].data?.products || []);
        setWomenFashion(results[5].data?.products || []);
        setMenFashion(results[6].data?.products || []);
        setFootwearProducts(results[7].data?.products || []);
        setJewelleryProducts(results[8].data?.products || []);
        setAccessoriesProducts(results[9].data?.products || []);
        setBeautyProducts(results[10].data?.products || []);
        setSportsProducts(results[11].data?.products || []);
      }
    } catch (e) {
      console.error('[Home] Error fetching data', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(query) ||
      p.category?.toLowerCase().includes(query) ||
      p.subcategory?.toLowerCase().includes(query) ||
      p.brand?.toLowerCase().includes(query) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(query)))
    );
  });

  const availableSubcategories = subcategoryMap[selectedCategory] || [];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Elevance Fashion" navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
          }}
          onSubmit={() => fetchHomeData(1)}
          placeholder="Search 2,400+ dresses, shoes, jewellery, watches..."
        />

        {/* Major Department Category Pills */}
        <CategoryTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setSelectedSubcategory('All');
            setPage(1);
          }}
        />

        {/* Subcategory Pills Row */}
        {selectedCategory !== 'All' && availableSubcategories.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subCatBar}>
            {availableSubcategories.map((sub) => {
              const isSelected = selectedSubcategory === sub;
              return (
                <TouchableOpacity
                  key={sub}
                  activeOpacity={0.8}
                  style={[
                    styles.subCatPill,
                    {
                      backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                  onPress={() => {
                    setSelectedSubcategory(sub);
                    setPage(1);
                  }}
                >
                  <Text
                    style={[
                      styles.subCatText,
                      { color: isSelected ? '#FFFFFF' : theme.colors.text },
                    ]}
                  >
                    {sub === 'All' ? `All ${selectedCategory}` : sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Hero Fashion Banner */}
        <View style={[styles.heroBanner, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.heroTextCol}>
            <Text style={styles.heroSub}>2,400+ PRODUCTS • STRICT FASHION CATEGORIZATION</Text>
            <Text style={styles.heroTitle}>FLAT 70% OFF</Text>
            <Text style={styles.heroDesc}>Top Brands • Free Express Shipping • Easy Returns</Text>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.heroBtn, { backgroundColor: '#FFFFFF' }]}
              onPress={() => {
                setSelectedCategory('Women');
                setSelectedSubcategory('Dresses');
              }}
            >
              <Text style={[styles.heroBtnText, { color: theme.colors.primary }]}>EXPLORE DRESSES CATALOG →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <>
            {/* Trending Now Carousel */}
            {trendingProducts.length > 0 && selectedCategory === 'All' && (
              <ProductCarousel
                title="🔥 Trending Now"
                subtitle="Most popular picks this week"
                products={trendingProducts}
                onSelectProduct={(p) => navigation.navigate('ProductDetail', { productId: p._id || p.id || p.slug })}
              />
            )}

            {/* Women's Fashion Highlights */}
            {womenFashion.length > 0 && selectedCategory === 'All' && (
              <ProductCarousel
                title="👗 Women's Dresses"
                subtitle="Maxi, Midi, Mini & Bodycon Dresses"
                products={womenFashion}
                onSelectProduct={(p) => navigation.navigate('ProductDetail', { productId: p._id || p.id || p.slug })}
                onViewAll={() => {
                  setSelectedCategory('Women');
                  setSelectedSubcategory('Dresses');
                }}
              />
            )}

            {/* Men's Fashion Highlights */}
            {menFashion.length > 0 && selectedCategory === 'All' && (
              <ProductCarousel
                title="👔 Men's Shirts"
                subtitle="Casual Shirts, Polos & Formal Shirts"
                products={menFashion}
                onSelectProduct={(p) => navigation.navigate('ProductDetail', { productId: p._id || p.id || p.slug || 'prod_101' })}
                onViewAll={() => {
                  setSelectedCategory('Men');
                  setSelectedSubcategory('Casual Shirts');
                }}
              />
            )}

            {/* Footwear Section */}
            {footwearProducts.length > 0 && selectedCategory === 'All' && (
              <ProductCarousel
                title="👟 Sneakers & Footwear"
                subtitle="Running Shoes, Casual Sneakers & Trainers"
                products={footwearProducts}
                onSelectProduct={(p) => navigation.navigate('ProductDetail', { productId: p._id || p.id || p.slug || 'prod_101' })}
                onViewAll={() => {
                  setSelectedCategory('Footwear');
                  setSelectedSubcategory('Sneakers');
                }}
              />
            )}

            {/* Jewellery Section */}
            {jewelleryProducts.length > 0 && selectedCategory === 'All' && (
              <ProductCarousel
                title="💎 Earrings & Jewellery"
                subtitle="Studs, Hoops, Jhumkas & Chandbali"
                products={jewelleryProducts}
                onSelectProduct={(p) => navigation.navigate('ProductDetail', { productId: p._id || p.id || p.slug || 'prod_101' })}
                onViewAll={() => {
                  setSelectedCategory('Jewellery');
                  setSelectedSubcategory('Earrings');
                }}
              />
            )}

            {/* Accessories Section */}
            {accessoriesProducts.length > 0 && selectedCategory === 'All' && (
              <ProductCarousel
                title="👜 Handbags & Bags"
                subtitle="Shoulder Bags, Tote Bags & Sling Bags"
                products={accessoriesProducts}
                onSelectProduct={(p) => navigation.navigate('ProductDetail', { productId: p._id || p.id || p.slug })}
                onViewAll={() => {
                  setSelectedCategory('Accessories');
                  setSelectedSubcategory('Handbags');
                }}
              />
            )}

            {/* Beauty & Skincare */}
            {beautyProducts.length > 0 && selectedCategory === 'All' && (
              <ProductCarousel
                title="💄 Lipsticks & Beauty"
                subtitle="Matte Lipsticks, Gloss & Foundations"
                products={beautyProducts}
                onSelectProduct={(p) => navigation.navigate('ProductDetail', { productId: p._id || p.id || p.slug })}
                onViewAll={() => {
                  setSelectedCategory('Beauty');
                  setSelectedSubcategory('Lipsticks');
                }}
              />
            )}

            {/* Sports & Activewear */}
            {sportsProducts.length > 0 && selectedCategory === 'All' && (
              <ProductCarousel
                title="🏃 Sports & Activewear"
                subtitle="Track Pants, Sports Bras & Gym Gear"
                products={sportsProducts}
                onSelectProduct={(p) => navigation.navigate('ProductDetail', { productId: p._id || p.id || p.slug })}
                onViewAll={() => {
                  setSelectedCategory('Sports & Activewear');
                  setSelectedSubcategory('All');
                }}
              />
            )}

            {/* Special Promotional Offers Banner */}
            <View style={[styles.offerCard, { backgroundColor: theme.colors.successLight }]}>
              <Text style={[styles.offerTag, { color: theme.colors.success }]}>INSTANT DISCOUNT</Text>
              <Text style={[styles.offerTitle, { color: theme.colors.text }]}>Extra ₹500 Off on 1st Order</Text>
              <Text style={[styles.offerCode, { color: theme.colors.subtext }]}>Use Code: ELEVANCE500</Text>
            </View>

            {/* You May Also Like (Personalized Recommendations) */}
            {recommendations.length > 0 && (
              <ProductCarousel
                title="✨ Recommended For You"
                subtitle="Handpicked based on your taste"
                products={recommendations}
                onSelectProduct={(p) => navigation.navigate('ProductDetail', { productId: p._id || p.id || p.slug })}
              />
            )}

            {/* Continue Shopping Section */}
            {continueShopping.length > 0 && (
              <ProductCarousel
                title="🛍️ Continue Shopping"
                subtitle="Pick up right where you left off"
                products={continueShopping}
                onSelectProduct={(p) => navigation.navigate('ProductDetail', { productId: p._id || p.id || p.slug })}
              />
            )}

            {/* Recently Viewed Carousel */}
            {recentlyViewed.length > 0 && (
              <ProductCarousel
                title="👀 Recently Viewed"
                subtitle="Your recently inspected items"
                products={recentlyViewed}
                onSelectProduct={(p) => navigation.navigate('ProductDetail', { productId: p._id || p.id || p.slug })}
              />
            )}

            {/* Bestsellers Section */}
            {bestsellerProducts.length > 0 && selectedCategory === 'All' && (
              <ProductCarousel
                title="🏆 Bestsellers"
                subtitle="Top rated customer favorites"
                products={bestsellerProducts}
                onSelectProduct={(p) => navigation.navigate('ProductDetail', { productId: p._id || p.id || p.slug })}
              />
            )}

            {/* Main Product Grid & Pagination */}
            <View style={styles.gridSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  {selectedCategory === 'All'
                    ? 'Explore All Products'
                    : selectedSubcategory === 'All'
                    ? `${selectedCategory} Collection`
                    : `${selectedCategory} → ${selectedSubcategory}`}
                </Text>
                <Text style={[styles.productCount, { color: theme.colors.subtext }]}>
                  Showing {filteredProducts.length} of {totalItems} Items
                </Text>
              </View>

              <View style={styles.gridContainer}>
                {filteredProducts.map((item) => (
                  <ProductCard
                    key={item._id || item.id}
                    product={item}
                    onPress={() => navigation.navigate('ProductDetail', { productId: item._id || item.id || item.slug || 'prod_101' })}
                  />
                ))}
              </View>

              {/* Pagination Row */}
              {totalPages > 1 && (
                <View style={styles.paginationRow}>
                  <TouchableOpacity
                    disabled={page <= 1}
                    style={[
                      styles.pageBtn,
                      { backgroundColor: page <= 1 ? theme.colors.border : theme.colors.primary },
                    ]}
                    onPress={() => fetchHomeData(page - 1)}
                  >
                    <Text style={styles.pageBtnText}>← Previous</Text>
                  </TouchableOpacity>

                  <Text style={[styles.pageInfoText, { color: theme.colors.text }]}>
                    Page {page} of {totalPages}
                  </Text>

                  <TouchableOpacity
                    disabled={page >= totalPages}
                    style={[
                      styles.pageBtn,
                      { backgroundColor: page >= totalPages ? theme.colors.border : theme.colors.primary },
                    ]}
                    onPress={() => fetchHomeData(page + 1)}
                  >
                    <Text style={styles.pageBtnText}>Next →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  subCatBar: {
    paddingHorizontal: 16,
    marginVertical: 6,
    flexDirection: 'row',
  },
  subCatPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  subCatText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroBanner: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 14,
    padding: 20,
    elevation: 4,
  },
  heroTextCol: {
    alignItems: 'flex-start',
  },
  heroSub: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 4,
  },
  heroDesc: {
    color: '#F0F0F0',
    fontSize: 12,
    marginBottom: 14,
  },
  heroBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  heroBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  loadingContainer: { padding: 40, alignItems: 'center' },
  offerCard: {
    marginHorizontal: 16,
    marginVertical: 14,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#038D63',
  },
  offerTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginVertical: 2,
  },
  offerCode: {
    fontSize: 12,
    fontWeight: '600',
  },
  gridSection: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  productCount: { fontSize: 12 },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 12,
  },
  pageBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pageBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  pageInfoText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
