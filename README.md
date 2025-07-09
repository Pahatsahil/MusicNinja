# 🎵 MusicNinja – React Native App

A personal music app built with **React Native** and powered by a **Flask backend**, which converts YouTube videos into MP3 audio and plays them using `react-native-track-player`.

---

## 🚀 Features

- 🔎 Search YouTube videos (music only) via YouTube Data API
- 🎧 Download and play MP3 audio extracted via `yt-dlp`
- 💾 Save audio files locally to reduce re-downloads
- 🔊 Integrated audio player with playback controls
- ⚡ Fast and simple UI designed for daily personal use

---

## 🧱 Tech Stack

| Layer    | Technology                |
| -------- | ------------------------- |
| Frontend | React Native, TypeScript  |
| Backend  | Flask, yt-dlp, Python     |
| Audio    | react-native-track-player |
| Storage  | Local File System (RNFS)  |

---

## 📂 Folder Structure

MusicNinja/
├── src/
│ ├── components/
│ ├── screens/
│ ├── services/ # API functions (search, download)
│ ├── hooks/ # Custom player/audio hooks
│ └── utils/ # Common utilities
├── assets/
│ ├── images/
│ └── splash/
├── App.tsx
└── package.json

---

## 🔧 Setup Instructions

### 1. Clone the repo

```bash
git clone https://github.com/Pahatsahil/MusicNinja.git
cd MusicNinja
⚙️ Getting Started
Note: Make sure you've followed the official React Native environment setup guide for your OS.

2. Start Metro Bundler
bash
Copy
Edit
# Using npm
npm start

# OR using Yarn
yarn start
3. Run the App
Android
bash
Copy
Edit
npm run android
# OR
yarn android
iOS (Mac Only)
Install CocoaPods first (only once):

bash
Copy
Edit
cd ios
pod install
cd ..
Then run:

bash
Copy
Edit
npm run ios
# OR
yarn ios
4. Edit and Save
Open App.tsx and make changes. Your app will auto-refresh via Fast Refresh.

🛠 Troubleshooting
React Native Docs: Troubleshooting Guide

Reset cache:

bash
Copy
Edit
npx react-native start --reset-cache
🎉 Congratulations!
You’ve successfully run and modified your React Native app! 🎊
```
