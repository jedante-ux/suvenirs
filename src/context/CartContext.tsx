'use client';

import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Product, CartItem, ProductVariant } from '@/types';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

// Unique key for a cart item: productId + optional variant SKU
export function cartItemKey(productId: string, variant?: ProductVariant | null): string {
  return variant ? `${productId}::${variant.sku}` : productId;
}

function getKey(item: CartItem): string {
  return cartItemKey(item.product.id, item.variant);
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity: number; variant?: ProductVariant | null } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { key: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

interface CartContextType {
  state: CartState;
  addItem: (product: Product, quantity?: number, variant?: ProductVariant | null) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getTotalItems: () => number;
  getItemQuantity: (productId: string, variant?: ProductVariant | null) => number;
  getCartItemKey: (productId: string, variant?: ProductVariant | null) => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const initialState: CartState = {
  items: [],
  isOpen: false,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const key = cartItemKey(action.payload.product.id, action.payload.variant);
      const existingIndex = state.items.findIndex(
        (item) => getKey(item) === key
      );

      if (existingIndex >= 0) {
        const updatedItems = [...state.items];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: updatedItems[existingIndex].quantity + action.payload.quantity,
        };
        return { ...state, items: updatedItems };
      }

      return {
        ...state,
        items: [...state.items, {
          product: action.payload.product,
          quantity: action.payload.quantity,
          variant: action.payload.variant || undefined,
        }],
      };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((item) => getKey(item) !== action.payload),
      };

    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => getKey(item) !== action.payload.key),
        };
      }

      return {
        ...state,
        items: state.items.map((item) =>
          getKey(item) === action.payload.key
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    }

    case 'CLEAR_CART':
      return { ...state, items: [] };

    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };

    case 'OPEN_CART':
      return { ...state, isOpen: true };

    case 'CLOSE_CART':
      return { ...state, isOpen: false };

    case 'LOAD_CART':
      return { ...state, items: action.payload };

    default:
      return state;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('suvenirs-cart');
    if (savedCart) {
      try {
        const items = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: items });
      } catch (e) {
        console.error('Error loading cart from localStorage:', e);
      }
    }
  }, []);

  // Save cart to localStorage on changes
  useEffect(() => {
    localStorage.setItem('suvenirs-cart', JSON.stringify(state.items));
  }, [state.items]);

  const addItem = (product: Product, quantity = 1, variant?: ProductVariant | null) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity, variant } });
  };

  const removeItem = (key: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: key });
  };

  const updateQuantity = (key: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { key, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  const openCart = () => {
    dispatch({ type: 'OPEN_CART' });
  };

  const closeCart = () => {
    dispatch({ type: 'CLOSE_CART' });
  };

  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getItemQuantity = (productId: string, variant?: ProductVariant | null) => {
    const key = cartItemKey(productId, variant);
    return state.items.find((item) => getKey(item) === key)?.quantity ?? 0;
  };

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        toggleCart,
        openCart,
        closeCart,
        getTotalItems,
        getItemQuantity,
        getCartItemKey: cartItemKey,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
