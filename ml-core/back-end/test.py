import sys
from datetime import timedelta

# Import functions from your auth module
try:
    from auth import (
        create_access_token,
        create_refresh_token,
        get_password_hash,
        verify_password,
        SecretKey,
        Algorithm,
        jwt,
        JWTError,
    )
except ImportError as e:
    print(f"❌ Failed to import from auth.py: {e}")
    sys.exit(1)


def run_auth_tests():
    print("--------------------------------------------------")
    print("🔐 Starting Authentication Module Tests")
    print("--------------------------------------------------")

    # -------------------------------------------------------------------------
    # 1. TEST PASSWORD HASHING & VERIFICATION
    # -------------------------------------------------------------------------
    print("\n1️⃣ Testing Password Hashing (Bcrypt)...")
    raw_password = "Password!"

    # Hash password
    hashed_password = get_password_hash(raw_password)
    print(f"   • Raw Password   : {raw_password}")
    print(f"   • Bcrypt Hash    : {hashed_password}")

    # Verify correct password
    is_valid = verify_password(raw_password, hashed_password)
    if is_valid:
        print("   ✅ Correct password verification: PASSED")
    else:
        print("   ❌ Correct password verification: FAILED")

    # Verify incorrect password
    is_invalid = verify_password("WrongPassword!", hashed_password)
    if not is_invalid:
        print("   ✅ Incorrect password rejection: PASSED")
    else:
        print("   ❌ Incorrect password rejection: FAILED")

    # -------------------------------------------------------------------------
    # 2. TEST ACCESS TOKEN CREATION & DECODING
    # -------------------------------------------------------------------------
    print("\n2️⃣ Testing Access Token Generation & JWT Decoding...")
    user_payload = {"sub": "dr_aryan_sharma", "role": "physician"}

    # Create Token
    access_token = create_access_token(data=user_payload)
    print(f"   • Generated JWT Token: {access_token[:30]}...{access_token[-10:]}")

    # Decode and Validate Token
    try:
        decoded_payload = jwt.decode(access_token, SecretKey, algorithms=[Algorithm])
        decoded_user = decoded_payload.get("sub")
        expiration = decoded_payload.get("exp")

        if decoded_user == user_payload["sub"]:
            print(f"   ✅ Decoded Username: '{decoded_user}' (Matches original payload)")
            print(f"   ✅ Token Expiration Set: {expiration}")
        else:
            print("   ❌ Token payload mismatch!")
    except JWTError as e:
        print(f"   ❌ Token decoding failed: {e}")

    # -------------------------------------------------------------------------
    # 3. TEST REFRESH TOKEN
    # -------------------------------------------------------------------------
    print("\n3️⃣ Testing Refresh Token Generation...")
    refresh_token = create_refresh_token(
        data=user_payload, expires_delta=timedelta(days=7)
    )
    if refresh_token:
        print(f"   • Generated Refresh Token: {refresh_token[:30]}...")
        print("   ✅ Refresh Token: PASSED")
    else:
        print("   ❌ Refresh Token creation failed")

    print("\n--------------------------------------------------")
    print("🎉 ALL AUTHENTICATION TESTS COMPLETED!")
    print("--------------------------------------------------")


if __name__ == "__main__":
    run_auth_tests()