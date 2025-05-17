// src/components/Footer.tsx
import { Container } from 'react-bootstrap'
import styles from '@/styles/Home.module.css'

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <Container fluid>
                <div className="text-center py-4">
                    © 2024 GIAY THE THAO SNEAKER. All rights reserved.
                </div>
            </Container>
        </footer>
    )
}