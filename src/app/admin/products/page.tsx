"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import styles from '@/styles/Admin.module.css'
import { formatCurrencySimple } from '@/lib/api'; // Import hàm từ api.ts


interface Variant {
    id: number;
    stock: number;
    size: string;
    color: string;
}
// Thêm interface Category
// Cập nhật interface Category
interface Category {
    id: number;
    name: string;
    children: Category[];
}
interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    discount: number;
    imageUrl: string;
    categoryId: number;
    variants: Variant[];
}

interface ProductPageData {
    content: Product[];
    number: number;
    size: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}

export default function AdminProductsPage() {
    const [data, setData] = useState<ProductPageData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [categories, setCategories] = useState<Category[]>([]); // Thêm state cho categories
    const [searchTerm, setSearchTerm] = useState("");
    const router = useRouter();

    const categoryMap: { [key: number]: string } = {
        1: "Giày Thể Thao",
        2: "Giày Chạy Bộ",
        3: "Giày Sneaker"
    };
// Hàm fetch categories
    // Cập nhật hàm fetchCategories
    const fetchCategories = async () => {
        try {
            const res = await axios.get<Category[]>(
                "http://localhost:8080/api/admin/categories/tree", // Đổi endpoint
                { withCredentials: true }
            );
            setCategories(res.data);
        } catch (err) {
            console.error("Lỗi khi tải danh mục:", err);
        }
    };
    const fetchProducts = async (page = 0, size = 10, search = "") => {
        setLoading(true);
        try {
            const [productsRes] = await Promise.all([
                axios.get<ProductPageData>(
                    `http://localhost:8080/api/admin/products?page=${page}&size=${size}&search=${encodeURIComponent(search)}`,
                    { withCredentials: true }
                ),
                fetchCategories() // Fetch cả categories và products cùng lúc
            ]);
            setData(productsRes.data);
            setError("");
        } catch (err: any) {
            console.error(err);
            setError("Lỗi khi tải danh sách sản phẩm.");
        } finally {
            setLoading(false);
        }
    };

    // Hàm mới để lấy đường dẫn category
    const getCategoryPath = (categoryId: number): string => {
        const findPath = (categories: Category[], targetId: number): string[] | null => {
            for (const category of categories) {
                if (category.id === targetId) {
                    return [category.name];
                }
                if (category.children && category.children.length > 0) {
                    const childPath = findPath(category.children, targetId);
                    if (childPath) {
                        return [category.name, ...childPath];
                    }
                }
            }
            return null;
        };

        const path = findPath(categories, categoryId);
        return path ? path.join(" > ") : "Không xác định";
    };

// Xử lý debounce
    useEffect(() => {
        const handler = setTimeout(() => {
            fetchProducts(0, 10, searchTerm);
        }, 500);

        return () => clearTimeout(handler);
    }, [searchTerm]);
// Hàm lấy tên category theo ID
    const getCategoryName = (categoryId: number): string => {
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : "Đang tải...";
    };
    const goToPage = (page: number) => {
        fetchProducts(page);
    };

    return (
        <div className="container pt-5"  style={{ marginTop: "15px" }}>
            {/* Header Section */}

            {/* Nút Thêm Sản Phẩm */}
            {/* Nút Thêm Sản Phẩm */}
            <div className={`col-12 ${styles.addProductButtonContainer}`}>
                <button
                    className={styles.addProductButton}
                    onClick={() => router.push('/admin/products/add')}
                >
                    <i className="bi bi-plus-lg"></i> Thêm Sản Phẩm
                </button>
            </div>
            {/* Main Content Section */}
            <div className="row">
                <div className="row mb-4">
                    <div className="col-12 text-center">
                        <h1 className="display-5 text-center">Danh sách Sản phẩm (Admin)</h1>
                    </div>
                    <div className="col-md-6 offset-md-3 mb-3">
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Tìm kiếm sản phẩm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={() => fetchProducts(0, 10, searchTerm)}
                            >
                                <i className="bi bi-search"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="col-12">
                    {/* Loading State */}
                    {loading && (
                        <div className="d-flex justify-content-center my-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="alert alert-danger text-center my-4">
                            {error}
                        </div>
                    )}

                    {/* Data Display */}
                    {data && (
                        <>
                            {/* Product Table */}
                            <div className="card shadow-sm mb-4">
                                <div className="card-body p-0">
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0">
                                            <thead className="table-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Tên sản phẩm</th>
                                                <th>Mô tả</th>
                                                <th>Giá</th>
                                                <th>Giảm giá</th>
                                                <th>Ảnh</th>
                                                <th>Danh mục</th>
                                                <th>Hành động</th>

                                            </tr>
                                            </thead>
                                            <tbody>
                                            {data.content.map((p) => (
                                                <tr key={p.id}>
                                                    <td>{p.id}</td>
                                                    <td>{p.name}</td>
                                                    <td className="text-truncate" style={{ maxWidth: "200px" }}>
                                                        {p.description}
                                                    </td>
                                                    <td>{formatCurrencySimple(p.price)}</td>
                                                    <td>{p.discount}%</td>
                                                    <td>
                                                        <img
                                                            src={`http://localhost:8080${p.imageUrl}`}
                                                            className="img-thumbnail"
                                                            style={{ width: "80px", height: "80px", objectFit: "cover" }}
                                                            alt={p.name}
                                                        />
                                                    </td>
                                                    {/*// Cập nhật cột Danh mục trong bảng*/}
                                                    <td>
                                                        {categories.length > 0 ? (
                                                            <small className="text-muted">
                                                                {getCategoryPath(p.categoryId)}
                                                            </small>
                                                        ) : (
                                                            "Đang tải..."
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-warning"
                                                            onClick={() => router.push(`/admin/products/edit/${p.id}`)}
                                                        >
                                                            Sửa
                                                        </button>
                                                    </td>

                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Pagination */}
                            {data.totalPages > 1 && (
                                <div className="d-flex justify-content-center">
                                    <nav>
                                        <ul className="pagination">
                                            <li className={`page-item ${data.first ? "disabled" : ""}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => goToPage(data.number - 1)}
                                                    disabled={data.first}
                                                >
                                                    &laquo;
                                                </button>
                                            </li>

                                            {Array.from({ length: data.totalPages }, (_, index) => (
                                                <li
                                                    key={index}
                                                    className={`page-item ${data.number === index ? "active" : ""}`}
                                                >
                                                    <button
                                                        className="page-link"
                                                        onClick={() => goToPage(index)}
                                                    >
                                                        {index + 1}
                                                    </button>
                                                </li>
                                            ))}

                                            <li className={`page-item ${data.last ? "disabled" : ""}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => goToPage(data.number + 1)}
                                                    disabled={data.last}
                                                >
                                                    &raquo;
                                                </button>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}