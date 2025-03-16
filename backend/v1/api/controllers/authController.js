/**
 * Kimlik doğrulama controller'ları
 */
const User = require('../models/User');
const Token = require('../models/Token');
const logger = require('../utils/logger');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

/**
 * @desc    Kullanıcı kaydı
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const {
      nickname,
      email,
      password,
      country_code: countryCode,
      phone,
      security_question: securityQuestion,
      security_answer: securityAnswer
    } = req.body;

    // E-posta adresi veya kullanıcı adı zaten kayıtlı mı kontrol et
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        error: 'Bu e-posta adresi zaten kullanılıyor'
      });
    }

    const nicknameExists = await User.findOne({ nickname });
    if (nicknameExists) {
      return res.status(400).json({
        success: false,
        error: 'Bu kullanıcı adı zaten kullanılıyor'
      });
    }

    // Yeni kullanıcı oluştur
    const user = await User.create({
      nickname,
      email,
      password,
      countryCode,
      phone,
      securityQuestion,
      securityAnswer
    });

    // Başarılı kayıt olma durumunda token oluştur
    sendTokenResponse(user, 201, res);
    
  } catch (error) {
    logger.error(`Kayıt hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Kayıt işlemi sırasında bir hata oluştu'
    });
  }
};

/**
 * @desc    Kullanıcı girişi
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // E-posta ve şifre kontrol et
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'E-posta ve şifre gereklidir'
      });
    }

    // Şifre ile birlikte kullanıcıyı bul
    const user = await User.findOne({ email }).select('+password');

    // Kullanıcı yoksa hata
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Geçersiz kullanıcı bilgileri'
      });
    }

    // Şifre doğrulaması yap
    const isMatch = await user.matchPassword(password);

    // Şifre yanlışsa hata
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Geçersiz kullanıcı bilgileri'
      });
    }

    // Token oluştur ve gönder
    sendTokenResponse(user, 200, res);
    
  } catch (error) {
    logger.error(`Giriş hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Giriş sırasında bir hata oluştu'
    });
  }
};

/**
 * @desc    Kullanıcı çıkışı
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
exports.logout = async (req, res) => {
  try {
    // Refresh token'ı al (varsa)
    const refreshToken = req.body.refreshToken;

    if (refreshToken) {
      // Refresh token'ı veritabanında bul ve geçersiz yap
      await Token.findOneAndUpdate(
        { token: refreshToken, type: 'refresh' },
        { isRevoked: true }
      );
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error(`Çıkış hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Çıkış sırasında bir hata oluştu'
    });
  }
};

/**
 * @desc    Refresh token ile yeni access token al
 * @route   POST /api/v1/auth/refresh
 * @access  Public
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token gereklidir'
      });
    }

    // Refresh token'ı veritabanında kontrol et
    const storedToken = await Token.findOne({
      token: refreshToken,
      type: 'refresh',
      isRevoked: false
    });

    // Token yoksa veya iptal edildiyse
    if (!storedToken) {
      return res.status(401).json({
        success: false,
        error: 'Geçersiz refresh token'
      });
    }

    // Token'ın geçerlilik süresi kontrol edilir
    if (storedToken.expiresAt < Date.now()) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token süresi dolmuş'
      });
    }

    // Token'ı doğrula
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Geçersiz refresh token'
      });
    }

    // Kullanıcıyı bul
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }

    // Yeni access token oluştur
    const accessToken = generateAccessToken({ id: user._id });

    res.status(200).json({
      success: true,
      accessToken,
      expiresIn: process.env.JWT_EXPIRE
    });
  } catch (error) {
    logger.error(`Refresh token hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Token yenileme sırasında bir hata oluştu'
    });
  }
};

/**
 * @desc    Mevcut kullanıcı bilgilerini getir
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error(`Kullanıcı bilgileri hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Kullanıcı bilgileri alınırken bir hata oluştu'
    });
  }
};

/**
 * @desc    Şifre değiştirme
 * @route   PUT /api/v1/auth/password
 * @access  Private
 */
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Şifre alanları dolu mu kontrol et
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Mevcut şifre ve yeni şifre alanları gereklidir'
      });
    }

    // Şifre ile birlikte kullanıcıyı bul
    const user = await User.findById(req.user.id).select('+password');

    // Mevcut şifreyi doğrula
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Mevcut şifre yanlış'
      });
    }

    // Şifreyi güncelle
    user.password = newPassword;
    await user.save();

    // Token oluştur ve gönder
    sendTokenResponse(user, 200, res);
  } catch (error) {
    logger.error(`Şifre güncelleme hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Şifre güncellenirken bir hata oluştu'
    });
  }
};

/**
 * Token oluştur ve yanıt olarak gönder
 * @param {Object} user - Kullanıcı objesi
 * @param {Number} statusCode - HTTP durum kodu
 * @param {Object} res - Response objesi
 */
const sendTokenResponse = async (user, statusCode, res) => {
  // Access token ve refresh token oluştur
  const accessToken = generateAccessToken({ id: user._id });
  const refreshToken = generateRefreshToken({ id: user._id });

  // Refresh token son kullanma tarihini hesapla
  const refreshExpire = process.env.JWT_REFRESH_EXPIRE;
  const refreshExpireDate = new Date(
    Date.now() + ms(refreshExpire)
  );

  // Refresh token'ı veritabanına kaydet
  await Token.create({
    token: refreshToken,
    user: user._id,
    type: 'refresh',
    expiresAt: refreshExpireDate
  });

  res.status(statusCode).json({
    success: true,
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      nickname: user.nickname,
      email: user.email,
      role: user.role,
      subscription: user.subscription
    },
    expiresIn: process.env.JWT_EXPIRE
  });
};

// ms string'ini milisaniyeye çevir (örn: "7d" -> 604800000)
function ms(val) {
  const s = 1000;
  const m = s * 60;
  const h = m * 60;
  const d = h * 24;
  const w = d * 7;
  const y = d * 365.25;

  const match = /^(-?(?:\d+)?\.?\d+) *(ms|s|m|h|d|w|y)?$/i.exec(val);
  if (!match) return 0;

  const n = parseFloat(match[1]);
  const type = (match[2] || 'ms').toLowerCase();
  
  switch (type) {
    case 'y': return n * y;
    case 'w': return n * w;
    case 'd': return n * d;
    case 'h': return n * h;
    case 'm': return n * m;
    case 's': return n * s;
    default: return n;
  }
}
