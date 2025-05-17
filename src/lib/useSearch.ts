// hooks/useSearch.ts
'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export const useSearch = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [searchTerm, setSearchTerm] = useState('')

    // Đồng bộ từ URL vào state khi trang load
    useEffect(() => {
        const search = searchParams.get('search')
        if (search) setSearchTerm(search)
    }, [searchParams])

    // Xử lý search (dùng chung cho cả header và products)
    const handleSearch = (term: string, navigate = false) => {
        const trimmedTerm = term.trim()
        setSearchTerm(trimmedTerm)

        const params = new URLSearchParams(window.location.search)

        if (trimmedTerm) {
            params.set('search', trimmedTerm)
        } else {
            params.delete('search')
        }

        if (navigate) {
            router.push(`/products?${params.toString()}`)
        } else {
            window.history.pushState({}, '', `?${params.toString()}`)
        }
    }

    return { searchTerm, handleSearch }
}