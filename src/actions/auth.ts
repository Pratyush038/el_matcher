// Stub for template compatibility
export async function verifyOtp(data: { email: string; otp: string; type?: string }) {
  void data;
  return JSON.stringify({ error: { message: "Not implemented" } });
}
