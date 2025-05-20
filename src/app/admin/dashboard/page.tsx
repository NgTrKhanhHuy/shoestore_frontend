"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Line } from "react-chartjs-2";
import { formatCurrencySimple } from '@/lib/api'; // Import hàm từ api.ts
import dayjs from "dayjs"; // Cài thêm thư viện dayjs để xử lý ngày


import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,  // Đăng ký PointElement
    LineElement,   // Đăng ký LineElement
} from "chart.js";

// Đăng ký các thành phần cần thiết
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,  // Đăng ký PointElement
    LineElement    // Đăng ký LineElement
);

interface OrderItem {
    price: number;
}

interface Order {
    id: number;
    createdAt: string;
    status: number;
    items: OrderItem[];
}

export default function AdminDashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllOrders = async () => {
            const allOrders: Order[] = [];
            let page = 0;
            let hasMore = true;

            try {
                while (hasMore) {
                    const response = await axios.get("http://localhost:8080/api/admin/orders", {
                        withCredentials: true,
                        params: {
                            page,
                            size: 50,
                        }
                    });

                    const data = response.data;
                    const content = data.content || data;

                    allOrders.push(...content);

                    // Kiểm tra nếu còn trang tiếp theo
                    hasMore = data.totalPages ? page + 1 < data.totalPages : content.length > 0;
                    page += 1;
                }

                setOrders(allOrders);
            } catch (err) {
                setError("Không thể tải toàn bộ đơn hàng.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllOrders();
    }, []);

    // Tính tổng doanh thu
    const getTotalRevenue = (orders: Order[]) => {
        return orders
            .filter(order => order.status === 3)
            .reduce((total, order) => {
                return total + order.items.reduce((sum, item) => sum + (item.price || 0), 0);
            }, 0);
    };

    // Tính số đơn hàng theo trạng thái
    const getOrderStatusData = () => {
        const statusCounts = [0, 0, 0, 0, 0]; // Đếm số lượng đơn hàng theo trạng thái
        orders.forEach(order => {
            statusCounts[order.status] += 1;
        });

        return statusCounts;
    };


    // Biểu đồ doanh thu theo ngày (Line chart)

// Biểu đồ doanh thu theo ngày (Line chart)
    const getRevenueChartData = () => {
        const revenueByDate: Record<string, number> = {};

        orders
            .filter(order => order.status === 3) // Chỉ lấy đơn đã hoàn thành
            .forEach(order => {
                const date = dayjs(order.createdAt).format("DD-MM-YYYY");
                const orderTotal = order.items.reduce((sum, item) => sum + (item.price || 0), 0);
                revenueByDate[date] = (revenueByDate[date] || 0) + orderTotal;
            });

        const sortedDates = Object.keys(revenueByDate).sort((a, b) =>
            dayjs(a, "DD-MM-YYYY").unix() - dayjs(b, "DD-MM-YYYY").unix()
        );

        return {
            labels: sortedDates,
            datasets: [
                {
                    label: "Doanh thu (VND)",
                    data: sortedDates.map(date => revenueByDate[date]),
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1,
                    tension: 0.3,
                },
            ],
        };
    };

    // Biểu đồ phân bổ đơn hàng theo trạng thái (Bar chart)
    const getOrderStatusChartData = () => {
        const statusCounts = getOrderStatusData();
        return {
            labels: ["Chờ xử lý", "Đang chuẩn bị", "Đang vận chuyển", "Đã hoàn thành", "Đã hủy"],
            datasets: [
                {
                    label: "Số đơn hàng",
                    data: statusCounts,
                    backgroundColor: ["#FFB6C1", "#FF6347", "#FFD700", "#32CD32", "#808080"],
                    borderColor: "#fff",
                    borderWidth: 1,
                },
            ],
        };
    };

    return (
        <div className="container py-5" style={{ marginTop: "15px" }}>
            <h1 className="mb-4">Dashboard Admin</h1>

            {/* Div chứa 2 biểu đồ */}
            <div className="d-flex justify-content-between">
                {/* Biểu đồ doanh thu */}
                <div className="chart-container" style={{ width: "48%" }}>
                    <h3>Doanh thu theo ngày</h3>
                    <Line data={getRevenueChartData()} />
                </div>

                {/* Biểu đồ phân bổ đơn hàng theo trạng thái */}
                <div className="chart-container" style={{ width: "48%" }}>
                    <h3>Phân bổ đơn hàng theo trạng thái</h3>
                    <Bar data={getOrderStatusChartData()} />
                </div>
            </div>

            {/* Thông tin tổng quan */}
            <div className="mt-4">
                <h4>Tổng Doanh Thu: {formatCurrencySimple(getTotalRevenue(orders))} </h4>
                <h5>Số lượng đơn hàng: {orders.length}</h5>
            </div>

            {loading && <p>Đang tải...</p>}
            {error && <p className="text-danger">{error}</p>}
        </div>
    );
}
