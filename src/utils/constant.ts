export const PASSWORD_REGEX = new RegExp(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!*])[A-Za-z\d@#$%^&+=!*]{8,}$/,
);
export enum MeasureUnit {
  GRAM = 'g',
  KILOGRAM = 'kg',
  LITER = 'l',
  MILLILITER = 'ml',
  PIECES = 'pcs',
  TEASPOON = 'tsp',
  TABLESPOON = 'tbsp',
}
