// Input validation middleware utilities

const validateEmail = (email) => {
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return emailRegex.test(email) && email.length <= 100;
};

const validatePassword = (password) => {
    return password && password.length >= 8 && password.length <= 128;
};

const validateCoordinates = (coords) => {
    if (!coords || typeof coords !== 'object') return false;
    const { latitude, longitude } = coords;
    return typeof latitude === 'number' && typeof longitude === 'number' &&
           latitude >= -90 && latitude <= 90 &&
           longitude >= -180 && longitude <= 180;
};

const validateRating = (rating) => {
    return typeof rating === 'number' && rating >= 1 && rating <= 5;
};

const validateToiletData = (data) => {
    const errors = [];
    
    // Required fields
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Name is required and must be a non-empty string');
    }
    
    if (!data.location || typeof data.location !== 'string' || data.location.trim().length === 0) {
        errors.push('Location is required and must be a non-empty string');
    }
    
    // Optional but validated fields
    if (data.coordinates && !validateCoordinates(data.coordinates)) {
        errors.push('Coordinates must be valid latitude/longitude values');
    }
    
    if (data.facilities && !Array.isArray(data.facilities)) {
        errors.push('Facilities must be an array');
    }
    
    if (data.type && !['public', 'private'].includes(data.type)) {
        errors.push('Type must be either "public" or "private"');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

const validateReviewData = (data) => {
    const errors = [];
    
    // Required fields
    if (!data.toiletId) {
        errors.push('toiletId is required');
    }
    
    if (!validateRating(data.rating)) {
        errors.push('Rating must be a number between 1 and 5');
    }
    
    if (!validateRating(data.cleanliness)) {
        errors.push('Cleanliness rating must be a number between 1 and 5');
    }
    
    if (!validateRating(data.maintenance)) {
        errors.push('Maintenance rating must be a number between 1 and 5');
    }
    
    if (!validateRating(data.accessibility)) {
        errors.push('Accessibility rating must be a number between 1 and 5');
    }
    
    // Optional fields
    if (data.comment && typeof data.comment !== 'string') {
        errors.push('Comment must be a string');
    }
    
    if (data.comment && data.comment.length > 1000) {
        errors.push('Comment must be less than 1000 characters');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// Middleware factory functions
const validateBody = (validator) => {
    return (req, res, next) => {
        const result = validator(req.body);
        if (!result.isValid) {
            console.log(`[VALIDATION] Failed validation: ${result.errors.join(', ')}`);
            return res.status(400).json({
                message: 'Validation failed',
                errors: result.errors
            });
        }
        next();
    };
};

const sanitizeString = (field, maxLength = 255) => {
    return (req, res, next) => {
        if (req.body[field] && typeof req.body[field] === 'string') {
            req.body[field] = req.body[field].trim().substring(0, maxLength);
        }
        next();
    };
};

module.exports = {
    validateEmail,
    validatePassword,
    validateCoordinates,
    validateRating,
    validateToiletData,
    validateReviewData,
    validateBody,
    sanitizeString
};