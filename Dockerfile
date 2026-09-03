# Build FreeDeepseekAPI from source with Chromium for headless browser auth
FROM node:20-bookworm-slim

# Install Chromium and its dependencies (needed for DeepSeek web session)
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    chromium-driver \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnss3 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libxshmfence1 \
    wget \
    ca-certificates \
    git \
 && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer/Chrome where to find the system Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROME_PATH=/usr/bin/chromium

WORKDIR /app

# Clone the project from GitHub
RUN git clone https://github.com/ForgetMeAI/FreeDeepseekAPI.git . \
 && npm install --omit=dev 2>/dev/null || true

# Expose the default server port
EXPOSE 9655

# Launch in non-interactive (headless/CI) mode
ENV NON_INTERACTIVE=1
CMD ["node", "server.js"]
