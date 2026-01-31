/**
 * PDF Generator Utility for Aadhaar E-Sign
 * This utility helps generate a base64 encoded PDF document for the e-sign process
 */

/**
 * Sample PDF document in base64 (minimal PDF with text "Onboarding Agreement")
 * This is a minimal valid PDF that can be used for testing
 */
export const samplePDFBase64 = 'JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PC9UaXRsZSAoT25ib2FyZGluZyBBZ3JlZW1lbnQpCi9Qcm9kdWNlciAoQnVyZ2VyIFNpbmdoKT4+CmVuZG9iagozIDAgb2JqCjw8L2NhIDEKL0JNIC9Ob3JtYWw+PgplbmRvYmoKNSAwIG9iago8PC9GaWx0ZXIgL0ZsYXRlRGVjb2RlCi9MZW5ndGggNDQ+PiBzdHJlYW0KeJwzMDQwVzA0AEJDBVMFQwMzBSMDcwUAM0VDBXMFYwNTBQsAKssGCQplbmRzdHJlYW0KZW5kb2JqCjIgMCBvYmoKPDwvVHlwZSAvUGFnZQovUmVzb3VyY2VzIDw8L1Byb2NTZXQgWy9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUldCi9FeHRHU3RhdGUgPDwvRzMgMyAwIFI+Pj4+Ci9NZWRpYUJveCBbMCAwIDU5NSA4NDJdCi9Db250ZW50cyA1IDAgUgovUGFyZW50IDYgMCBSPj4KZW5kb2JqCjYgMCBvYmoKPDwvVHlwZSAvUGFnZXMKL0NvdW50IDEKL0tpZHMgWzIgMCBSXT4+CmVuZG9iago3IDAgb2JqCjw8L1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDYgMCBSPj4KZW5kb2JqCnhyZWYKMCA4CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMTY0IDAwMDAwIG4gCjAwMDAwMDAwODMgMDAwMDAgbiAKMDAwMDAwMDAwMCAwMDAwMCBuIAowMDAwMDAwMTIwIDAwMDAwIG4gCjAwMDAwMDAzMjcgMDAwMDAgbiAKMDAwMDAwMDM4NCAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgOAovUm9vdCA3IDAgUgovSW5mbyAxIDAgUj4+CnN0YXJ0eHJlZgo0MzMKJSVFT0Y=';

/**
 * Generate onboarding agreement PDF content (as text)
 * @param {Object} candidateInfo - Candidate information
 * @returns {string} Agreement text content
 */
export const generateAgreementText = (candidateInfo) => {
  const { name, email, phone, role, outlet } = candidateInfo;
  
  return `
BURGER SINGH ONBOARDING AGREEMENT

This agreement is entered into on ${new Date().toLocaleDateString('en-IN')} between:

Burger Singh (the "Company")
and
${name || '[Name]'} (the "Employee")

Employee Details:
- Name: ${name || '[Name]'}
- Email: ${email || '[Email]'}
- Phone: ${phone || '[Phone]'}
- Role: ${role || '[Role]'}
- Outlet: ${outlet || '[Outlet]'}

Terms and Conditions:

1. Employment: The Employee agrees to work with Burger Singh as a ${role || '[Role]'} at ${outlet || '[Outlet]'}.

2. Duties: The Employee shall perform duties as assigned by the Company.

3. Compensation: The Employee will be paid as per company policy.

4. Confidentiality: The Employee agrees to maintain confidentiality of all company information.

5. Termination: Either party may terminate this agreement with appropriate notice.

6. Consent: The Employee consents to verification of provided documents.

By signing this document via Aadhaar e-Sign, the Employee acknowledges and agrees to all the above terms and conditions.

---
This is an electronically generated document and does not require a physical signature.
Date: ${new Date().toLocaleDateString('en-IN')}
  `;
};

/**
 * Convert file buffer to base64
 * @param {Buffer} buffer - File buffer
 * @returns {string} Base64 encoded string
 */
export const bufferToBase64 = (buffer) => {
  return buffer.toString('base64');
};

/**
 * Get sample PDF for testing
 * @returns {string} Base64 encoded PDF
 */
export const getSamplePDF = () => {
  return samplePDFBase64;
};

export default {
  samplePDFBase64,
  generateAgreementText,
  bufferToBase64,
  getSamplePDF
};
