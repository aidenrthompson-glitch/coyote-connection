export const ALLOWED_EMAIL_DOMAIN = "@yotes.collegeofidaho.edu"; // <-- change if needed

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isAllowedEmail(email: string) {
  return normalizeEmail(email).endsWith(ALLOWED_EMAIL_DOMAIN);
}
