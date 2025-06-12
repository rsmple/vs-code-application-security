# Whitespots Application Security Extension

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/Whitespots.whitespots-application-security?label=VS%20Code%20Marketplace&logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=Whitespots.whitespots-application-security)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/Whitespots.whitespots-application-security)](https://marketplace.visualstudio.com/items?itemName=Whitespots.whitespots-application-security)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/Whitespots.whitespots-application-security)](https://marketplace.visualstudio.com/items?itemName=Whitespots.whitespots-application-security)
[![GitHub Stars](https://img.shields.io/github/stars/rsmple/myga?style=social)](https://github.com/your-username/myga/stargazers)

**Description**: A Visual Studio Code extension to integrate with the [Whitespots Application Security Portal](https://whitespots.io/) and display vulnerabilities related to the current repository.

---

## 🛡️ Overview

The **Whitespots Application Security Extension** brings vulnerability insights directly into your VS Code workspace. It connects to your instance of the **Whitespots Application Security Portal** and retrieves detailed information about security issues discovered in your current project repository.

This tool is ideal for developers who want to:

- See real-time vulnerability data in their code editor
- Quickly identify and fix security issues
- Stay in sync with the Portal’s scan results

---

## 🚀 Features

- 🔗 Connect your local project to a Whitespots Portal instance
- 📂 Automatically detect the current repository and fetch related vulnerabilities
- 🛠️ View issue descriptions, severity, file paths, and remediation tips
- 🧭 Navigate from the vulnerability list to affected code locations
- ♻️ Refresh data with a single click

---

## 🔧 Requirements

- Access to a Whitespots Application Security Portal instance
- Project repository asset registered and scanned in the Portal
- Internet access to communicate with the Portal API

---

## 🔌 Installation

1. Open **Visual Studio Code**
2. Go to the **Extensions** sidebar (`Ctrl+Shift+X`)
3. Search for **"Whitespots Security"**
4. Click **Install**

---

## 🛠️ Usage

1. Open a project folder in **Visual Studio Code**
2. Click on the **Whitespots Security** icon in the sidebar to open the extension panel
3. In the panel, click the **Settings** (⚙️) button
4. Enter the following details in the settings form:
   - **External Portal URL** – the External URL of your Whitespots Application Security Portal instance
   - **Auth API Token** – authorization API token from the Portal

Once configured, the extension will automatically retrieve and display vulnerabilities related to the current repository.

---

## 🧪 Development & Contributions

This extension is developed and maintained by **Whitespots**.

For feature requests, feedback, or support inquiries, please contact us at [sales@whitespots.io](mailto:sales@whitespots.io).

---

## 📄 License

MIT License  
© Whitespots