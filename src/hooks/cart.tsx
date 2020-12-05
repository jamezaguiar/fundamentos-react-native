import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const savedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (savedProducts) {
        const parsedProducts: Product[] = JSON.parse(savedProducts);
        setProducts(parsedProducts);
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function updateSavedProducts(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    }

    updateSavedProducts();
  }, [products]);

  const increment = useCallback(
    async id => {
      const updatedProducts = [...products];
      const productIndex = updatedProducts.findIndex(
        product => product.id === id,
      );
      updatedProducts[productIndex].quantity += 1;

      setProducts(updatedProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const updatedProducts = [...products];
      const productIndex = updatedProducts.findIndex(
        product => product.id === id,
      );

      if (updatedProducts[productIndex].quantity === 1) {
        return;
      }

      updatedProducts[productIndex].quantity -= 1;

      setProducts(updatedProducts);
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(
        stateProduct => product.id === stateProduct.id,
      );

      if (productExists) {
        increment(product.id);
      } else {
        const newProduct = { ...product, quantity: 1 };
        setProducts([...products, newProduct]);
      }
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
