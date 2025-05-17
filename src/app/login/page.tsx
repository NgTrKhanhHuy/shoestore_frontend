'use client'

import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth, User } from '@/context/AuthContext'
import debounce from 'lodash.debounce'
import Link from 'next/link'
import { Button, Form, Alert } from 'react-bootstrap'
import styles from '@/styles/Login.module.css'

interface LoginFormData {
    email: string
    password: string
}

export default function LoginPage() {
    const { setUser } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectParam = searchParams.get('redirect') || ''
    const [serverError, setServerError] = useState('')

    const {
        register,
        handleSubmit,
        setError,
        clearErrors,
        watch,
        formState: { errors, isValid },
    } = useForm<LoginFormData>({ mode: 'onChange' })

    // Check if email exists (opposite logic to register)
    const checkEmailExists = async (email: string) => {
        try {
            const response = await axios.get(
                `http://localhost:8080/api/auth/check-email?email=${encodeURIComponent(email)}`
            )
            if (!response.data.exists) {
                setError('email', {
                    type: 'manual',
                    message: 'Email không tồn tại trong hệ thống!',
                })
            } else {
                clearErrors('email')
            }
        } catch (error) {
            console.error('Lỗi kiểm tra email:', error)
        }
    }

    // Debounce email check
    const debouncedCheckEmail = useCallback(debounce(checkEmailExists, 500), [])

    // Watch email value
    const emailValue = watch('email')

    // Trigger email check on change
    useEffect(() => {
        if (emailValue) {
            debouncedCheckEmail(emailValue)
        }
    }, [emailValue, debouncedCheckEmail])

    const onSubmit = async (data: LoginFormData) => {
        try {
            if (errors.email) return
            const redirectUrl = encodeURIComponent(redirectParam)
            const response = await axios.post(
                `http://localhost:8080/api/auth/login?redirect=${redirectUrl}`,
                data,
                { withCredentials: true }
            )

            const rawUser = response.data.user
            const user: User = {
                id: rawUser.id,
                email: rawUser.email,
                username: rawUser.username,
                role: rawUser.role[0]?.authority ?? '',
            }
            setUser(rawUser)
            localStorage.setItem('user', JSON.stringify(rawUser))
            localStorage.setItem('userRole', user.role)

            router.push(response.data.redirect)
        } catch (error: any) {
            setServerError(error.response?.data || 'Sai mật khẩu!')
        }
    }

    return (
        <div className={styles.loginContainer}>
            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className={styles.breadcrumb}>
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link href="/">Trang chủ</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        Đăng nhập
                    </li>
                </ol>
            </nav>

            {/* Main Content */}
            <div className={styles.loginWrapper}>
                <h1 className={styles.loginTitle}>ĐĂNG NHẬP TÀI KHOẢN</h1>

                <div className={styles.registerPrompt}>
                    Bạn chưa có tài khoản?{' '}
                    <Link href="/register" className={styles.registerLink}>
                        Đăng ký tại đây
                    </Link>
                </div>

                {serverError && <Alert variant="danger">{serverError}</Alert>}

                <Form className={styles.loginForm} onSubmit={handleSubmit(onSubmit)}>
                    {/* Email Field */}
                    <Form.Group controlId="formEmail" className="mb-4">
                        <Form.Label className={styles.formLabel}>
                            Email <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            type="email"
                            placeholder="Nhập email của bạn"
                            className={styles.formControl}
                            {...register('email', {
                                required: 'Email không được để trống',
                                pattern: {
                                    value: /^\S+@\S+$/i,
                                    message: 'Email không hợp lệ',
                                },
                            })}
                            isInvalid={!!errors.email}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.email?.message}
                        </Form.Control.Feedback>
                    </Form.Group>

                    {/* Password Field */}
                    <Form.Group controlId="formPassword" className="mb-4">
                        <Form.Label className={styles.formLabel}>
                            Mật khẩu <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="Nhập mật khẩu"
                            className={styles.formControl}
                            {...register('password', {
                                required: 'Mật khẩu không được để trống',
                            })}
                            isInvalid={!!errors.password}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.password?.message}
                        </Form.Control.Feedback>
                        <div className={styles.forgotPassword}>
                            <Link href="/forgot-password" className={styles.forgotPasswordLink}>
                                Quên mật khẩu? Nhấn vào đây
                            </Link>
                        </div>
                    </Form.Group>

                    <Button
                        variant="primary"
                        type="submit"
                        className={styles.loginButton}
                        disabled={!isValid}
                    >
                        Đăng nhập
                    </Button>

                    {/* Social Login Divider */}
                    <div className={styles.socialDivider}>
                        <span className={styles.dividerText}>Hoặc đăng nhập bằng</span>
                    </div>

                    {/* Social Login Buttons */}
                    <div className={styles.socialButtons}>
                        <Button variant="outline-secondary" className={styles.socialButton}>
                            <i className="bi bi-google"></i> Google
                        </Button>
                        <Button variant="outline-secondary" className={styles.socialButton}>
                            <i className="bi bi-facebook"></i> Facebook
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    )
}