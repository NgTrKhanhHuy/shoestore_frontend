"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import {formatCurrencySimple} from "@/lib/api";

interface Variant {
    id?: number; // Variant cũ có id, variant mới thì id undefined
    size: string;
    color: string;
    stock: number;
}

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

interface ValidationError {
    field: string;
    defaultMessage: string;
}

interface FlattenedCategory {
    id: number;
    name: string;
    level: number;
    isLeaf: boolean;
}

// NEW: Thêm colorMap để ánh xạ label màu sang mã hex
const colorMap: Record<string, string> = {
    'đỏ': 'red',
    'xanh': 'blue',
    'vàng': 'yellow',
    'trắng': 'white',
    'đen': 'black',
    'xám': 'gray',
    'xanh lá': 'green',
    'hồng': 'pink',
    'tím': 'purple',
    'nâu': 'brown',
    'cam': 'orange',
    'be': 'beige',
    'vàng chanh': 'lemon',
    'màu mận': 'plum',
    'xanh da trời': 'skyblue',
    'xanh dương': 'navy',
    'xanh lục': 'teal',
    'xanh lam': 'cyan',
    'vàng đậm': 'gold',
    'bạc': 'silver',
    'trắng ngà': 'ivory',
};

// NEW: Nhóm các màu theo tiền tố để hiển thị trong datalist
const groupedColors: { group: string; options: { label: string; value: string }[] }[] = (() => {
    const groups: Record<string, { label: string; value: string }[]> = {};
    for (const [label, value] of Object.entries(colorMap)) {
        const root = label.split(" ")[0]; // nhóm theo tiền tố đầu tiên
        if (!groups[root]) groups[root] = [];
        groups[root].push({ label, value });
    }
    return Object.entries(groups).map(([group, options]) => ({ group, options }));
})();

// NEW: Tạo map từ label sang mã hex để sử dụng khi hiển thị
const labelToHexMap: Record<string, string> = {};
groupedColors.forEach(({ options }) => {
    options.forEach(({ label, value }) => {
        labelToHexMap[label.toLowerCase()] = value;
    });
});

export default function EditProductPage() {
    const params = useParams();
    const productId = params.id as string; // Ép kiểu vì đảm bảo có id trong URL
    const router = useRouter();

    // Category
    const [categories, setCategories] = useState<Category[]>([]);
    const [flattenedCategories, setFlattenedCategories] = useState<FlattenedCategory[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [categoriesError, setCategoriesError] = useState("");

    // State cho form (khởi tạo rỗng)
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [discount, setDiscount] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [variants, setVariants] = useState<Variant[]>([]);
    const [oldImg, setOldImg] = useState("");
    const [file, setFile] = useState<File | null>(null);

    // Feedback state
    const [message, setMessage] = useState("");
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get<Category[]>(
                    "http://localhost:8080/api/admin/categories/tree",
                    { withCredentials: true }
                );
                setCategories(res.data);
                const flattened = flattenCategories(res.data);
                setFlattenedCategories(flattened);
            } catch (err) {
                setCategoriesError("Không thể tải danh sách danh mục");
            } finally {
                setCategoriesLoading(false);
            }
        };
        fetchCategories();
    }, []);

    // Update category when categories are loaded
    useEffect(() => {
        if (flattenedCategories.length > 0 && categoryId) {
            const finalCategoryId = findLastLeaf(parseInt(categoryId, 10));
            setCategoryId(finalCategoryId.toString());
        }
    }, [flattenedCategories, categoryId]);

    // Helper functions
    const flattenCategories = (categories: Category[], level: number = 0): FlattenedCategory[] => {
        let result: FlattenedCategory[] = [];
        categories.forEach(cat => {
            const isLeaf = cat.children.length === 0;
            result.push({
                id: cat.id,
                name: cat.name,
                level,
                isLeaf
            });
            result = result.concat(flattenCategories(cat.children, level + 1));
        });
        return result;
    };

    const findLastLeaf = (categoryId: number): number => {
        const category = categories.find(c => c.id === categoryId);
        if (!category || category.children.length === 0) return categoryId;

        const lastChild = category.children[category.children.length - 1];
        return findLastLeaf(lastChild.id);
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = parseInt(e.target.value, 10);
        const finalCategoryId = findLastLeaf(selectedId);
        setCategoryId(finalCategoryId.toString());
        setErrors(prev => ({ ...prev, categoryId: "" }));
    };

    const handleInputChange = (
        setter: React.Dispatch<React.SetStateAction<string>>,
        fieldName: string
    ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setter(e.target.value);
        setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    };

    // Variant management
    const addVariant = () => {
        setVariants((prev) => [...prev, { size: "", color: "", stock: 0 }]);
    };

    const removeVariant = (index: number) => {
        // Cho phép xoá variant nếu chưa có id (tức variant mới thêm vào)
        if (!variants[index].id) {
            setVariants((prev) => prev.filter((_, i) => i !== index));
            const newErrors = { ...errors };
            Object.keys(newErrors).forEach((key) => {
                if (key.startsWith(`variants[${index}]`)) {
                    delete newErrors[key];
                }
            });
            setErrors(newErrors);
        }
    };

    const handleVariantChange = (
        index: number,
        field: keyof Variant,
        value: string
    ) => {
        setVariants((prev) => {
            const newVariants = [...prev];
            newVariants[index] = {
                ...newVariants[index],
                [field]: field === "stock" ? parseInt(value, 10) || 0 : value,
            };
            return newVariants;
        });
        const errorKey = `variants[${index}].${field}`;
        setErrors((prev) => ({ ...prev, [errorKey]: "" }));
    };

    // Load dữ liệu sản phẩm khi component mount
    useEffect(() => {
        if (!productId) return;

        axios
            .get<Product>(`http://localhost:8080/api/admin/products/${productId}`, {
                withCredentials: true,
            })
            .then((res) => {
                const product = res.data;

                // Parse giá trị số thành chuỗi
                setName(product.name || "");
                setDescription(product.description || "");
                setPrice(product.price?.toString() || "0"); // Chuyển price thành string
                setDiscount(product.discount?.toString() || "0"); // Chuyển discount thành string
                setCategoryId(product.categoryId?.toString() || ""); // Chuyển categoryId thành string

                // Xử lý variants
                const processedVariants = product.variants?.map(variant => ({
                    ...variant,
                    size: variant.size.toString(), // Đảm bảo size là string
                    color: variant.color.toString(), // Đảm bảo color là string
                    stock: Number(variant.stock) || 0 // Đảm bảo stock là number
                })) || [];

                setVariants(processedVariants);
                setOldImg(product.imageUrl || "");
            })
            .catch((err) => {
                console.error("Lỗi tải dữ liệu sản phẩm:", err);
            });
    }, [productId]);

    // Xử lý submit form cập nhật sản phẩm
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setMessage("");

        // Tạo object product để cập nhật, thêm các trường cần thiết
        const product = {
            id: parseInt(productId, 10),
            name,
            description,
            price: parseFloat(price),
            discount: parseInt(discount, 10),
            categoryId: parseInt(categoryId, 10),
            variants: variants,
        };

        // Nếu không có file mới, muốn giữ lại ảnh cũ, thêm field "oldImg"
        if (!file) {
            // Ép kiểu product thành any để thêm thuộc tính oldImg
            (product as any).oldImg = oldImg;
        }

        // Chuẩn bị FormData
        const productBlob = new Blob([JSON.stringify(product)], {
            type: "application/json",
        });
        const formData = new FormData();
        formData.append("product", productBlob);
        if (file) {
            formData.append("file", file);
        }

        try {
            const response = await axios.post(
                "http://localhost:8080/api/admin/products/edit",
                formData,
                { withCredentials: true }
            );
            if (response.status === 200) {
                router.push("/admin/products");
            }
        } catch (error: any) {
            if (error.response?.status === 400) {
                const backendErrors = error.response.data;
                if (Array.isArray(backendErrors)) {
                    const validationErrors = backendErrors.reduce(
                        (acc: { [key: string]: string }, err: ValidationError) => {
                            acc[err.field] = err.defaultMessage;
                            return acc;
                        },
                        {}
                    );
                    setErrors(validationErrors);
                } else {
                    setMessage("Lỗi validation không xác định");
                }
            } else {
                setMessage(
                    error.response?.data?.message ||
                    error.message ||
                    "Lỗi không xác định"
                );
            }
        }
    };

    return (
        <div className="container pt-5" style={{ marginTop: "15px" }}>
            <h2 className="my-4 text-center">Chỉnh sửa Sản phẩm</h2>
            {message && (
                <div className="alert alert-danger text-center" role="alert">
                    {message}
                </div>
            )}
            <form onSubmit={handleSubmit} className="mb-4">
                {/* Tên sản phẩm */}
                <div className="mb-3">
                    <label className="form-label">Tên sản phẩm *</label>
                    <input
                        type="text"
                        className={`form-control ${errors.name ? "is-invalid" : ""}`}
                        value={name}
                        onChange={handleInputChange(setName, "name")}
                        required
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                {/* Mô tả */}
                <div className="mb-3">
                    <label className="form-label">Mô tả *</label>
                    <textarea
                        className={`form-control ${errors.description ? "is-invalid" : ""}`}
                        value={description}
                        onChange={handleInputChange(setDescription, "description")}
                        rows={3}
                        required
                    />
                    {errors.description && (
                        <div className="invalid-feedback">{errors.description}</div>
                    )}
                </div>

                {/* Giá */}
                <div className="mb-3">
                    <label className="form-label">Giá *</label>
                    <input
                        type="number"
                        step="0.01"
                        className={`form-control ${errors.price ? "is-invalid" : ""}`}
                        value={price}
                        onChange={handleInputChange(setPrice, "price")}
                        required
                    />
                    <div className="mt-2">
                        {/* Hiển thị giá trị đã nhập dưới dạng tiền tệ */}
                        <small>{price && formatCurrencySimple(parseFloat(price))}</small>
                    </div>
                    {errors.price && <div className="invalid-feedback">{errors.price}</div>}
                </div>

                {/* Giảm giá */}
                <div className="mb-3">
                    <label className="form-label">Giảm giá (%) *</label>
                    <input
                        type="number"
                        className={`form-control ${errors.discount ? "is-invalid" : ""}`}
                        value={discount}
                        onChange={handleInputChange(setDiscount, "discount")}
                        min="0"
                        max="100"
                        required
                    />
                    {errors.discount && (
                        <div className="invalid-feedback">{errors.discount}</div>
                    )}
                </div>

                {/* Category ID */}
                <div className="mb-3">
                    <label className="form-label">Danh mục *</label>
                    {categoriesLoading ? (
                        <div className="animate-pulse bg-gray-200 h-10 rounded" />
                    ) : categoriesError ? (
                        <div className="text-danger">{categoriesError}</div>
                    ) : flattenedCategories.length === 0 ? (
                        <div className="text-danger">Chưa có danh mục nào</div>
                    ) : (
                        <select
                            className={`form-control ${errors.categoryId ? "is-invalid" : ""}`}
                            value={categoryId}
                            onChange={handleCategoryChange}
                        >
                            {flattenedCategories.map(category => (
                                <option
                                    key={category.id}
                                    value={category.id}
                                    style={{ paddingLeft: `${category.level * 20}px` }}
                                    className={category.isLeaf ? "fw-bold" : ""}
                                >
                                    {category.name} {!category.isLeaf && "→"}
                                </option>
                            ))}
                        </select>
                    )}
                    {errors.categoryId && (
                        <div className="invalid-feedback">{errors.categoryId}</div>
                    )}
                </div>

                {/* Variants Section */}
                <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h5 className="mb-0">Biến thể</h5>
                        <button
                            type="button"
                            className="btn btn-success btn-sm"
                            onClick={addVariant}
                        >
                            Thêm Biến thể
                        </button>
                    </div>
                    {variants.map((variant, index) => {
                        // NEW: Lấy mã màu hex từ labelToHexMap
                        const colorHex = labelToHexMap[variant.color?.toLowerCase()] || "#ccc";
                        return (
                            <div
                                key={index}
                                className="border rounded p-3 mb-2 position-relative"
                                style={{ borderColor: colorHex, borderWidth: "2px", borderStyle: "solid" }} // NEW: Thêm viền màu
                            >
                                {/* Cho phép xoá variant chỉ nếu variant chưa có id */}
                                {!variant.id && (
                                    <button
                                        type="button"
                                        className="btn-close position-absolute top-0 end-0"
                                        aria-label="Xóa"
                                        onClick={() => removeVariant(index)}
                                    ></button>
                                )}
                                <div className="mb-2">
                                    <label className="form-label">Kích thước (33–45) *</label>
                                    <input
                                        type="number"
                                        min={33}
                                        max={45}
                                        className={`form-control ${
                                            errors[`variants[${index}].size`] ? "is-invalid" : ""
                                        }`}
                                        value={variant.size}
                                        onChange={(e) =>
                                            handleVariantChange(index, "size", e.target.value)
                                        }
                                        required
                                    />
                                    {errors[`variants[${index}].size`] && (
                                        <div className="invalid-feedback">
                                            {errors[`variants[${index}].size`]}
                                        </div>
                                    )}
                                </div>
                                {/* NEW: Cập nhật trường màu sắc với datalist và hiển thị màu */}
                                <div className="mb-2">
                                    <label className="form-label">Màu sắc *</label>
                                    <div className="d-flex align-items-center gap-2">
                                        <input
                                            list={`colors-${index}`}
                                            className={`form-control ${
                                                errors[`variants[${index}].color`] ? "is-invalid" : ""
                                            }`}
                                            value={variant.color}
                                            onChange={(e) => {
                                                const inputLabel = e.target.value;
                                                handleVariantChange(index, "color", inputLabel); // Lưu label
                                            }}
                                            onDoubleClick={(e) => (e.currentTarget.value = "")} // NEW: Xóa nội dung khi double click
                                            style={{
                                                border: `2px solid ${labelToHexMap[variant.color?.toLowerCase()] || "#ccc"}`, // NEW: Viền theo màu
                                                borderRadius: "4px",
                                            }}
                                            placeholder="Gõ để tìm màu…" // NEW: Placeholder
                                            required
                                        />
                                        <div
                                            className="rounded-circle border border-gray-300"
                                            style={{
                                                width: "24px",
                                                height: "24px",
                                                backgroundColor: labelToHexMap[variant.color?.toLowerCase()] || "#ccc", // NEW: Hiển thị màu
                                            }}
                                        />
                                    </div>
                                    {/* NEW: Thêm datalist cho màu */}
                                    <datalist id={`colors-${index}`}>
                                        {groupedColors.map(({ group, options }) => (
                                            <optgroup key={group} label={group}>
                                                {options.map((opt, i) => (
                                                    <option key={i} value={opt.label}>{opt.label}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </datalist>
                                    {errors[`variants[${index}].color`] && (
                                        <div className="invalid-feedback">
                                            {errors[`variants[${index}].color`]}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="form-label">Số lượng *</label>
                                    <input
                                        type="number"
                                        className={`form-control ${
                                            errors[`variants[${index}].stock`] ? "is-invalid" : ""
                                        }`}
                                        value={variant.stock}
                                        onChange={(e) =>
                                            handleVariantChange(index, "stock", e.target.value)
                                        }
                                        min="0"
                                        required
                                    />
                                    {errors[`variants[${index}].stock`] && (
                                        <div className="invalid-feedback">
                                            {errors[`variants[${index}].stock`]}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* File Upload */}
                <div className="mb-3">
                    <label className="form-label">Ảnh sản phẩm *</label>
                    <input
                        type="file"
                        className={`form-control ${errors.file ? "is-invalid" : ""}`}
                        onChange={(e) => {
                            const selectedFile = e.target.files ? e.target.files[0] : null;
                            setFile(selectedFile);
                            setErrors((prev) => ({ ...prev, file: "" }));
                        }}
                        accept="image/*"
                    />
                    {errors.file && (
                        <div className="invalid-feedback">{errors.file}</div>
                    )}
                    {/* NEW: Hiển thị ảnh hiện tại nếu có */}
                    {oldImg && (
                        <div className="mt-2">
                            <p>Ảnh hiện tại:</p>
                            <img src={`http://localhost:8080${oldImg}`} alt="Current product" style={{ maxWidth: "100px" }} />
                        </div>
                    )}
                </div>

                <button type="submit" className="btn btn-primary w-100">
                    Cập nhật Sản phẩm
                </button>
            </form>
        </div>
    );
}