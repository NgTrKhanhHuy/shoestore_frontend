'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Form } from 'react-bootstrap'
import { useCart } from '@/context/CartContext'
import styles from '@/styles/ProductDetail.module.css'
import { useRouter } from "next/navigation";

// Bảng ánh xạ màu sắc từ tiếng Việt sang màu CSS
import colorMap from '@/lib/colorMap'
import {formatCurrencySimple} from "@/lib/api";

interface ProductVariant {
    id: number
    stock: number
    size: string
    color: string
}

interface Product {
    id: number
    name: string
    description: string
    price: number
    imageUrl: string
    discount: number
    variants: ProductVariant[]
    totalSold: number
}



export default function ProductDetailPage() {
    const params = useParams()
    const router = useRouter();
    const productId = params.id as string

    const [product, setProduct] = useState<Product | null>(null)
    const [selectedColor, setSelectedColor] = useState<string | null>(null)
    const [selectedSize, setSelectedSize] = useState<string | null>(null)
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
    const [quantity, setQuantity] = useState(1)
    const { addToCart } = useCart()

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axios.get(`http://localhost:8080/api/products/${productId}`)
                setProduct(response.data)
            } catch (error) {
                console.error('Lỗi khi tải chi tiết sản phẩm:', error)
            }
        }
        fetchProduct()
    }, [productId])

    useEffect(() => {
        if (selectedColor && selectedSize && product) {
            const variant = product.variants.find(
                (v) => v.color === selectedColor && v.size === selectedSize
            )
            setSelectedVariant(variant ?? null)
        } else {
            setSelectedVariant(null)
        }
    }, [selectedColor, selectedSize, product])

    const handleAddToCart = () => {
        if (selectedVariant && product) {
            if (selectedVariant.stock >= quantity) {
                addToCart({
                    variantId: selectedVariant.id,
                    quantity: quantity,
                    productId: product.id,
                    productName: product.name,
                    productImageUrl: product.imageUrl,
                    price: product.price,
                    discount: product.discount,
                    color: selectedVariant.color,
                    size: selectedVariant.size
                });
                alert("Đã thêm vào giỏ hàng!");
            } else {
                alert("Số lượng vượt quá tồn kho!");
            }
        }
    };
    const handleBuyNow = () => {
        if (selectedVariant && product) {
            if (selectedVariant.stock >= quantity) {
                // Tạo đối tượng sản phẩm đã chọn
                const selectedItem = {
                    variantId: selectedVariant.id,
                    quantity: quantity,
                    productName: product.name,
                    productImageUrl: product.imageUrl,
                    price: product.price,
                    discount: product.discount,
                    color: selectedVariant.color,
                    size: selectedVariant.size
                };

                // Lưu vào localStorage để trang checkout có thể đọc
                localStorage.setItem('selectedItems', JSON.stringify([selectedItem]));

                // Chuyển hướng sang trang checkout
                router.push('/checkout');
            } else {
                alert("Số lượng vượt quá tồn kho!");
            }
        }
    };



    const calculateSavings = (price: number, discount: number) => {
        return (price * discount / 100)
    }

    if (!product) return <div className={styles.productContainer}>Đang tải...</div>

    const colors = [...new Set(product.variants.map((v) => v.color))]
    const sizes = selectedColor
        ? [...new Set(product.variants.filter((v) => v.color === selectedColor).map((v) => v.size))]
        : []

    const isOutOfStock = selectedVariant !== null && selectedVariant.stock === 0

    return (
        <div className={styles.productContainer}>
            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className={styles.breadcrumb}>
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link href="/">Trang chủ</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                       Sản phẩm
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        {product.name}
                    </li>
                </ol>
            </nav>

            {/* Main Content */}
            <div className={styles.productWrapper}>
                <div className="row">
                    {/* Product Image */}
                    <div className="col-md-6 mb-4">
                        <img
                            src={`http://localhost:8080${product.imageUrl}`}
                            className={styles.productImage}
                            alt={product.name}
                        />
                    </div>

                    {/* Product Details */}
                    <div className="col-md-6">
                        <h1 className={styles.productTitle}>{product.name}</h1>
                        <div className={styles.priceWrapper}>
    <span className={styles.currentPrice}>
        {formatCurrencySimple(product.price * (1 - product.discount / 100))}
    </span>
                            {product.discount > 0 && (
                                <>
            <span className={styles.originalPrice}>
                {formatCurrencySimple(product.price)}
            </span>
                                    <span className={styles.discountPercent}>
                -{product.discount}%
            </span>
                                </>
                            )}
                        </div>
                        {product.discount > 0 && (
                            <p className={styles.savings}>
                                Tiết kiệm: {formatCurrencySimple(calculateSavings(product.price, product.discount))}
                            </p>
                        )}

                        <p className={styles.totalSold}>
                            <strong>Đã bán:</strong> {product.totalSold} sản phẩm
                        </p>
                        <div className={styles.description}>
                            <h5>Mô tả sản phẩm</h5>
                            <p>{product.description}</p>
                        </div>

                        {/* Color Selection */}
                        <Form.Group className="mb-4">
                            <div className={styles.optionWrapper}>
                                <Form.Label className={styles.formLabel}>Màu sắc:</Form.Label>
                                {selectedColor && (
                                    <span className={styles.selectedOption}>{selectedColor}</span>
                                )}
                            </div>
                            <div className={styles.optionButtons}>
                                {colors.map((color) => (
                                    <Button
                                        key={color}
                                        variant="outline-secondary"
                                        className={`${styles.colorButton} ${selectedColor === color ? styles.selected : ''}`}
                                        style={{ backgroundColor: colorMap[color] }}
                                        onClick={() => {
                                            setSelectedColor(color)
                                            setSelectedSize(null)
                                        }}
                                    />
                                ))}
                            </div>
                        </Form.Group>

                        {/* Size Selection */}
                        {selectedColor && (
                            <Form.Group className="mb-4">
                                <div className={styles.optionWrapper}>
                                    <Form.Label className={styles.formLabel}>Kích thước:</Form.Label>
                                    {selectedSize && (
                                        <span className={styles.selectedOption}>{selectedSize}</span>
                                    )}
                                </div>
                                <div className={styles.optionButtons}>
                                    {sizes.map((size) => (
                                        <Button
                                            key={size}
                                            variant="outline-secondary"
                                            className={`${styles.sizeButton} ${selectedSize === size ? styles.selected : ''}`}
                                            onClick={() => setSelectedSize(size)}
                                        >
                                            {size}
                                        </Button>
                                    ))}
                                </div>
                            </Form.Group>
                        )}

                        {/* Stock Info */}
                        {selectedVariant && (
                            <p className={styles.stockInfo}>
                                <strong>Tồn kho:</strong> {selectedVariant.stock} sản phẩm
                            </p>
                        )}

                        {/* Quantity and Add to Cart */}
                        <div className={styles.actionWrapper}>
                            <Form.Group>
                                <Form.Label className={styles.formLabel}>Số lượng:</Form.Label>
                                <div className={styles.quantityWrapper}>
                                    <Button
                                        variant="outline-secondary"
                                        className={styles.quantityButton}
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    >
                                        -
                                    </Button>
                                    <Form.Control
                                        type="number"
                                        value={quantity}
                                        min="1"
                                        className={styles.quantityInput}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value)))}
                                    />
                                    <Button
                                        variant="outline-secondary"
                                        className={styles.quantityButton}
                                        onClick={() => setQuantity(quantity + 1)}
                                    >
                                        +
                                    </Button>
                                </div>
                            </Form.Group>
                            <Button
                                variant="outline-primary"
                                className={`${styles.addToCartButton} ${!selectedVariant || isOutOfStock ? styles.disabled : ''}`}
                                disabled={!selectedVariant || isOutOfStock}
                                onClick={handleAddToCart}
                            >
                                {selectedVariant ? 'Thêm vào giỏ hàng' : 'Chọn loại sản phẩm'}

                            </Button>
                        </div>
                        <Button
                            className={styles.buyNowButton}
                            disabled={!selectedVariant || isOutOfStock}
                            onClick={handleBuyNow}
                        >
                            {isOutOfStock ? 'Hết hàng' : 'Mua ngay'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
