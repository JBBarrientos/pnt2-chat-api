import { jwtVerify, createRemoteJWKSet } from "jose";

const REGION = process.env.AWS_REGION
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID
const COGNITO_ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;

const JWKS = createRemoteJWKSet(new URL(`${COGNITO_ISSUER}/.well-known/jwks.json`));

export async function validateCognitoToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const token = authHeader.substring(7);

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: COGNITO_ISSUER,
    });

    req.user = payload;
    next();
  } catch (err) {
    console.error("Token validation error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
