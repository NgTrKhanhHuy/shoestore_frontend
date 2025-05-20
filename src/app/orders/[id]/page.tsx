"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import styles from "@/styles/OrderDetail.module.css";
import {formatCurrencySimple, formatDate} from "@/lib/api";


interface OrderItem {
    variantId: number;
    quantity: number;
    price: number;
    color: { id: number; name: string } | null;
    size: { id: number; value: string } | null;
    product: { id: number; name: string; imageUrl: string } | null;
}

interface OrderDetails {
    id: number;
    createdAt: string;
    status: number;
    address: string;  // Thêm vào đây
    phone: string;    // Thêm vào đây
    items: OrderItem[];
}

export default function OrderDetailsPage() {
    const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
    const params = useParams();
    const orderId = params?.id;

    const fetchOrderDetails = async () => {
        try {
            // Lấy chi tiết đơn hàng từ API admin
            const res = await fetch(`http://localhost:8080/api/orders/${orderId}`, {
                method: "GET",
                credentials: "include",
            });
            const data = await res.json();

            // Lấy thông tin chi tiết variant cho từng mục
            const enrichedItems = await Promise.all(
                data.items.map(async (item: OrderItem) => {
                    try {
                        const variantResponse = await fetch(
                            `http://localhost:8080/api/product-variants/${item.variantId}`
                        );
                        const variant = await variantResponse.json();

                        let product = null;
                        if (variant.productId) {
                            const productResponse = await fetch(
                                `http://localhost:8080/api/products/${variant.productId}`
                            );
                            product = await productResponse.json();
                        }

                        return {
                            ...item,
                            color: variant.color || null,
                            size: variant.size || null,
                            product: product || null,
                        };
                    } catch (error) {
                        console.error(`Lỗi khi lấy thông tin biến thể ${item.variantId}:`, error);
                        return { ...item, color: null, size: null, product: null };
                    }
                })
            );

            setOrderDetails({ ...data, items: enrichedItems });
        } catch (error) {
            console.error("Lỗi khi tải chi tiết đơn hàng:", error);
        }
    };

    useEffect(() => {
        if (orderId) fetchOrderDetails();
    }, [orderId]);

    const statusMap: Record<number, string> = {
        0: "Chờ xử lý",
        1: "Đang chuẩn bị",
        2: "Đang vận chuyển",
        3: "Đã hoàn thành",
        4: "Đã hủy",
    };


    if (!orderDetails) return <div className={styles.loading}>Đang tải...</div>;

    return (
        <div className={styles.container}>
            <nav aria-label="breadcrumb" className={styles.breadcrumb}>
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link href="/">Trang chủ</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        Sản phẩm
                    </li>
                </ol>
            </nav>

            <div className={styles.header}>
                <h1 className={styles.pageTitle}>Đơn hàng #{orderDetails.id}</h1>
                <Link href="http://localhost:3000/orders" className={styles.backButton}>
                    ← Quay lại danh sách
                </Link>
            </div>

            <div className={styles.layout}>
                {/* Cột thông tin khách hàng */}
                <div className={styles.customerInfo}>
                    <div className={styles.infoCard}>
                        <h3 className={styles.sectionTitle}>Thông tin đơn hàng</h3>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Ngày đặt hàng:</span>
                                <span className={styles.infoValue}>
                                    {formatDate(orderDetails.createdAt)}
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Trạng thái:</span>
                                <span className={`${styles.status} ${styles[`status${orderDetails.status}`]}`}>
                                    {statusMap[orderDetails.status]}
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Địa chỉ:</span>
                                <span className={styles.infoValue}>{orderDetails.address}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>SĐT:</span>
                                <span className={styles.infoValue}>{orderDetails.phone}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cột chi tiết sản phẩm */}
                <div className={styles.orderDetails}>
                    <div className={styles.productsCard}>
                        <h3 className={styles.sectionTitle}>Chi tiết sản phẩm</h3>

                        <table className={styles.productsTable}>
                            <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Phân loại</th>
                                <th>Số lượng</th>
                                <th>Đơn giá</th>
                                <th>Tổng</th>
                            </tr>
                            </thead>
                            <tbody>
                            {orderDetails.items.map((item) => (
                                <tr key={item.variantId} className={styles.productRow}>
                                    <td>
                                        {item.product ? (
                                            <div className={styles.productInfo}>
                                                <img
                                                    src={`http://localhost:8080${item.product.imageUrl}`}
                                                    alt={item.product.name}
                                                    className={styles.productImage}
                                                />
                                                <span className={styles.productName}>
                                                        {item.product.name}
                                                    </span>
                                            </div>
                                        ) : "N/A"}
                                    </td>
                                    <td>
                                        <div className={styles.variantInfo}>
                                            {item.color?.name || "N/A"}, {item.size?.value || "N/A"}
                                        </div>
                                    </td>
                                    <td>{item.quantity}</td>
                                    <td>{formatCurrencySimple(item.price)}</td>
                                    <td>{formatCurrencySimple(item.price * item.quantity)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        <div className={styles.totalAmount}>
                            <span>Tổng cộng:</span>
                            <span className={styles.amount}>

                                {orderDetails.items
                                    ? formatCurrencySimple(
                                    orderDetails.items.reduce((total, item) => total + item.price * item.quantity, 0))
                                    : "0₫"
                                    }
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
