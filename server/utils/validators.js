/**
 * Input Validation Utilities
 * Validates all user inputs to prevent SQL injection and invalid data
 */

const validator = require('validator');

/**
 * Validate email format
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return validator.isEmail(email);
};

/**
 * Validate username (alphanumeric, 3-20 chars)
 */
const validateUsername = (username) => {
  if (!username || typeof username !== 'string') return false;
  return /^[a-zA-Z0-9._-]{3,20}$/.test(username);
};

/**
 * Validate password (min 8 chars, at least 1 uppercase, 1 lowercase, 1 number)
 */
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password) && password.length >= 8;
};

/**
 * Validate latitude (-90 to 90)
 */
const validateLatitude = (lat) => {
  const latitude = parseFloat(lat);
  return !isNaN(latitude) && latitude >= -90 && latitude <= 90;
};

/**
 * Validate longitude (-180 to 180)
 */
const validateLongitude = (lon) => {
  const longitude = parseFloat(lon);
  return !isNaN(longitude) && longitude >= -180 && longitude <= 180;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Check if location is within allowed radius
 */
const isLocationWithinRadius = (userLat, userLon, allowedLat, allowedLon, radiusMeters = 500) => {
  if (!validateLatitude(userLat) || !validateLongitude(userLon) ||
      !validateLatitude(allowedLat) || !validateLongitude(allowedLon)) {
    return false;
  }
  
  const distance = calculateDistance(userLat, userLon, allowedLat, allowedLon);
  return distance <= radiusMeters;
};

/**
 * Sanitize string input
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '').slice(0, 255);
};

/**
 * Validate employee ID (positive integer)
 */
const validateEmployeeId = (id) => {
  const employeeId = parseInt(id);
  return !isNaN(employeeId) && employeeId > 0;
};

/**
 * Validate date format (YYYY-MM-DD)
 */
const validateDateFormat = (dateStr) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
};

/**
 * Validate phone number (basic)
 */
const validatePhoneNumber = (phone) => {
  if (!phone) return true; // Optional field
  return /^\d{10,15}$/.test(phone.replace(/\D/g, ''));
};

module.exports = {
  validateEmail,
  validateUsername,
  validatePassword,
  validateLatitude,
  validateLongitude,
  calculateDistance,
  isLocationWithinRadius,
  sanitizeString,
  validateEmployeeId,
  validateDateFormat,
  validatePhoneNumber
};
