// Password phải có:
// - Ít nhất 8 ký tự
// - Ít nhất 1 chữ thường (a-z)
// - Ít nhất 1 chữ hoa (A-Z)
// - Ít nhất 1 số (0-9)
// - Ít nhất 1 ký tự đặc biệt (@#$%^&+=!*)
export const PASSWORD_REGEX = new RegExp(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!*])[A-Za-z\d@#$%^&+=!*]{8,}$/,
);
