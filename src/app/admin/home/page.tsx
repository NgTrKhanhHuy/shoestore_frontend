"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminHome() {
    const router = useRouter();

    useEffect(() => {
        // Scroll xuống để tránh bị che bởi header fixed-top
        window.scrollTo(0, 0);
    }, []);

    const goTo = (path: string) => {
        router.push(path);
    };

    return (
        <div className="container" style={{ paddingTop: "100px" }}>
            <h2 className="text-center mb-4">Bảng điều khiển quản trị</h2>

            <div className="row g-4">
                <div className="col-md-4">
                    <div
                        className="card text-white bg-primary h-100"
                        onClick={() => goTo("/admin/products")}
                        style={{ cursor: "pointer" }}
                    >
                        <div className="card-body text-center">
                            <h5 className="card-title">Quản lý Sản phẩm</h5>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div
                        className="card text-white bg-primary h-100"
                        onClick={() => goTo("/admin/categories")}
                        style={{ cursor: "pointer" }}
                    >
                        <div className="card-body text-center">
                            <h5 className="card-title">Quản lý Danh mục</h5>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div
                        className="card text-white bg-success h-100"
                        onClick={() => goTo("/admin/users")}
                        style={{ cursor: "pointer" }}
                    >
                        <div className="card-body text-center">
                            <h5 className="card-title">Quản lý Người dùng</h5>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div
                        className="card text-white bg-warning h-100"
                        onClick={() => goTo("/admin/orders")}
                        style={{ cursor: "pointer" }}
                    >
                        <div className="card-body text-center">
                            <h5 className="card-title">Quản lý Đơn hàng</h5>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div
                        className="card text-white bg-warning h-100"
                        onClick={() => goTo("/admin/dashboard")}
                        style={{ cursor: "pointer" }}
                    >
                        <div className="card-body text-center">
                            <h5 className="card-title">biểu đồ</h5>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
