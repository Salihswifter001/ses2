/**
 * JWT ile ilgili yardımcı fonksiyonlar
 */
const jwt = require('jsonwebtoken');

/**
 * Access token oluşturma
 * @param {object} payload - Token içine gömülecek veri
 * @returns {string} JWT token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

/**
 * Refresh token oluşturma
 * @param {object} payload - Token içine gömülecek veri
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE
  });
};

/**
 * Access token doğrulama
 * @param {string} token - Doğrulanacak token
 * @returns {object|null} Doğrulama başarılıysa payload, değilse null
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Refresh token doğrulama
 * @param {string} token - Doğrulanacak refresh token
 * @returns {object|null} Doğrulama başarılıysa payload, değilse null
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
