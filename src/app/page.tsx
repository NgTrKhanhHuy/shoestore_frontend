// src/app/page.tsx
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import styles from '@/styles/Home.module.css'

export default function HomePage() {
    return (


            <main className={styles.main}>
                <h1>GIAY THE THAO SNEAKER</h1>
                <section className={styles.hero}>
                    <h2>PEAK HIGH!</h2>
                </section>

                <section className="mt-5">
                    <h3>GIAY BONGRÒ</h3>
                    <div className="row">
                        {/* Product items */}
                    </div>
                </section>
            </main>


    )
}