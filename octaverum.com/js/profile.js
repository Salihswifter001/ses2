/**
 * Profil sayfası JavaScript kodu
 */
document.addEventListener('DOMContentLoaded', async function() {
  // Kullanıcı giriş yapmış mı kontrol et
  const isLoggedIn = window.authAPI && window.authAPI.isLoggedIn();
  
  if (!isLoggedIn) {
    // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
    showMessage('Bu sayfayı görüntülemek için giriş yapmalısınız', true);
    
    setTimeout(() => {
      window.location.href = 'signin.html';
    }, 2000);
    return;
  }
  
  // Profil bilgilerini getir
  try {
    const profileInfo = document.getElementById('profile-info');
    const subscriptionDetails = document.getElementById('subscription-details');
    const editProfileForm = document.getElementById('edit-profile-form');
    const changePasswordForm = document.getElementById('change-password-form');
    
    // Profil bilgilerini al
    const user = await window.authAPI.getProfile();
    
    // Profil bilgilerini göster
    if (profileInfo) {
      profileInfo.innerHTML = `
        <div class="profile-header">
          <div class="profile-info">
            <h2 class="profile-nickname">${user.nickname}</h2>
            <p class="profile-email">${user.email}</p>
            <p class="profile-phone">${user.countryCode} ${user.phone}</p>
          </div>
        </div>
      `;
    }
    
    // Abonelik bilgilerini göster
    if (subscriptionDetails) {
      const planNames = {
        'free': 'Ücretsiz',
        'starter': 'Starter',
        'plus': 'Plus',
        'pro': 'Pro'
      };
      
      const planName = planNames[user.subscription?.plan || 'free'];
      const startDate = user.subscription?.startDate ? new Date(user.subscription.startDate).toLocaleDateString('tr-TR') : '-';
      const endDate = user.subscription?.endDate ? new Date(user.subscription.endDate).toLocaleDateString('tr-TR') : '-';
      
      subscriptionDetails.innerHTML = `
        <div class="subscription-item">
          <span class="item-label">Plan:</span>
          <span class="item-value">${planName}</span>
        </div>
        <div class="subscription-item">
          <span class="item-label">Başlangıç Tarihi:</span>
          <span class="item-value">${startDate}</span>
        </div>
        <div class="subscription-item">
          <span class="item-label">Bitiş Tarihi:</span>
          <span class="item-value">${endDate}</span>
        </div>
      `;
    }
    
    // Form alanlarını doldur
    if (editProfileForm) {
      document.getElementById('nickname').value = user.nickname;
      document.getElementById('country-code').value = user.countryCode;
      document.getElementById('phone').value = user.phone;
    }
    
    // Profil düzenleme butonuna tıklama
    const editProfileButton = document.getElementById('edit-profile-button');
    if (editProfileButton) {
      editProfileButton.addEventListener('click', function() {
        editProfileForm.style.display = 'block';
        if (changePasswordForm) changePasswordForm.style.display = 'none';
      });
    }
    
    // Şifre değiştirme butonuna tıklama
    const changePasswordButton = document.getElementById('change-password-button');
    if (changePasswordButton) {
      changePasswordButton.addEventListener('click', function() {
        if (changePasswordForm) changePasswordForm.style.display = 'block';
        editProfileForm.style.display = 'none';
      });
    }
    
    // İptal butonları
    const cancelEditButton = document.getElementById('cancel-edit');
    if (cancelEditButton) {
      cancelEditButton.addEventListener('click', function() {
        editProfileForm.style.display = 'none';
      });
    }
    
    const cancelPasswordButton = document.getElementById('cancel-password');
    if (cancelPasswordButton) {
      cancelPasswordButton.addEventListener('click', function() {
        if (changePasswordForm) changePasswordForm.style.display = 'none';
      });
    }
    
    // Profil düzenleme form gönderimi
    if (editProfileForm) {
      editProfileForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const formData = {
          nickname: document.getElementById('nickname').value,
          countryCode: document.getElementById('country-code').value,
          phone: document.getElementById('phone').value
        };
        
        try {
          const updatedUser = await window.authAPI.updateProfile(formData);
          
          showMessage('Profil bilgileri güncellendi');
          
          // Sayfayı yenile
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (error) {
          showMessage(error.message || 'Profil güncellenirken bir hata oluştu', true);
        }
      });
    }
    
    // Şifre değiştirme form gönderimi
    if (changePasswordForm) {
      changePasswordForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (newPassword !== confirmPassword) {
          showMessage('Yeni şifreler eşleşmiyor', true);
          return;
        }
        
        // Şifre gücünü kontrol et
        if (!validatePassword(newPassword)) {
          return;
        }
        
        try {
          await window.authAPI.changePassword({
            currentPassword,
            newPassword
          });
          
          showMessage('Şifreniz başarıyla değiştirildi');
          
          // Formu temizle ve kapat
          changePasswordForm.reset();
          changePasswordForm.style.display = 'none';
        } catch (error) {
          showMessage(error.message || 'Şifre değiştirme sırasında bir hata oluştu', true);
        }
      });
    }
    
  } catch (error) {
    showMessage('Profil bilgileri alınamadı. Lütfen tekrar giriş yapın.', true);
    
    // Giriş sayfasına yönlendir
    setTimeout(() => {
      window.location.href = 'signin.html';
    }, 2000);
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
});
