"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {formatCurrencySimple} from "@/lib/api";

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
    customerInfo?: {
        name: string;
        phone: string;
        email: string;
        address: string;
    };
}

export default function AdminOrderDetailsPage() {
    const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
    const params = useParams();
    const orderId = params?.id;

// Trong AdminOrderDetailsPage
    const fetchOrderDetails = async () => {
        if (!orderId) return;

        try {
            const res = await fetch(`http://localhost:8080/api/admin/orders/${orderId}`, {
                method: "GET",
                credentials: "include",
            });
            const data = await res.json();

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
                        console.error(`Error fetching variant ${item.variantId}:`, error);
                        return { ...item, color: null, size: null, product: null };
                    }
                })
            );

            setOrderDetails({
                ...data,
                items: enrichedItems,
                customerInfo: data.customerInfo || null
            });
        } catch (error) {
            console.error("Error fetching order details:", error);
        }
    };

    useEffect(() => {
        fetchOrderDetails();
    }, [orderId]);    const handleUpdateStatus = async (newStatus: number) => {
        try {
            await fetch(`http://localhost:8080/api/admin/orders/${orderId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
                credentials: "include",
            });
            // Refresh data sau khi cập nhật
            await fetchOrderDetails();
        } catch (error) {
            console.error("Lỗi khi cập nhật trạng thái:", error);
            alert("Cập nhật trạng thái thất bại!");
        }
    };

    if (!orderDetails) return <div className="container py-5" >Đang tải...</div>;

    const statusMap: Record<number, string> = {
        0: "Chờ xử lý",
        1: "Đang chuẩn bị",
        2: "Đang vận chuyển",
        3: "Đã hoàn thành",
        4: "Đã hủy",
    };
    const totalAmount = orderDetails.items
        .reduce((total, item) => total + (item.price || 0) * item.quantity, 0);
    return (
        <div className="container py-5" style={{marginTop:"15px"}}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Chi tiết đơn hàng #{orderDetails.id}</h1>
                <Link href="admin/orders" className="btn btn-secondary">
                    Quay lại danh sách
                </Link>
            </div>

            <div className="card mb-4">
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6">
                            <h5>Thông tin đơn hàng</h5>
                            <p><strong>Ngày tạo:</strong> {new Date(orderDetails.createdAt).toLocaleString()}</p>
                            <p><strong>Trạng thái:</strong> {statusMap[orderDetails.status] || "Không xác định"}</p>
                            {orderDetails.status === 0 && (
                                <div className="btn-group">
                                    <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => handleUpdateStatus(1)}
                                    >
                                        Xác nhận đơn
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleUpdateStatus(4)}
                                    >
                                        Hủy đơn
                                    </button>
                                </div>
                            )}
                            {orderDetails.status === 0 && (
                                <div className="btn-group">
                                    <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => handleUpdateStatus(1)}
                                    >
                                        Xác nhận đơn
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleUpdateStatus(4)}
                                    >
                                        Hủy đơn
                                    </button>
                                </div>
                            )}

                            {orderDetails.status === 1 && (
                                <div className="btn-group">
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleUpdateStatus(2)}
                                    >
                                        Bắt đầu vận chuyển
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleUpdateStatus(4)}
                                    >
                                        Hủy đơn
                                    </button>
                                </div>
                            )}

                            {orderDetails.status === 2 && (
                                <div className="btn-group">
                                    <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => handleUpdateStatus(3)}
                                    >
                                        Đánh dấu hoàn thành
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleUpdateStatus(4)}
                                    >
                                        Hủy đơn
                                    </button>
                                </div>
                            )}

                            {orderDetails.status === 3 && (
                                <button
                                    className="btn btn-warning btn-sm"
                                    onClick={() => alert("Chức năng hoàn tiền đang phát triển")}
                                >
                                    Xử lý hoàn tiền
                                </button>
                            )}
                        </div>
                        {orderDetails.customerInfo && (
                            <div className="col-md-6">
                                <h5>Thông tin khách hàng</h5>
                                <p><strong>Tên:</strong> {orderDetails.customerInfo.name}</p>
                                <p><strong>SĐT:</strong> {orderDetails.phone}</p>
                                <p><strong>Email:</strong> {orderDetails.customerInfo.email || "N/A"}</p>
                                <p><strong>Địa chỉ:</strong> {orderDetails.address}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <h3 className="mb-3">Chi tiết sản phẩm</h3>
            <div className="table-responsive">
                <table className="table">
                    <thead>
                    <tr>
                        <th>Sản phẩm</th>
                        <th>Loại sản phẩm</th>
                        <th>Số lượng</th>
                        <th>Đơn giá</th>
                        <th>Tổng</th>
                    </tr>
                    </thead>
                    <tbody>
                    {orderDetails.items.map((item) => (
                        <tr key={item.variantId}>
                            <td>
                                {item.product ? (
                                    <div className="d-flex align-items-center">
                                        <img
                                            src={`http://localhost:8080${item.product.imageUrl}`}
                                            alt={item.product.name}
                                            style={{ width: "50px", marginRight: "10px" }}
                                        />
                                        <Link href={`/products/${item.product.id}`}>
                                            {item.product.name}
                                        </Link>
                                    </div>
                                ) : (
                                    "N/A"
                                )}
                            </td>
                            <td>
                                {item.color?.name || "N/A"}, {item.size?.value || "N/A"}
                            </td>
                            <td>{item.quantity}</td>
                            <td>{formatCurrencySimple(item.price || 0)}</td>
                            <td>{formatCurrencySimple((item.price || 0) * item.quantity)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="text-end mt-4">
                <h3>
                    Tổng cộng:
                    {formatCurrencySimple(totalAmount)}
                </h3>
            </div>
        </div>
    );
}