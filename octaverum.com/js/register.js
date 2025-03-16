/**
 * Kayıt olma sayfası JavaScript kodu
 */
document.addEventListener('DOMContentLoaded', function() {
  // authAPI'nin yüklendiğinden emin ol
  if (!window.authAPI) {
    console.error('Auth API yüklenemedi! Lütfen sayfayı yenileyin.');
    return;
  }
  
  const registerForm = document.getElementById('register-form');
  
  if (registerForm) {
    registerForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      try {
        // Form içindeki verileri al
        const formData = {
          nickname: document.getElementById('nickname').value,
          email: document.getElementById('email').value,
          password: document.getElementById('password').value,
          password2: document.getElementById('password2').value,
          country_code: document.getElementById('country_code').value,
          phone: document.getElementById('phone').value,
          security_question: document.getElementById('security_question').value,
          security_answer: document.getElementById('security_answer').value
        };
        
        // Şifrelerin eşleştiğini kontrol et
        if (formData.password !== formData.password2) {
          showMessage('Şifreler eşleşmiyor', true);
          return;
        }
        
        // Şifre gücünü kontrol et
        if (!validatePassword(formData.password)) {
          return;
        }
        
        // Auth API yüklendi mi kontrol et
        if (!window.authAPI || typeof window.authAPI.register !== 'function') {
          showMessage('Sistem hazırlanamadı. Lütfen sayfayı yenileyin.', true);
          console.error('Auth API hazır değil!', window.authAPI);
          return;
        }
        
        // Kayıt işlemini gerçekleştir
        const response = await window.authAPI.register(formData);
        
        // Başarılı kayıt sonrası uygulama sayfasına yönlendir
        showMessage('Kayıt işlemi başarıyla tamamlandı! Yönlendiriliyorsunuz...');
        
        // 2 saniye sonra uygulama sayfasına yönlendir
        setTimeout(() => {
          window.location.href = window.authAPI.getRedirectUrl();
        }, 2000);
      } catch (error) {
        showMessage(error.message || 'Kayıt işlemi sırasında bir hata oluştu', true);
      }
    });
    
    // Şifre gücü kontrolü
    const passwordInput = document.getElementById('password');
    const password2Input = document.getElementById('password2');
    
    if (passwordInput) {
      passwordInput.addEventListener('input', function() {
        validatePasswordStrength(this.value);
      });
    }
    
    if (password2Input) {
      password2Input.addEventListener('input', function() {
        const password = passwordInput.value;
        if (this.value !== password) {
          this.setCustomValidity('Şifreler eşleşmiyor');
        } else {
          this.setCustomValidity('');
        }
      });
    }
  }
  
  /**
   * Şifre gücünü kontrol et
   * @param {string} password - Kontrol edilecek şifre
   * @returns {boolean} Şifre geçerli mi
   */
  function validatePassword(password) {
    if (password.length < 8) {
      showMessage('Şifre en az 8 karakter olmalıdır', true);
      return false;
    }
    
    if (!/[A-Z]/.test(password)) {
      showMessage('Şifre en az bir büyük harf içermelidir', true);
      return false;
    }
    
    if (!/[a-z]/.test(password)) {
      showMessage('Şifre en az bir küçük harf içermelidir', true);
      return false;
    }
    
    if (!/[0-9]/.test(password)) {
      showMessage('Şifre en az bir rakam içermelidir', true);
      return false;
    }
    
    // Özel karakter kontrolü: !@#$%^&*(),.?":{}|<>
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      showMessage('Şifre en az bir özel karakter içermelidir', true);
      return false;
    }
    
    return true;
  }
  
  /**
   * Şifre gücünü görsel olarak göster
   * @param {string} password - Kontrol edilecek şifre
   */
  function validatePasswordStrength(password) {
    // Şifre gücü göstergesi varsa güncelle
    const strengthMeter = document.getElementById('password-strength');
    if (!strengthMeter) return;
    
    let strength = 0;
    
    // Uzunluk kontrolü
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Karakter türü kontrolü
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    // Gücü göstergeye yansıt
    const percentage = (strength / 6) * 100;
    strengthMeter.style.width = `${percentage}%`;
    
    // Renk değiştir
    if (strength < 2) {
      strengthMeter.style.backgroundColor = '#ff3333'; // Zayıf
    } else if (strength < 4) {
      strengthMeter.style.backgroundColor = '#ffa500'; // Orta
    } else {
      strengthMeter.style.backgroundColor = '#33cc33'; // Güçlü
    }
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
