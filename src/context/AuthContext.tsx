"use client";

import React, {createContext, useContext, useState, ReactNode, useEffect} from "react";
import axios from "axios";

export interface User {
    id: number;
    email: string;
    username: string;
    role: string;
    // thêm các trường khác nếu cần
}

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    setUser: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    // Re-fetch profile mỗi khi component mount
    useEffect(() => {
        // Kiểm tra nếu có thông tin user đã lưu trong cookie hoặc localStorage
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            setUser(null);
        }
        // axios
        //     .get("http://localhost:8080/api/auth/profile", { withCredentials: true })
        //     .then((res) => {
        //         setUser(res.data);
        //     })
        //     .catch((err) => {
        //         // console.error("Lỗi load profile:", err);
        //         setUser(null);
        //     });
    }, []);


    return (
        <AuthContext.Provider value={{ user, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
