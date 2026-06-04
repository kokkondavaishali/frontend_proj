/**
 * Intelligent Demand Forecast & Inventory Management System
 * Local Deployment & Startup Orchestrator
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

console.log('\x1b[35m%s\x1b[0m', '==================================================');
console.log('\x1b[35m%s\x1b[0m', '   🚀 STARTING DEMAND FORECAST SYSTEM DEPLOYMENT  ');
console.log('\x1b[35m%s\x1b[0m', '==================================================\n');

// 1. Install Backend Dependencies if missing
const backendDir = path.join(__dirname, 'backend');
const nodeModulesExist = fs.existsSync(path.join(backendDir, 'node_modules'));

if (!nodeModulesExist) {
    console.log('\x1b[33m%s\x1b[0m', '📦 Installing backend dependencies, please wait...');
    try {
        execSync('npm install', { cwd: backendDir, stdio: 'inherit' });
        console.log('\x1b[32m%s\x1b[0m', '✅ Backend dependencies installed successfully.\n');
    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', '❌ Failed to install backend dependencies:', error.message);
        process.exit(1);
    }
} else {
    console.log('\x1b[32m%s\x1b[0m', '✅ Backend dependencies are already installed.\n');
}

// 2. Setup Frontend Static Server (Port 3000)
function startFrontendServer() {
    const publicDir = path.join(__dirname, 'frontend');
    const MIME_TYPES = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    };

    const server = http.createServer((req, res) => {
        // Decode URL to handle spaces/special characters
        const decodedUrl = decodeURIComponent(req.url.split('?')[0]);
        let filePath = path.join(publicDir, decodedUrl === '/' ? 'index.html' : decodedUrl);
        
        // Prevent directory traversal attacks
        if (!filePath.startsWith(publicDir)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Forbidden');
            return;
        }

        fs.stat(filePath, (err, stats) => {
            if (err || !stats.isFile()) {
                // Check if appending .html helps
                const htmlFilePath = filePath + '.html';
                if (fs.existsSync(htmlFilePath) && fs.statSync(htmlFilePath).isFile()) {
                    filePath = htmlFilePath;
                } else {
                    // Fallback to index.html
                    filePath = path.join(publicDir, 'index.html');
                }
            }
            
            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            
            res.writeHead(200, { 'Content-Type': contentType });
            fs.createReadStream(filePath).pipe(res);
        });
    });

    server.listen(3000, '0.0.0.0', () => {
        console.log('\x1b[36m%s\x1b[0m', '💻 FRONTEND: Serving client at http://localhost:3000');
    });

    server.on('error', (err) => {
        console.error('\x1b[31m%s\x1b[0m', `❌ Frontend server error: ${err.message}`);
    });
}

// 3. Spawn Services
const children = [];

function spawnService(name, command, args, cwd, colorCode) {
    console.log(`🚀 Starting ${name} in ${cwd}...`);
    
    // On Windows, running python or npm might need shell: true
    const child = spawn(command, args, { 
        cwd, 
        shell: true,
        env: { ...process.env, FORCE_COLOR: 'true' }
    });
    
    child.stdout.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
            console.log(`${colorCode}[${name}]\x1b[0m ${line}`);
        });
    });
    
    child.stderr.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
            console.warn(`${colorCode}[${name} ERROR]\x1b[0m ${line}`);
        });
    });
    
    child.on('close', (code) => {
        console.log(`🛑 ${name} process exited with code ${code}`);
        cleanup();
        process.exit(code || 0);
    });

    children.push(child);
    return child;
}

function cleanup() {
    console.log('\n🧹 Shutting down all services...');
    children.forEach(child => {
        try {
            if (!child.killed) {
                // Kill process tree on Windows if possible
                if (process.platform === 'win32') {
                    spawn('taskkill', ['/pid', child.pid, '/f', '/t']);
                } else {
                    child.kill('SIGTERM');
                }
            }
        } catch (e) {
            // Silence shutdown errors
        }
    });
    console.log('👋 All services stopped.');
}

// Handle termination signals
process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
});
process.on('SIGTERM', () => {
    cleanup();
    process.exit(0);
});

// Start frontend server
startFrontendServer();

// Start ML service (Python)
// First detect if virtual environment or python command is active
const mlDir = path.join(__dirname, 'ml-service');
spawnService('ML-SERVICE', 'python', ['app.py'], mlDir, '\x1b[32m');

// Start Backend server (Node)
spawnService('BACKEND', 'node', ['server.js'], backendDir, '\x1b[34m');

console.log('\x1b[32m%s\x1b[0m', '\n🎉 All services initiated! Press Ctrl+C to terminate all services.');
