import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { TwitterApi } from "twitter-api-v2";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5174;
const dataDir = path.resolve(process.cwd(), "data");
const dataFile = path.join(dataDir, "accounts.json");
const postsFile = path.join(dataDir, "posts.json");
const usersFile = path.join(dataDir, "users.json");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@socialhub.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";
const JWT_SECRET = process.env.JWT_SECRET || "socialhub_super_secret_jwt_key_change_me";
const JWT_EXPIRES_IN = "8h";

let ADMIN_PASSWORD_HASH_FOR_AUTH = ADMIN_PASSWORD_HASH;
if (!ADMIN_PASSWORD_HASH_FOR_AUTH && ADMIN_PASSWORD) {
  ADMIN_PASSWORD_HASH_FOR_AUTH = bcrypt.hashSync(ADMIN_PASSWORD, 12);
}

const loadJsonFile = async (filePath, defaultValue) => {
  try {
    const contents = await fs.readFile(filePath, "utf8");
    return JSON.parse(contents);
  } catch {
    return defaultValue;
  }
};

const saveJsonFile = async (filePath, value) => {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
};

const loadUsers = async () => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("users").select("*");
      if (error) throw error;
      return Array.isArray(data)
        ? data.map((user) => ({
            email: user.email,
            passwordHash: user.password_hash || user.passwordHash,
            role: user.role || "user",
            createdAt: user.created_at || user.createdAt || new Date().toISOString(),
          }))
        : [];
    } catch (err) {
      console.warn("Supabase loadUsers failed, falling back to local file:", err.message || err);
    }
  }

  const users = await loadJsonFile(usersFile, []);
  return Array.isArray(users) ? users : [];
};

const saveUsers = async (users) => {
  if (supabase) {
    try {
      const payload = users.map((user) => ({
        email: user.email,
        password_hash: user.passwordHash,
        role: user.role || "user",
        created_at: user.createdAt || new Date().toISOString(),
      }));
      const { error } = await supabase.from("users").upsert(payload, { onConflict: ["email"] });
      if (error) throw error;
      return;
    } catch (err) {
      console.warn("Supabase saveUsers failed, falling back to local file:", err.message || err);
    }
  }

  await saveJsonFile(usersFile, users);
};

const saveUser = async (user) => {
  if (supabase) {
    try {
      const payload = {
        email: user.email,
        password_hash: user.passwordHash,
        role: user.role || "user",
        created_at: user.createdAt || new Date().toISOString(),
      };
      const { error } = await supabase.from("users").upsert(payload, { onConflict: ["email"] });
      if (error) throw error;
      return;
    } catch (err) {
      console.warn("Supabase saveUser failed, falling back to local file:", err.message || err);
    }
  }

  const users = await loadUsers();
  const existing = findUserByEmail(users, user.email);
  if (existing) {
    existing.passwordHash = user.passwordHash;
    existing.role = user.role || existing.role || "user";
    existing.createdAt = existing.createdAt || user.createdAt;
  } else {
    users.push(user);
  }
  await saveJsonFile(usersFile, users);
};

const findUserByEmail = (users, email) => users.find((user) => user.email.toLowerCase() === email.toLowerCase());

const DEFAULT_PLATFORMS = [
  {
    id: "facebook",
    label: "Facebook",
    color: "#1877F2",
    icon: "f",
    accounts: [
      { id: "fb_1", handle: "@dillavee.page", followers: "12.4K", connected: true, apiKey: "", apiSecret: "" },
      { id: "fb_2", handle: "@business.hub", followers: "8.2K", connected: true, apiKey: "", apiSecret: "" },
    ],
  },
  {
    id: "instagram",
    label: "Instagram",
    color: "#E1306C",
    icon: "📷",
    accounts: [
      { id: "ig_1", handle: "@dilla.vee", followers: "8.9K", connected: true, apiKey: "", apiSecret: "" },
      { id: "ig_2", handle: "@team.hub", followers: "4.5K", connected: true, apiKey: "", apiSecret: "" },
    ],
  },
  {
    id: "twitter",
    label: "X / Twitter",
    color: "#1DA1F2",
    icon: "𝕏",
    accounts: [
      { id: "tw_1", handle: "@dilla_vee", followers: "5.2K", connected: true, apiKey: "", apiSecret: "" },
    ],
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    color: "#0A66C2",
    icon: "in",
    accounts: [
      { id: "li_1", handle: "Not connected", followers: "—", connected: false, apiKey: "", apiSecret: "" },
    ],
  },
];

const normalizeAccounts = (platforms) => platforms.map((p) => ({
  ...p,
  accounts: (p.accounts || []).map((acc) => ({
    id: acc.id,
    handle: acc.handle,
    followers: acc.followers,
    connected: !!acc.connected,
    apiKey: acc.api_key || acc.apiKey || "",
    apiSecret: acc.api_secret || acc.apiSecret || "",
    accessToken: acc.access_token || acc.accessToken || "",
    accessTokenSecret: acc.access_token_secret || acc.accessTokenSecret || "",
  })),
}));

// Supabase client (optional). If not configured, server falls back to local JSON files.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase = null;
// Disabled Supabase connection to prevent split-brain state (where writes fallback to local files due to missing schema columns, but reads still fetch blank values from Supabase).
// if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
//   supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
// }

const loadAccounts = async (userId) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("platforms").select("*, accounts(*)");
      if (error) throw error;
      return normalizeAccounts(data || []);
    } catch (err) {
      console.warn("Supabase loadAccounts failed, falling back to local file:", err.message || err);
    }
  }

  try {
    const contents = await fs.readFile(dataFile, "utf8");
    const stored = JSON.parse(contents);
    if (!userId) {
      return normalizeAccounts(Array.isArray(stored) ? stored : stored.admin || DEFAULT_PLATFORMS);
    }

    if (Array.isArray(stored)) {
      const updatedData = { admin: stored, [userId]: DEFAULT_PLATFORMS };
      await saveJsonFile(dataFile, updatedData);
      return normalizeAccounts(DEFAULT_PLATFORMS);
    }

    if (stored[userId]) {
      return normalizeAccounts(stored[userId]);
    }

    const updatedData = { ...stored, [userId]: DEFAULT_PLATFORMS };
    await saveJsonFile(dataFile, updatedData);
    return normalizeAccounts(DEFAULT_PLATFORMS);
  } catch (err) {
    await fs.mkdir(dataDir, { recursive: true });
    const initialData = { [userId]: DEFAULT_PLATFORMS };
    await saveJsonFile(dataFile, initialData);
    return normalizeAccounts(DEFAULT_PLATFORMS);
  }
};

const saveAccounts = async (userId, platforms) => {
  if (supabase) {
    try {
      const platformsPayload = platforms.map((p) => ({ id: p.id, label: p.label, color: p.color, icon: p.icon }));
      const { error: platErr } = await supabase.from("platforms").upsert(platformsPayload, { onConflict: ["id"] });
      if (platErr) throw platErr;

      const allAccounts = platforms.flatMap((p) =>
        (p.accounts || []).map((a) => ({
          id: a.id,
          platform_id: p.id,
          handle: a.handle,
          followers: a.followers,
          connected: a.connected,
          api_key: a.apiKey || null,
          api_secret: a.apiSecret || null,
          access_token: a.accessToken || null,
          access_token_secret: a.accessTokenSecret || null,
        })),
      );
      if (allAccounts.length > 0) {
        const { error: accErr } = await supabase.from("accounts").upsert(allAccounts, { onConflict: ["id"] });
        if (accErr) throw accErr;
      }
      return;
    } catch (err) {
      console.warn("Supabase saveAccounts failed, falling back to local file:", err.message || err);
    }
  }

  let stored = {};
  try {
    const contents = await fs.readFile(dataFile, "utf8");
    const parsed = JSON.parse(contents);
    stored = Array.isArray(parsed) ? { admin: parsed } : parsed;
  } catch {
    stored = {};
  }

  stored[userId] = platforms;
  await saveJsonFile(dataFile, stored);
};

const loadPosts = async (userId) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("posts").select("*, post_accounts(account_id, accounts(platform_id))").order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((post) => ({
        id: post.id,
        text: post.text,
        accounts: (post.post_accounts || []).map((rel) => ({
          accountId: rel.account_id,
          platformId: rel.accounts?.platform_id || rel.platform_id,
        })),
        scheduled: post.scheduled ?? false,
        schedDate: post.sched_date || null,
        status: post.status || "published",
        createdAt: post.created_at || new Date().toISOString(),
      }));
    } catch (err) {
      console.warn("Supabase loadPosts failed, falling back to local file:", err.message || err);
    }
  }

  try {
    const contents = await fs.readFile(postsFile, "utf8");
    const stored = JSON.parse(contents);
    if (!userId) {
      return Array.isArray(stored) ? stored : stored.admin || [];
    }

    if (Array.isArray(stored)) {
      const updatedData = { admin: stored, [userId]: [] };
      await saveJsonFile(postsFile, updatedData);
      return [];
    }

    if (stored[userId]) {
      return stored[userId];
    }

    const updatedData = { ...stored, [userId]: [] };
    await saveJsonFile(postsFile, updatedData);
    return [];
  } catch (err) {
    await fs.mkdir(dataDir, { recursive: true });
    const initialData = { [userId]: [] };
    await saveJsonFile(postsFile, initialData);
    return [];
  }
};

const savePosts = async (userId, posts) => {
  if (supabase) {
    try {
      const payload = posts.map((p) => ({
        id: p.id,
        text: p.text,
        scheduled: !!p.scheduled,
        sched_date: p.schedDate || null,
        status: p.status || null,
        created_at: p.createdAt || new Date().toISOString(),
      }));

      if (payload.length > 0) {
        const { error } = await supabase.from("posts").upsert(payload, { onConflict: ["id"] });
        if (error) throw error;
      }

      const postAccountRelations = posts.flatMap((p) =>
        (p.accounts || []).map((account) => ({
          post_id: p.id,
          account_id: account.accountId,
        })),
      );

      if (postAccountRelations.length > 0) {
        const { error: relationError } = await supabase.from("post_accounts").upsert(postAccountRelations, { onConflict: ["post_id", "account_id"] });
        if (relationError) throw relationError;
      }
      return;
    } catch (err) {
      console.warn("Supabase savePosts failed, falling back to local file:", err.message || err);
    }
  }

  let stored = {};
  try {
    const contents = await fs.readFile(postsFile, "utf8");
    const parsed = JSON.parse(contents);
    stored = Array.isArray(parsed) ? { admin: parsed } : parsed;
  } catch {
    stored = {};
  }

  stored[userId] = posts;
  await saveJsonFile(postsFile, stored);
};

const findPlatform = (platforms, platformId) => platforms.find((platform) => platform.id === platformId);
const findAccount = (platform, accountId) => platform.accounts.find((account) => account.id === accountId);

const isValidApiKey = (apiKey) => typeof apiKey === "string" && apiKey.trim().length >= 8;

app.use(cors());
app.use(express.json());

/* ── AUTH MIDDLEWARE ────────────────────────────────────── */
const jwtSecret = new TextEncoder().encode(JWT_SECRET);

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Unauthorized. Please log in." });
  try {
    const { payload } = await jwtVerify(token, jwtSecret);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Session expired. Please log in again." });
  }
};

const createJwtToken = async (email, role) => {
  return new SignJWT({ email, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(jwtSecret);
};

/* ── AUTH ROUTES (public) ───────────────────────────────── */
app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const users = await loadUsers();
  if (findUserByEmail(users, normalizedEmail)) {
    return res.status(409).json({ message: "A user with that email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const newUser = { email: normalizedEmail, passwordHash, role: "user", createdAt: new Date().toISOString() };
  await saveUser(newUser);

  const token = await createJwtToken(normalizedEmail, "user");
  return res.json({ token, email: normalizedEmail, role: "user" });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required." });

  const normalizedEmail = email.trim().toLowerCase();
  const users = await loadUsers();
  const user = findUserByEmail(users, normalizedEmail);

  if (user) {
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const token = await createJwtToken(normalizedEmail, user.role || "user");
    return res.json({ token, email: normalizedEmail, role: user.role || "user" });
  }

  const emailMatch = normalizedEmail === ADMIN_EMAIL.toLowerCase();
  if (!emailMatch)
    return res.status(401).json({ message: "Invalid email or password." });

  const effectivePasswordHash = ADMIN_PASSWORD_HASH || (ADMIN_PASSWORD ? await bcrypt.hash(ADMIN_PASSWORD, 12) : "");
  if (!effectivePasswordHash && !ADMIN_PASSWORD) {
    console.error("Admin credentials are not configured in .env");
    return res.status(500).json({ message: "Server misconfiguration. Contact the administrator." });
  }

  let passMatch = false;
  if (effectivePasswordHash) {
    passMatch = await bcrypt.compare(password, effectivePasswordHash);
  }
  if (!passMatch && ADMIN_PASSWORD) {
    passMatch = password === ADMIN_PASSWORD;
  }

  if (!passMatch)
    return res.status(401).json({ message: "Invalid email or password." });

  const token = await createJwtToken(ADMIN_EMAIL.toLowerCase(), "admin");
  return res.json({ token, email: ADMIN_EMAIL.toLowerCase(), role: "admin" });
});

app.post("/api/auth/logout", (_req, res) => {
  return res.json({ message: "Logged out successfully." });
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  const email = req.user.email.toLowerCase();
  if (req.user.role === "admin") {
    return res.json({ email, role: "admin" });
  }

  const users = await loadUsers();
  const user = findUserByEmail(users, email);
  if (!user) {
    return res.status(404).json({ message: "User profile not found." });
  }

  return res.json({ email: user.email, role: user.role || "user", createdAt: user.createdAt || null });
});

app.get("/api/accounts", requireAuth, async (req, res) => {
  const userId = req.user.email.toLowerCase();
  const platforms = await loadAccounts(userId);
  return res.json({ platforms });
});

app.put("/api/accounts/:platformId/:accountId", requireAuth, async (req, res) => {
  const userId = req.user.email.toLowerCase();
  const platforms = await loadAccounts(userId);
  const { platformId, accountId } = req.params;
  const patch = req.body;
  const platform = findPlatform(platforms, platformId);
  if (!platform) return res.status(404).json({ message: "Platform not found." });

  const account = findAccount(platform, accountId);
  if (!account) return res.status(404).json({ message: "Account not found." });

  Object.assign(account, {
    apiKey: patch.apiKey ?? account.apiKey,
    apiSecret: patch.apiSecret ?? account.apiSecret,
    accessToken: patch.accessToken ?? account.accessToken,
    accessTokenSecret: patch.accessTokenSecret ?? account.accessTokenSecret,
  });
  await saveAccounts(userId, platforms);
  return res.json({ platforms });
});

app.post("/api/accounts/:platformId/:accountId/connect", requireAuth, async (req, res) => {
  const userId = req.user.email.toLowerCase();
  const platforms = await loadAccounts(userId);
  const { platformId, accountId } = req.params;
  const platform = findPlatform(platforms, platformId);
  if (!platform) return res.status(404).json({ message: "Platform not found." });

  const account = findAccount(platform, accountId);
  if (!account) return res.status(404).json({ message: "Account not found." });

  // Debug logging: show masked apiKey info to help diagnose connection issues
  try {
    const masked = account.apiKey ? `${String(account.apiKey).slice(0,4)}...${String(account.apiKey).slice(-4)}` : null;
    console.log(`Connect attempt: user=${userId} platform=${platformId} account=${accountId} apiKey_len=${account.apiKey?String(account.apiKey).length:0} apiKey_mask=${masked}`);
  } catch (e) {
    console.warn('Failed to log apiKey debug info', e.message || e);
  }

  let valid = false;
  if (platformId === "twitter") {
    valid = isValidApiKey(account.apiKey) && isValidApiKey(account.apiSecret) && isValidApiKey(account.accessToken) && isValidApiKey(account.accessTokenSecret);
  } else if (platformId === "linkedin") {
    valid = isValidApiKey(account.apiSecret);
  } else if (platformId === "facebook" || platformId === "instagram") {
    valid = isValidApiKey(account.apiKey) && isValidApiKey(account.apiSecret);
  } else {
    valid = isValidApiKey(account.apiKey);
  }

  if (!valid) {
    console.warn(`Connect validation failed for ${platformId}`);
    return res.status(400).json({ message: `Please enter all required API credentials to connect ${platform.label}.` });
  }

  account.connected = true;
  await saveAccounts(userId, platforms);
  return res.json({ platforms });
});

app.post("/api/accounts/:platformId/:accountId/disconnect", requireAuth, async (req, res) => {
  const userId = req.user.email.toLowerCase();
  const platforms = await loadAccounts(userId);
  const { platformId, accountId } = req.params;
  const platform = findPlatform(platforms, platformId);
  if (!platform) return res.status(404).json({ message: "Platform not found." });

  const account = findAccount(platform, accountId);
  if (!account) return res.status(404).json({ message: "Account not found." });

  account.connected = false;
  await saveAccounts(userId, platforms);
  return res.json({ platforms });
});

app.post("/api/accounts/:platformId", requireAuth, async (req, res) => {
  const userId = req.user.email.toLowerCase();
  const platforms = await loadAccounts(userId);
  const { platformId } = req.params;
  const platform = findPlatform(platforms, platformId);
  if (!platform) return res.status(404).json({ message: "Platform not found." });

  const suffix = Math.random().toString(36).slice(2, 8);
  platform.accounts.push({
    id: `${platformId}_${suffix}`,
    handle: `@new_${suffix}`,
    followers: "0",
    connected: false,
    apiKey: "",
    apiSecret: "",
  });
  await saveAccounts(userId, platforms);
  return res.json({ platforms });
});

app.get("/api/posts", requireAuth, async (req, res) => {
  const userId = req.user.email.toLowerCase();
  const posts = await loadPosts(userId);
  return res.json({ posts });
});

app.post("/api/posts", requireAuth, async (req, res) => {
  const { text, accounts, scheduled, schedDate, attachments } = req.body;
  const hasText = text && typeof text === "string" && text.trim();
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
  if (!hasText && !hasAttachments) {
    return res.status(400).json({ message: "Post content or at least one attachment is required." });
  }
  if (!Array.isArray(accounts) || accounts.length === 0) {
    return res.status(400).json({ message: "At least one target account is required." });
  }

  try {
    const userId = req.user.email.toLowerCase();
    const userPlatforms = await loadAccounts(userId);
    const posts = await loadPosts(userId);
    const isScheduled = !!scheduled;

    const errors = [];

    // Make real posts only if it's not a draft and not scheduled (live publish now)
    if (!isScheduled) {
      for (const accRef of accounts) {
        const platform = findPlatform(userPlatforms, accRef.platformId);
        if (!platform) continue;
        const account = findAccount(platform, accRef.accountId);
        if (!account || !account.connected) continue;

        try {
          if (accRef.platformId === "twitter") {
            const client = new TwitterApi({
              appKey: account.apiKey,
              appSecret: account.apiSecret,
              accessToken: account.accessToken,
              accessSecret: account.accessTokenSecret,
            });
            await client.v2.tweet(text.trim());
          } 
          else if (accRef.platformId === "linkedin") {
            let authorUrn = null;
            const meRes = await fetch("https://api.linkedin.com/v2/userinfo", {
              headers: { Authorization: `Bearer ${account.apiSecret}` }
            });
            if (meRes.ok) {
              const meData = await meRes.json();
              if (meData.sub) authorUrn = `urn:li:person:${meData.sub}`;
            } else {
              const meRes2 = await fetch("https://api.linkedin.com/v2/me", {
                headers: { Authorization: `Bearer ${account.apiSecret}` }
              });
              if (meRes2.ok) {
                const meData2 = await meRes2.json();
                if (meData2.id) authorUrn = `urn:li:person:${meData2.id}`;
              }
            }

            if (!authorUrn) {
              throw new Error("Unable to retrieve LinkedIn profile URN.");
            }

            const postRes = await fetch("https://api.linkedin.com/v2/posts", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${account.apiSecret}`,
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0"
              },
              body: JSON.stringify({
                author: authorUrn,
                commentary: text.trim(),
                visibility: "PUBLIC",
                distribution: {
                  feedDistribution: "MAIN_FEED",
                  targetEntities: [],
                  thirdPartyDistributionChannels: []
                },
                lifecycleState: "PUBLISHED"
              })
            });
            if (!postRes.ok) {
              const errData = await postRes.json().catch(() => ({}));
              throw new Error(`LinkedIn publishing failed: ${errData.message || postRes.statusText}`);
            }
          } 
          else if (accRef.platformId === "facebook") {
            const pageId = account.apiKey;
            const pageToken = account.apiSecret;
            const fbRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: text.trim(),
                access_token: pageToken
              })
            });
            const fbData = await fbRes.json();
            if (!fbRes.ok) {
              throw new Error(`Facebook posting failed: ${fbData.error?.message || fbRes.statusText}`);
            }
          } 
          else if (accRef.platformId === "instagram") {
            const igBusinessId = account.apiKey;
            const pageToken = account.apiSecret;
            
            const hasImage = attachments && attachments.length > 0 && attachments[0].preview;
            if (!hasImage) {
              throw new Error("Instagram only supports posts containing an image or media attachment.");
            }
            
            const imageUrl = attachments[0].preview;
            const createRes = await fetch(`https://graph.facebook.com/v18.0/${igBusinessId}/media`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                image_url: imageUrl,
                caption: text.trim(),
                access_token: pageToken
              })
            });
            const createData = await createRes.json();
            if (!createRes.ok) {
              throw new Error(`Instagram container creation failed: ${createData.error?.message || createRes.statusText}`);
            }
            const creationId = createData.id;

            const publishRes = await fetch(`https://graph.facebook.com/v18.0/${igBusinessId}/media_publish`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                creation_id: creationId,
                access_token: pageToken
              })
            });
            const publishData = await publishRes.json();
            if (!publishRes.ok) {
              throw new Error(`Instagram publishing failed: ${publishData.error?.message || publishRes.statusText}`);
            }
          }
        } catch (err) {
          console.error(`Error posting to ${accRef.platformId}:`, err.message || err);
          errors.push(`${platform.label}: ${err.message || err}`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(502).json({ message: `Publishing failed for some platforms:\n${errors.join("\n")}` });
    }

    const post = {
      id: Date.now(),
      text: hasText ? text.trim() : "",
      accounts,
      attachments: (Array.isArray(attachments) ? attachments : []),
      scheduled: isScheduled,
      schedDate: isScheduled ? schedDate : null,
      status: isScheduled ? "scheduled" : "published",
      createdAt: new Date().toISOString(),
      likes: isScheduled ? 0 : Math.floor(Math.random() * 450) + 50,
      comments: isScheduled ? 0 : Math.floor(Math.random() * 45) + 5,
      reach: isScheduled ? 0 : Math.floor(Math.random() * 8000) + 1000,
    };

    posts.unshift(post);
    await savePosts(userId, posts);
    return res.json({ post, posts });
  } catch (err) {
    console.error("Error creating post:", err.message || err);
    return res.status(500).json({ message: "Failed to create post." });
  }
});

app.delete("/api/posts/:postId", requireAuth, async (req, res) => {
  const userId = req.user.email.toLowerCase();
  const { postId } = req.params;
  const posts = await loadPosts(userId);
  const existingIndex = posts.findIndex((post) => String(post.id) === String(postId));
  if (existingIndex === -1) {
    return res.status(404).json({ message: "Post not found." });
  }

  posts.splice(existingIndex, 1);

  if (supabase) {
    try {
      await supabase.from("post_accounts").delete().eq("post_id", postId);
      await supabase.from("posts").delete().eq("id", postId);
    } catch (err) {
      console.warn("Supabase post delete failed:", err.message || err);
    }
  }

  await savePosts(userId, posts);
  return res.json({ success: true, posts });
});

/* ── AI VARIANTS (paraphrase) ───────────────────────────── */
app.post("/api/ai/variants", requireAuth, async (req, res) => {
  const { theme, count } = req.body || {};
  const n = Math.max(1, Math.min(10, Number(count) || 1));
  const text = (theme || "").toString().trim();
  if (!text) return res.status(400).json({ message: "Theme text is required." });

  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (OPENAI_KEY) {
    try {
      const prompt = `Please return a JSON array of ${n} short paraphrases (each under 280 characters) that convey the same agenda as the following theme. Respond with valid JSON ONLY.\n\nTheme: ${text}`;
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: 800, temperature: 0.8 }),
      });
      const body = await response.json().catch(() => ({}));
      const raw = (body.choices && body.choices[0] && (body.choices[0].message?.content || body.choices[0].text)) || "";
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return res.json({ variants: parsed.slice(0, n) });
      } catch (e) {
        // try to extract JSON inside text
        const m = raw.match(/\[.*\]/s);
        if (m) {
          try {
            const parsed = JSON.parse(m[0]);
            if (Array.isArray(parsed)) return res.json({ variants: parsed.slice(0, n) });
          } catch (_) {}
        }
      }

      // fallback: split by newlines
      const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length) return res.json({ variants: lines.slice(0, n) });
    } catch (err) {
      console.warn("OpenAI paraphrase failed:", err.message || err);
      // fall through to local generation fallback
    }
  }

  // Local fallback paraphrasing (template-based)
  const templates = [
    (t, i) => `${t} We're thrilled to share this update — fresh ideas, practical impact.`,
    (t, i) => `Sharing a new update: ${t} Join us on this journey of building and learning.`,
    (t, i) => `${t} Built with care using modern web tools — let's create something useful together.`,
    (t, i) => `A short note: ${t} Your feedback helps shape what's next.`,
    (t, i) => `${t} Grateful for the support — here's what's next for the project.`,
  ];
  const emoji = ["🌊", "🚀", "✨", "📣", "🤝"];
  const variants = Array.from({ length: n }).map((_, i) => `${emoji[i % emoji.length]} ${templates[i % templates.length](text, i)}`);
  return res.json({ variants });
});

/* ── Serve built Vite frontend in production ── */
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const distPath = path.join(__dirname, "dist");

app.use(express.static(distPath));

// All non-API routes → index.html (SPA fallback)
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`);
});
