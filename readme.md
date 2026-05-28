# Phoenix XShare v3.0

Phoenix XShare is a secure, cloud-native, and self-hostable private file-sharing application designed for privacy, ease of use, and multi-user scaling. Upgraded to version 3.0, it features pluggable storage backends (Local, FTP, SFTP), strict in-memory buffer encryption, brute-force route protection, and a stunning dark glassmorphic dashboard.

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](https://choosealicense.com/licenses/mit/)
![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)
![MongoDB Support](https://img.shields.io/badge/Database-MongoDB-darkgreen.svg)
![Docker Support](https://img.shields.io/badge/Docker-Supported-cyan.svg)

---

## 🔥 Key Upgrades & Features

### 🛡️ Multi-User Registration & Advanced Security
* **Database Authentication**: Dynamic user management via MongoDB instead of static configuration credentials.
* **Bcrypt Password Security**: Passwords hashed securely using the standard `bcryptjs` algorithm (10 salt rounds).
* **Private Host Protection**: Optional `registrationSecret` code to restrict signup access, keeping private servers completely secure.
* **Session Regulating**: Automatic session regeneration upon login and registration to shield against session-fixation attacks.

### 🔌 Pluggable Local & Remote Storage Adapters
* **Unified API**: Toggle seamlessly between storage providers inside your configuration.
* **Local Storage**: Saves uploads securely inside the local file structure.
* **FTP/FTPS Support**: Direct uploads to remote FTP/FTPS servers (using `basic-ftp`).
* **SFTP Support**: Direct uploads to remote secure shell SFTP servers (using `ssh2-sftp-client`).

### 💎 Pure In-Memory Cryptography
* **Zero Disk Footprint**: Bypasses local disk cache entirely during uploads and downloads. Cryptographic operations (AES-256-CBC) execute strictly in transit via memory buffers.
* **Global Identifiers**: Encryption keys are linked dynamically to unique `filename` strings inside MongoDB, decoupling database records from local system absolute paths.

### 🚦 Bruteforce & DOS Protection
* **Spam Armor**: Custom sliding-window memory `rateLimiter.js` middleware.
* **Auth Safeguard**: Max 15 login/signup actions per 15 minutes to block automated dictionary attacks.
* **Upload Guard**: Max 50 uploads per 15 minutes to block storage-filling DOS attempts.

### 🚀 Asynchronous Drag-Drop Multi-Uploader
* **Simultaneous File Queuing**: Drag & drop or browse multiple files at once.
* **Live Progress Overlays**: Asynchronous multi-upload progress tracker showing live percentages, transferred sizes, and transmission speed.
* **Quick Link Aggregation**: After a successful upload, retrieve Share Links, direct CDN Links, and QR codes instantly inside a single cohesive success panel.

### 📂 Cloud Inventory Manager Dashboard
* **Workspace Panel**: A full cloud workspace dashboard where users can filter, preview, scan, and manage inventory.
* **Live Filter**: Instant name-matching search bar to filter dashboard inventory in real-time.
* **Secure Purges**: Deleting files purges them instantly from remote FTP/SFTP/local storage and cleans up metadata in MongoDB.

### 🎨 Stunning Dark Glassmorphic Interface
* **Premium Theme**: Sleek slate-dark palette (`#070a13`) accented with indigo glowing borders (`#6366f1`), glowing cyan highlights (`#06b6d4`), and premium typography (`Outfit`).
* **Micro-Animations**: Hover animations on action controls, float animations on floating elements, and shake animations on error feedback boxes.

### 🐳 Containerized Cloud-Ready Runtime
* **Cloud-Native Config**: Configurations natively bind to standard `process.env` variables, enabling zero-configuration deployments.
* **Multi-Container Stack**: Includes a robust `docker-compose.yml` linking a lightweight Alpine Node.js app service and a MongoDB service with double persistent volumes (`uploads-data` and `mongo-data`).

---

## 🐳 Running with Docker (Recommended)

To spin up your entire persistent, optimized cloud sharing platform (Node App + Database + Data Volumes) with a single command:

1. **Start the containers**:
   ```bash
   docker-compose up -d --build
   ```
2. **Shut down the containers**:
   ```bash
   docker-compose down
   ```
3. **Check container logs**:
   ```bash
   docker-compose logs -f
   ```

---

## 💻 Running Locally

### 1. Prerequisites
* **Node.js**: Version `18.0.0` or higher installed.
* **MongoDB**: A running local MongoDB database instance or a remote MongoDB Atlas URI connection.

### 2. Setup Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/codedbysoumyajit/Phoenix-XShare.git
   cd Phoenix-XShare
   ```
2. Install the production and socket package dependencies:
   ```bash
   npm install
   ```
3. Configure settings by adding environment variables or updating configuration defaults inside `config/config.js`:
   * Set your `mongoURI` (e.g. `mongodb://localhost:27017/phoenix-xshare`).
   * Set your `domain` (e.g. `http://localhost:3000`).
   * Choose your `storageProvider` ("local" | "ftp" | "sftp") and fill in credentials if utilizing remote backends.
   * Customize your `registrationSecret` to keep signup access restricted.

### 3. Launching
Start the server with the optimal IPv4 DNS resolution flag:
```bash
npm start
```
Open your browser and navigate to `http://localhost:3000` to access your new workspace.

---

## ⚙️ Configuration Properties (`config/config.js`)

Below is the complete set of environment keys you can pass to Docker or standard VPS runs:

| Environment Variable | Description | Default |
| --- | --- | --- |
| `PORT` | Listening port for the web server | `3000` |
| `DOMAIN` | Domain URL (required for share/view links) | `http://localhost:3000` |
| `MONGO_URI` | Connection URI for the MongoDB server | `mongodb://localhost:27017/...` |
| `ENCRYPTION` | Toggle dynamic AES-256 file encryption (`true` / `false`) | `true` |
| `REGISTRATION_SECRET`| Optional secret code required for user signup | *Empty (Public)* |
| `STORAGE_PROVIDER` | Backend storage provider (`local` / `ftp` / `sftp`) | `local` |
| `FTP_HOST` | Host address of your remote FTP server | `ftp.example.com` |
| `SFTP_HOST` | Host address of your remote SFTP server | `sftp.example.com` |

---

## 📄 License

Phoenix XShare is licensed under the [MIT License](https://choosealicense.com/licenses/mit/). See the `LICENSE` file for more details.

---

## 🤝 Contributing

Contributions to make Phoenix XShare even better are always welcome! Feel free to open issues or submit pull requests.

*Built with ❤️ and lots of ☕ by Soumyajit Das & The Open Source Community.*
