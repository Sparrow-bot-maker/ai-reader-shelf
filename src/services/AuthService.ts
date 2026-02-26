/**
 * AuthService.ts
 * 處理密碼哈希、API 請求與本地狀態管理
 */

// GAS 部署後的 Web App URL (優先使用環境變數)
const GAS_URL = import.meta.env.VITE_GAS_URL || 'YOUR_GAS_WEB_APP_URL';

export interface AuthResponse {
    success: boolean;
    message?: string;
    userId?: string;
    email?: string;
    verified?: boolean;
}

export class AuthService {
    /**
     * 使用 Web Crypto API 進行 SHA-256 哈希
     * @param password 原始密碼
     */
    static async hashPassword(password: string): Promise<string> {
        const msgUint8 = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    /**
     * 統一處理對 GAS 的請求，強制使用 text/plain 以避開 CORS 預檢 (OPTIONS)
     */
    static async gasRequest(action: string, payload: any): Promise<any> {
        try {
            const response = await fetch(GAS_URL, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action, ...payload })
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`GAS Request Error (${action}):`, error);
            return { success: false, message: '網路連線失敗，請檢查 API 設定或網路' };
        }
    }

    private static async request(action: string, payload: any): Promise<AuthResponse> {
        return await this.gasRequest(action, payload);
    }

    static async login(userId: string, passwordHash: string): Promise<AuthResponse> {
        return this.request('login', { id: userId, passHash: passwordHash });
    }

    static async signUp(userId: string, passwordHash: string, email?: string): Promise<AuthResponse> {
        return this.request('signUp', { id: userId, passHash: passwordHash, email });
    }

    static async sendCode(email: string): Promise<AuthResponse> {
        return this.request('sendVerificationCode', { email });
    }

    static async resetPassword(email: string, code: string, newPassHash: string): Promise<AuthResponse> {
        return this.request('resetPassword', { email, code, newPassHash });
    }

    static async bindEmail(userId: string, email: string): Promise<AuthResponse> {
        return this.request('bindEmail', { userId, email });
    }

    // 書籍管理 API
    static async getBooks(userId: string) {
        return this.gasRequest('getBooks', { User_ID: userId });
    }

    static async addBook(bookData: any) {
        return this.gasRequest('addBook', bookData);
    }

    static async updateBook(bookData: any) {
        return this.gasRequest('updateBook', bookData);
    }

    static async deleteBook(bookId: string) {
        return this.gasRequest('delete', { Book_ID: bookId });
    }

    // 本地操作
    static saveSession(userId: string, email?: string) {
        localStorage.setItem('userId', userId);
        if (email) localStorage.setItem('userEmail', email);
    }

    static logout() {
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        window.location.reload();
    }
}
