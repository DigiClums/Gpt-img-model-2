const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path");
const http = require("http");
const fs = require("fs");
const dotenv = require("dotenv");
const serveHandler = require("serve-handler");
const OpenAI = require("openai");

// Load .env.local file from root directory or user app data
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

let mainWindow = null;
let serverPort = 3000;
let server = null;

/**
 * Get OpenAI client instance for Node main process
 */
function getOpenAIInstance() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_openai_api_key_here") {
    throw new Error("OPENAI_API_KEY is not configured in .env.local");
  }

  const timeoutMs = parseInt(process.env.OPENAI_TIMEOUT_MS || "180000", 10);
  return new OpenAI({
    apiKey: apiKey.trim(),
    timeout: timeoutMs,
    maxRetries: 3,
  });
}

/**
 * Handle gpt-image-2 generation in Node.js Main Process
 */
async function handleGenerateImage(payload) {
  const openai = getOpenAIInstance();
  const { prompt, size = "1024x1024", n = 1, quality = "auto", autoEnhance = true, image } = payload;
  const targetModel = "gpt-image-2";

  let requestSize = "1024x1024";
  if (size === "1536x1024") requestSize = "1792x1024";
  else if (size === "1024x1536") requestSize = "1024x1792";

  let finalPrompt = prompt;
  let enhancedPrompt = undefined;

  // Prompt Auto-Enhancement
  if (autoEnhance && !image) {
    try {
      const enhanceRes = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert AI image prompt engineer for gpt-image-2. Transform simple user prompts into highly detailed, vivid, photorealistic, cinematic image prompts suitable for high quality image synthesis. Focus on lighting, art style, camera angle, textures, and color palette. Output ONLY the enhanced prompt string without commentary, quotes, or prefix.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 250,
      });
      const enhanced = enhanceRes.choices[0]?.message?.content?.trim();
      if (enhanced && enhanced !== prompt) {
        enhancedPrompt = enhanced;
        finalPrompt = enhanced;
      }
    } catch (err) {
      console.warn("Auto enhance warning:", err.message);
    }
  }

  const results = [];

  // Image Editing Mode
  if (image && typeof image === "string" && image.startsWith("data:image")) {
    const base64Data = image.split(",")[1];
    const imageBuffer = Buffer.from(base64Data, "base64");
    const file = new File([imageBuffer], "input.png", { type: "image/png" });

    const editResponse = await openai.images.edit({
      model: targetModel,
      image: file,
      prompt: finalPrompt,
      n: Math.min(n, 4),
      size: "1024x1024",
    });

    for (const item of editResponse.data || []) {
      if (item.b64_json) {
        results.push({ url: `data:image/png;base64,${item.b64_json}`, revisedPrompt: finalPrompt });
      } else if (item.url) {
        try {
          const res = await fetch(item.url);
          const buffer = await res.arrayBuffer();
          const base64Str = Buffer.from(buffer).toString("base64");
          const mime = res.headers.get("content-type") || "image/png";
          results.push({ url: `data:${mime};base64,${base64Str}`, revisedPrompt: finalPrompt });
        } catch {
          results.push({ url: item.url, revisedPrompt: finalPrompt });
        }
      }
    }
    return { success: true, images: results, enhancedPrompt };
  }

  // Standard Image Generation Mode
  const count = Math.min(Math.max(1, n), 4);
  for (let i = 0; i < count; i++) {
    const response = await openai.images.generate({
      model: targetModel,
      prompt: finalPrompt,
      n: 1,
      size: requestSize,
      quality: quality || "auto",
    });

    const item = response.data?.[0];
    if (item?.b64_json) {
      results.push({ url: `data:image/png;base64,${item.b64_json}`, revisedPrompt: item.revised_prompt || finalPrompt });
    } else if (item?.url) {
      try {
        const res = await fetch(item.url);
        const buffer = await res.arrayBuffer();
        const base64Str = Buffer.from(buffer).toString("base64");
        const mime = res.headers.get("content-type") || "image/png";
        results.push({ url: `data:${mime};base64,${base64Str}`, revisedPrompt: item.revised_prompt || finalPrompt });
      } catch {
        results.push({ url: item.url, revisedPrompt: item.revised_prompt || finalPrompt });
      }
    }
  }

  return { success: true, images: results, enhancedPrompt };
}

/**
 * Start lightweight embedded HTTP server serving Next.js exported static files and API endpoints
 */
function startEmbeddedServer() {
  return new Promise((resolve, reject) => {
    const outDir = path.join(__dirname, "..", "out");

    server = http.createServer((req, res) => {
      // Intercept POST /api/generate-image
      if (req.method === "POST" && req.url === "/api/generate-image") {
        let body = "";
        req.on("data", (chunk) => (body += chunk.toString()));
        req.on("end", async () => {
          try {
            const payload = JSON.parse(body);
            const result = await handleGenerateImage(payload);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(result));
          } catch (error) {
            console.error("API Generate Error in Main Process:", error);
            const status = error.status || 500;
            res.writeHead(status, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                success: false,
                error: error.message || "OpenAI API request failed.",
                code: status,
              })
            );
          }
        });
        return;
      }

      // Serve static Next.js export assets from out/ directory
      return serveHandler(req, res, {
        public: outDir,
        cleanUrls: true,
      });
    });

    server.listen(0, "127.0.0.1", () => {
      serverPort = server.address().port;
      console.log(`[Electron Server] Running on http://127.0.0.1:${serverPort}`);
      resolve(serverPort);
    });

    server.on("error", (err) => reject(err));
  });
}

/**
 * Create Electron Main Window
 */
async function createWindow() {
  await startEmbeddedServer();

  mainWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: "ChatGPT Image Studio",
    backgroundColor: "#0d0d0e",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  mainWindow.loadURL(`http://127.0.0.1:${serverPort}`);

  // Open external links in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (server) server.close();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
