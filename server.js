'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.KMEI_PORT || 8080);
const ROOT = __dirname;
const STORAGE_ROOT = process.env.KMEI_STORAGE_ROOT
    ? path.resolve(process.env.KMEI_STORAGE_ROOT)
    : ROOT;
const BOARD_DIR = path.join(STORAGE_ROOT, 'board-library');
const FILE_DIR = path.join(STORAGE_ROOT, 'library-file');
const MANIFEST = path.join(BOARD_DIR, 'file-list.txt');
const MAX_BODY_SIZE = 50 * 1024 * 1024;

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.hwp': 'application/x-hwp',
    '.hwpx': 'application/vnd.hancom.hwpx'
};

function sendJson(response, status, payload) {
    response.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    response.end(JSON.stringify(payload));
}

function safeName(value, fallback) {
    const cleaned = String(value || '')
        .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
        .replace(/[. ]+$/g, '')
        .trim();
    return cleaned || fallback;
}

function uniqueFileName(directory, requestedName) {
    const extension = path.extname(requestedName);
    const base = path.basename(requestedName, extension);
    let candidate = requestedName;
    let number = 1;

    while (fs.existsSync(path.join(directory, candidate))) {
        candidate = `${base}-${number}${extension}`;
        number += 1;
    }
    return candidate;
}

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} Bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function collectBody(request) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let size = 0;

        request.on('data', (chunk) => {
            size += chunk.length;
            if (size > MAX_BODY_SIZE) {
                reject(new Error('등록 가능한 전체 용량은 50MB 이하입니다.'));
                request.destroy();
                return;
            }
            chunks.push(chunk);
        });
        request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        request.on('error', reject);
    });
}

async function saveLibraryPost(request, response) {
    try {
        const raw = await collectBody(request);
        const input = JSON.parse(raw);
        const title = safeName(input.title, '제목 없음');
        const date = /^\d{4}-\d{2}-\d{2}$/.test(input.date || '')
            ? input.date
            : new Date().toISOString().slice(0, 10);
        const content = String(input.content || '').trim();

        if (!content) {
            sendJson(response, 400, { message: '내용을 입력해 주세요.' });
            return;
        }

        fs.mkdirSync(BOARD_DIR, { recursive: true });
        fs.mkdirSync(FILE_DIR, { recursive: true });

        const textFileName = `${title}.txt`;
        const textPath = path.join(BOARD_DIR, textFileName);
        if (fs.existsSync(textPath)) {
            sendJson(response, 409, { message: '같은 제목의 자료가 이미 존재합니다.' });
            return;
        }

        const savedFiles = [];
        for (const file of Array.isArray(input.files) ? input.files : []) {
            const originalName = safeName(file.name, 'attachment.bin');
            const storedName = uniqueFileName(FILE_DIR, originalName);
            const bytes = Buffer.from(String(file.data || ''), 'base64');
            fs.writeFileSync(path.join(FILE_DIR, storedName), bytes);
            savedFiles.push({
                name: originalName,
                path: storedName,
                size: formatSize(bytes.length)
            });
        }

        const record = {
            id: Date.now(),
            title,
            date,
            content: [{ heading: '자료 안내', text: content, items: [] }],
            files: savedFiles
        };

        fs.writeFileSync(textPath, `${JSON.stringify(record)}\n`, 'utf8');

        const current = fs.existsSync(MANIFEST)
            ? fs.readFileSync(MANIFEST, 'utf8').split(/\r?\n/).filter(Boolean)
            : [];
        current.unshift(textFileName);
        fs.writeFileSync(MANIFEST, `${current.join('\n')}\n`, 'utf8');

        sendJson(response, 201, {
            message: '자료가 저장되었습니다.',
            fileName: textFileName
        });
    } catch (error) {
        sendJson(response, 400, { message: error.message || '저장 중 오류가 발생했습니다.' });
    }
}

function serveStatic(request, response) {
    let pathname;
    try {
        pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
    } catch {
        response.writeHead(400);
        response.end('Bad Request');
        return;
    }

    if (pathname === '/') pathname = '/main.html';
    const target = path.resolve(ROOT, `.${pathname}`);
    if (!target.startsWith(`${ROOT}${path.sep}`) && target !== ROOT) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
    }

    fs.stat(target, (error, stats) => {
        if (error || !stats.isFile()) {
            response.writeHead(404);
            response.end('Not Found');
            return;
        }
        response.writeHead(200, {
            'Content-Type': mimeTypes[path.extname(target).toLowerCase()] || 'application/octet-stream'
        });
        fs.createReadStream(target).pipe(response);
    });
}

const server = http.createServer((request, response) => {
    if (request.method === 'OPTIONS') {
        response.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
        });
        response.end();
        return;
    }
    if (request.method === 'POST' && request.url === '/api/library') {
        saveLibraryPost(request, response);
        return;
    }
    if (request.method === 'GET' || request.method === 'HEAD') {
        serveStatic(request, response);
        return;
    }
    response.writeHead(405, { Allow: 'GET, HEAD, POST' });
    response.end('Method Not Allowed');
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`KMEI server: http://127.0.0.1:${PORT}/`);
    console.log(`자료실 글쓰기: http://127.0.0.1:${PORT}/board-library-write.html`);
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`[오류] ${PORT} 포트를 다른 프로그램이 사용 중입니다.`);
        console.error('해당 프로그램을 종료한 뒤 start-server.cmd를 다시 실행해 주세요.');
    } else {
        console.error('[오류] 저장 서버를 시작하지 못했습니다:', error.message);
    }
    process.exitCode = 1;
});
