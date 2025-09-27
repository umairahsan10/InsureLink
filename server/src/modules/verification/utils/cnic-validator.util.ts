export class CnicValidatorUtil {
  static validate(cnic: string): boolean {
    // Basic CNIC validation logic
    return cnic.length === 13 && /^\d+$/.test(cnic);
  }
}
