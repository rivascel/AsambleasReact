require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'dev',
  isProd: process.env.NODE_ENV === 'production',
  port: process.env.PORT || 3000,
  BaseUrl: process.env.BASE_URL || "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET_KEY || "your_secret_key",
  email_user: process.env.EMAIL_USER || "techprocess.sas@gmail.com",
  email_pass: process.env.EMAIL_PASS || "hhdx honp gsmx vxwf"
}

module.exports = { config };

