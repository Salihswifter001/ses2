/**
 * Auth API ile iletişim kurmak için yardımcı fonksiyonlar
 */

// API URL'si
const API_URL = "https://70.167.205.92.host.secureserver.net";

// Uygulama URL'si
const APP_URL = "https://70.167.205.92.host.secureserver.net";

// Veritabanı Yapılandırması
const DB_CONFIG = {
  user: 'salih_octaverum_user',
  password: 'Achilles14123!',
  database: 'salih_octaverum_db',
  host: 'localhost',
  port: 5432, // PostgreSQL için varsayılan port
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20 // Bağlantı havuzu maksimum bağlantı sayısı
};

// Local storage token anahtarları
const ACCESS_TOKEN_KEY = 'octaverum_access_token';
const REFRESH_TOKEN_KEY = 'octaverum_refresh_token';
const USER_KEY = 'octaverum_user';

// authAPI nesnesi - tüm fonksiyonları içerecek
const authAPI = {};

/**
 * Kullanıcı kaydı
 * @param {Object} userData - Kullanıcı verileri
 * @returns {Promise} Yanıt verisi
 */
authAPI.register = async function(userData) {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Kayıt sırasında bir hata oluştu');
    }

    // Token ve kullanıcı verilerini sakla
    saveTokens(data.accessToken, data.refreshToken);
    saveUser(data.user);

    return data;
  } catch (error) {
    console.error('Kayıt hatası:', error);
    throw error;
  }
};

/**
 * Kullanıcı girişi
 * @param {Object} credentials - Kullanıcı kimlik bilgileri
 * @returns {Promise} Yanıt verisi
 */
authAPI.login = async function(credentials) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Giriş sırasında bir hata oluştu');
    }

    // Token ve kullanıcı verilerini sakla
    saveTokens(data.accessToken, data.refreshToken);
    saveUser(data.user);

    return data;
  } catch (error) {
    console.error('Giriş hatası:', error);
    throw error;
  }
};

/**
 * Kullanıcı çıkışı
 * @returns {Promise} Çıkış işlemi sonucu
 */
authAPI.logout = async function() {
  try {
    const refreshToken = getRefreshToken();

    if (refreshToken) {
      // Backend'e çıkış bildirimi yap
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify({ refreshToken })
      });
    }

    // Yerel verileri temizle
    clearTokens();
    clearUser();

    return true;
  } catch (error) {
    console.error('Çıkış hatası:', error);
    // Hata olsa bile yerel verileri temizle
    clearTokens();
    clearUser();
    return false;
  }
};

/**
 * Refresh token ile yeni access token al
 * @returns {Promise<string|null>} Yeni access token veya null
 */
async function refreshAccessToken() {
  try {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      return null;
    }

    const response = await fetch(`${API_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Token yenileme hatası');
    }

    // Yeni access token'ı sakla
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);

    return data.accessToken;
  } catch (error) {
    console.error('Token yenileme hatası:', error);
    return null;
  }
}

/**
 * Kullanıcı bilgilerini getir
 * @returns {Promise} Kullanıcı verileri
 */
authAPI.getProfile = async function() {
  try {
    const response = await fetchWithAuth(`${API_URL}/auth/me`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Profil bilgileri alınamadı');
    }

    // Kullanıcı verilerini güncelle
    saveUser(data.data);

    return data.data;
  } catch (error) {
    console.error('Profil getirme hatası:', error);
    throw error;
  }
};

/**
 * Profil bilgilerini güncelle
 * @param {Object} profileData - Güncellenecek profil verileri
 * @returns {Promise} Güncellenmiş kullanıcı verileri
 */
authAPI.updateProfile = async function(profileData) {
  try {
    const response = await fetchWithAuth(`${API_URL}/users/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Profil güncellenemedi');
    }

    // Kullanıcı verilerini güncelle
    saveUser(data.data);

    return data.data;
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    throw error;
  }
};

/**
 * Şifre değiştir
 * @param {Object} passwordData - Şifre değiştirme verileri
 * @returns {Promise} Yanıt verisi
 */
authAPI.changePassword = async function(passwordData) {
  try {
    const response = await fetchWithAuth(`${API_URL}/auth/password`, {
      method: 'PUT',
      body: JSON.stringify(passwordData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Şifre değiştirilemedi');
    }

    return data;
  } catch (error) {
    console.error('Şifre değiştirme hatası:', error);
    throw error;
  }
};

/**
 * Şifre sıfırlama e-postası iste
 * @param {string} email - Kullanıcının e-posta adresi
 * @returns {Promise} Yanıt verisi
 */
authAPI.forgotPassword = async function(email) {
  try {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Şifre sıfırlama isteği gönderilemedi');
    }

    return data;
  } catch (error) {
    console.error('Şifre sıfırlama isteği hatası:', error);
    throw error;
  }
};

/**
 * Token ile şifre sıfırla
 * @param {string} token - Şifre sıfırlama token'ı
 * @param {Object} passwordData - Yeni şifre verileri
 * @returns {Promise} Yanıt verisi
 */
authAPI.resetPassword = async function(token, passwordData) {
  try {
    const response = await fetch(`${API_URL}/auth/reset-password/${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(passwordData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Şifre sıfırlanamadı');
    }

    return data;
  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    throw error;
  }
};

/**
 * Güvenlik sorusu ile şifre sıfırla
 * @param {Object} securityData - Güvenlik sorusu ve yeni şifre verileri
 * @returns {Promise} Yanıt verisi
 */
authAPI.resetBySecurityQuestion = async function(securityData) {
  try {
    const response = await fetch(`${API_URL}/auth/reset-by-security`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(securityData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Şifre sıfırlanamadı');
    }

    return data;
  } catch (error) {
    console.error('Güvenlik sorusu ile sıfırlama hatası:', error);
    throw error;
  }
};

/**
 * Abonelik planını güncelle
 * @param {string} plan - Abonelik planı
 * @returns {Promise} Güncellenmiş abonelik verileri
 */
authAPI.updateSubscription = async function(plan) {
  try {
    const response = await fetchWithAuth(`${API_URL}/users/subscription`, {
      method: 'PUT',
      body: JSON.stringify({ plan })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Abonelik güncellenemedi');
    }

    // Kullanıcı verilerini güncelle
    const user = getUser();
    if (user) {
      user.subscription = data.data.subscription;
      saveUser(user);
    }

    return data.data;
  } catch (error) {
    console.error('Abonelik güncelleme hatası:', error);
    throw error;
  }
};

/**
 * Auth token ile API isteği yap
 * @param {string} url - İstek URL'si
 * @param {Object} options - Fetch seçenekleri
 * @returns {Promise} Fetch yanıtı
 */
async function fetchWithAuth(url, options = {}) {
  // İlk olarak token'ı al
  let token = getAccessToken();

  // Eğer token yoksa, null dön
  if (!token) {
    // Token yenilemeyi dene
    token = await refreshAccessToken();
    
    // Hala token yoksa, çıkış yap ve hatayı bildir
    if (!token) {
      authAPI.logout();
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
    const newToken = await refreshAccessToken();
    
    // Eğer yeni token alınamazsa, çıkış yap ve hatayı bildir
    if (!newToken) {
      authAPI.logout();
      throw new Error('Oturum süresi dolmuş, lütfen tekrar giriş yapın');
    }
    
    // Yeni token ile tekrar istek yap
    fetchOptions.headers.Authorization = `Bearer ${newToken}`;
    return fetch(url, fetchOptions);
  }

  return response;
}

/**
 * Kullanıcı başarılı giriş/kayıt sonrası yönlendirme
 * @returns {string} Yönlendirilecek URL
 */
authAPI.getRedirectUrl = function() {
  return APP_URL;
};

/**
 * Veritabanı yapılandırmasını getir
 * Bu fonksiyon sadece sunucu tarafında kullanılmalıdır.
 * @returns {Object} Veritabanı yapılandırması
 */
authAPI.getDbConfig = function() {
  // Bu fonksiyon normalde istemci tarafında çağrılmamalıdır.
  // Sunucu tarafı kodunda kullanılmak üzere eklenmiştir.
  return DB_CONFIG;
};

// Yardımcı fonksiyonlar

/**
 * Tokenları sakla
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token
 */
function saveTokens(accessToken, refreshToken) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

/**
 * Access token'ı getir
 * @returns {string|null} Access token
 */
function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Refresh token'ı getir
 * @returns {string|null} Refresh token
 */
function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Tokenları temizle
 */
function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Kullanıcı verilerini sakla
 * @param {Object} user - Kullanıcı verileri
 */
function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Kullanıcı verilerini getir
 * @returns {Object|null} Kullanıcı verileri
 */
function getUser() {
  const userJson = localStorage.getItem(USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
}

/**
 * Kullanıcı verilerini temizle
 */
function clearUser() {
  localStorage.removeItem(USER_KEY);
}

/**
 * Kullanıcının giriş yapmış olup olmadığını kontrol et
 * @returns {boolean} Giriş yapılmış mı
 */
authAPI.isLoggedIn = function() {
  return !!getAccessToken() && !!getUser();
};

// Sayfa yüklendiğinde doğrudan authAPI'yi window nesnesine ata
window.authAPI = authAPI;

// DOMContentLoaded olayını dinleyerek API'nin hazır olduğunu kontrol et
document.addEventListener('DOMContentLoaded', function() {
  if (!window.authAPI) {
    console.error('authAPI yüklenemedi! Sayfa yeniden yükleniyor...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
});

// Hata yönetimi için olay dinleyicisi
window.addEventListener('error', function(event) {
  if (event.message && event.message.includes('Cannot read properties of undefined (reading \'register\')')) {
    console.error('authAPI hazır değil! Sayfa yeniden yükleniyor...');
    if (!window.authAPIErrorCount) window.authAPIErrorCount = 0;
    window.authAPIErrorCount++;
    
    if (window.authAPIErrorCount < 3) {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }
});

// API hazır olduğunda custom event tetikle
const authAPIReadyEvent = new CustomEvent('authAPIReady');
document.dispatchEvent(authAPIReadyEvent);

console.log('authAPI modülü yüklendi ve hazır!');
