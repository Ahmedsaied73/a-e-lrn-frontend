# Backend Migration Guide for HttpOnly Cookies

The frontend currently stores an access token in memory and uses a non-sensitive `isLoggedIn` cookie to power Next.js middleware redirects. However, to achieve full security against XSS attacks, the backend must transition to HttpOnly cookies.

## What the Backend Needs to Do

### 1. Set Cookies on Login & Register
When a user logs in (or registers), the backend should respond with a `Set-Cookie` header instead of just returning the token in the JSON body.
- **accessToken**: Short-lived (e.g., 15 minutes). `HttpOnly`, `Secure` (in production), `SameSite=Strict`.
- **refreshToken**: Long-lived (e.g., 7 days). `HttpOnly`, `Secure` (in production), `SameSite=Strict`.

Example Express Response:
```javascript
res.cookie('accessToken', generateAccessToken(user), { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 15 * 60 * 1000 });
res.cookie('refreshToken', generateRefreshToken(user), { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
```

### 2. Enable CORS with Credentials
The backend must allow the frontend to send cookies.
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL, // e.g. http://localhost:3000
  credentials: true
}));
```

### 3. Create a `/auth/refresh` Endpoint
The frontend needs an endpoint to call when the `accessToken` expires. This endpoint should read the `refreshToken` cookie, validate it, and set a new `accessToken` cookie.

### 4. Clear Cookies on Logout
The `/auth/logout` endpoint must send `Clear-Cookie` headers for both tokens.

## Frontend Follow-up
Once the backend is updated, the frontend will update `lib/api-client.ts` to use `credentials: 'include'` for all requests, and handle automatic refresh logic on `401 Unauthorized`.
