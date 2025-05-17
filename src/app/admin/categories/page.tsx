"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button, Modal, Form } from "react-bootstrap";

interface Category {
    id: number;
    name: string;
    children: Category[];
}

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [showModal, setShowModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [selectedParentId, setSelectedParentId] = useState<number | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await axios.get<Category[]>("http://localhost:8080/api/admin/categories/tree", {
                withCredentials: true,
            });
            setCategories(res.data);
            setError("");
        } catch (err) {
            console.error(err);
            setError("Lỗi khi tải danh mục.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async () => {
        try {
            await axios.post(
                "http://localhost:8080/api/admin/categories/add",
                {
                    name: newCategoryName,
                    parentId: selectedParentId
                },
                { withCredentials: true }
            );
            setNewCategoryName("");
            setSelectedParentId(null);
            setShowModal(false);
            fetchCategories();
        } catch (err: any) {
            if (err.response) {
                alert("Lỗi: " + err.response.data);
            } else if (err.request) {
                alert("Không nhận được phản hồi từ server.");
            } else {
                alert("Lỗi: " + err.message);
            }
        }
    };

    const flattenCategories = (categories: Category[], level: number = 0): Array<{ id: number; name: string; level: number }> => {
        let result: Array<{ id: number; name: string; level: number }> = [];
        categories.forEach(cat => {
            result.push({ id: cat.id, name: cat.name, level });
            result = result.concat(flattenCategories(cat.children, level + 1));
        });
        return result;
    };

    const CategoryTree = ({ categories, level = 0 }: { categories: Category[], level?: number }) => (
        <ul className="list-unstyled">
            {categories.map(category => (
                <li key={category.id} style={{ marginLeft: `${level * 20}px` }}>
                    <div>
                        <span className="fw-bold">{category.name}</span>
                        <small className="text-muted ms-2">(ID: {category.id})</small>
                    </div>
                    {category.children.length > 0 && (
                        <CategoryTree categories={category.children} level={level + 1} />
                    )}
                </li>
            ))}
        </ul>
    );

    return (
        <div className="container pt-5" style={{ marginTop: "15px" }}>
            {loading && (
                <div className="d-flex justify-content-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="alert alert-danger text-center my-4">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <div className="card shadow-sm">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h2 className="mb-0">Quản lý Danh mục</h2>
                        <Button variant="primary" onClick={() => setShowModal(true)}>
                            Thêm danh mục
                        </Button>
                    </div>

                    <div className="card-body p-3">
                        <CategoryTree categories={categories} />
                    </div>
                </div>
            )}

            <Modal show={showModal} onHide={() => {
                setShowModal(false);
                setNewCategoryName("");
                setSelectedParentId(null);
            }} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Thêm danh mục mới</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Tên danh mục</Form.Label>
                            <Form.Control
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Nhập tên danh mục..."
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>Danh mục cha</Form.Label>
                            <Form.Select
                                value={selectedParentId ?? ''}
                                onChange={(e) => setSelectedParentId(e.target.value ? parseInt(e.target.value) : null)}
                            >
                                <option value="">-- Không có danh mục cha --</option>
                                {flattenCategories(categories).map(cat => (
                                    <option
                                        key={cat.id}
                                        value={cat.id}
                                        style={{ paddingLeft: `${cat.level * 20}px` }}
                                    >
                                        {cat.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Hủy
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleAddCategory}
                        disabled={!newCategoryName.trim()}
                    >
                        Thêm
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}