// config/config.js

const config = {
  settings: {
    domain: process.env.DOMAIN || "http://localhost:3000",
    mongoURI: process.env.MONGO_URI || "mongodb://localhost:27017/phoenix-xshare",
    encryption: process.env.ENCRYPTION !== "false", // Defaults to true unless explicitly set to "false"
    registrationSecret: process.env.REGISTRATION_SECRET || "", // Set a secret string to lock signup
    storageProvider: process.env.STORAGE_PROVIDER || "local", // Options: "local" | "ftp" | "sftp"
    port: parseInt(process.env.PORT || "3000", 10),
    
    // FTP Remote Storage (used if storageProvider is "ftp")
    ftp: {
      host: process.env.FTP_HOST || "ftp.example.com",
      port: parseInt(process.env.FTP_PORT || "21", 10),
      user: process.env.FTP_USER || "username",
      password: process.env.FTP_PASSWORD || "password",
      secure: process.env.FTP_SECURE === "true", // Set true for FTPS
      remotePath: process.env.FTP_REMOTE_PATH || "/uploads"
    },
    
    // SFTP Remote Storage (used if storageProvider is "sftp")
    sftp: {
      host: process.env.SFTP_HOST || "sftp.example.com",
      port: parseInt(process.env.SFTP_PORT || "22", 10),
      username: process.env.SFTP_USERNAME || "username",
      password: process.env.SFTP_PASSWORD || "password",
      remotePath: process.env.SFTP_REMOTE_PATH || "/uploads"
    }
  }
};

export default config;