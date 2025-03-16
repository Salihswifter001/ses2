/**
 * Giriş yapma sayfası JavaScript kodu
 */
document.addEventListener('DOMContentLoaded', function() {
  // authAPI'nin yüklendiğinden emin ol
  if (!window.authAPI) {
    console.error('Auth API yüklenemedi! Lütfen sayfayı yenileyin.');
    return;
  }
  
  const loginForm = document.getElementById('login-form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      try {
        // Form içindeki verileri al
        const formData = {
          email: document.getElementById('email').value,
          password: document.getElementById('password').value
        };
        
        // Auth API yüklendi mi kontrol et
        if (!window.authAPI || typeof window.authAPI.login !== 'function') {
          showMessage('Sistem hazırlanamadı. Lütfen sayfayı yenileyin.', true);
          console.error('Auth API hazır değil!', window.authAPI);
          return;
        }
        
        // Giriş işlemini gerçekleştir
        const response = await window.authAPI.login(formData);
        
        // Başarılı giriş sonrası uygulama sayfasına yönlendir
        showMessage('Giriş başarılı! Yönlendiriliyorsunuz...');
        
        // 2 saniye sonra uygulama sayfasına yönlendir
        setTimeout(() => {
          window.location.href = window.authAPI.getRedirectUrl();
        }, 2000);
      } catch (error) {
        showMessage(error.message || 'Giriş sırasında bir hata oluştu', true);
      }
    });
  }
  
  /**
   * Mesaj göster
   * @param {string} message - Gösterilecek mesaj
   * @param {boolean} isError - Hata mesajı mı
   */
  function showMessage(message, isError = false) {
    const messageElement = document.createElement('div');
    messageElement.className = isError ? 'error-message' : 'success-message';
    messageElement.textContent = message;
    messageElement.style.position = 'fixed';
    messageElement.style.top = '70px';
    messageElement.style.left = '50%';
    messageElement.style.transform = 'translateX(-50%)';
    messageElement.style.padding = '10px 20px';
    messageElement.style.borderRadius = '5px';
    messageElement.style.color = '#fff';
    messageElement.style.backgroundColor = isError ? '#ff3333' : '#33cc33';
    messageElement.style.zIndex = '1000';
    
    document.body.appendChild(messageElement);
    
    // 3 saniye sonra mesajı kaldır
    setTimeout(() => {
      messageElement.remove();
    }, 3000);
  }
});
