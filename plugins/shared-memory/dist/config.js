"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigPath = getConfigPath;
exports.checkConfig = checkConfig;
exports.saveConfig = saveConfig;
exports.loadConfig = loadConfig;
exports.getMissingConfigMessage = getMissingConfigMessage;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const CONFIG_DIR = path.join(os.homedir(), '.config', 'brain-jar');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
function getConfigPath() {
    return CONFIG_FILE;
}
function checkConfig() {
    if (!fs.existsSync(CONFIG_FILE)) {
        return { status: 'missing', configPath: CONFIG_FILE };
    }
    try {
        const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const config = JSON.parse(content);
        if (!config.mem0_api_key) {
            return { status: 'missing', configPath: CONFIG_FILE };
        }
        return {
            status: 'configured',
            apiKey: config.mem0_api_key,
            configPath: CONFIG_FILE,
        };
    }
    catch {
        return { status: 'missing', configPath: CONFIG_FILE };
    }
}
function saveConfig(config) {
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
function loadConfig() {
    const status = checkConfig();
    if (status.status === 'missing') {
        return null;
    }
    const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
}
function getMissingConfigMessage() {
    return `
Mem0 API Key Required

To use shared-memory, you need a Mem0 API key:

1. Go to https://app.mem0.ai
2. Sign up (free tier: 10,000 memories)
3. Navigate to Settings -> API Keys
4. Create and copy your key

Then run: node dist/index.js --setup

Or create ${CONFIG_FILE} with:
{
  "mem0_api_key": "your-key-here",
  "default_scope": "global",
  "auto_summarize": true
}
`.trim();
}
//# sourceMappingURL=config.js.map