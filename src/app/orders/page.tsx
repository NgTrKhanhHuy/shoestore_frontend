"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "@/styles/Orders.module.css";
import {formatCurrencySimple, formatDate} from "@/lib/api";

interface OrderItem {
    price: number;
}

interface Order {
    id: number;
    createdAt: string;
    status: number;
    items: OrderItem[];
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTab, setCurrentTab] = useState("all");

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch("http://localhost:8080/api/orders", {
                    method: "GET",
                    credentials: "include",
                });
                const data = await res.json();
                setOrders(data);
            } catch (error) {
                setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại.");
                console.error("Lỗi khi tải đơn hàng:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const statusMap: Record<number, string> = {
        0: "Chờ xử lý",
        1: "Đang chuẩn bị",
        2: "Đang vận chuyển",
        3: "Đã hoàn thành",
        4: "Đã hủy",
    };

    const tabs = [
        { key: "all", label: "Tất cả" },
        { key: "0", label: "Chờ xử lý" },
        { key: "1", label: "Đang chuẩn bị" },
        { key: "2", label: "Đang vận chuyển" },
        { key: "3", label: "Đã hoàn thành" },
        { key: "4", label: "Đã hủy" },
    ];

    const filteredOrders = currentTab === "all"
        ? orders
        : orders.filter(order => order.status === parseInt(currentTab));

    const handleCancelOrder = async (orderId: number) => {
        if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) return;

        try {
            const res = await fetch(`http://localhost:8080/api/orders/${orderId}/cancel`, {
                method: "PUT",
                credentials: "include"
            });

            if (res.ok) {
                setOrders(orders.map(order =>
                    order.id === orderId ? { ...order, status: 4 } : order
                ));
                alert("Đã hủy đơn hàng thành công!");
            } else {
                const error = await res.text();
                throw new Error(error);
            }
        } catch (error) {
            // @ts-ignore
            alert(error.message);
        }
    };

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

            <h1 className={styles.pageTitle}>Đơn hàng của bạn</h1>

            {/* Tab navigation - UI updated only */}
            <div className={styles.tabContainer}>
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        className={`${styles.tabButton} ${currentTab === tab.key ? styles.activeTab : ''}`}
                        onClick={() => setCurrentTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Loading and Error states - UI updated only */}
            {loading && <div className={styles.loading}>Đang tải đơn hàng...</div>}
            {error && <div className={styles.error}>{error}</div>}

            {/* Orders table - UI updated only */}
            {!loading && filteredOrders.length === 0 ? (
                <div className={styles.emptyState}>
                    Không có đơn hàng nào.
                </div>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.orderTable}>
                        <thead>
                        <tr>
                            <th>ID Đơn hàng</th>
                            <th>Ngày tạo</th>
                            <th>Trạng thái</th>
                            <th>Tổng tiền</th>
                            <th>Hành động</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredOrders.map((order) => (
                            <tr key={order.id} className={styles.tableRow}>
                                <td className={styles.orderId}>
                                    <Link href={`/orders/${order.id}`}>{order.id}</Link>
                                </td>
                                <td>{formatDate(order.createdAt)}</td>
                                <td>
                                        <span className={`${styles.status} ${styles[`status${order.status}`]}`}>
                                            {statusMap[order.status]}
                                        </span>
                                </td>
                                <td className={styles.amount}>
                                    {order.items
                                        ? formatCurrencySimple(
                                            order.items.reduce((total, item) => total + (item.price || 0), 0)
                                        )
                                        : "0₫"}
                                </td>
                                <td>
                                    <div className={styles.actions}>
                                        {(order.status === 0 || order.status === 1) && (
                                            <button
                                                className={`${styles.actionButton} ${styles.cancelButton}`}
                                                onClick={() => handleCancelOrder(order.id)}
                                            >
                                                Hủy đơn
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}