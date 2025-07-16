# 🔍 TriggerTools – Keyword Monitor for Web Pages

**TriggerTools** is a simple yet powerful Chrome extension that monitors web pages for custom keywords and displays alerts when matches are found. Perfect for workflows like order processing, content moderation, or any task where spotting specific terms is critical.

---

## ✅ Features

- 🔎 **Keyword-based monitoring**  
  Scan pages for specific words or phrases in real time.

- 🧩 **Trigger logic**  
  Define custom rules using this format:  
  `keyword=message`

- 🧠 **Smart alerts**  
  Show an alert only when a trigger phrase **and** a keyword are both present on the page.

- 💾 **Persistent storage**  
  User-defined rules are saved securely in Chrome’s `storage.sync`.

- 🛠️ **Simple interface**  
  Manage your rules via a clean popup UI—no coding needed.

---

## 🧪 Example Rules

```
Cold brew coffee=⚠️ Add 5lb or 10 lb Nitrigen tank to the order.
latte=✅ Double-check syrups.
Iced americano=💡 Add straws to the order.
Workspace 401 Union Str=Loading dock strict access! Notify the driver.
RandomCompanyName=Badge required! Ask for escort on 40 floor.
RandomCompanyName2=Call 1hr in adwance to the administrator: 000-000-0000!
```

These rules will display the corresponding message when both the *trigger phrase* and *keyword* appear on the page.

---

## 🛡️ Privacy

This extension does **not** collect or transmit any personal or sensitive data. All keyword rules are stored locally in your browser using the `chrome.storage.sync` API.  
See full [Privacy Policy](#) (https://github.com/dmytro-shk/Keyword-alert/blob/main/privacy-policy.md).

---

## 📦 Installation

#### Option 1:

1. Install via Google Chrome store

#### Option 2

1. Clone or download this repository
2. Go to `chrome://extensions/`
3. Enable **Developer mode**
4. Click **"Load unpacked"**
5. Select the extension folder

---

## 📁 File Structure

```
├── manifest.json
├── popup.html
├── popup.js
├── content.js
└── README.md
```

---

## 🚀 Future Ideas

- Regex support
- In-page custom popups (instead of `alert()`)
- Export/import rule sets
- Optional keyword highlighting

---

**License:** MIT
