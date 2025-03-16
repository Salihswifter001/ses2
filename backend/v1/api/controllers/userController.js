/**
 * Kullanıcı işlemleri controller'ları
 */
const User = require('../models/User');
const logger = require('../utils/logger');
const activityLogger = require('../utils/activityLogger');
const config = require('../config/default');
const { validateUsername } = require('../utils/authUtils');

/**
 * @desc    Tüm kullanıcıları getir (admin için)
 * @route   GET /api/v1/users
 * @access  Private/Admin
 */
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-__v');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    logger.error(`Kullanıcıları getirme hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Kullanıcılar getirilirken bir hata oluştu'
    });
  }
};

/**
 * @desc    Kullanıcı detaylarını getir (admin için)
 * @route   GET /api/v1/users/:id
 * @access  Private/Admin
 */
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-__v');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error(`Kullanıcı getirme hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Kullanıcı getirilirken bir hata oluştu'
    });
  }
};

/**
 * @desc    Kullanıcı bilgilerini güncelle
 * @route   PUT /api/v1/users/profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      nickname: req.body.nickname,
      countryCode: req.body.countryCode,
      phone: req.body.phone,
      updatedAt: Date.now()
    };
    
    // Sadece tanımlı olan alanları güncelle
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );
    
    // Kullanıcı adı değişiyorsa, benzersiz olup olmadığını kontrol et
    if (fieldsToUpdate.nickname && fieldsToUpdate.nickname !== req.user.nickname) {
      // Kullanıcı adı doğrulaması
      const usernameValidation = validateUsername(fieldsToUpdate.nickname);
      if (!usernameValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: usernameValidation.message
        });
      }
      
      const nicknameExists = await User.findOne({ 
        nickname: fieldsToUpdate.nickname,
        _id: { $ne: req.user._id } 
      });
      
      if (nicknameExists) {
        return res.status(400).json({
          success: false,
          error: 'Bu kullanıcı adı zaten kullanılıyor'
        });
      }
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }
    
    // Profil güncellemesini günlüğe ekle
    await activityLogger.logProfileUpdate(user, req, fieldsToUpdate);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error(`Profil güncelleme hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Profil güncellenirken bir hata oluştu'
    });
  }
};

/**
 * @desc    Abonelik planını güncelle
 * @route   PUT /api/v1/users/subscription
 * @access  Private
 */
exports.updateSubscription = async (req, res) => {
  try {
    const { plan } = req.body;
    
    // Plan türünü kontrol et
    if (!plan || !['free', 'starter', 'plus', 'pro'].includes(plan)) {
      return res.status(400).json({
        success: false,
        error: 'Geçerli bir abonelik planı seçiniz'
      });
    }
    
    // Planı al
    const planDetails = config.subscriptionPlans[plan];
    if (!planDetails && plan !== 'free') {
      return res.status(400).json({
        success: false,
        error: 'Geçerli bir abonelik planı seçiniz'
      });
    }
    
    // Abonelik başlangıç ve bitiş tarihlerini hesapla (1 ay)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    
    const subscription = {
      plan,
      startDate,
      endDate
    };
    
    // Kullanıcının aboneliğini güncelle
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { subscription },
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }
    
    // Abonelik değişikliğini günlüğe ekle
    await activityLogger.logSubscriptionChange(user, req, plan);
    
    res.status(200).json({
      success: true,
      data: {
        subscription: user.subscription,
        plan: plan === 'free' ? {
          id: 'free',
          name: 'Free',
          price: 0,
          currency: 'TRY',
          features: {
            dailyLimit: 3,
            aiMusicLevel: 'basic',
            support: 'standard'
          }
        } : planDetails
      }
    });
  } catch (error) {
    logger.error(`Abonelik güncelleme hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Abonelik güncellenirken bir hata oluştu'
    });
  }
};

/**
 * @desc    Kullanıcıyı sil (admin için)
 * @route   DELETE /api/v1/users/:id
 * @access  Private/Admin
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }
    
    // Admin kendisini silemesin
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Kendi hesabınızı silemezsiniz'
      });
    }
    
    await user.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error(`Kullanıcı silme hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Kullanıcı silinirken bir hata oluştu'
    });
  }
};
