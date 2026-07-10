# Secure Token Refresh System Implementation

## Overview
This document describes the implementation of a secure, "never-expiring" token system that provides seamless user experience while maintaining enterprise-grade security.

## Architecture

### Token Types
1. **Access Token**: Short-lived (15 minutes)
   - Used for API authentication
   - Stored in memory/SecureStore
   - Automatically refreshed before expiration

2. **Refresh Token**: Long-lived (30 days)
   - Used to obtain new access tokens
   - Stored securely in SecureStore (encrypted)
   - Rotated on each refresh for security
   - Stored in database for revocation tracking

### Database Schema

**RefreshToken Model** (`models/RefreshToken.go`):
```go
type RefreshToken struct {
    Token     string    // Unique token string
    UserID    uint      // User who owns this token
    DeviceID  string    // Optional: device tracking
    ExpiresAt time.Time // Expiration timestamp
    Revoked   bool      // Revocation flag
    RevokedAt *time.Time // When revoked
}
```

### Backend Implementation

#### 1. Token Creation (`utils/tokens.go`)
- `CreateTokenPair(userID, deviceID)` creates both tokens
- Access token: 15 minutes expiry
- Refresh token: 30 days expiry
- Refresh token stored in database
- Device ID tracked for session management

#### 2. Refresh Endpoint (`/api/auth/refresh`)
- Validates refresh token from database
- Checks expiration and revocation status
- **Token Rotation**: Revokes old token, issues new one
- Returns new access + refresh token pair
- Handles device ID tracking

#### 3. Token Rotation Security
- Old refresh token is immediately revoked
- New refresh token is generated
- Prevents token reuse attacks
- Database tracks all tokens for audit

### Frontend Implementation

#### 1. Secure Storage
- **Access Token**: Stored in SecureStore (encrypted)
- **Refresh Token**: Stored in SecureStore (encrypted)
- Never stored in localStorage or insecure storage

#### 2. Automatic Token Refresh (`services/api.ts`)
- Axios response interceptor catches 401 errors
- Automatically calls `/auth/refresh` with refresh token
- Updates stored tokens
- Retries original request with new access token
- Queue system prevents multiple simultaneous refreshes

#### 3. Token Refresh Flow
```
1. API request fails with 401
2. Interceptor catches error
3. Calls /auth/refresh with refresh token
4. Receives new access + refresh tokens
5. Updates SecureStore
6. Retries original request
7. User never sees login screen
```

### Security Features

1. **Token Rotation**: Each refresh generates new tokens
2. **Database Tracking**: All tokens stored for audit
3. **Revocation Support**: Tokens can be revoked on logout
4. **Device Tracking**: Optional device ID for session management
5. **Expiration Checks**: Tokens validated on each use
6. **Secure Storage**: Tokens never in plain text

### User Experience

- **Seamless**: User never sees login screen
- **Automatic**: Token refresh happens in background
- **Fast**: Refresh takes < 1 second
- **Reliable**: Queue system prevents race conditions

### Logout Behavior

On logout:
1. Revoke refresh token in database
2. Clear tokens from SecureStore
3. User must login again

### Migration Notes

- Existing refresh tokens in Redis are migrated to database
- Backward compatibility maintained during transition
- Old Redis-based tokens still work but new ones use database
