"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import {router} from "next/client";

// types.ts hoặc trong CartContext.tsx
export interface CartItem {
    variantId: number;
    quantity: number;
    productId?: number;
    productName?: string;
    productImageUrl?: string;
    price?: number;
    discount?: number;
    color?: string | { id: number; name: string } | null;
    size?: string | { id: number; value: string } | null;
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (item: CartItem) => void;
    setCartItems: (items: CartItem[]) => void; // 👈 Add this line

}





const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false);

    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const { user, setUser } = useAuth();

    useEffect(() => {
        const storedCart = localStorage.getItem("cart");
        if (storedCart) {
            setCartItems(JSON.parse(storedCart));
        }
    }, []);

    useEffect(() => {
        // Chỉ lưu cartItems vào localStorage nếu người dùng chưa đăng nhập
        if (!user) {
            localStorage.setItem("cart", JSON.stringify(cartItems));
        }
    }, [cartItems, user]);


    const forceLogout = () => {
        setUser(null);
        setCartItems([]);
        setIsAdmin(false);

        localStorage.removeItem("cart");
        localStorage.removeItem("user");
        localStorage.removeItem("selectedItems");
        localStorage.removeItem("userRole");

    };
// Trong CartContext.tsx
    useEffect(() => {
        if (user) {
            const mergeCart = async () => {
                try {
                    const itemsToMerge = cartItems.map(item => ({
                        variantId: item.variantId,
                        quantity: item.quantity
                    }));

                    const response = await axios.post(
                        "http://localhost:8080/api/cart/merge",
                        itemsToMerge,
                        { withCredentials: true }
                    );

                    setCartItems(response.data.cartItems);
                    localStorage.removeItem("cart");
                } catch (error: any) {
                    console.warn("Lỗi khi hợp nhất giỏ hàng:", error);

                    if (error.response) {
                        if (error.response.status === 400) {
                            alert("Không đủ hàng tồn kho: " + error.response.data);
                        } else if (error.response.status === 401 || error.response.status === 403) {
                            alert("Phiên đăng nhập hết hạn hoặc không hợp lệ. Bạn sẽ được đăng xuất.");
                            forceLogout(); // 👈 Gọi hàm đăng xuất
                        } else {
                            alert("Có lỗi xảy ra khi hợp nhất giỏ hàng. Vui lòng thử lại sau.");
                        }
                    } else {
                        alert("Không thể kết nối đến máy chủ.");
                    }
                }
            };

            mergeCart();
        }
    }, [user]);
    const addToCart = async (item: CartItem) => {
        setCartItems((prev) => {
            const existingItem = prev.find((i) => i.variantId === item.variantId);
            if (existingItem) {
                return prev.map((i) =>
                    i.variantId === item.variantId
                        ? { ...i, quantity: i.quantity + item.quantity }
                        : i
                );
            }
            return [...prev, item];
        });

        if (user) {
            try {
                await axios.post(
                    "http://localhost:8080/api/cart/add",
                    item,
                    { withCredentials: true }
                );
            } catch (error) {
                console.error("Lỗi khi thêm vào giỏ hàng trên server:", error);
                alert("Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng.");
            }
        }
    };

    return (
        <CartContext.Provider value={{ cartItems, addToCart, setCartItems}}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart phải được sử dụng trong một CartProvider");
    }
    return context;
}