# 🌌 Phoenix Drive

**Phoenix Drive** is a premium, secure, self-hosted cloud storage and file sharing workspace modeled after Google Drive and designed using **Material You** design principles. Built on a modern full-stack architecture with Next.js, Express, and MongoDB, it provides in-transit file encryption, direct drag-and-drop file ingestion, dynamic light/dark styling, and sharing features.

---

## 🎨 Design System & Aesthetic

* **Material You Inspired Layout**: Built with a sleek pastel-accented color palette, organic card elements, high-end hover responses, and fluid transition easing.
* **Fluid Theme Engine**: Full client-side light and dark mode synchronization. Integrates an anti-flash blocking script in the header to ensure transitions are instantaneous and comfortable for the eyes.
* **Responsive Layout Strategy**:
  * **Desktop**: Double-column dashboard featuring a Left Navigation Sidebar and a unified horizontal toolbar matching high-end cloud storage explorers.
  * **Mobile**: Automatically collapses to a clean single-column view, replacing list tables with compact rows and wrapping sidebar items into a bottom navigation drawer or bottom-right Floating Action Button (FAB).

---

## 🚀 Key Features

* **🗂 File & Folder Explorer**: Fully nested virtual directory system with folder path breadcrumbs, supporting instant dynamic search query filtering on the client.
* **🎛 Grid & List Layout Toggle**:
  * **Grid View**: Displays modern item cards containing format badges, metadata details, options, and direct file preview thumbnails.
  * **List View**: Displays compact table rows. Non-essential table columns dynamically hide on mobile viewports to prevent layout squishing.
* **📥 Direct Drag-and-Drop Uploader**: Drag one or more files anywhere onto the dashboard to initiate uploads instantly in the active folder directory.
* **⚡ Background Upload Widget**: A floating progress widget in the bottom-right corner tracks file queues, percentage bars, and finishes without blocking the main user interface.
* **🛡 Active Server Encryption**: Fully automatic server-side AES-256 binary file encryption and decryption processes on demand.
* **📱 Share Links & Adaptive QR Sharing**: Generates share links and custom QR codes. The QR generator dynamically adjusts its canvas background color depending on whether light or dark mode is selected.
* **🖼 In-Browser File Previews**: Stream and preview images, video (auto-playing HTML5 frames), audio, PDFs, and syntax-highlighted code blocks directly from the browser window.

---

## 🛠 Tech Stack

* **Frontend**: React 19, Next.js 16 (App Router), Tailwind CSS v4, PostCSS, Progress Web App (PWA).
* **Backend**: Node.js, Express, MongoDB (session management and file metadata tracking), local/FTP/SFTP storage adapters.
* **Development**: Concurrently.

---

## 📂 Project Structure

```text
├── backend/
│   ├── config/             # Config files and environment overrides
│   ├── src/
│   │   ├── controllers/    # Authentication and secure file controllers
│   │   ├── middleware/     # JWT/session authentication checkers
│   │   ├── routes/         # Router mounting endpoints
│   │   ├── utils/          # Console logger, MongoDB driver, helpers
│   │   └── index.js        # Server launch file
│   └── package.json
│
├── frontend/
│   ├── app/                # Next.js App Router workspace
│   │   ├── console/        # System settings console page
│   │   ├── dashboard/      # Google Drive file explorer core
│   │   ├── download/       # Secure public download portals
│   │   ├── login/          # Material You login interface
│   │   ├── register/       # User sign up form
│   │   ├── upload/         # Alternative manual upload forms
│   │   ├── view/           # Browser preview Dynamic page views
│   │   ├── globals.css     # Tailwind v4 import & transition presets
│   │   ├── layout.js       # Global provider context & blocking script
│   │   └── Navbar.js       # Floating header & theme switch toggler
│   ├── public/             # PWA assets, manifest and favicon icons
│   ├── package.json
│   └── next.config.mjs
│
├── package.json            # Workspace orchestrator package
└── README.md
```

---

## 🚦 Getting Started

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **MongoDB** (running locally or a connection URI string)

### Installation
Clone the repository and run the setup scripts from the root directory:

```bash
# Install root, backend, and frontend dependencies concurrently
npm run install:all
```

### Run Locally (Development)
Launch both the Next.js dev server and the Express API server concurrently with a single command:

```bash
npm run dev
```

* The **Frontend** client will boot on `http://localhost:3000`
* The **Backend** API proxy will launch on `http://localhost:5000`

### Build for Production
To build the static HTML and optimization bundle for production deployment:

```bash
# Compiles Next.js bundle and TypeScript definitions
npm run build
```

---

## 🐳 Docker Deployment

You can also run **Phoenix Drive** in a containerized environment using Docker and Docker Compose. This packages the Node.js application server and sets up a dedicated MongoDB instance automatically.

### 1. Build and Start Services
Run the following command from the root of the project to build the image and start the containers in the background (detached mode):

```bash
docker-compose up --build -d
```

### 2. Access the Application
* **Web Portal**: Open `http://localhost:3000` in your web browser.
* **Database**: MongoDB will run internally inside the container network on port `27017`, persisting data inside the named volume `mongo-data`.
* **Storage**: Uploaded files are securely stored inside the `uploads-data` container volume.

### 3. Stop the Application
To stop and remove the active containers while keeping your database volumes intact, run:

```bash
docker-compose down
```

