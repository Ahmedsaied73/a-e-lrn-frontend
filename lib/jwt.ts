import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Decodes and verifies a refresh token using the secret key from environment variables
 * @param refreshToken - The refresh token to decode and verify
 * @returns The decoded token payload containing user information
 * @throws Error if token is invalid or verification fails
 */
export const decodeRefreshToken = (refreshToken: string): TokenPayload => {
  try {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    if (!secret) {
      throw new Error('Refresh token secret is not configured');
    }

    const decoded = jwt.verify(refreshToken, secret) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw new Error('Failed to decode refresh token');
  }
};