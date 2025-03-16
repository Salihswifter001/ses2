/**
 * Ana sayfa JavaScript kodu
 */
document.addEventListener('DOMContentLoaded', function() {
  // Prompt gönderme işlemi
  const promptButton = document.getElementById('promptButton');
  const promptInput = document.getElementById('promptInput');
  
  if (promptButton && promptInput) {
    promptButton.addEventListener('click', async function() {
      const promptText = promptInput.value.trim();
      
      if (!promptText) {
        showMessage('Lütfen bir prompt girin', true);
        return;
      }
      
      // Kullanıcı giriş yapmış mı kontrol et
      const isLoggedIn = window.authAPI && window.authAPI.isLoggedIn();
      
      if (!isLoggedIn) {
        showMessage('Müzik oluşturmak için giriş yapmalısınız', true);
        
        setTimeout(() => {
          window.location.href = 'signin.html';
        }, 2000);
        return;
      }
      
      // Kullanıcının abonelik planını kontrol et
      const user = window.authAPI.getUser();
      
      // Abonelik planına göre günlük limit kontrolü yapılabilir
      // Bu kısım backend'de de kontrol edilmeli
      
      try {
        // Burada prompt gönderme API isteği yapılacak
        showMessage('Müzik oluşturuluyor, lütfen bekleyin...');
        
        // Simüle edilmiş müzik oluşturma işlemi
        setTimeout(() => {
          showMessage('Müzik başarıyla oluşturuldu!');
          
          // Oluşturulan müziği göster/çal
          // Bu kısım backend entegrasyonuna göre değişecek
        }, 2000);
        
        // API isteği örneği
        /*
        const response = await fetch(`${API_URL}/music/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.authAPI.getAccessToken()}`
          },
          body: JSON.stringify({ prompt: promptText })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Müzik oluşturulamadı');
        }
        
        // Başarılı yanıt
        showMessage('Müzik başarıyla oluşturuldu!');
        
        // Oluşturulan müziği göster/çal
        // Örneğin:
        const audioPlayer = document.createElement('audio');
        audioPlayer.src = data.audioUrl;
        audioPlayer.controls = true;
        document.querySelector('.music-player').appendChild(audioPlayer);
        */
        
      } catch (error) {
        showMessage(error.message || 'Müzik oluşturulurken bir hata oluştu', true);
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
