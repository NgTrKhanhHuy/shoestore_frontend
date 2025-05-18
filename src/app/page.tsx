// src/app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import Image from 'next/image'
import styles from '@/styles/Home.module.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Product {
    id: number
    name: string
    price: number
    imageUrl: string
    discount: number
}

export default function HomePage() {
    const [currentBanner, setCurrentBanner] = useState(0)
    const [products, setProducts] = useState<Product[]>([])

    const banners = [
        'https://theme.hstatic.net/200000940675/1001304908/14/slider_1.jpg?v=187',
        'https://theme.hstatic.net/200000940675/1001304908/14/slider_2.jpg?v=187',
        'https://theme.hstatic.net/200000940675/1001304908/14/slider_3.jpg?v=187'
    ]

    const policies = [
        {
            icon: 'https://theme.hstatic.net/200000940675/1001304908/14/policies_icon_1.png?v=187',
            title: 'Miễn phí vận chuyển',
            desc: 'Cho đơn hàng từ 499k'
        },
        {
            icon: 'https://theme.hstatic.net/200000940675/1001304908/14/policies_icon_2.png?v=187',
            title: 'Bảo hành 6 tháng',
            desc: '15 ngày đổi trả'
        },
        {
            icon: 'https://theme.hstatic.net/200000940675/1001304908/14/policies_icon_3.png?v=187',
            title: 'Thanh toán COD',
            desc: 'Yên tâm mua sắm'
        },
        {
            icon: 'https://theme.hstatic.net/200000940675/1001304908/14/policies_icon_4.png?v=187',
            title: 'Hotline: 0866550286',
            desc: 'Hỗ trợ 24/7'
        }
    ]

    const seasonImages = [
        'https://theme.hstatic.net/200000940675/1001304908/14/season_coll_1_img_large.png?v=187',
        'https://theme.hstatic.net/200000940675/1001304908/14/season_coll_2_img_large.png?v=187',
        'https://theme.hstatic.net/200000940675/1001304908/14/season_coll_3_img_large.png?v=187',
        'https://theme.hstatic.net/200000940675/1001304908/14/season_coll_4_img_large.png?v=187'
    ]

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentBanner((prev) => (prev + 1) % banners.length)
        }, 3000)
        return () => clearInterval(timer)
    }, [])

// src/app/page.tsx (phần useEffect fetch products)
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Fetch tất cả sản phẩm thuộc category giày bóng rổ (categoryId=2)
                const res = await axios.get('http://localhost:8080/api/products?categoryId=2')

                // Lấy 8 sản phẩm đầu tiên từ danh sách trả về
                const firstEightProducts = res.data.content.slice(0, 8)
                setProducts(firstEightProducts)
            } catch (error) {
                console.error('Lỗi khi tải sản phẩm:', error)
            }
        }
        fetchProducts()
    }, [])
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price)
    }

    return (
        <>

            <main className={styles.main}>
                {/* Banner Section */}
                <section className={styles.bannerContainer}>
                    <div className={styles.bannerWrapper}>
                        {banners.map((banner, index) => (
                            <div
                                key={index}
                                className={`${styles.bannerSlide} ${index === currentBanner ? styles.active : ''}`}
                            >
                                <Image
                                    src={banner}
                                    alt={`Banner ${index + 1}`}
                                    fill
                                    priority
                                    className={styles.bannerImage}
                                />
                            </div>
                        ))}
                    </div>

                    <div className={styles.bannerControls}>
                        <button
                            className={styles.controlPrev}
                            onClick={() => setCurrentBanner(prev => (prev - 1 + banners.length) % banners.length)}
                        >
                            &lt;
                        </button>
                        <button
                            className={styles.controlNext}
                            onClick={() => setCurrentBanner(prev => (prev + 1) % banners.length)}
                        >
                            &gt;
                        </button>
                    </div>
                </section>

                {/* Policy Icons */}
                <section className={styles.policySection}>
                    {policies.map((policy, index) => (
                        <div key={index} className={styles.policyItem}>
                            <Image
                                src={policy.icon}
                                alt={policy.title}
                                width={60}
                                height={60}
                                className={styles.policyIcon}
                            />
                            <div className={styles.policyText}>
                                <h3>{policy.title}</h3>
                                <p>{policy.desc}</p>
                            </div>
                        </div>
                    ))}
                </section>

                {/* Season Collections */}
                <section className={styles.seasonSection}>
                    {seasonImages.map((img, index) => (
                        <div key={index} className={styles.seasonItem}>
                            <Image
                                src={img}
                                alt={`Season ${index + 1}`}
                                fill
                                className={styles.seasonImage}
                            />
                        </div>
                    ))}
                </section>

                {/* Fixed Banner */}
                <section className={styles.fixedBanner}>
                    <Image
                        src="https://theme.hstatic.net/200000940675/1001304908/14/slide_product_1_img_1_img.jpg?v=187"
                        alt="Fixed Banner"
                        fill
                        className={styles.fixedBannerImage}
                    />
                </section>

                {/* Products Section */}
                <section className={styles.productsSection}>
                    <div className={styles.sectionHeader}>
                        <h2>Giày Bóng Rổ</h2>
                        <Link
                            href="/products?categoryId=2" // Thêm categoryId vào query params
                            className={styles.seeAll}
                        >
                            Xem tất cả
                        </Link>
                    </div>

                    <div className={styles.productsGrid}>
                        {products.map((product) => (
                            <div key={product.id} className={styles.productCard}>
                                <div className={styles.imageContainer}>
                                    <Image
                                        src={`http://localhost:8080${product.imageUrl}`}
                                        alt={product.name}
                                        fill
                                        className={styles.productImage}
                                    />
                                    {product.discount > 0 && (
                                        <span className={styles.discountBadge}>
                      -{product.discount}%
                    </span>
                                    )}
                                </div>
                                <div className={styles.productInfo}>
                                    <h3 className={styles.productName}>{product.name}</h3>
                                    <p className={styles.productPrice}>
                                        {formatPrice(product.price * (1 - product.discount / 100))}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

        </>
    )
}