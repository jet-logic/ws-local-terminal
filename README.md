# Workspace Local Terminal

![VSCode Extension](https://img.shields.io/visual-studio-marketplace/v/JetLogic.workspace-local-terminal)
![VSCode Downloads](https://img.shields.io/visual-studio-marketplace/d/JetLogic.workspace-local-terminal)
![License](https://img.shields.io/github/license/jet-logic/ws-local-terminal)

<a href="https://ko-fi.com/B0B01E8SY7"><img src="https://storage.ko-fi.com/cdn/brandasset/v2/support_me_on_kofi_beige.png" alt="Alt Text" width="50%" height="50%" /></a>
[![vscode](https://cdn.vsassets.io/v/M255_20250415.1/_content/Header/vs-logo.png)](https://marketplace.visualstudio.com/items?itemName=JetLogic.workspace-local-terminal)

**Ride the shell locally, with shared initialization and history file scoped to your workspace.**

This extension sets up a terminal in Visual Studio Code that uses a workspace-specific initialization and history file, keeping your shell history clean, relevant, and project-specific.

---

## ✨ Features

- 📁 **Workspace-local terminal** with its own history and initialization file.
- 🧠 Shared history across terminal sessions within the same workspace.
- 🧠 Store your configurations in a separate rcfile to avoid modifying the default, enabling custom environment variables and init commands.
- ⚙️ Easy setup via command: `Setup Workspace Local Terminal`.
- 🐚 Shell compatibility: works with `bash`, `zsh`, `fish`.

---

## 🚀 Usage

1. Open your project in VSCode.
2. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
3. Run: **`Setup Workspace Local Terminal`**
4. That’s it! You now have a terminal tied to your project with its own history file.
5. **For bash shells:**
   - Custom initialization runs from **.vscode/.bashrc**
   - Shell history is saved in **.vscode/.bash_history**

## 🔧 Requirements

- Visual Studio Code `^1.50.0`
- Shell like `bash`, `zsh`, `fish`, etc.

---

## ⚙️ Development

```bash
npm install
npm run compile
```
