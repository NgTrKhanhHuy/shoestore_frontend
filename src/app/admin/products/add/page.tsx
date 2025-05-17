"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {formatCurrencySimple} from "@/lib/api";

interface Variant {
    size: string;
    color: string;
    stock: number;
}

interface Category {
    id: number;
    name: string;
    children: Category[];
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

// ===================== COLOR MAP =====================
// Màu sắc được nhóm theo phân loại chính
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
    'hồng nhạt': 'lightpink',
    'hồng đậm': '-deeppink',
    // Các biến thể của màu sắc
    'đỏ đậm': 'darkred',
    'đỏ nhạt': 'lightcoral',
    'xanh lá đậm': 'darkgreen',
    'xanh lá nhạt': 'lightgreen',
    'xanh da trời đậm': 'darkblue',
    'xanh da trời nhạt': 'lightskyblue',
    'vàng nhạt': 'lightyellow',
    'nâu đậm': 'saddlebrown',
    'nâu nhạt': 'sandybrown',
    'cam đậm': 'darkorange',
    'cam nhạt': 'peachpuff',
    'xám đậm': 'dimgray',
    'xám nhạt': 'lightgray',
    'trắng sữa': 'seashell',
    'trắng bạc': 'ghostwhite',
    // Các màu theo phong cách thời trang và mỹ phẩm
    'màu rượu vang': 'wine',
    'màu cafe': 'coffee',
    'màu mực': 'midnightblue',
    'màu hạt dẻ': 'chestnut',
    'màu thạch anh': 'amethyst',
    'màu xám đá': 'slategray',
    'màu than': 'charcoal',
    'màu cát': 'sand',
    'màu hoa hồng': 'rose',
    'màu nắng': 'sunflower',
    'màu gạch': 'brickred',
    'màu lúa mì': 'wheat',
    'màu xám bạc': 'silvergray',
    'màu bùn': 'mud',
    'màu xanh bạc hà': 'mint',
    'màu trà xanh': 'matcha',
    'màu mơ': 'peach',
    'màu lá phong': 'maple',
    // Các màu sắc khác
    'màu ngọc bích': 'turquoise',
    'màu ngọc lục bảo': 'emerald',
    'màu ngọc bích xanh': 'aquamarine',
    'màu hoa anh đào': 'cherryblossom',
    'màu bạc hà': 'honeydew',
    'màu hạt dẻ nướng': 'roastedchestnut',
    'màu đậu phộng': 'peanut',
    'màu cẩm thạch': 'marble',
    'màu cánh sen': 'lotus',
    'màu băng': 'iceblue',
    'màu lá cây': 'olive',
    'màu hoa violet': 'violet',
    'màu kim cương': 'diamond',
    'màu xà cừ': 'pearl',
    'màu mật ong': 'honey',
};

const groupedColors: { group: string; options: { label: string; value: string }[] }[] = (() => {
    const groups: Record<string, { label: string; value: string }[]> = {};
    for (const [label, value] of Object.entries(colorMap)) {
        const root = label.split(" ")[0]; // nhóm theo tiền tố đầu tiên
        if (!groups[root]) groups[root] = [];
        groups[root].push({ label, value });
    }
    return Object.entries(groups).map(([group, options]) => ({ group, options }));
})();

const labelToHexMap: Record<string, string> = {};
groupedColors.forEach(({ options }) => {
    options.forEach(({ label, value }) => {
        labelToHexMap[label.toLowerCase()] = value;
    });
});

// ===================== MAIN COMPONENT =====================
export default function AddProductPage() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [flattenedCategories, setFlattenedCategories] = useState<FlattenedCategory[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [categoriesError, setCategoriesError] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [discount, setDiscount] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [variants, setVariants] = useState<Variant[]>([{ size: "", color: "", stock: 0 }]);
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState("");
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

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
                const firstLeaf = flattened.find(c => c.isLeaf);
                if (firstLeaf) {
                    setCategoryId(firstLeaf.id.toString());
                }
            } catch {
                setCategoriesError("Không thể tải danh sách danh mục");
            } finally {
                setCategoriesLoading(false);
            }
        };
        fetchCategories();
    }, []);

    const flattenCategories = (categories: Category[], level: number = 0): FlattenedCategory[] => {
        let result: FlattenedCategory[] = [];
        categories.forEach(cat => {
            const isLeaf = cat.children.length === 0;
            result.push({ id: cat.id, name: cat.name, level, isLeaf });
            if (cat.children.length > 0) {
                result = result.concat(flattenCategories(cat.children, level + 1));
            }
        });
        return result;
    };

    const handleInputChange = (
        setter: React.Dispatch<React.SetStateAction<string>>,
        fieldName: string
    ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setter(e.target.value);
        setErrors(prev => ({ ...prev, [fieldName]: "" }));
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = parseInt(e.target.value);
        setCategoryId(selectedId.toString());
        setErrors(prev => ({ ...prev, categoryId: "" }));
    };

    const addVariant = () => {
        setVariants(prev => [...prev, { size: "", color: "", stock: 0 }]);
    };

    const removeVariant = (index: number) => {
        if (variants.length > 1) {
            setVariants(prev => prev.filter((_, i) => i !== index));
            const newErrors = { ...errors };
            Object.keys(newErrors).forEach(key => {
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
        setVariants(prev => {
            const newVariants = [...prev];
            newVariants[index] = {
                ...newVariants[index],
                [field]: field === "stock" ? parseInt(value) || 0 : value
            };
            return newVariants;
        });
        const errorKey = `variants[${index}].${field}`;
        setErrors(prev => ({ ...prev, [errorKey]: "" }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setMessage("");

        if (!file) {
            setErrors(prev => ({ ...prev, file: "Vui lòng chọn ảnh sản phẩm" }));
            return;
        }

        const product = {
            name,
            description,
            price: parseFloat(price),
            discount: parseInt(discount, 10),
            categoryId: parseInt(categoryId, 10),
            variants: variants.map(v => ({ ...v, stock: Number(v.stock) }))
        };

        const formData = new FormData();
        formData.append("product", new Blob([JSON.stringify(product)], { type: "application/json" }));
        formData.append("file", file);

        try {
            const response = await axios.post(
                "http://localhost:8080/api/admin/products/add",
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
                        }, {}
                    );
                    setErrors(validationErrors);
                } else {
                    setMessage("Lỗi validation không xác định");
                }
            } else {
                setMessage(error.response?.data?.message || error.message || "Lỗi không xác định");
            }
        }
    };

    return (
        // NEW: Use Bootstrap container and padding
        <div className="container pt-5" style={{ marginTop: "15px" }}>
            {/* NEW: Center-aligned heading with Bootstrap styling */}
            <h2 className="my-4 text-center">Thêm Sản Phẩm</h2>
            {/* NEW: Use Bootstrap alert for error messages */}
            {message && (
                <div className="alert alert-danger text-center" role="alert">
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="mb-4">
                {/* Product Name */}
                <div className="mb-3">
                    {/* NEW: Use form-label and form-control */}
                    <label className="form-label">Tên sản phẩm *</label>
                    <input
                        type="text"
                        className={`form-control ${errors.name ? "is-invalid" : ""}`}
                        value={name}
                        onChange={handleInputChange(setName, "name")}
                        required
                    />
                    {/* NEW: Use invalid-feedback for errors */}
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                {/* Description */}
                <div className="mb-3">
                    <label className="form-label">Mô tả *</label>
                    <textarea
                        className={`form-control ${errors.description ? "is-invalid" : ""}`}
                        value={description}
                        onChange={(e) => {
                            setDescription(e.target.value);
                            setErrors((prev) => ({ ...prev, description: "" }));
                        }}
                        rows={4}
                        required
                    />
                    {errors.description && (
                        <div className="invalid-feedback">{errors.description}</div>
                    )}
                </div>

                {/* Price */}
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

                {/* Discount */}
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

                {/* Category Dropdown */}
                <div className="mb-3">
                    <label className="form-label">Danh mục *</label>
                    {categoriesLoading ? (
                        // NEW: Bootstrap-style loading placeholder
                        <div className="animate-pulse bg-secondary h-10 rounded" />
                    ) : categoriesError ? (
                        <div className="text-danger">{categoriesError}</div>
                    ) : flattenedCategories.length === 0 ? (
                        <div className="text-danger">Chưa có danh mục nào</div>
                    ) : (
                        <select
                            className={`form-control ${errors.categoryId ? "is-invalid" : ""}`}
                            value={categoryId}
                            onChange={handleCategoryChange}
                            required
                        >
                            {flattenedCategories.map((category) => (
                                <option
                                    key={category.id}
                                    value={category.id}
                                    style={{ paddingLeft: `${category.level * 20}px` }}
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

                {/* Variants */}
                <div className="mb-3">
                    {/* NEW: Use Bootstrap flex for variant header */}
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h5 className="mb-0">Biến thể</h5>
                        {/* NEW: Bootstrap button for adding variant */}
                        <button
                            type="button"
                            onClick={addVariant}
                            className="btn btn-success btn-sm"
                        >
                            Thêm Biến thể
                        </button>
                    </div>
                    {variants.map((variant, index) => {
                        const colorHex = labelToHexMap[variant.color?.toLowerCase()] || "#ccc";
                        return (
                            <div
                                key={index}
                                className="border rounded p-3 mb-2 position-relative"
                                style={{ borderColor: colorHex, borderWidth: "2px", borderStyle: "solid" }}
                            >
                                {variants.length > 1 && (
                                    // NEW: Use Bootstrap btn-close for remove button
                                    <button
                                        type="button"
                                        onClick={() => removeVariant(index)}
                                        className="btn-close position-absolute top-0 end-0"
                                        aria-label="Xóa"
                                    ></button>
                                )}

                                {/* Size */}
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
                                        onChange={(e) => handleVariantChange(index, "size", e.target.value)}
                                        required
                                    />
                                    {errors[`variants[${index}].size`] && (
                                        <div className="invalid-feedback">
                                            {errors[`variants[${index}].size`]}
                                        </div>
                                    )}
                                </div>

                                {/* Color */}
                                <div className="mb-2">
                                    <label className="form-label">Màu sắc *</label>
                                    {/* NEW: Use Bootstrap d-flex for color input layout */}
                                    <div className="d-flex align-items-center gap-2">
                                        <input
                                            list={`colors-${index}`}
                                            className={`form-control ${
                                                errors[`variants[${index}].color`] ? "is-invalid" : ""
                                            }`}
                                            value={variant.color}
                                            onChange={(e) => {
                                                const inputLabel = e.target.value;
                                                handleVariantChange(index, "color", inputLabel);
                                            }}
                                            onDoubleClick={(e) => (e.currentTarget.value = "")}
                                            style={{
                                                border: `2px solid ${colorHex}`,
                                                borderRadius: "4px",
                                            }}
                                            placeholder="Gõ để tìm màu…"
                                            required
                                        />
                                        <div
                                            className="rounded-circle border border-secondary"
                                            style={{
                                                width: "24px",
                                                height: "24px",
                                                backgroundColor: colorHex,
                                            }}
                                        />
                                    </div>
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

                                {/* Stock */}
                                <div className="mb-2">
                                    <label className="form-label">Số lượng *</label>
                                    <input
                                        type="number"
                                        min={0}
                                        className={`form-control ${
                                            errors[`variants[${index}].stock`] ? "is-invalid" : ""
                                        }`}
                                        value={variant.stock}
                                        onChange={(e) => handleVariantChange(index, "stock", e.target.value)}
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
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            setFile(file || null);
                            setErrors((prev) => ({ ...prev, file: "" }));
                        }}
                        accept="image/*"
                        className={`form-control ${errors.file ? "is-invalid" : ""}`}
                    />
                    {errors.file && <div className="invalid-feedback">{errors.file}</div>}
                    {/* NEW: Add placeholder for file preview consistency (optional) */}
                    {file && (
                        <div className="mt-2">
                            <p>Ảnh đã chọn:</p>
                            <img
                                src={URL.createObjectURL(file)}
                                alt="Selected product"
                                style={{ maxWidth: "100px" }}
                            />
                        </div>
                    )}
                </div>

                {/* Submit */}
                <button type="submit" className="btn btn-primary w-100">
                    Thêm Sản Phẩm
                </button>
            </form>
        </div>
    );
}