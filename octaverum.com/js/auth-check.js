/**
 * Giriş durumunu kontrol eden ve navbar'ı güncelleyen JavaScript
 */
document.addEventListener('DOMContentLoaded', function() {
  updateNavbarForAuth();
  
  /**
   * Kullanıcının giriş durumuna göre navbar'ı güncelle
   */
  function updateNavbarForAuth() {
    // Giriş durumunu kontrol et
    const isLoggedIn = window.authAPI && window.authAPI.isLoggedIn();
    const navbar = document.querySelector('.navbar ul');
    
    if (navbar) {
      // Navbar'daki elemanları güncelle
      if (isLoggedIn) {
        // Giriş yapılmışsa "Giriş yap" yerine "Profil" ve "Çıkış yap" göster
        
        // Önce "Giriş yap" linkini bul
        const signinLi = Array.from(navbar.querySelectorAll('li')).find(
          li => li.querySelector('a[href="signin.html"]')
        );
        
        if (signinLi) {
          // "Giriş yap" linkini "Profil" ile değiştir
          signinLi.innerHTML = '<a href="profiles.html">Profil</a>';
          
          // "Çıkış yap" linki ekle
          const logoutLi = document.createElement('li');
          logoutLi.innerHTML = '<a href="#" id="logout-link">Çıkış yap</a>';
          navbar.appendChild(logoutLi);
          
          // Çıkış yapma işlemi
          document.getElementById('logout-link').addEventListener('click', async function(event) {
            event.preventDefault();
            
            try {
              await window.authAPI.logout();
              showMessage('Çıkış yapıldı! Yönlendiriliyorsunuz...');
              
              // 2 saniye sonra sayfayı yenile
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            } catch (error) {
              console.error('Çıkış hatası:', error);
              showMessage('Çıkış yapılırken bir hata oluştu', true);
            }
          });
        }
      }
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
