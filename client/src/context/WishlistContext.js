import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const WishlistContext = createContext();

export const WishlistProvider = ({ children, user }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      syncAndFetchWishlist();
    } else {
      loadGuestWishlist();
    }
  }, [user]);

  const loadGuestWishlist = async () => {
    try {
      const stored = await AsyncStorage.getItem('@guest_wishlist');
      if (stored) {
        setWishlist(JSON.parse(stored));
      } else {
        setWishlist([]);
      }
    } catch (e) {
      console.error('[Wishlist] Error loading guest wishlist', e);
    }
  };

  const syncAndFetchWishlist = async () => {
    try {
      setLoading(true);
      const storedGuest = await AsyncStorage.getItem('@guest_wishlist');
      if (storedGuest) {
        const guestItems = JSON.parse(storedGuest);
        if (guestItems && guestItems.length > 0) {
          for (const item of guestItems) {
            const pId = item.product?._id || item.product?.id || item._id || item.id;
            if (pId) {
              await api.post(`/wishlist/${pId}`).catch(() => {});
            }
          }
          await AsyncStorage.removeItem('@guest_wishlist');
        }
      }
      const res = await api.get('/wishlist');
      if (res.data && res.data.wishlist) {
        setWishlist(res.data.wishlist);
      }
    } catch (e) {
      console.error('[Wishlist] Error fetching wishlist', e);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productOrId) => {
    let productId = productOrId;
    let productObj = null;

    if (typeof productOrId === 'object' && productOrId !== null) {
      productObj = productOrId;
      productId = productOrId._id || productOrId.id || productOrId.slug;
    }

    const pIdStr = productId ? productId.toString() : '';

    setWishlist((prev) => {
      const exists = prev.some((item) => {
        const id = item.product?._id || item.product?.id || item._id || item.id;
        return id?.toString() === pIdStr;
      });
      if (exists) return prev;

      const newItem = {
        _id: productId,
        product: productObj || {
          _id: productId,
          name: (productObj && (productObj.name || productObj.title)) ? (productObj.name || productObj.title) : 'StyleAura Fashion Item',
          price: 999,
          images: ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600'],
        },
        addedAt: new Date().toISOString(),
      };

      const updated = [...prev, newItem];
      AsyncStorage.setItem('@guest_wishlist', JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        const res = await api.post(`/wishlist/${productId}`);
        if (res.data && res.data.wishlist) {
          setWishlist(res.data.wishlist);
        }
      } catch (e) {
        console.error('[Wishlist] Error adding item to wishlist', e);
      }
    }

    return { success: true };
  };

  const removeFromWishlist = async (productOrId) => {
    let productId = productOrId;
    if (typeof productOrId === 'object' && productOrId !== null) {
      productId = productOrId._id || productOrId.id || productOrId.slug;
    }

    const pIdStr = productId ? productId.toString() : '';

    setWishlist((prev) => {
      const updated = prev.filter((item) => {
        const id = item.product?._id || item.product?.id || item._id || item.id;
        return id?.toString() !== pIdStr;
      });
      AsyncStorage.setItem('@guest_wishlist', JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        const res = await api.delete(`/wishlist/${productId}`);
        if (res.data && res.data.wishlist) {
          setWishlist(res.data.wishlist);
        }
      } catch (e) {
        console.error('[Wishlist] Error removing item from wishlist', e);
      }
    }

    return { success: true };
  };

  const isInWishlist = (productOrId) => {
    if (!productOrId) return false;
    let targetStr = productOrId;
    if (typeof productOrId === 'object' && productOrId !== null) {
      targetStr = productOrId._id || productOrId.id || productOrId.slug;
    }
    targetStr = targetStr ? targetStr.toString() : '';

    return wishlist.some((item) => {
      if (!item) return false;
      const pId = item.product?._id || item.product?.id || item._id || item.id;
      return pId?.toString() === targetStr;
    });
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        refreshWishlist: user ? syncAndFetchWishlist : loadGuestWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
