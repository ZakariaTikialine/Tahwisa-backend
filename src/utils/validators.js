const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

const validateMatricule = (matricule) => {
    const matriculeRegex = /^[A-Za-z0-9]{3,20}$/;
    return matriculeRegex.test(matricule);
};

const validatePhone = (phone) => {
    const phoneRegex = /^[\+]?[0-9]{10,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

const validateName = (name) => {
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]{2,50}$/;
    return nameRegex.test(name);
};

const validateStructure = (structure) => {
    const validStructures = ['IT', 'HR', 'Finance', 'Marketing', 'Operations', 'Sales'];
    return validStructures.includes(structure);
};

module.exports = {
    validateEmail,
    validatePassword,
    validateMatricule,
    validatePhone,
    validateName,
    validateStructure
};
