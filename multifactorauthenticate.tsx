import React, { useState } from 'react';
import { Camera as CameraIcon, Mail, Shield, AlertCircle, Fingerprint, Key } from 'lucide-react';


interface VerificationResult {
  success: boolean;
  user?: {
    name: string;
    id: string;
  };
  confidence?: number;
  message?: string;
}

export function MultiFactorAuth() {
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  /**
   * Handles face verification
   * @param imageData - The base64 encoded image data.
   */
  const handleFaceVerify = async (imageData: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });

      const result = await response.json();
      setVerificationResult(result);
      
      if (result.success && result.user) {
        // Send OTP if face verification is successful
        sendOtp(result.user.id);
      }
    } catch (error) {
      setVerificationResult({ success: false, message: 'Face verification failed. Try again.' });
    }
    setLoading(false);
  };

  /**
   * Sends OTP to the user
   */
  const sendOtp = async (userId: string) => {
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setOtpSent(true);
      } else {
        setVerificationResult({ success: false, message: 'Failed to send OTP. Try again.' });
      }
    } catch (error) {
      setVerificationResult({ success: false, message: 'Error sending OTP.' });
    }
  };

  /**
   * Verifies OTP entered by the user
   */
  const handleOtpVerify = async () => {
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });

      const result = await response.json();
      if (result.success) {
        setOtpVerified(true);
      } else {
        setVerificationResult({ success: false, message: 'Invalid OTP. Try again.' });
      }
    } catch (error) {
      setVerificationResult({ success: false, message: 'OTP verification failed.' });
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden p-6">
      <div className="flex items-center">
        <Fingerprint className="w-6 h-6 text-purple-400" />
        <h2 className="ml-2 text-xl font-medium text-white">Multi-Factor Authentication</h2>
      </div>

      {/* Face Verification Section */}
      {!verificationResult?.success && (
        <div className="mt-4">
          <p className="text-sm text-gray-300">Step 1: Face Verification</p>
          <Camera onCapture={handleFaceVerify} mode="verify" />
          {loading && <p className="text-sm text-gray-400">Verifying face...</p>}
        </div>
      )}

      {/* OTP Section (Shown after face verification success) */}
      {verificationResult?.success && !otpVerified && (
        <div className="mt-6">
          <p className="text-sm text-gray-300">Step 2: Enter OTP</p>
          <div className="flex items-center space-x-2 mt-2">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="px-4 py-2 border rounded-lg bg-gray-800 text-white"
            />
            <button 
              onClick={handleOtpVerify} 
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
            >
              Verify OTP
            </button>
          </div>
          {otpSent && (
            <p className="text-sm text-gray-400 mt-2 flex items-center">
              <Mail className="w-4 h-4 mr-1" /> OTP sent to your registered email/phone
            </p>
          )}
        </div>
      )}

      {/* Authentication Success Message */}
      {otpVerified && (
        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-400" />
            <p className="text-sm text-green-300">
              Access Granted! Welcome, {verificationResult?.user?.name}.
            </p>
          </div>
        </div>
      )}

      {/* Authentication Error Message */}
      {verificationResult && !verificationResult.success && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-sm text-red-300">{verificationResult.message || 'Access Denied'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
