/**
 * Şifre sıfırlama sayfası JavaScript kodu
 */
document.addEventListener('DOMContentLoaded', function() {
  const forgotPasswordForm = document.getElementById('forgot-password-form');
  const resetBySecurityForm = document.getElementById('reset-by-security-form');
  const resetPasswordForm = document.getElementById('reset-password-form');
  
  // Şifre sıfırlama e-postası isteği formu
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      // Form içindeki verileri al
      const email = document.getElementById('email').value;
      
      try {
        // Şifre sıfırlama e-postası gönderme isteği
        const response = await window.authAPI.forgotPassword(email);
        
        // Başarılı şifre sıfırlama e-postası isteği
        showMessage('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi');
        
        // Geliştirme modunda: Şifre sıfırlama bağlantısını konsola yaz
        if (response.data && response.data.resetUrl) {
          console.log('Şifre sıfırlama URL:', response.data.resetUrl);
        }
        
      } catch (error) {
        showMessage(error.message || 'Şifre sıfırlama sırasında bir hata oluştu', true);
      }
    });
  }
  
  // Güvenlik sorusu ile şifre sıfırlama formu
  if (resetBySecurityForm) {
    resetBySecurityForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      // Form içindeki verileri al
      const formData = {
        email: document.getElementById('security-email').value,
        security_question: document.getElementById('security-question').value,
        security_answer: document.getElementById('security-answer').value,
        password: document.getElementById('new-password').value,
        password2: document.getElementById('confirm-password').value
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
      
      try {
        // Güvenlik sorusu ile şifre sıfırlama isteği
        const response = await window.authAPI.resetBySecurityQuestion(formData);
        
        // Başarılı şifre sıfırlama
        showMessage('Şifreniz başarıyla sıfırlandı! Yönlendiriliyorsunuz...');
        
        // 2 saniye sonra giriş sayfasına yönlendir
        setTimeout(() => {
          window.location.href = 'signin.html';
        }, 2000);
        
      } catch (error) {
        showMessage(error.message || 'Şifre sıfırlama sırasında bir hata oluştu', true);
      }
    });
  }
  
  // Token ile şifre sıfırlama formu
  if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      // URL'den token'ı al
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      if (!token) {
        showMessage('Geçersiz veya eksik token', true);
        return;
      }
      
      // Form içindeki verileri al
      const formData = {
        password: document.getElementById('password').value,
        password2: document.getElementById('password2').value
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
      
      try {
        // Token ile şifre sıfırlama isteği
        const response = await window.authAPI.resetPassword(token, formData);
        
        // Başarılı şifre sıfırlama
        showMessage('Şifreniz başarıyla sıfırlandı! Yönlendiriliyorsunuz...');
        
        // 2 saniye sonra giriş sayfasına yönlendir
        setTimeout(() => {
          window.location.href = 'signin.html';
        }, 2000);
        
      } catch (error) {
        showMessage(error.message || 'Şifre sıfırlama sırasında bir hata oluştu', true);
      }
    });
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
  
  // Şifre kuralları kontrolünü güncelleme
  const newPasswordInput = document.getElementById('new-password');
  if (newPasswordInput) {
    newPasswordInput.addEventListener('input', function() {
      const password = this.value;
      
      // Kuralları kontrol et
      document.getElementById('rule-length').classList.toggle('valid', password.length >= 8);
      document.getElementById('rule-uppercase').classList.toggle('valid', /[A-Z]/.test(password));
      document.getElementById('rule-lowercase').classList.toggle('valid', /[a-z]/.test(password));
      document.getElementById('rule-number').classList.toggle('valid', /[0-9]/.test(password));
      document.getElementById('rule-special').classList.toggle('valid', /[!@#$%^&*(),.?":{}|<>]/.test(password));
    });
  }
});
