/**
 * auth.js - Octaverus Auth API İstemcisi
 * 
 * Backend API ile iletişim kurarak kimlik doğrulama işlemlerini yönetir.
 * Token tabanlı kimlik doğrulama sistemi kullanır.
 */

// API URL'si - gerçek ortamda değiştirilmeli
const API_URL = "https://octaverus.com/api";

// Local storage anahtarları
const ACCESS_TOKEN_KEY = 'octaverus_access_token';
const REFRESH_TOKEN_KEY = 'octaverus_refresh_token';
const USER_KEY = 'octaverus_user';

/**
 * Auth API nesnesi - tüm kimlik doğrulama işlevlerini içerir
 */
const authAPI = {
    /**
     * Kullanıcı kaydı
     * 
     * @param {Object} userData Kullanıcı verileri
     * @returns {Promise} İşlem sonucu
     */
    async register(userData) {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Kayıt işlemi sırasında bir hata oluştu');
            }
            
            // Token ve kullanıcı bilgilerini sakla
            this._saveTokens(data.data.accessToken, data.data.refreshToken);
            this._saveUser(data.data.user);
            
            return data.data;
        } catch (error) {
            console.error('Kayıt hatası:', error);
            throw error;
        }
    },
    
    /**
     * Kullanıcı girişi
     * 
     * @param {Object} credentials Kullanıcı kimlik bilgileri
     * @returns {Promise} İşlem sonucu
     */
    async login(credentials) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Giriş yapılırken bir hata oluştu');
            }
            
            // Token ve kullanıcı bilgilerini sakla
            this._saveTokens(data.data.accessToken, data.data.refreshToken);
            this._saveUser(data.data.user);
            
            return data.data;
        } catch (error) {
            console.error('Giriş hatası:', error);
            throw error;
        }
    },
    
    /**
     * Kullanıcı çıkışı
     * 
     * @param {boolean} logoutFromAllDevices Tüm cihazlardan çıkış yapılsın mı?
     * @returns {Promise} İşlem sonucu
     */
    async logout(logoutFromAllDevices = false) {
        try {
            const refreshToken = this._getRefreshToken();
            
            if (refreshToken) {
                // Çıkış isteği gönder
                await this._fetchWithAuth(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    body: JSON.stringify({ 
                        refreshToken, 
                        logoutFromAllDevices 
                    })
                });
            }
            
            // Yerel verileri temizle
            this._clearTokens();
            this._clearUser();
            
            return true;
        } catch (error) {
            console.error('Çıkış hatası:', error);
            // Hata olsa bile yerel verileri temizle
            this._clearTokens();
            this._clearUser();
            return true;
        }
    },
    
    /**
     * Kullanıcı bilgilerini getir
     * 
     * @returns {Promise} Kullanıcı bilgileri
     */
    async getProfile() {
        try {
            const response = await this._fetchWithAuth(`${API_URL}/auth/me`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Kullanıcı bilgileri alınamadı');
            }
            
            // Kullanıcı bilgilerini güncelle
            this._saveUser(data.data);
            
            return data.data;
        } catch (error) {
            console.error('Profil bilgileri hatası:', error);
            throw error;
        }
    },
    
    /**
     * Profil güncelleme
     * 
     * @param {Object} profileData Profil verileri
     * @returns {Promise} İşlem sonucu
     */
    async updateProfile(profileData) {
        try {
            const response = await this._fetchWithAuth(`${API_URL}/user/profile`, {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Profil güncellenirken bir hata oluştu');
            }
            
            // Kullanıcı bilgilerini güncelle
            const user = this._getUser();
            if (user) {
                Object.assign(user, data.data);
                this._saveUser(user);
            }
            
            return data.data;
        } catch (error) {
            console.error('Profil güncelleme hatası:', error);
            throw error;
        }
    },
    
    /**
     * Şifre değiştirme
     * 
     * @param {Object} passwordData Şifre verileri
     * @returns {Promise} İşlem sonucu
     */
    async changePassword(passwordData) {
        try {
            const response = await this._fetchWithAuth(`${API_URL}/auth/password`, {
                method: 'PUT',
                body: JSON.stringify(passwordData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Şifre değiştirme sırasında bir hata oluştu');
            }
            
            return data.data;
        } catch (error) {
            console.error('Şifre değiştirme hatası:', error);
            throw error;
        }
    },
    
    /**
     * Şifre sıfırlama e-postası iste
     * 
     * @param {string} email E-posta adresi
     * @returns {Promise} İşlem sonucu
     */
    async forgotPassword(email) {
        try {
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Şifre sıfırlama isteği gönderilirken bir hata oluştu');
            }
            
            return data;
        } catch (error) {
            console.error('Şifre sıfırlama isteği hatası:', error);
            throw error;
        }
    },
    
    /**
     * Şifre sıfırlama
     * 
     * @param {string} token Sıfırlama token'ı
     * @param {Object} passwordData Şifre verileri
     * @returns {Promise} İşlem sonucu
     */
    async resetPassword(token, passwordData) {
        try {
            const response = await fetch(`${API_URL}/auth/reset-password/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(passwordData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Şifre sıfırlama sırasında bir hata oluştu');
            }
            
            return data;
        } catch (error) {
            console.error('Şifre sıfırlama hatası:', error);
            throw error;
        }
    },
    
    /**
     * Güvenlik sorusu ile şifre sıfırlama
     * 
     * @param {Object} securityData Güvenlik sorusu ve şifre verileri
     * @returns {Promise} İşlem sonucu
     */
    async resetBySecurityQuestion(securityData) {
        try {
            const response = await fetch(`${API_URL}/auth/reset-by-security`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(securityData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Şifre sıfırlama sırasında bir hata oluştu');
            }
            
            return data;
        } catch (error) {
            console.error('Güvenlik sorusu ile şifre sıfırlama hatası:', error);
            throw error;
        }
    },
    
    /**
     * Abonelik planı güncelleme
     * 
     * @param {string} plan Abonelik planı
     * @returns {Promise} İşlem sonucu
     */
    async updateSubscription(plan) {
        try {
            const response = await this._fetchWithAuth(`${API_URL}/user/subscription`, {
                method: 'PUT',
                body: JSON.stringify({ plan })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Abonelik güncellenirken bir hata oluştu');
            }
            
            // Kullanıcı bilgilerini güncelle
            const user = this._getUser();
            if (user) {
                user.subscription = data.data.subscription;
                this._saveUser(user);
            }
            
            return data.data;
        } catch (error) {
            console.error('Abonelik güncelleme hatası:', error);
            throw error;
        }
    },
    
    /**
     * Kullanıcı giriş yapmış mı?
     * 
     * @returns {boolean} Giriş durumu
     */
    isLoggedIn() {
        return !!this._getAccessToken() && !!this._getUser();
    },
    
    /**
     * Mevcut kullanıcıyı getir
     * 
     * @returns {Object|null} Kullanıcı bilgileri
     */
    getUser() {
        return this._getUser();
    },
    
    /**
     * Access token al
     * 
     * @returns {string|null} Access token
     */
    getAccessToken() {
        return this._getAccessToken();
    },
    
    /**
     * Yönlendirme URL'si
     * 
     * @returns {string} Yönlendirme URL'si
     */
    getRedirectUrl() {
        // Başarılı işlem sonrası yönlendirme URL'si
        return 'index.html';
    },
    
    /**
     * Access token yenileme
     * 
     * @returns {Promise<string|null>} Yeni access token
     */
    async _refreshAccessToken() {
        try {
            const refreshToken = this._getRefreshToken();
            
            if (!refreshToken) {
                return null;
            }
            
            const response = await fetch(`${API_URL}/auth/refresh-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Token yenileme hatası');
            }
            
            // Yeni access token'ı sakla
            this._saveAccessToken(data.data.accessToken);
            
            return data.data.accessToken;
        } catch (error) {
            console.error('Token yenileme hatası:', error);
            return null;
        }
    },
    
    /**
     * Access token ile istek yapma
     * 
     * @param {string} url İstek URL'si
     * @param {Object} options İstek seçenekleri
     * @returns {Promise} Fetch yanıtı
     */
    async _fetchWithAuth(url, options = {}) {
        // İlk olarak token'ı al
        let token = this._getAccessToken();
        
        // Eğer token yoksa, null dön
        if (!token) {
            // Token yenilemeyi dene
            token = await this._refreshAccessToken();
            
            // Hala token yoksa, çıkış yap ve hatayı bildir
            if (!token) {
                this.logout();
                throw new Error('Oturum süresi dolmuş, lütfen tekrar giriş yapın');
            }
        }
        
        // Fetch options'ı yapılandır
        const fetchOptions = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            }
        };
        
        // İsteği yap
        const response = await fetch(url, fetchOptions);
        
        // Eğer 401 (Unauthorized) dönerse, token'ı yenile ve tekrar dene
        if (response.status === 401) {
            const newToken = await this._refreshAccessToken();
            
            // Eğer yeni token alınamazsa, çıkış yap ve hatayı bildir
            if (!newToken) {
                this.logout();
                throw new Error('Oturum süresi dolmuş, lütfen tekrar giriş yapın');
            }
            
            // Yeni token ile tekrar istek yap
            fetchOptions.headers.Authorization = `Bearer ${newToken}`;
            return fetch(url, fetchOptions);
        }
        
        return response;
    },
    
    // Yardımcı metotlar
    _saveTokens(accessToken, refreshToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    },
    
    _saveAccessToken(accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    },
    
    _getAccessToken() {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    },
    
    _getRefreshToken() {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    },
    
    _clearTokens() {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    },
    
    _saveUser(user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },
    
    _getUser() {
        const userJson = localStorage.getItem(USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    },
    
    _clearUser() {
        localStorage.removeItem(USER_KEY);
    }
};

// authAPI'yi global scope'a ekle
window.authAPI = authAPI;

// DOMContentLoaded olayını dinle
document.addEventListener('DOMContentLoaded', function() {
    console.log('AuthAPI modülü yüklendi ve hazır');
    
    // authAPI hazır olduğunu bildiren olay
    const authReadyEvent = new CustomEvent('authAPIReady');
    document.dispatchEvent(authReadyEvent);
});
