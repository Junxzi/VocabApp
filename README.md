# VocabMaster Setup

This repository contains the web server and React Native mobile app for **VocabMaster**.

## Setup Script

A convenience script is provided to install dependencies for both the main project and the mobile application and to initialize default categories in the database.

```bash
# from the repository root
chmod +x .codex/setup.sh
./.codex/setup.sh
```

The script performs the following steps:

1. Installs root project dependencies using `npm install`.
2. Installs mobile app dependencies inside the `mobile` directory.
3. Runs `server/setup-categories.ts` using `npx ts-node` to populate the database with default categories.

Ensure the `DATABASE_URL` environment variable is configured before running the script so the setup can connect to your PostgreSQL database.
