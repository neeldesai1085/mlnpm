# 🚀 MLNPM: The Machine Learning Package Manager

[![Backend](https://img.shields.io/badge/Backend-Express.js-blue.svg)]()
[![Frontend](https://img.shields.io/badge/Frontend-React.js-61dafb.svg)]()
[![Database](https://img.shields.io/badge/Database-PostgreSQL-336791.svg)]()

MLNPM is a high-performance, distributed ecosystem designed to bridge the gap between **Python-based Data Science** and **Node.js Production Environments**. It enables developers to package, publish, and consume machine learning models as native NPM modules with zero Python dependencies at runtime.

**Live Deployment:** [mlnpm.vercel.app](https://mlnpm.vercel.app)  
**NPM Packages:** [@mlnpm/cli](https://www.npmjs.com/package/@mlnpm/cli) | [@mlnpm/runtime](https://www.npmjs.com/package/@mlnpm/runtime)

---

## 📋 Table of Contents
1. [Overview](#-overview)
2. [Why MLNPM? (The USP)](#-why-mlnpm-the-usp)
3. [Deep Architectural Deep-Dive](#-deep-architectural-deep-dive)
4. [CLI Mastery & Lifecycle](#-cli-mastery--lifecycle)
5. [Advanced Technical Features](#-advanced-technical-features)
6. [Database Engineering](#-database-engineering)
7. [Security & Infrastructure](#-security--infrastructure)
8. [Deployment & Operations](#-deployment--operations)
9. [Technology Stack](#-technology-stack)
10. [License](#-license)

---

## 🌟 Overview

For modern developers, deploying machine learning models usually requires complex Python microservices (FastAPI/Flask). **MLNPM** eliminates this overhead by allowing models to be run natively in Node.js using **ONNX Runtime**.

---

## 💎 Why MLNPM? (The USP)

While platforms like **Hugging Face** are incredible for research, they often present a significant barrier for Node.js developers who need lightweight, production backends.

| Feature | Hugging Face | **MLNPM** |
| :--- | :--- | :--- |
| **Runtime** | Python/PyTorch Required. | **Zero Python.** Native Node.js execution. |
| **Workflow** | Manual weight handling. | **NPM Paradigm.** Install via `node_modules`. |
| **Infrastructure** | Heavyweight Containers. | **Ultra-Lightweight.** Standard Node process. |

---

## 🏗️ Deep Architectural Deep-Dive

### 1. The CLI/Runtime "Internal Handshake"
When a user runs `mlnpm install <package>`, MLNPM performs surgical filesystem operations:
- **Direct FS Scaffolding**: The CLI identifies the local `@mlnpm/runtime` and dynamically creates a dedicated directory structure for the model.
- **Dynamic Module Bridge**: It generates a `wrapper.config.js` and an `index.js` on the fly, allowing for `import model from "my-model"` syntax.
- **Dependency Isolation**: Native OS bindings (`onnxruntime-node`) are linked specifically to the runtime's internal session manager.

### 2. Native System Bridges
Through `onnxruntime-node`, the system automatically detects and links to:
- **NVIDIA CUDA** (Windows/Linux GPU)
- **Apple CoreML** (macOS Silicon)
- **DirectML** (Windows/DirectX)
*The runtime includes graceful fallback logic to "strip" unavailable providers in real-time, preventing crashes on lower-end hardware.*

---

## 📟 CLI Mastery & Lifecycle

The MLNPM CLI (`@mlnpm/cli`) is a full **Lifecycle Management System** for machine learning models.

### 1. Global Model Mirroring
- **Location**: Models are stored in the user's home directory (`~/.mlnpm/cache`).
- **Optimization**: If multiple projects on the same machine use the same model version, the CLI downloads it only once, sharing it across projects.

### 2. Environment Maintenance Commands
| Command | Action | Technical Impact |
| :--- | :--- | :--- |
| `mlnpm list` | Inventory Audit | Listings of all locally installed and globally cached models. |
| `mlnpm cache` | Footprint Mgmt | Audit and clear model binaries to free up disk space. |
| `mlnpm restore` | Env Repair | Re-scaffolds the `node_modules/@mlnpm` directory from the manifest. |
| `mlnpm uninstall` | Surgical Cleanup | Removes model entries from project dependencies and runtime links. |

---

## 🛠️ Advanced Technical Features

### 1. Hierarchical Registry Protocol
- **Version Yanking**: Support for marking versions as "Yanked" in the database, protecting developers from using faulty models.
- **Manifest Merge Engine**: Dynamically joins `versions` and `version_files` to generate unique manifests with 60-minute expiring R2 signatures.

### 2. Multi-Cloud Orchestration (R2 & Brevo)
- **Cloudflare R2**: Secure object storage with a **Presigned URL Protocol** for protected model streaming.
- **Brevo V3 (Transactional)**: MLNPM uses the **Brevo REST API** for mission-critical email delivery, bypassing traditional SMTP delivery issues.
- **OTP Security Policy**: One-Time Passwords have a strict **10-minute expiration (TTL)**, enforced at both the application and database layers.

### 3. Client-Side Compilation Bridge
- **Sucrase Engine**: Compiles model wrappers *in the browser* using the Sucrase library, ensuring sanitized JavaScript reaches the production backend.
- **Context-Aware Docs**: Backend scans wrappers for `predict()` or `stream()` and customizes all CLI/Web documentation snippets automatically.

---

## 🗄️ Database Engineering (PostgreSQL)

### 1. Search Efficiency & Analytics
- **Relevance Ranking**: Search results prioritized via `access_count` (total views/installs).
- **Access-Count Indexing**: High-performance B-tree indexes for constant-time complexity during popularity sorting.

### 2. Relational Integrity & Automation
- **`ON DELETE CASCADE`**: Deep-purging logic across `Users -> Packages -> Versions`.
- **Meta-Triggers**: Automated timestamp management via custom PL/pgSQL functions.

---

## 🛡️ Security & Infrastructure

| Feature | Implementation | Purpose |
| :--- | :--- | :--- |
| **Integrity Hash** | SHA-256 Signature Match | Verifies R2 binary integrity after cloud transit. |
| **Password Sec** | Bcrypt (12 Rounds) | Industrial-strength credential salting. |
| **Session Proact** | Proactive DB Validation | Frontend verifies user existence on every page load. |
| **Hardening** | Helmet.js & Origin Whitelist | Prevents XSS, Frame-Injection, and CSRF. |

---

## 🚀 Deployment & Operations

### 1. Frontend (Vercel)
- **SPA Rewrite Logic**: Uses a precise `vercel.json` configuration to rewrite all non-file requests (`/(.*)`) to the root index. This enables clean, bookmarkable URLs and fixes routing issues on page refreshes.

### 2. Backend Orchestration (Render/Cloud)
- **Environment Calibration**: Highly modular environment configuration that allows the CLI and Dashboard to switch seamlessly between development and production endpoints based on build context.
- **Stateless Scaling**: The architecture is entirely stateless (using JWT and R2 presigned URLs), allowing the backend to scale horizontally without session synchronization issues.

---

## 📦 Technology Stack

| Category | Primary Technologies |
| :--- | :--- |
| **Inference Engine** | ONNX Runtime Node (Native OS Bindings) |
| **Email Service** | **Brevo Transactional API (V3)** |
| **Frontend UI** | React 18, Vite, Tailwind CSS, Sucrase |
| **Backend Core** | Node.js (NodeNext), Express.js, PostgreSQL |
| **Object Storage** | Cloudflare R2 (@aws-sdk/client-s3) |

---

## 📜 License

MLNPM was created by **Neel Desai** as a comprehensive solution for native Machine Learning in Node.js. Licensed under the **MIT License**.