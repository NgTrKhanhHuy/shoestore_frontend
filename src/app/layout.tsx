// src/app/layout.tsx
import type { Metadata } from 'next'
import { MantineProvider } from '@mantine/core'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@mantine/core/styles.css'
import '@/styles/globals.css'
import React from "react";
import 'bootstrap-icons/font/bootstrap-icons.css'
import {CartProvider} from "@/context/CartContext";
import {AuthProvider} from "@/context/AuthContext"; // <-- Thêm dòng này
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "@/styles/Home.module.css";

export const metadata: Metadata = {
    title: 'GIAY THE THAO SNEAKER',
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="vi">
        <body>
        <div className={styles.container}>

        <MantineProvider>
            <AuthProvider>
                <CartProvider>
                    <Header />
            {children}
                    <Footer />
                </CartProvider></AuthProvider>
        </MantineProvider>
        </div>
        </body>
        </html>
    )
}