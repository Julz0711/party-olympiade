import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_production';
const JWT_EXPIRES = '7d';

const MAX_IMAGE_BYTES = 600_000; // ~450 KB actual image after base64

function signToken(user) {
  return jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function safeUser(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    avatarColor: user.avatarColor ?? 0,
    playerCard: user.playerCard ?? null,
    cardImage: user.cardImage ?? null,
    bio: user.bio ?? "",
  };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ error: 'username, email and password are required' });

    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ error: 'Invalid email address' });

    const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (exists) {
      const field = exists.email === email.toLowerCase() ? 'email' : 'username';
      return res.status(409).json({ error: `That ${field} is already taken` });
    }

    const user = await User.create({ username, email, password });
    const token = signToken(user);

    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = signToken(user);
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me — verify token and return user
router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });

    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user: safeUser(user) });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// PATCH /api/auth/profile — update profile fields
router.patch('/profile', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });

    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { username, avatarColor, playerCard, cardImage, bio } = req.body;

    if (username !== undefined) {
      const trimmed = String(username).trim().slice(0, 30);
      if (trimmed.length < 2) return res.status(400).json({ error: 'Username must be at least 2 characters' });
      const taken = await User.findOne({ username: trimmed, _id: { $ne: user._id } });
      if (taken) return res.status(409).json({ error: 'Username already taken' });
      user.username = trimmed;
    }
    if (avatarColor !== undefined) {
      const c = Number(avatarColor);
      if (!Number.isInteger(c) || c < 0 || c > 7) return res.status(400).json({ error: 'Invalid avatarColor' });
      user.avatarColor = c;
    }
    if (playerCard !== undefined) {
      if (playerCard === null) {
        user.playerCard = null;
      } else {
        const { iq, shooter, racing, party, troll } = playerCard;
        const vals = [iq, shooter, racing, party, troll];
        for (const v of vals) {
          if (!Number.isInteger(v) || v < 1 || v > 5) {
            return res.status(400).json({ error: 'Each playerCard value must be between 1 and 5' });
          }
        }
        const sum = vals.reduce((a, b) => a + b, 0);
        if (sum !== 15) return res.status(400).json({ error: 'playerCard values must sum to exactly 15' });
        user.playerCard = { iq, shooter, racing, party, troll };
      }
    }
    if (bio !== undefined) {
      user.bio = String(bio).slice(0, 300);
    }
    if ('cardImage' in req.body) {
      if (cardImage === null) {
        user.cardImage = null;
      } else {
        if (typeof cardImage !== 'string' || !cardImage.startsWith('data:image/')) {
          return res.status(400).json({ error: 'Invalid image format' });
        }
        if (cardImage.length > MAX_IMAGE_BYTES) {
          return res.status(400).json({ error: 'Image too large (max ~450 KB)' });
        }
        user.cardImage = cardImage;
      }
    }

    await user.save();
    res.json({ user: safeUser(user) });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// GET /api/auth/user/:username — public profile
router.get('/user/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('-password -email');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      username: user.username,
      avatarColor: user.avatarColor ?? 0,
      playerCard: user.playerCard ?? null,
      cardImage: user.cardImage ?? null,
      bio: user.bio ?? "",
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
