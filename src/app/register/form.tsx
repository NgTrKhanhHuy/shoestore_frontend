'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import debounce from "lodash.debounce";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Form, Button, Alert } from 'react-bootstrap';
import styles from '@/styles/Register.module.css';

// Zod schema for form validation
const schema = z
    .object({
        email: z.string().nonempty('Email không được để trống').email('Email không hợp lệ'),
        username: z.string().nonempty('Username không được để trống').min(3, 'Username tối thiểu 3 ký tự'),
        password: z.string().nonempty('Mật khẩu không được để trống').min(6, 'Mật khẩu tối thiểu 6 ký tự'),
        confirmPassword: z.string().nonempty('Xác nhận mật khẩu không được để trống'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Mật khẩu xác nhận không khớp',
        path: ['confirmPassword'],
    });

type RegisterFormData = z.infer<typeof schema>;

export default function RegisterForm() {
    const router = useRouter();
    const [serverMessage, setServerMessage] = useState('');

    const {
        register,
        handleSubmit,
        setError,
        clearErrors,
        formState: { errors, isValid },
        watch,
    } = useForm<RegisterFormData>({
        resolver: zodResolver(schema),
        mode: 'onChange',
    });

    // Debounced check email
    const checkEmailExists = async (email: string) => {
        try {
            const response = await axios.get(
                `http://localhost:8080/api/auth/check-email?email=${encodeURIComponent(email)}`
            );
            if (response.data.exists) {
                setError('email', { type: 'manual', message: 'Email đã được sử dụng!' });
            } else {
                clearErrors('email');
            }
        } catch (error) {
            console.error('Lỗi kiểm tra email:', error);
        }
    };

    // Debounced check username
    const checkUsernameExists = async (username: string) => {
        try {
            const response = await axios.get(
                `http://localhost:8080/api/auth/check-username?username=${encodeURIComponent(username)}`
            );
            if (response.data.exists) {
                setError('username', { type: 'manual', message: 'Username đã được sử dụng!' });
            } else {
                clearErrors('username');
            }
        } catch (error) {
            console.error('Lỗi kiểm tra username:', error);
        }
    };

    const debouncedCheckEmail = useCallback(debounce(checkEmailExists, 500), []);
    const debouncedCheckUsername = useCallback(debounce(checkUsernameExists, 500), []);

    const emailValue = watch('email');
    const usernameValue = watch('username');

    useEffect(() => {
        if (emailValue) {
            debouncedCheckEmail(emailValue);
        }
    }, [emailValue, debouncedCheckEmail]);

    useEffect(() => {
        if (usernameValue) {
            debouncedCheckUsername(usernameValue);
        }
    }, [usernameValue, debouncedCheckUsername]);

    const onSubmit = async (data: RegisterFormData) => {
        try {
            const response = await axios.post('http://localhost:8080/api/auth/register', data);
            setServerMessage('Đăng ký thành công!');
            router.push('/login');
        } catch (error: any) {
            if (error.response && error.response.data) {
                if (Array.isArray(error.response.data)) {
                    setServerMessage(error.response.data.join(', '));
                } else {
                    setServerMessage(error.response.data);
                }
            } else {
                setServerMessage('Đăng ký thất bại!');
            }
        }
    };

    return (
        <div className={styles.registerContainer}>
            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className={styles.breadcrumb}>
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link href="/">Trang chủ</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        Đăng ký
                    </li>
                </ol>
            </nav>

            {/* Main Content */}
            <div className={styles.registerWrapper}>
                <h1 className={styles.registerTitle}>ĐĂNG KÝ TÀI KHOẢN</h1>

                {serverMessage && <Alert variant="danger">{serverMessage}</Alert>}

                <Form className={styles.registerForm} onSubmit={handleSubmit(onSubmit)}>
                    {/* Email */}
                    <Form.Group controlId="formEmail" className="mb-4 position-relative">
                        <Form.Label className={styles.formLabel}>
                            Email <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            type="email"
                            placeholder="Nhập email của bạn"
                            className={styles.formControl}
                            {...register('email')}
                            isInvalid={!!errors.email}
                            isValid={!!emailValue && !errors.email}
                        />
                        <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
                        {!errors.email && emailValue && (
                            <span className="position-absolute top-50 end-0 translate-middle-y pe-3 text-success"></span>
                        )}
                    </Form.Group>

                    <Form.Group controlId="formUsername" className="mb-4 position-relative">
                        <Form.Label className={styles.formLabel}>
                            Tên người dùng <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Nhập tên người dùng"
                            className={styles.formControl}
                            {...register('username')}
                            isInvalid={!!errors.username}
                            isValid={!!usernameValue && !errors.username}
                        />
                        <Form.Control.Feedback type="invalid">{errors.username?.message}</Form.Control.Feedback>
                        {!errors.username && usernameValue && (
                            <span className="position-absolute top-50 end-0 translate-middle-y pe-3 text-success"></span>
                        )}
                    </Form.Group>

                    <Form.Group controlId="formPassword" className="mb-4 position-relative">
                        <Form.Label className={styles.formLabel}>
                            Mật khẩu <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="Nhập mật khẩu"
                            className={styles.formControl}
                            {...register('password')}
                            isInvalid={!!errors.password}
                            isValid={!!watch('password') && !errors.password}
                        />
                        <Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
                        {!errors.password && watch('password') && (
                            <span className="position-absolute top-50 end-0 translate-middle-y pe-3 text-success"></span>
                        )}
                    </Form.Group>

                    <Form.Group controlId="formConfirmPassword" className="mb-4 position-relative">
                        <Form.Label className={styles.formLabel}>
                            Nhập lại mật khẩu <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="Nhập lại mật khẩu"
                            className={styles.formControl}
                            {...register('confirmPassword')}
                            isInvalid={!!errors.confirmPassword}
                            isValid={!!watch('confirmPassword') && !errors.confirmPassword}
                        />
                        <Form.Control.Feedback type="invalid">{errors.confirmPassword?.message}</Form.Control.Feedback>
                        {!errors.confirmPassword && watch('confirmPassword') && (
                            <span className="position-absolute top-50 end-0 translate-middle-y pe-3 text-success"></span>
                        )}
                    </Form.Group>


                    {/* Submit */}
                    <Button type="submit" className={styles.registerButton} disabled={!isValid}>
                        Đăng ký
                    </Button>
                </Form>
            </div>
        </div>
    );
}