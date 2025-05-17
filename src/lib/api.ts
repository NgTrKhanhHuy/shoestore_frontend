import axios from "axios";

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
    return amount.toLocaleString('vi-VN') + '₫'; // Ví dụ: "1,000,000₫"
};
