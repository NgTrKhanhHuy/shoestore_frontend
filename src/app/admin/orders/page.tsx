"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import {formatCurrencySimple, formatDate} from '@/lib/api';
import dayjs from "dayjs"; // Import hàm từ api.ts


interface OrderItem {
    price: number;
}

interface Order {
    id: number;
    createdAt: string;
    status: number;
    items: OrderItem[];
}

export default function AdminOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentTab, setCurrentTab] = useState("all");

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get("http://localhost:8080/api/admin/orders", {
                    params: { page, size: 10, search: searchTerm },
                    withCredentials: true,
                });
                setOrders(response.data.content || response.data);
                setTotalPages(response.data.totalPages || 1);
            } catch (err) {
                setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại.");
                console.error("Lỗi khi tải đơn hàng:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [page, searchTerm]);

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

    const filteredOrders = currentTab === "all" ? orders : orders.filter(order => order.status === parseInt(currentTab));

    const handleUpdateStatus = async (orderId: number, newStatus: number) => {
        try {
            await axios.put(`http://localhost:8080/api/admin/orders/${orderId}/status`, { status: newStatus }, {
                withCredentials: true,
            });
            setOrders(orders.map(order => order.id === orderId ? { ...order, status: newStatus } : order));

        } catch (err) {
            setError("Cập nhật trạng thái thất bại. Vui lòng thử lại.");
            console.error("Lỗi khi cập nhật trạng thái:", err);
        }
    };

    const goToPage = (newPage: number) => {
        if (newPage >= 0 && newPage < totalPages) {
            setPage(newPage);
        }
    };


    return (
        <div className="container py-5" style={{ marginTop: "15px" }}>
            <h1 className="mb-4">Danh sách Đơn hàng (Admin)</h1>
            <div className="mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Tìm kiếm theo số điện thoại..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <ul className="nav nav-tabs mb-3">
                {tabs.map(tab => (
                    <li key={tab.key} className="nav-item">
                        <button
                            className={`nav-link ${currentTab === tab.key ? "active" : ""}`}
                            onClick={() => setCurrentTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    </li>
                ))}
            </ul>
            {loading && <p>Đang tải...</p>}
            {error && <p className="text-danger">{error}</p>}
            {!loading && filteredOrders.length === 0 ? (
                <p>Chưa có đơn hàng nào.</p>
            ) : (
                <table className="table">
                    <thead>
                    <tr>
                        <th>ID Đơn hàng</th>
                        <th>Ngày tạo</th>
                        <th>Trạng thái</th>
                        <th>Tổng số tiền</th>
                        <th>Hành động</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredOrders.map((order) => (
                        <tr key={order.id}>
                            <td>
                                <Link href={`orders/${order.id}`}>{order.id}</Link>
                            </td>
                            <td>{formatDate(order.createdAt)}</td>

                            <td>{statusMap[order.status] || "Không xác định"}</td>
                            <td>
                                {order.items
                                    ? formatCurrencySimple(
                                        order.items.reduce((total, item) => total + (item.price || 0), 0)
                                    )
                                    : "0₫" // Hiển thị 0₫ nếu không có items
                                }
                            </td>

                            <td>
                                {currentTab === "0" && (
                                    <>
                                        <button
                                            className="btn btn-sm btn-success me-2"
                                            onClick={() => handleUpdateStatus(order.id, 1)}
                                        >
                                            Xác nhận
                                        </button>
                                        <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleUpdateStatus(order.id, 4)}
                                        >
                                            Hủy
                                        </button>
                                    </>
                                )}
                                {currentTab === "1" && (
                                    <>
                                        <button
                                            className="btn btn-sm btn-primary me-2"
                                            onClick={() => handleUpdateStatus(order.id, 2)}
                                        >
                                            Vận chuyển
                                        </button>
                                        <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleUpdateStatus(order.id, 4)}
                                        >
                                            Hủy
                                        </button>
                                    </>
                                )}
                                {currentTab === "2" && (
                                    <>
                                        <button
                                            className="btn btn-sm btn-primary me-2"
                                            onClick={() => handleUpdateStatus(order.id, 3)}
                                        >
                                            Hoàn thành
                                        </button>
                                        <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleUpdateStatus(order.id, 4)}
                                        >
                                            Hủy
                                        </button>
                                    </>
                                )}
                                {currentTab === "3" && (
                                    <button
                                        className="btn btn-sm btn-warning"
                                        onClick={() => alert("mua rồi thì giữ luôn đi nha =))")}
                                    >
                                        Hoàn tiền
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
            {totalPages > 1 && (
                <div className="d-flex justify-content-center">
                    <nav>
                        <ul className="pagination">
                            <li className={`page-item ${page === 0 ? "disabled" : ""}`}>
                                <button className="page-link" onClick={() => goToPage(page - 1)}>
                                    «
                                </button>
                            </li>
                            {Array.from({ length: totalPages }, (_, index) => (
                                <li key={index} className={`page-item ${page === index ? "active" : ""}`}>
                                    <button className="page-link" onClick={() => goToPage(index)}>
                                        {index + 1}
                                    </button>
                                </li>
                            ))}
                            <li className={`page-item ${page === totalPages - 1 ? "disabled" : ""}`}>
                                <button className="page-link" onClick={() => goToPage(page + 1)}>
                                    »
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            )}
        </div>
    );
}