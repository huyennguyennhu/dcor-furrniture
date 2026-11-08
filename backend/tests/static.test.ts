/**
 * NHÓM B - KIỂM THỬ TĨNH MÃ NGUỒN (STATIC ANALYSIS TESTS)
 * Đọc mã nguồn backend/src để kiểm tra kiến trúc, bảo mật, và cấu hình route.
 * Chạy bằng: npx ts-node tests/static.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.resolve(__dirname, '../src');
const ROUTES_DIR = path.join(SRC_DIR, 'routes');

describe('NHÓM B - KIỂM THỬ TĨNH MÃ NGUỒN (STATIC CODE TESTS)', () => {

  it('TC-STAT-01: Mọi route trong các router /api/admin/* phải có authenticateJWT và requirePermission', () => {
    // Tìm các file route phục vụ phân hệ quản trị
    // Gồm: admin-*.routes.ts, chat-admin.routes.ts, blog-admin.routes.ts, staff.routes.ts, inventory.routes.ts, report.routes.ts, design.routes.ts
    const serverPath = path.join(SRC_DIR, 'server.ts');
    const serverContent = fs.readFileSync(serverPath, 'utf8');

    // Quét server.ts tìm các route gắn prefix '/api/admin/'
    // Ví dụ: app.use('/api/admin/chatbox', chatAdminRoutes);
    const adminMountRegex = /app\.use\(\s*['"](\/api\/admin\/[^'"]+)['"]\s*,\s*([a-zA-Z0-9_]+)\s*\)/g;
    const adminMounts: Array<{ path: string; routerVar: string }> = [];
    let match;
    while ((match = adminMountRegex.exec(serverContent)) !== null) {
      adminMounts.push({ path: match[1], routerVar: match[2] });
    }

    assert.ok(adminMounts.length > 0, 'Phải tìm thấy các router được mount dưới /api/admin/*');

    // Tìm import map: routerVar -> file path
    const importRegex = /import\s+([a-zA-Z0-9_]+|\{[^}]+\})\s+from\s+['"]\.\/routes\/([^'"]+)['"]/g;
    const routerFileMap = new Map<string, string>();
    while ((match = importRegex.exec(serverContent)) !== null) {
      const varName = match[1].replace(/[{}]/g, '').trim();
      const fileName = match[2].endsWith('.ts') ? match[2] : `${match[2]}.ts`;
      routerFileMap.set(varName, fileName);
    }

    const failedRoutes: string[] = [];
    const knownIssues: string[] = [];

    // Kiểm tra từng admin router
    for (const mount of adminMounts) {
      const fileName = routerFileMap.get(mount.routerVar);
      if (!fileName) continue;

      const filePath = path.join(ROUTES_DIR, fileName);
      if (!fs.existsSync(filePath)) continue;

      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Kiểm tra file router có áp dụng authenticateJWT hoặc requirePermission không
      const hasAuth = fileContent.includes('authenticateJWT');
      const hasPermission = fileContent.includes('requirePermission');

      // Kiểm tra chi tiết từng method route router.(get|post|put|delete|patch)
      const routeLineRegex = /router\.(get|post|put|delete|patch)\s*\(\s*['"][^'"]+['"]\s*,([\s\S]*?)\);/g;
      let routeMatch;
      while ((routeMatch = routeLineRegex.exec(fileContent)) !== null) {
        const middlewares = routeMatch[2];
        const routeMethod = routeMatch[1].toUpperCase();
        const routeName = `${mount.path} (${fileName} ${routeMethod})`;

        // Ngoại lệ: Nếu route có router-level middleware (router.use(authenticateJWT))
        const hasRouterLevelAuth = /router\.use\([^)]*authenticateJWT[^)]*\)/.test(fileContent);

        const isAuthProtected = hasRouterLevelAuth || middlewares.includes('authenticateJWT');
        const isPermProtected = fileContent.includes('requirePermission') && 
          (middlewares.includes('requirePermission') || hasRouterLevelAuth);

        if (!isAuthProtected || !isPermProtected) {
          if (fileName.includes('design') || fileName.includes('administrative')) {
            knownIssues.push(`[KNOWN ISSUE] ${routeName}: Thiếu authenticateJWT hoặc requirePermission`);
          } else {
            failedRoutes.push(`${routeName}: Chưa đủ bảo vệ authenticateJWT + requirePermission`);
          }
        }
      }
    }

    // design.routes.ts đã biết thiếu xác thực hoàn chỉnh: Ghi nhận KNOWN ISSUE và test ĐỎ nếu có lỗi
    if (knownIssues.length > 0) {
      console.warn('Phát hiện các route admin chưa đạt tiêu chuẩn (KNOWN ISSUES):', knownIssues);
    }

    // Test yêu cầu: nếu có router admin nào vi phạm (kể cả design.routes.ts), test phải FAIL để lộ lỗi
    assert.strictEqual(
      failedRoutes.length + knownIssues.length,
      0,
      `Các router /api/admin/* sau đây thiếu bảo vệ bảo mật:\n${[...failedRoutes, ...knownIssues].join('\n')}`
    );
  });

  it('TC-STAT-02: server.ts không được mount hai router khác nhau cùng một đường dẫn', () => {
    const serverPath = path.join(SRC_DIR, 'server.ts');
    const serverContent = fs.readFileSync(serverPath, 'utf8');

    // Tìm tất cả các lệnh app.use('/đường_dẫn', router)
    const mountRegex = /app\.use\(\s*['"]([^'"]+)['"]\s*,\s*([a-zA-Z0-9_]+)\s*\)/g;
    const mounts = new Map<string, string[]>();
    let match;

    while ((match = mountRegex.exec(serverContent)) !== null) {
      const routePath = match[1];
      const routerVar = match[2];
      if (!mounts.has(routePath)) {
        mounts.set(routePath, []);
      }
      mounts.get(routePath)!.push(routerVar);
    }

    const duplicateMounts: Array<{ path: string; routers: string[] }> = [];
    for (const [routePath, routers] of mounts.entries()) {
      if (routers.length > 1) {
        duplicateMounts.push({ path: routePath, routers });
      }
    }

    // Yêu cầu: server.ts không mount hai router khác nhau hoặc trùng lặp cùng 1 path
    // Ví dụ trùng lặp: /api/admin/orders gắn 2 lần, /api/admin/customers gắn 2 lần
    assert.strictEqual(
      duplicateMounts.length,
      0,
      `Phát hiện các đường dẫn bị mount lặp lại trong server.ts:\n` +
      duplicateMounts.map(d => ` - Path '${d.path}' được mount bởi: ${d.routers.join(', ')}`).join('\n')
    );
  });

  it('TC-STAT-03: Không còn dấu xung đột merge (conflict markers) trong mã nguồn src/', () => {
    const conflictMarkers = ['<<<<<<<', '=======', '>>>>>>>'];
    const conflictedFiles: Array<{ file: string; marker: string; line: number }> = [];

    function scanDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js') || entry.name.endsWith('.json')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            for (const marker of conflictMarkers) {
              if (line.startsWith(marker)) {
                conflictedFiles.push({ file: fullPath, marker, line: idx + 1 });
              }
            }
          });
        }
      }
    }

    scanDir(SRC_DIR);

    assert.strictEqual(
      conflictedFiles.length,
      0,
      `Phát hiện dấu vết merge conflict trong src/:\n` +
      conflictedFiles.map(c => ` - ${c.file}:${c.line} (${c.marker})`).join('\n')
    );
  });

  it('TC-STAT-04: Không có console.log debug tùy tiện trong backend/src (trừ log lỗi hệ thống/seed)', () => {
    // Quy tắc: Chỉ cho phép console.error/warn hoặc log hệ thống có tiền tố [SERVER], [INFO], [Cleanup], [DB-Init]
    const unauthorizedLogs: Array<{ file: string; line: number; text: string }> = [];

    function scanDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.name.endsWith('.ts')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            const trimmed = line.trim();
            // Bỏ qua dòng comment
            if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

            // Kiểm tra lệnh console.log
            if (/console\.log\s*\(/.test(trimmed)) {
              // Ngoại lệ hợp lệ: Log thông báo khởi động hệ thống hoặc seed được cấp phép
              const isAllowedSystemLog = 
                trimmed.includes('[DB-Init]') ||
                trimmed.includes('[Cleanup]') ||
                trimmed.includes('[INFO]') ||
                trimmed.includes('Server is running on') ||
                trimmed.includes('[EMAIL') ||
                trimmed.includes('[SMS Dev');

              if (!isAllowedSystemLog) {
                unauthorizedLogs.push({
                  file: path.relative(SRC_DIR, fullPath),
                  line: idx + 1,
                  text: trimmed,
                });
              }
            }
          });
        }
      }
    }

    scanDir(SRC_DIR);

    assert.strictEqual(
      unauthorizedLogs.length,
      0,
      `Phát hiện console.log debug không hợp lệ trong src/:\n` +
      unauthorizedLogs.map(l => ` - ${l.file}:${l.line} -> ${l.text}`).join('\n')
    );
  });

  it('TC-STAT-05: Không hard-code secret ngoài giá trị mặc định đã biết', () => {
    const knownDefaultSecret = 'dcor_super_secret_key_2026';
    const dangerousSecrets: Array<{ file: string; line: number; text: string }> = [];

    function scanDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.name.endsWith('.ts')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('//')) return;

            // Kiểm tra gán secret cố định mà không đọc từ process.env
            // Ví dụ: const SECRET = 'xyz123' thay vì process.env.SECRET || '...'
            if (/(?:api_key|secret_key|private_key|token)\s*=\s*['"][a-zA-Z0-9_\-]{8,}['"]/i.test(trimmed)) {
              if (!trimmed.includes('process.env') && !trimmed.includes(knownDefaultSecret)) {
                dangerousSecrets.push({
                  file: path.relative(SRC_DIR, fullPath),
                  line: idx + 1,
                  text: trimmed,
                });
              }
            }
          });
        }
      }
    }

    scanDir(SRC_DIR);

    assert.strictEqual(
      dangerousSecrets.length,
      0,
      `Phát hiện hardcoded secret không an toàn trong src/:\n` +
      dangerousSecrets.map(s => ` - ${s.file}:${s.line} -> ${s.text}`).join('\n')
    );
  });
});

