'use client'

import React, { useState, useEffect, useRef } from 'react'
import {Navbar, Nav, Dropdown, Container, Button, InputGroup,Form} from 'react-bootstrap'
import { useSearch } from '@/lib/useSearch'
import styles from '@/styles/Home.module.css'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useRouter } from 'next/navigation'
import { logoutUser } from '@/lib/api'

import axios from 'axios'
import Link from 'next/link'

interface Category {
    id: number
    name: string
    children: Category[]
}

export default function Header() {
    const [activeCategory, setActiveCategory] = useState<string | null>(null)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [visibleCategories, setVisibleCategories] = useState<Category[]>([])
    const [hiddenCategories, setHiddenCategories] = useState<Category[]>([])
    const navRef = useRef<HTMLDivElement>(null)
    const [showMore, setShowMore] = useState(false)
    const { user, setUser } = useAuth()
    const { cartItems, setCartItems } = useCart()
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState('')
    const { handleSearch } = useSearch()
    const [localSearchTerm, setLocalSearchTerm] = useState('')
    const [isOpen, setIsOpen] = useState(false)

    const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0)
    // const handleSearch = (value: string) => {
    //     setSearchTerm(value)
    // }
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get<Category[]>(
                    "http://localhost:8080/api/admin/categories/tree",
                    { withCredentials: true }
                )
                setCategories(res.data)
                calculateVisibleItems(res.data)
            } catch (error) {
                console.error("Lỗi khi tải danh mục:", error)
            }
        }

        const calculateVisibleItems = (categories: Category[]) => {
            if (navRef.current) {
                const navWidth = navRef.current.offsetWidth
                const itemWidth = 150
                const maxVisible = Math.floor((navWidth - 100) / itemWidth)
                setVisibleCategories(categories.slice(0, maxVisible))
                setHiddenCategories(categories.slice(maxVisible))
            }
        }

        const handleResize = () => calculateVisibleItems(categories)

        fetchCategories()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [categories.length])

    const handleLogout = async () => {
        try {
            await logoutUser()
            setUser(null)
            setIsAdmin(false)
            localStorage.removeItem("user")
            localStorage.removeItem("cart")
            localStorage.removeItem("selectedItems"); // Xóa  khỏi localStorage
            localStorage.removeItem("userRole"); // Xóa  khỏi localStorage
            setCartItems([])
            router.push("/login")
        } catch (error) {
            console.error("Đăng xuất thất bại:", error)
        }
    }
    const [isAdmin, setIsAdmin] = useState(false);
    useEffect(() => {
        if (user?.role === "ROLE_ADMIN") {
            setIsAdmin(true);
        } else if (typeof window !== 'undefined') {
            const role = localStorage.getItem("userRole");
            if (role === "ROLE_ADMIN") {
                setIsAdmin(true);
            }
        }
    }, [user]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };
    if (isAdmin) {
        return (
            <header className="navbar navbar-expand-lg navbar-dark bg-primary fixed-top shadow-sm" style={{margin:"0 29px 0 29px", borderRadius:"15px"}}>
                <div className="container-fluid" >
                    <Link href="/admin/home" className="navbar-brand">Trang Chủ</Link>

                    <nav className="navbar-nav ms-auto">
                        <ul className="navbar-nav align-items-center">

                            <li className="nav-item dropdown">
                                <button
                                    className="nav-link dropdown-toggle d-flex align-items-center"
                                    onClick={toggleDropdown}
                                    aria-expanded={isDropdownOpen}
                                    style={{ minWidth: "120px" }}
                                >
                                    Tài Khoản
                                </button>
                                {isDropdownOpen && (
                                    <ul className="dropdown-menu  dropdown-menu-end show" >
                                        {user ? (
                                            <li className="dropdown-item-text" >
                                                <div className="d-flex flex-column p-2">
                                                    <span className="mb-2">Xin chào {user.username}!</span>

                                                    <button
                                                        onClick={handleLogout}
                                                        className="btn btn-danger btn-sm"
                                                    >
                                                        Đăng xuất
                                                    </button>
                                                </div>
                                            </li>
                                        ) : (
                                            <li>
                                                <Link href="/register" className="dropdown-item">Đăng ký</Link>
                                                <Link href="/login" className="dropdown-item">Đăng nhập</Link>
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </li>
                        </ul>
                    </nav>
                </div>
            </header>
        );}
    return (
        <Navbar expand="lg" className={styles.navbar} bg="white" variant="light">
            <Container fluid>
                <Navbar.Brand href="/" className="d-flex align-items-center" style={{margin:"0 80px 0 15px "}}>
                    <img
                        src="http://localhost:8080/uploads/images/logo-ofc.png"
                        alt="Logo"
                        height="40"
                        style={{ objectFit: 'contain' }}
                    />
                </Navbar.Brand>


                <Navbar.Toggle aria-controls="main-nav" />

                <Navbar.Collapse id="main-nav" className="justify-content-between">
                    <Nav ref={navRef} className="flex-grow-1 position-relative" style={{ maxWidth: '70vw' }}>
                        {visibleCategories.map((category) => (
                            <div
                                key={category.id}
                                className="position-relative d-inline-block" style={{margin:"0 15px"}}
                                onMouseEnter={() => setActiveCategory(category.id.toString())}
                                onMouseLeave={() => setActiveCategory(null)}
                            >
                                <div className="d-flex align-items-center gap-1">
                                    {/* Phần text điều hướng */}
                                    <Link
                                        href={`/products?categoryId=${category.id}`}
                                        className={styles.categoryParentLink}
                                    >
                                        {category.name}
                                    </Link>

                                    {/* Icon dropdown */}
                                    <div
                                        className={styles.dropdownIcon}
                                        onClick={(e) => e.preventDefault()}
                                    >
                                        ▼
                                    </div>
                                </div>

                                {/* Dropdown menu */}
                                {activeCategory === category.id.toString() && (
                                    <div className={styles.dropdownMenu}>
                                        {category.children.map((subCat) => (
                                            <Link
                                                key={subCat.id}
                                                href={`/products?categoryId=${subCat.id}`}
                                                className={styles.dropdownItem}
                                            >
                                                {subCat.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {hiddenCategories.length > 0 && (
                            <Dropdown
                                show={showMore}
                                onMouseEnter={() => setShowMore(true)}
                                onMouseLeave={() => setShowMore(false)}
                            >
                                <Dropdown.Toggle as={Button} variant="link" className={styles.moreButton}>
                                    ▾
                                </Dropdown.Toggle>

                                <Dropdown.Menu className={styles.moreMenu}>
                                    {hiddenCategories.map((category) => (
                                        <Dropdown.Item
                                            key={category.id}
                                            href={`/products?categoryId=${category.id}`}
                                            as={Link}
                                        >
                                            {category.name}
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            </Dropdown>
                        )}
                    </Nav>

                    <div className="d-flex align-items-center gap-3 ms-auto">
                        <InputGroup className={`${styles.searchGroup} ${isOpen ? 'active' : ''}`}>
                            <button
                                className="btn btn-link p-0"
                                onClick={() => setIsOpen(!isOpen)}
                                aria-label="Toggle search"
                            >
                                <i className="bi bi-search" style={{ color: '#333', fontSize: '1.2rem' }} />
                            </button>

                            {isOpen && (
                                <Form.Control
                                    type="search"
                                    placeholder="Tìm kiếm..."
                                    value={localSearchTerm}
                                    onChange={(e) => setLocalSearchTerm(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSearch(localSearchTerm, true) // true = có chuyển hướng
                                        }
                                    }}
                                    className="border-0 shadow-none"
                                    autoFocus
                                    style={{ width: '200px' }}
                                />
                            )}
                        </InputGroup>

                        <Link href="/cart" className="d-flex align-items-center text-decoration-none">
                            <i className="bi bi-cart fs-5" style={{ color: '#333' }} />
                            <span className="badge bg-danger rounded-pill ms-1">{totalQuantity}</span>
                        </Link>

                        <Dropdown
                            show={showUserMenu}
                            onMouseEnter={() => setShowUserMenu(true)}
                            onMouseLeave={() => setTimeout(() => setShowUserMenu(false), 200)}
                        >
                            <Dropdown.Toggle as={Link} href="#" className={styles.userToggle}>
                                <i className="bi bi-person fs-5" style={{ color: '#333' }} />
                            </Dropdown.Toggle>

                            <Dropdown.Menu className={`${styles.userMenu} dropdown-menu-end`}>
                                {user ? (
                                    <>
                                        <Dropdown.ItemText>Xin chào {user.username}</Dropdown.ItemText>
                                        <Dropdown.Item as={Link} href="/orders">Đơn hàng</Dropdown.Item>
                                        <Dropdown.Item onClick={handleLogout}>Đăng xuất</Dropdown.Item>
                                    </>
                                ) : (
                                    <>
                                        <Dropdown.Item as={Link} href="/login">Đăng nhập</Dropdown.Item>
                                        <Dropdown.Item as={Link} href="/register">Đăng ký</Dropdown.Item>
                                    </>
                                )}
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    )
}