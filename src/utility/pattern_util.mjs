const PatternUtil = {
  // Method to check if a password has a length greater than 8 characters
  checkPasswordLength: (password) => {
    return password.length >= 8;
  },

  // Method to check if the email has a valid pattern
  checkEmailPattern: (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  },

  // Method to check if a name consists of only alphabets
  checkAlphabeticName: (name) => {
    const alphabeticPattern = /^[a-zA-Z ]+$/;
    return alphabeticPattern.test(name);
  },

  // Method to check if a phone number consists of only digits
  checkPhoneNumber: (phoneNumber) => {
    const numericPattern = /^\d+$/;
    return numericPattern.test(phoneNumber);
  },

  // Method to filter values pairs from an object
  filterParametersFromObject: (object, params) => {
    const objectWithoutParams = Object.fromEntries(
      Object.entries(object).filter(([key]) => !params.includes(key))
    );
    return objectWithoutParams;
  },

  keepParametersFromObject: (object, paramsToKeep) => {
    const objectWithFilteredParams = Object.fromEntries(
      Object.entries(object).filter(([key]) => paramsToKeep.includes(key))
    );
    return objectWithFilteredParams;
  },

  // Method to generate a random string
  // Must be used with a DB check to ensure uniqueness
  generateRandomCode() {
    const characters = "0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  },

  // Rename keys in any object by
  // const renamedObject = PatternUtil.renameKeys({firstName: john}, {firstname: FirstName});
  renameKeys: (object, keyMap) => {
    const renamedObject = {};
    Object.keys(object).forEach((key) => {
      const newKey = keyMap[key] || key;
      renamedObject[newKey] = object[key];
    });
    return renamedObject;
  },
};

export default PatternUtil;
