import axios from "axios";
import dayjs from 'dayjs';

export const logoutUser = async () => {
    try {
        const response = await axios.post(
            "http://localhost:8080/api/auth/logout",
            {},
            { withCredentials: true }
        );

        // Xóa giỏ hàng trong localStorage sau khi đăng xuất thành công
        localStorage.removeItem("cart");
        return response.data;
    } catch (error) {
        throw error;
    }
};
// Hàm định dạng tiền tệ Việt Nam (VND)
export const formatCurrencySimple = (amount: number): string => {
    return Math.round(amount).toLocaleString('vi-VN') + '₫';
};

/**
 * Format ngày về dạng DD-MM-YYYY (ví dụ: 20-05-2025)
 * @param date - Ngày dạng Date object, string, hoặc timestamp
 * @returns Chuỗi ngày đã format
 */
export const formatDate = (date: string | number | Date): string => {
    return dayjs(date).format("DD-MM-YYYY");
};

