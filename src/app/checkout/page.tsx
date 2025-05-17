"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import styles from "@/styles/Checkout.module.css";
import {formatCurrencySimple} from "@/lib/api";

interface CartItem {
    variantId: number;
    productId: number;
    quantity: number;
    productName: string;
    productImageUrl: string;
    price: number;
    discount: number;
    color: { id: number; name: string } | null;
    size: { id: number; value: string } | null;
}

const SHIPPING_FEE = 50000; // 50k
const FREE_SHIPPING_THRESHOLD = 490000; // 490k

export default function CheckoutPage() {
    const { cartItems, setCartItems } = useCart();
    const [selectedItems, setSelectedItems] = useState<CartItem[]>([]);
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        const data = localStorage.getItem("selectedItems");
        if (data) {
            try {
                const parsed = JSON.parse(data);
                setSelectedItems(parsed);
            } catch (err) {
                console.error("Lỗi khi đọc selectedItems:", err);
            }
        }
    }, []);

    const handleCancel = () => {
        setSelectedItems([]);
        setAddress("");
        setPhone("");
        localStorage.removeItem("selectedItems");
    };

    const calculateItemTotal = (item: CartItem) => {
        const discountedPrice = item.price * (1 - item.discount / 100);
        return (discountedPrice * item.quantity);
    };

    const calculateSubtotal = () => {
        return selectedItems.reduce((total, item) => {
            const discountedPrice = item.price * (1 - item.discount / 100);
            return total + discountedPrice * item.quantity;
        }, 0);
    };

    const calculateShippingFee = () => {
        const subtotal = calculateSubtotal();
        return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const shippingFee = calculateShippingFee();
        return (subtotal + shippingFee);
    };

    const handleOrderSubmit = async () => {
        if (!address || !phone) {
            alert("Vui lòng nhập đầy đủ địa chỉ và số điện thoại!");
            return;
        }

        const payload = {
            address,
            phone,
            items: selectedItems.map(item => ({
                variantId: item.variantId,
                quantity: item.quantity
            }))
        };

        try {
            const res = await fetch("http://localhost:8080/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include"
            });

            if (res.ok) {
                alert("Đơn hàng đã được gửi! 🚀");
                localStorage.removeItem("selectedItems");
                setSelectedItems([]);

                const remainingCartItems = cartItems.filter(
                    item => !selectedItems.some(selected => selected.variantId === item.variantId)
                );
                setCartItems(remainingCartItems);
                setAddress("");
                setPhone("");
            } else {
                alert("Có lỗi xảy ra khi gửi đơn hàng.");
            }
        } catch (error) {
            console.error("Lỗi khi gửi đơn hàng:", error);
            alert("Lỗi kết nối tới server.");
        }
    };

    const subtotal = calculateSubtotal();
    const shippingFee = calculateShippingFee();
    const total = calculateTotal();
    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

    return (
        <div className={styles.container}>
            <h1 className={styles.pageTitle}>Xác nhận đơn hàng</h1>

            {selectedItems.length === 0 ? (
                <div className={styles.emptyCart}>
                    <div className={styles.emptyCartIcon}>🛒</div>
                    <div className={styles.emptyCartMessage}>Không có sản phẩm nào được chọn để thanh toán</div>
                    <Link href="/cart" className={styles.continueShopping}>
                        Quay lại giỏ hàng
                    </Link>
                </div>
            ) : (
                <div className={styles.checkoutLayout}>
                    <div className={styles.orderItems}>
                        <h2 className={styles.sectionTitle}>Sản phẩm đã chọn</h2>

                        <div className={styles.itemsList}>
                            {selectedItems.map(item => {
                                const discountedPrice = item.price * (1 - item.discount / 100);

                                return (
                                    <div key={item.variantId} className={styles.orderItem}>
                                        <Link href={`/products/${item.productId}`} className={styles.itemImageLink}>
                                            <img
                                                src={`http://localhost:8080${item.productImageUrl}`}
                                                alt={item.productName}
                                                className={styles.itemImage}
                                            />
                                        </Link>

                                        <div className={styles.itemInfo}>
                                            <Link href={`/products/${item.productId}`} className={styles.itemName}>
                                                {item.productName}
                                            </Link>
                                            <div className={styles.itemVariant}>
                                                {typeof item.color === 'object' ? item.color?.name : item.color || "N/A"} /{" "}
                                                {typeof item.size === 'object' ? item.size?.value : item.size || "N/A"}
                                            </div>
                                        </div>

                                        <div className={styles.itemPrice}>
                      <span className={styles.currentPrice}>
                        {formatCurrencySimple(discountedPrice)}
                      </span>
                                            {item.discount > 0 && (
                                                <span className={styles.originalPrice}>
                          {formatCurrencySimple(item.price)}
                        </span>
                                            )}
                                        </div>

                                        <div className={styles.itemQuantity}>
                                            × {item.quantity}
                                        </div>

                                        <div className={styles.itemTotal}>
                                            {formatCurrencySimple(calculateItemTotal(item))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className={styles.shippingForm}>
                            <h2 className={styles.sectionTitle}>Thông tin giao hàng</h2>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Địa chỉ giao hàng</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    placeholder="vd: 123 đường ABC, phường XYZ, TP.HCM"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Số điện thoại</label>
                                <input
                                    type="tel"
                                    pattern="[0-9]*"
                                    inputMode="numeric"
                                    maxLength={11}
                                    className={styles.formInput}
                                    placeholder="vd: 0987654321"
                                    value={phone}
                                    onChange={(e) => {
                                        const onlyDigits = e.target.value.replace(/\D/g, "");
                                        setPhone(onlyDigits);
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.orderSummary}>
                        <h2 className={styles.sectionTitle}>Tóm tắt đơn hàng</h2>

                        <div className={styles.summaryDetails}>
                            <div className={styles.summaryRow}>
                                <span>Tạm tính:</span>
                                <span>{formatCurrencySimple(subtotal)}</span>
                            </div>

                            <div className={styles.summaryRow}>
                                <span>Phí vận chuyển:</span>
                                {isFreeShipping ? (
                                    <span className={styles.freeShipping}>
                    <span className={styles.crossedPrice}>{(SHIPPING_FEE/1000)}k</span>
                    <span>Miễn phí</span>
                  </span>
                                ) : (
                                    <span>{(SHIPPING_FEE/1000).toFixed(0)}đk</span>
                                )}
                            </div>

                            <div className={styles.summaryTotal}>
                                <span>Tổng thanh toán:</span>
                                <span className={styles.totalAmount}>{formatCurrencySimple(total)}</span>
                            </div>
                        </div>

                        <div className={styles.paymentMethods}>
                            <h3 className={styles.paymentTitle}>Phương thức thanh toán</h3>
                            <div className={styles.paymentOptions}>
                                <div className={styles.paymentMethod}>VISA</div>
                                <div className={styles.paymentMethod}>💬️</div>
                                <div className={styles.paymentMethod}>ZaloZo</div>
                                <div className={styles.paymentMethod}>Scribe</div>
                            </div>
                        </div>

                        <div className={styles.actionButtons}>
                            <button
                                className={styles.cancelButton}
                                onClick={handleCancel}
                            >
                                Hủy đơn hàng
                            </button>

                            {user ? (
                                <button
                                    className={styles.checkoutButton}
                                    onClick={handleOrderSubmit}
                                >
                                    Xác nhận thanh toán
                                </button>
                            ) : (
                                <button
                                    className={styles.loginButton}
                                    onClick={() => router.push("/login")}
                                >
                                    Vui lòng đăng nhập
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}