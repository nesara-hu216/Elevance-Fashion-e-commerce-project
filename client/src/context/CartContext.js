import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children, user }) => {
  const [cart, setCart] = useState({ items: [], savedItems: [], subtotal: 0, totalItems: 0 });
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  useEffect(() => {
    if (user) {
      syncAndFetchCart();
    } else {
      loadGuestCart();
    }
  }, [user]);

  const loadGuestCart = async () => {
    try {
      const stored = await AsyncStorage.getItem('@guest_cart');
      if (stored) {
        setCart(JSON.parse(stored));
      } else {
        setCart({ items: [], savedItems: [], subtotal: 0, totalItems: 0 });
      }
    } catch (e) {
      console.error('[Cart] Error loading guest cart', e);
    }
  };

  const syncAndFetchCart = async () => {
    try {
      setLoading(true);
      const storedGuest = await AsyncStorage.getItem('@guest_cart');
      if (storedGuest) {
        const guestData = JSON.parse(storedGuest);
        if (guestData.items && guestData.items.length > 0) {
          for (const item of guestData.items) {
            const pId = item.product?._id || item.product?.id || item.product;
            if (pId) {
              await api.post('/cart/items', {
                productId: pId,
                variantId: item.variantId || 'default',
                size: item.size || 'Standard',
                color: item.color || 'Standard',
                quantity: item.quantity || 1,
              }).catch(() => {});
            }
          }
          await AsyncStorage.removeItem('@guest_cart');
        }
      }
      const res = await api.get('/cart');
      if (res.data && res.data.cart) {
        setCart(res.data.cart);
      }
    } catch (e) {
      console.error('[Cart] Error fetching cart', e);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productOrId, variant = {}, quantity = 1) => {
    try {
      let productId = productOrId;
      let productObj = null;

      if (typeof productOrId === 'object' && productOrId !== null) {
        productObj = productOrId;
        productId = productOrId._id || productOrId.id || productOrId.slug || productOrId.productId;
      }

      const payload = {
        productId,
        variantId: variant.variantId || 'default',
        size: variant.size || 'Standard',
        color: variant.color || 'Standard',
        quantity,
      };

      const itemKey = `${productId}_${payload.variantId}_${payload.size}_${payload.color}`;
      const itemPrice = productObj?.discountPrice || productObj?.price || 999;

      setCart((prevCart) => {
        const existingItems = prevCart.items || [];
        const existingIdx = existingItems.findIndex((i) => i.itemKey === itemKey);
        let updatedItems = [];

        if (existingIdx > -1) {
          updatedItems = [...existingItems];
          updatedItems[existingIdx].quantity += quantity;
          if (productObj && productObj.name) {
            updatedItems[existingIdx].product = productObj;
          }
        } else {
          updatedItems = [
            ...existingItems,
            {
              itemKey,
              product: productObj || {
                _id: productId,
                name: 'StyleAura Fashion Item',
                price: itemPrice,
                discountPrice: itemPrice,
                images: ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600'],
              },
              variantId: payload.variantId,
              size: payload.size,
              color: payload.color,
              quantity,
              priceAtAddition: itemPrice,
            },
          ];
        }

        const subtotal = updatedItems.reduce((sum, i) => {
          const p = i.product;
          const price = p ? (p.discountPrice || p.price || 999) : 999;
          return sum + price * i.quantity;
        }, 0);

        const totalItems = updatedItems.reduce((sum, i) => sum + i.quantity, 0);

        const newCart = { ...prevCart, items: updatedItems, subtotal, totalItems };
        AsyncStorage.setItem('@guest_cart', JSON.stringify(newCart));
        return newCart;
      });

      if (user) {
        try {
          const res = await api.post('/cart/items', payload);
          if (res.data && res.data.cart) {
            setCart(res.data.cart);
          }
        } catch (e) {
          console.error('[Cart] Sync error on add', e);
        }
      }

      return { success: true, message: 'Added to cart' };
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to add item to cart';
      return { success: false, message: msg };
    }
  };

  const updateQuantity = async (itemKey, newQuantity) => {
    if (newQuantity <= 0) {
      return removeFromCart(itemKey);
    }
    setCart((prevCart) => {
      const updatedItems = (prevCart.items || []).map((item) => {
        if (item.itemKey === itemKey) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
      const subtotal = updatedItems.reduce((sum, i) => {
        const p = i.product;
        const price = p ? (p.discountPrice || p.price || 999) : 999;
        return sum + price * i.quantity;
      }, 0);
      const totalItems = updatedItems.reduce((sum, i) => sum + i.quantity, 0);
      const newCart = { ...prevCart, items: updatedItems, subtotal, totalItems };
      AsyncStorage.setItem('@guest_cart', JSON.stringify(newCart));
      return newCart;
    });

    if (user) {
      try {
        const res = await api.patch(`/cart/items/${itemKey}`, { quantity: newQuantity });
        if (res.data && res.data.cart) {
          setCart(res.data.cart);
        }
      } catch (e) {
        console.error('[Cart] Error updating quantity', e);
      }
    }
  };

  const removeFromCart = async (itemKey) => {
    setCart((prevCart) => {
      const updatedItems = (prevCart.items || []).filter((item) => item.itemKey !== itemKey);
      const subtotal = updatedItems.reduce((sum, i) => {
        const p = i.product;
        const price = p ? (p.discountPrice || p.price || 999) : 999;
        return sum + price * i.quantity;
      }, 0);
      const totalItems = updatedItems.reduce((sum, i) => sum + i.quantity, 0);
      const newCart = { ...prevCart, items: updatedItems, subtotal, totalItems };
      AsyncStorage.setItem('@guest_cart', JSON.stringify(newCart));
      return newCart;
    });

    if (user) {
      try {
        const res = await api.delete(`/cart/items/${itemKey}`);
        if (res.data && res.data.cart) {
          setCart(res.data.cart);
        }
      } catch (e) {
        console.error('[Cart] Error removing item', e);
      }
    }
  };

  const saveForLater = async (itemKey) => {
    setCart((prevCart) => {
      const itemToSave = (prevCart.items || []).find((i) => i.itemKey === itemKey);
      if (!itemToSave) return prevCart;
      const updatedItems = (prevCart.items || []).filter((i) => i.itemKey !== itemKey);
      const updatedSaved = [...(prevCart.savedItems || []), itemToSave];
      const subtotal = updatedItems.reduce((sum, i) => {
        const p = i.product;
        const price = p ? (p.discountPrice || p.price || 999) : 999;
        return sum + price * i.quantity;
      }, 0);
      const totalItems = updatedItems.reduce((sum, i) => sum + i.quantity, 0);
      const newCart = { items: updatedItems, savedItems: updatedSaved, subtotal, totalItems };
      AsyncStorage.setItem('@guest_cart', JSON.stringify(newCart));
      return newCart;
    });

    if (user) {
      try {
        const res = await api.post(`/cart/items/${itemKey}/save`);
        if (res.data && res.data.cart) {
          setCart(res.data.cart);
        }
      } catch (e) {
        console.error('[Cart] Error saving for later', e);
      }
    }
  };

  const moveToCart = async (itemKey) => {
    setCart((prevCart) => {
      const itemToMove = (prevCart.savedItems || []).find((i) => i.itemKey === itemKey);
      if (!itemToMove) return prevCart;
      const updatedSaved = (prevCart.savedItems || []).filter((i) => i.itemKey !== itemKey);
      const updatedItems = [...(prevCart.items || []), itemToMove];
      const subtotal = updatedItems.reduce((sum, i) => {
        const p = i.product;
        const price = p ? (p.discountPrice || p.price || 999) : 999;
        return sum + price * i.quantity;
      }, 0);
      const totalItems = updatedItems.reduce((sum, i) => sum + i.quantity, 0);
      const newCart = { items: updatedItems, savedItems: updatedSaved, subtotal, totalItems };
      AsyncStorage.setItem('@guest_cart', JSON.stringify(newCart));
      return newCart;
    });

    if (user) {
      try {
        const res = await api.post(`/cart/saved-items/${itemKey}/move`);
        if (res.data && res.data.cart) {
          setCart(res.data.cart);
        }
      } catch (e) {
        console.error('[Cart] Error moving to cart', e);
      }
    }
    return { success: true };
  };

  const validateCartBeforeCheckout = async () => {
    if (!user) {
      return { success: true, hasIssues: false };
    }
    try {
      const res = await api.post('/cart/validate');
      setValidationResult(res.data);
      return res.data;
    } catch (e) {
      console.error('[Cart] Validation error', e);
      return { success: true, hasIssues: false };
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        validationResult,
        addToCart,
        updateQuantity,
        removeFromCart,
        saveForLater,
        moveToCart,
        validateCartBeforeCheckout,
        refreshCart: user ? syncAndFetchCart : loadGuestCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
