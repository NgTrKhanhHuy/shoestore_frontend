"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "@/styles/Cart.module.css";
import {formatCurrencySimple} from "@/lib/api";

interface CartItem {
    variantId: number;
    quantity: number;
    productName: string;
    productImageUrl: string;
    price: number;
    discount: number;
    color: { id: number; name: string } | null;
    size: { id: number; value: string } | null;
}

export default function CartPage() {
    const { cartItems, setCartItems } = useCart();
    const { user } = useAuth();
    const [cartDetails, setCartDetails] = useState<CartItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchCartDetails = async () => {
            setLoading(true);
            if (user) {
                try {
                    const response = await axios.get("http://localhost:8080/api/cart", { withCredentials: true });
                    const cartItems = response.data.cartItems;

                    const enrichedCartItems = await Promise.all(
                        cartItems.map(async (item: CartItem) => {
                            try {
                                const variantResponse = await axios.get(
                                    `http://localhost:8080/api/product-variants/${item.variantId}`
                                );
                                return {
                                    ...item,
                                    color: variantResponse.data.color || null,
                                    size: variantResponse.data.size || null,
                                };
                            } catch (error) {
                                console.error(`Lỗi khi lấy thông tin biến thể ${item.variantId}:`, error);
                                return { ...item, color: null, size: null };
                            }
                        })
                    );

                    setCartDetails(enrichedCartItems);
                } catch (error) {
                    console.error("Lỗi khi lấy giỏ hàng:", error);
                }
            } else {
                const localCart = localStorage.getItem("cart");
                if (localCart) {
                    const parsedCart = JSON.parse(localCart);
                    if (parsedCart.length > 0 && parsedCart[0].productName) {
                        setCartDetails(parsedCart);
                    } else {
                        const enrichedItems = await Promise.all(
                            parsedCart.map(async (item: CartItem) => {
                                try {
                                    const variantResponse = await axios.get(
                                        `http://localhost:8080/api/product-variants/${item.variantId}`
                                    );
                                    const productResponse = await axios.get(
                                        `http://localhost:8080/api/products/${variantResponse.data.productId}`
                                    );

                                    return {
                                        ...item,
                                        productId: variantResponse.data.productId,
                                        productName: productResponse.data.name,
                                        productImageUrl: productResponse.data.imageUrl,
                                        price: productResponse.data.price,
                                        discount: productResponse.data.discount,
                                        color: typeof item.color === 'object' ? item.color?.name || null : item.color,
                                        size: typeof item.size === 'object' ? item.size?.value || null : item.size
                                    };
                                } catch (error) {
                                    console.error(`Lỗi khi lấy thông tin sản phẩm ${item.variantId}:`, error);
                                    return item;
                                }
                            })
                        );
                        setCartDetails(enrichedItems);
                        localStorage.setItem("cart", JSON.stringify(enrichedItems));
                    }
                }
            }
            setLoading(false);
        };
        fetchCartDetails();
    }, [user]);

    const handleUpdateQuantity = async (variantId: number, newQuantity: number) => {
        if (newQuantity < 1) return;

        const updatedCart = cartDetails.map((item) =>
            item.variantId === variantId ? { ...item, quantity: newQuantity } : item
        );
        setCartDetails(updatedCart);

        if (user) {
            try {
                await axios.put(
                    "http://localhost:8080/api/cart/update",
                    { variantId, quantity: newQuantity },
                    { withCredentials: true }
                );
                setCartItems(updatedCart);
            } catch (error: any) {
                if (axios.isAxiosError(error) && error.response) {
                    const serverMessage = error.response.data?.message || "Không thể cập nhật số lượng.";
                    alert(`Lỗi: ${serverMessage}`);
                } else {
                    console.warn("Đã xảy ra lỗi khi cập nhật số lượng (không phải AxiosError).");
                    alert("Có lỗi xảy ra khi cập nhật số lượng.");
                }

                const originalItem = cartDetails.find(item => item.variantId === variantId);
                if (originalItem) {
                    const revertedCart = cartDetails.map(item =>
                        item.variantId === variantId ? { ...item, quantity: originalItem.quantity } : item
                    );
                    setCartDetails(revertedCart);
                }
            }
        } else {
            setCartItems(updatedCart);
            localStorage.setItem("cart", JSON.stringify(updatedCart));
        }
    };

    const handleRemoveItem = async (variantId: number) => {
        const updatedCart = cartDetails.filter((item) => item.variantId !== variantId);
        setCartDetails(updatedCart);

        if (user) {
            try {
                await axios.delete(`http://localhost:8080/api/cart/remove/${variantId}`, {
                    withCredentials: true,
                });
                setCartItems(updatedCart);
            } catch (error) {
                console.error("Lỗi khi xóa sản phẩm:", error);
                alert("Có lỗi xảy ra khi xóa sản phẩm.");
            }
        } else {
            setCartItems(updatedCart);
            localStorage.setItem("cart", JSON.stringify(updatedCart));
        }
    };

    const calculateItemTotal = (item: CartItem) => {
        const discountedPrice = item.price * (1 - item.discount / 100);
        return formatCurrencySimple(parseFloat((discountedPrice * item.quantity).toFixed(2)));
    };

    const calculateTotal = () => {
        return formatCurrencySimple(
            cartDetails.reduce((total, item) => {
                const discountedPrice = item.price * (1 - item.discount / 100);
                return total + discountedPrice * item.quantity;
            }, 0)
        );
    };

    const calculateSelectedTotal = () => {
        return cartDetails
            .filter(item => selectedItems.includes(item.variantId))
            .reduce((total, item) => {
                const discountedPrice = item.price * (1 - item.discount / 100);
                return total + discountedPrice * item.quantity;
            }, 0)
            .toFixed(2);
    };


    const handleCheckout = () => {
        const selectedCartItems = cartDetails.filter(item =>
            selectedItems.includes(item.variantId)
        );

        localStorage.setItem("selectedItems", JSON.stringify(selectedCartItems));
        router.push("/checkout");
    };

    if (loading) return <div className={styles.loading}>Đang tải giỏ hàng...</div>;

    return (
        <div className={styles.container}>

            {cartDetails.length === 0 ? (
                <div className={styles.emptyCart}>
                    <div className={styles.emptyCartIcon}>🛒</div>
                    <div className={styles.emptyCartMessage}>Giỏ hàng của bạn đang trống</div>
                    <Link href="/" className={styles.continueShopping}>
                        Tiếp tục mua sắm
                    </Link>
                </div>
            ) : (
                <>
                    <div className={styles.cartItems}>
                        <nav aria-label="breadcrumb" className={styles.breadcrumb}>
                            <ol className="breadcrumb">
                                <li className="breadcrumb-item">
                                    <Link href="/">Trang chủ</Link>
                                </li>
                                <li className="breadcrumb-item active" aria-current="page">
                                    giỏ hàng
                                </li>
                            </ol>
                        </nav>

                        <div className={styles.cartHeader}>
                            <h2 className={styles.cartTitle}>Giỏ hàng</h2>
                        </div>

                        <table className={styles.cartTable}>
                            <tbody>
                            {cartDetails.map(item => {
                                const discountedPrice = item.price * (1 - item.discount / 100);
                                const isSelected = selectedItems.includes(item.variantId);

                                return (
                                    <tr
                                        key={item.variantId}
                                        className={`${styles.cartItem} ${isSelected ? styles.selected : ''}`}
                                    >
                                        <td className={styles.cartItemCell}>
                                            <input
                                                type="checkbox"
                                                className={styles.itemCheckbox}
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedItems([...selectedItems, item.variantId]);
                                                    } else {
                                                        setSelectedItems(selectedItems.filter(id => id !== item.variantId));
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td className={styles.cartItemCell}>
                                                <span
                                                    className={styles.removeItem}
                                                    title="Xóa"
                                                    onClick={() => handleRemoveItem(item.variantId)}
                                                >
                                                    ×
                                                </span>
                                        </td>
                                        <td className={styles.cartItemCell}>
                                            {/*<Link href={`/products/${item.variantId.}`}>*/}
                                                <img
                                                    src={`http://localhost:8080${item.productImageUrl}`}
                                                    alt={item.productName}
                                                    className={styles.itemImage}
                                                />
                                            {/*</Link>*/}
                                        </td>
                                        <td className={styles.cartItemCell}>
                                            <div className={styles.itemInfo}>
                                                <div className={styles.itemName}>{item.productName}</div>
                                                <div className={styles.itemVariant}>
                                                    {typeof item.color === 'object' ? item.color?.name : item.color || "N/A"} /{" "}
                                                    {typeof item.size === 'object' ? item.size?.value : item.size || "N/A"}
                                                </div>
                                            </div>
                                        </td>
                                        <td className={styles.cartItemCell}>
                                            <div className={styles.itemPrice}>
                                                    <span className={styles.currentPrice}>
                                                    {formatCurrencySimple(discountedPrice)}
                                                    </span>
                                                {item.discount > 0 && (
                                                    <span className={styles.originalPrice}>
                                                            {formatCurrencySimple(item.price)}
                                                        </span>
                                                )}
                                                {item.discount > 0 && (
                                                    <span className={styles.discountTag}>
                                                            -{item.discount}%
                                                        </span>
                                                )}
                                            </div>                                        </td>
                                        <td className={styles.cartItemCell}>
                                            <div className={styles.quantityControl}>
                                                <button
                                                    className={styles.quantityButton}
                                                    onClick={() => handleUpdateQuantity(item.variantId, item.quantity - 1)}
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    min="1"
                                                    className={styles.quantityInput}
                                                    onChange={(e) =>
                                                        handleUpdateQuantity(item.variantId, parseInt(e.target.value))
                                                    }
                                                />
                                                <button
                                                    className={styles.quantityButton}
                                                    onClick={() => handleUpdateQuantity(item.variantId, item.quantity + 1)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>

                    <div className={styles.summary}>
                        <h3 className={styles.summaryTitle}>Tổng cộng</h3>
                        <div className={styles.summaryItem}>
                            <span>Tạm tính</span>
                            <span>{formatCurrencySimple(parseFloat(calculateSelectedTotal()))}</span>
                        </div>
                        <div className={styles.summaryItem}>
                            <span>Phí vận chuyển</span>
                            <span>...</span>
                        </div>
                        <div className={styles.summaryTotal}>
                            <span>Tổng tiền: </span>
                            <span>{formatCurrencySimple(parseFloat(calculateSelectedTotal()))}</span>
                        </div>

                        <button className={styles.couponButton}>
                            Chọn mã giảm giá &gt;
                        </button>

                        <div className={styles.paymentMethods}>
                            <div className={styles.paymentMethod}>VISA</div>
                            <div className={styles.paymentMethod}>💬️</div>
                            <div className={styles.paymentMethod}>💬️</div>
                            <div className={styles.paymentMethod}>ZaloZo</div>
                            <div className={styles.paymentMethod}>Scribe</div>
                        </div>

                        <button
                            className={styles.checkoutButton}
                            onClick={handleCheckout}
                            disabled={selectedItems.length === 0}
                        >
                            {selectedItems.length === 0 ?  'Chọn mặt hàng':'Thanh Toán' }
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}