/**
 * Abonelik sayfası JavaScript kodu
 */
document.addEventListener('DOMContentLoaded', function() {
  const planButtons = document.querySelectorAll('.plan-button');
  
  // Giriş yapılmış mı kontrol et
  const isLoggedIn = window.authAPI && window.authAPI.isLoggedIn();
  
  if (planButtons.length > 0) {
    planButtons.forEach(button => {
      button.addEventListener('click', async function(event) {
        event.preventDefault();
        
        // Kullanıcı giriş yapmamışsa, giriş sayfasına yönlendir
        if (!isLoggedIn) {
          showMessage('Bu işlemi yapabilmek için giriş yapmalısınız', true);
          
          // 2 saniye sonra giriş sayfasına yönlendir
          setTimeout(() => {
            window.location.href = 'signin.html';
          }, 2000);
          return;
        }
        
        // Hangi plan seçildi
        const planId = button.getAttribute('data-plan');
        
        if (!planId) {
          showMessage('Geçersiz abonelik planı', true);
          return;
        }
        
        try {
          // Aboneliği güncelle
          const response = await window.authAPI.updateSubscription(planId);
          
          showMessage(`${planId.toUpperCase()} planına başarıyla abone oldunuz!`);
          
          // 2 saniye sonra profil sayfasına yönlendir
          setTimeout(() => {
            window.location.href = 'profiles.html';
          }, 2000);
        } catch (error) {
          showMessage(error.message || 'Abonelik işlemi sırasında bir hata oluştu', true);
        }
      });
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
