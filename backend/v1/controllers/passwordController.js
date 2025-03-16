/**
 * Şifre sıfırlama işlemleri
 */
const crypto = require('crypto');
const User = require('../models/User');
const Token = require('../models/Token');
const logger = require('../utils/logger');

/**
 * @desc    Şifre sıfırlama isteği oluştur
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'E-posta adresi gereklidir'
      });
    }

    // Kullanıcıyı e-posta ile bul
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı'
      });
    }

    // Şifre sıfırlama için benzersiz token oluştur
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Token'ın son kullanma tarihini hesapla (1 saat)
    const expiresAt = new Date(Date.now() + 3600000); // 1 saat (3600000 ms)

    // Token'ı veritabanına kaydet
    await Token.create({
      token: hashedToken,
      user: user._id,
      type: 'reset',
      expiresAt
    });

    // Şifre sıfırlama URL'si oluştur
    // Not: Gerçek bir uygulamada bu URL frontend URL'sine yönlendirilir
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

    // NOT: Gerçek bir uygulamada e-posta gönderimi burada yapılır
    // Bu örnekte sadece simüle ediyoruz

    res.status(200).json({
      success: true,
      message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi',
      data: {
        resetUrl, // Gerçek uygulamada bu URL dönülmez, sadece geliştirme amaçlı
        expiresIn: '1 saat'
      }
    });

  } catch (error) {
    logger.error(`Şifre sıfırlama hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Şifre sıfırlama işlemi sırasında bir hata oluştu'
    });
  }
};

/**
 * @desc    Şifre sıfırlama
 * @route   POST /api/v1/auth/reset-password/:token
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Token ve yeni şifre gereklidir'
      });
    }

    // Token'ı hash'le
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Geçerli bir token olup olmadığını kontrol et
    const resetToken = await Token.findOne({
      token: hashedToken,
      type: 'reset',
      expiresAt: { $gt: Date.now() },
      isRevoked: false
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz veya süresi dolmuş token'
      });
    }

    // Kullanıcıyı bul
    const user = await User.findById(resetToken.user);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }

    // Şifreyi güncelle
    user.password = password;
    await user.save();

    // Token'ı kullanılmış olarak işaretle
    resetToken.isRevoked = true;
    await resetToken.save();

    res.status(200).json({
      success: true,
      message: 'Şifreniz başarıyla sıfırlandı'
    });
  } catch (error) {
    logger.error(`Şifre sıfırlama hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Şifre sıfırlama işlemi sırasında bir hata oluştu'
    });
  }
};

/**
 * @desc    Güvenlik sorusu ile şifre sıfırlama
 * @route   POST /api/v1/auth/reset-by-security
 * @access  Public
 */
exports.resetBySecurityQuestion = async (req, res) => {
  try {
    const { email, security_question, security_answer, password } = req.body;

    // Tüm alanların dolu olduğunu kontrol et
    if (!email || !security_question || !security_answer || !password) {
      return res.status(400).json({
        success: false,
        error: 'Tüm alanlar doldurulmalıdır'
      });
    }

    // Kullanıcıyı e-posta ile bul ve güvenlik sorusu cevabını al
    const user = await User.findOne({ email }).select('+securityAnswer');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı'
      });
    }

    // Güvenlik sorusunun doğru olup olmadığını kontrol et
    if (user.securityQuestion !== security_question) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz güvenlik sorusu'
      });
    }

    // Güvenlik sorusu cevabını kontrol et (case insensitive)
    if (user.securityAnswer.toLowerCase() !== security_answer.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'Güvenlik sorusu cevabı yanlış'
      });
    }

    // Şifreyi güncelle
    user.password = password;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Şifreniz başarıyla sıfırlandı'
    });
  } catch (error) {
    logger.error(`Güvenlik sorusu ile şifre sıfırlama hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Şifre sıfırlama işlemi sırasında bir hata oluştu'
    });
  }
};
