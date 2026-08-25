export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.POSTGRES_HOST || 'postgres',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'nirvaha',
    password: process.env.POSTGRES_PASSWORD || 'nirvaha_dev_pw',
    name: process.env.POSTGRES_DB || 'nirvaha',
  },
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    // Empty locally; set by managed Redis providers, which all require AUTH.
    password: process.env.REDIS_PASSWORD || '',
    ttl: parseInt(process.env.SCAN_CACHE_TTL_SECONDS || '86400', 10),
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'minio',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    rootUser: process.env.MINIO_ROOT_USER || 'nirvaha',
    rootPassword: process.env.MINIO_ROOT_PASSWORD || 'nirvaha_dev_pw',
    bucket: process.env.MINIO_BUCKET || 'nirvaha-scans',
    useSSL: process.env.MINIO_USE_SSL === 'true',
    publicUrl: process.env.MINIO_PUBLIC_URL || 'http://localhost:9000',
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'auto',
  },
  gemini: {
    apiKeys: (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0),
    model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    totalBudgetMs: parseInt(process.env.GEMINI_TOTAL_BUDGET_MS || '45000', 10),
  },
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://host.docker.internal:11434',
    model: process.env.OLLAMA_MODEL || 'qwen2.5vl:3b',
    timeoutMs: parseInt(process.env.OLLAMA_TIMEOUT_MS || '45000', 10),
    keepAlive: process.env.OLLAMA_KEEP_ALIVE || '30m',
    warmup: (process.env.OLLAMA_WARMUP || 'true') === 'true',
    maxImagePx: parseInt(process.env.OLLAMA_MAX_IMAGE_PX || '768', 10),
    confidenceThreshold: parseFloat(
      process.env.OLLAMA_CONFIDENCE_THRESHOLD || '0.75',
    ),
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'change_me_in_env',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  thresholds: {
    confidenceAmberThreshold: 0.6,
    confidenceHighThreshold: 0.8,
  },
  demoAccount: {
    email: process.env.DEMO_EMAIL || 'test@gmail.com',
    password: process.env.DEMO_PASSWORD || 'test@1234',
    displayName: process.env.DEMO_DISPLAY_NAME || 'Test User',
    otp: process.env.DEMO_OTP || '123456',
  },
  allowRegistration: (process.env.ALLOW_REGISTRATION || 'false') === 'true',
  allowAnonymousScan: (process.env.ALLOW_ANONYMOUS_SCAN || 'true') === 'true',
});
