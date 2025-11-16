import express from 'express';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { validateCognitoToken } from '../middleware/authentication.js';

const router = express.Router();

const REGION = process.env.AWS_REGION;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;

const cognito = new CognitoIdentityProviderClient({ region: REGION });

router.post('/signup', async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({
      message: 'Username, email and password are required',
    });
  }

  try {
    const cmd = new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: username,
      Password: password,
      UserAttributes: [{ Name: 'email', Value: email }],
    });

    const result = await cognito.send(cmd);
    res.status(201).json({
      message:
        'User registered successfully. Please check your email for verification code.',
      userConfirmed: result.UserConfirmed,
      userSub: result.UserSub,
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(400).json({
      error: err.name,
      message: err.message,
    });
  }
});

router.post('/confirm', async (req, res) => {
  const { username, code } = req.body;

  if (!username || !code) {
    return res.status(400).json({
      message: 'Username and confirmation code are required',
    });
  }

  try {
    const cmd = new ConfirmSignUpCommand({
      ClientId: CLIENT_ID,
      Username: username,
      ConfirmationCode: code,
    });

    await cognito.send(cmd);
    res.json({
      message: 'Account confirmed successfully. You can now login.',
    });
  } catch (err) {
    console.error('Confirm error:', err);
    res.status(400).json({
      error: err.name,
      message: err.message,
    });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: 'Username and password are required',
    });
  }

  try {
    const cmd = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    });

    const result = await cognito.send(cmd);

    if (!result.AuthenticationResult) {
      return res.status(401).json({
        message: 'Authentication failed',
      });
    }

    res.json({
      message: 'Login successful',
      accessToken: result.AuthenticationResult.AccessToken,
      idToken: result.AuthenticationResult.IdToken,
      refreshToken: result.AuthenticationResult.RefreshToken,
      expiresIn: result.AuthenticationResult.ExpiresIn,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(401).json({
      error: err.name,
      message: err.message,
    });
  }
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      message: 'Refresh token is required',
    });
  }

  try {
    const cmd = new InitiateAuthCommand({
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });

    const result = await cognito.send(cmd);

    if (!result.AuthenticationResult) {
      return res.status(401).json({
        message: 'Token refresh failed',
      });
    }

    res.json({
      message: 'Token refreshed successfully',
      accessToken: result.AuthenticationResult.AccessToken,
      idToken: result.AuthenticationResult.IdToken,
      expiresIn: result.AuthenticationResult.ExpiresIn,
    });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(401).json({
      error: err.name,
      message: err.message,
    });
  }
});

router.get('/me', validateCognitoToken, async (req, res) => {
  const authHeader = req.headers.authorization;
  const accessToken = authHeader.substring(7);

  try {
    const cmd = new GetUserCommand({
      AccessToken: accessToken,
    });

    const result = await cognito.send(cmd);

    const userData = {
      username: result.Username,
      attributes: result.UserAttributes.reduce((acc, attr) => {
        acc[attr.Name] = attr.Value;
        return acc;
      }, {}),
    };

    res.json(userData);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(401).json({
      error: err.name,
      message: err.message,
    });
  }
});

export default router;
