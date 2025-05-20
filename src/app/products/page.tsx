'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'
import styles from '@/styles/Products.module.css'
import { useSearchParams } from 'next/navigation'
import {useSearch} from "@/lib/useSearch";


interface Category {
    id: number
    name: string
    children: Category[]
}

interface Product {
    id: number
    name: string
    price: number
    imageUrl: string
    discount: number
    categoryId: number
}

interface FlattenedCategory {
    id: number
    name: string
    level: number
    isLeaf: boolean
}

const PRODUCTS_PER_PAGE = 12

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [flattenedCategories, setFlattenedCategories] = useState<FlattenedCategory[]>([])
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
    const [selectedSizes, setSelectedSizes] = useState<string[]>([])
    const [currentPage, setCurrentPage] = useState<number>(0)
    const [totalPages, setTotalPages] = useState<number>(0)
    const [hoveredProduct, setHoveredProduct] = useState<number | null>(null)
    const { searchTerm, handleSearch } = useSearch()

    // List of sizes from 33 to 45
    const sizeOptions = Array.from({ length: 13 }, (_, i) => (33 + i).toString())
// Trong component ProductsPage
    const searchParams = useSearchParams()

    useEffect(() => {
        const categoryId = searchParams.get('categoryId')
        const search = searchParams.get('search')
        const sizes = searchParams.getAll('sizes')

        if (categoryId) {
            // const finalCategoryId = findLastLeaf(Number(categoryId))
            // setSelectedCategory(finalCategoryId)
            setSelectedCategory(Number(categoryId)) // Sửa thành set trực tiếp
        }

        if (search) {
            setSearchQuery(search)
        }

        if (sizes.length > 0) {
            setSelectedSizes(sizes)
        }
    }, [searchParams, categories]) // Thêm categories vào dependencies nếu cần
    // Fetch categories and flatten
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get<Category[]>(
                    'http://localhost:8080/api/admin/categories/tree',
                    { withCredentials: true }
                )
                setCategories(res.data)
                const flattened = flattenCategories(res.data)
                setFlattenedCategories(flattened)
            } catch (error) {
                console.error('Lỗi khi tải danh mục:', error)
            }
        }
        fetchCategories()
    }, [])

    // Flatten category tree
    const flattenCategories = (categories: Category[], level: number = 0): FlattenedCategory[] => {
        let result: FlattenedCategory[] = []
        categories.forEach((cat) => {
            const isLeaf = cat.children.length === 0
            result.push({
                id: cat.id,
                name: cat.name,
                level,
                isLeaf,
            })
            result = result.concat(flattenCategories(cat.children, level + 1))
        })
        return result
    }

    // Find last leaf category
    // const findLastLeaf = (categoryId: number): number => {
    //     const category = categories.find((c) => c.id === categoryId)
    //     if (!category || category.children.length === 0) return categoryId
    //     const lastChild = category.children[category.children.length - 1]
    //     return findLastLeaf(lastChild.id)
    // }

    // Handle category selection
    // const handleCategoryChange = (categoryId: string) => {
    //     const id = categoryId ? Number(categoryId) : null
    //     const finalCategoryId = id ? findLastLeaf(id) : null
    //     setSelectedCategory(finalCategoryId)
    //     setCurrentPage(0)
    // }
    const handleCategoryChange = (categoryId: string) => {
        const id = categoryId ? Number(categoryId) : null

        // Xóa logic findLastLeaf
        const params = new URLSearchParams(window.location.search)
        if (id) {
            params.set('categoryId', id.toString())
        } else {
            params.delete('categoryId')
        }

        window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`)
        setSelectedCategory(id)
        setCurrentPage(0)
    }
    // Handle size selection
    const handleSizeChange = (size: string) => {
        setSelectedSizes((prev) =>
            prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
        )
        setCurrentPage(0)
    }
// Đồng bộ searchTerm từ useSearch vào state searchQuery
    useEffect(() => {
        setSearchQuery(searchTerm);
    }, [searchTerm]);
    // Fetch products
    useEffect(() => {
        const fetchData = async () => {
            try {
                const params = new URLSearchParams({
                    page: currentPage.toString(),
                    size: PRODUCTS_PER_PAGE.toString(),
                    search: searchQuery,
                    ...(selectedCategory && { categoryId: selectedCategory.toString() }),
                })

                selectedSizes.forEach((size) => {
                    params.append('sizes', size)
                })

                const productsRes = await axios.get(
                    `http://localhost:8080/api/products?${params}`,
                    { withCredentials: true }
                )

                setProducts(productsRes.data.content)
                setTotalPages(productsRes.data.totalPages)
            } catch (error) {
                console.error('Lỗi khi tải sản phẩm:', error)
            }
        }

        const handler = setTimeout(() => fetchData(), 500)
        return () => clearTimeout(handler)
    }, [searchQuery, selectedCategory, currentPage, selectedSizes])

    // Format price in VND
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price)
    }

    return (
        <div className={styles.productsLayout}>
            {/* Sidebar - Search and Filters */}
            <div className={styles.sidebar}>
                <div className={styles.searchBox}>
                    <input
                        type="text"
                        placeholder="Tìm kiếm sản phẩm..."
                        value={searchTerm}
                        onChange={(e) => {
                            handleSearch(e.target.value); // Cập nhật searchTerm và URL
                            setCurrentPage(0); // Reset về trang đầu tiên khi tìm kiếm
                        }} // false = không chuyển hướng

                        className={styles.searchInput}
                    />
                </div>
                <div className={styles.selectCategory}>
                    <select
                        className={styles.categorySelect}
                        value={selectedCategory || ''}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                    >
                        <option value="">Chọn danh mục</option>
                        {flattenedCategories.map((category) => (
                            <option
                                key={category.id}
                                value={category.id}
                                style={{ paddingLeft: `${category.level * 20}px` }}
                            >
                                {category.name}
                                {!category.isLeaf && ' →'}
                            </option>
                        ))}
                    </select>
                </div>
                <div className={styles.sizeFilter}>
                    <h3 className={styles.filterTitle}>Kích thước</h3>
                    <div className={styles.sizeCheckboxes}>
                        {sizeOptions.map((size) => (
                            <label key={size} className={styles.sizeLabel}>
                                <input
                                    type="checkbox"
                                    value={size}
                                    className={styles.sizeCheckbox}
                                    checked={selectedSizes.includes(size)}
                                    onChange={() => handleSizeChange(size)}
                                />
                                {size}
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Products Container */}
            <div className={styles.productsContainer}>
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
                <h1 className={styles.pageTitle}>
                    {selectedCategory
                        ? `Sản phẩm - ${flattenedCategories.find((cat) => cat.id === selectedCategory)?.name}`
                        : 'Tất cả sản phẩm'}
                </h1>

                {/* Products Grid */}
                <div className={styles.productsGrid}>
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className={styles.productCard}
                            onMouseEnter={() => setHoveredProduct(product.id)}
                            onMouseLeave={() => setHoveredProduct(null)}
                        >
                            <div className={styles.productImageContainer}>
                                <img
                                    src={`http://localhost:8080${product.imageUrl}`}
                                    alt={product.name}
                                    loading="lazy"
                                    className={styles.productImage}
                                />
                                {hoveredProduct === product.id && (
                                    <div className={styles.productHoverActions}>
                                        <button className={styles.actionButton}>
                                            <i className="bi bi-cart-plus"></i>
                                        </button>
                                        <Link href={`/products/${product.id}`} className={styles.actionButton}>
                                            <i className="bi bi-eye"></i>
                                        </Link>
                                    </div>
                                )}
                            </div>
                            <div className={styles.productInfo}>
                                <h3 className={styles.productName}>{product.name}</h3>
                                <div className={styles.productPrice}>
                        <span className={styles.currentPrice}>
                            {formatPrice(product.price * (1 - product.discount / 100))}
                        </span>
                                    {product.discount > 0 && hoveredProduct === product.id && (
                                        <>
                                            <span className={styles.originalPrice}>{formatPrice(product.price)}</span>
                                            <span className={styles.discountTag}>-{product.discount}%</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Nếu không có sản phẩm, hiển thị thông báo bên ngoài grid */}
                {products.length === 0 && (
                    <div className={styles.noProductsMessage}>
                        Không có sản phẩm nào để hiển thị.
                    </div>
                )}
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className={styles.pagination}>
                        {[...Array(totalPages)].map((_, index) => (
                            <button
                                key={index}
                                className={`${styles.pageButton} ${currentPage === index ? styles.activePage : ''}`}
                                onClick={() => setCurrentPage(index)}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}