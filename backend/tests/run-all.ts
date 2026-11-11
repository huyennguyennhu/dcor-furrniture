/**
 * TEST RUNNER TOÀN BỘ BACKEND TESTS
 * Chạy tuần tự các nhóm test: Nhóm A (Unit), Nhóm B (Static), Nhóm C (Integration)
 * In bảng tổng kết chi tiết PASS / FAIL / SKIP
 * Chạy bằng: npx ts-node tests/run-all.ts
 */

import { spawnSync } from 'child_process';
import * as path from 'path';

interface SuiteResult {
  group: string;
  name: string;
  total: number;
  pass: number;
  fail: number;
  skip: number;
  exitCode: number;
  rawOutput: string;
}

const testSuites = [
  { group: 'NHÓM A', name: 'Test Đơn vị (Unit Tests)', file: 'tests/unit.test.ts' },
  { group: 'NHÓM B', name: 'Test Tĩnh Mã Nguồn (Static Tests)', file: 'tests/static.test.ts' },
  { group: 'NHÓM C', name: 'Test Tích Hợp API & DB (Integration Tests)', file: 'tests/integration.test.ts' },
];

function runSuite(file: string, group: string, name: string): SuiteResult {
  console.log(`\n======================================================`);
  console.log(` ĐANG CHẠY: [${group}] ${name}`);
  console.log(` File: ${file}`);
  console.log(`======================================================`);

  const proc = spawnSync('cmd.exe', ['/c', 'npx', 'ts-node', file], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    env: { ...process.env },
  });

  const output = (proc.stdout || '') + (proc.stderr || '');
  console.log(output);

  // Parse số lượng tests, pass, fail, skipped từ output node:test
  // Định dạng: ℹ tests 19 | ℹ pass 19 | ℹ fail 0 | ℹ skipped 0
  const totalMatch = output.match(/ℹ\s+tests\s+(\d+)/);
  const passMatch = output.match(/ℹ\s+pass\s+(\d+)/);
  const failMatch = output.match(/ℹ\s+fail\s+(\d+)/);
  const skipMatch = output.match(/ℹ\s+skipped\s+(\d+)/);

  const total = totalMatch ? parseInt(totalMatch[1], 10) : 0;
  const pass = passMatch ? parseInt(passMatch[1], 10) : 0;
  const fail = failMatch ? parseInt(failMatch[1], 10) : 0;
  const skip = skipMatch ? parseInt(skipMatch[1], 10) : 0;

  return {
    group,
    name,
    total,
    pass,
    fail,
    skip,
    exitCode: proc.status ?? 1,
    rawOutput: output,
  };
}

function main() {
  const startTime = Date.now();
  console.log(`\n===============================================================`);
  console.log(`      BẮT ĐẦU CHẠY BỘ KIỂM THỬ BACKEND DCOR FURNITURE        `);
  console.log(`===============================================================`);

  const results: SuiteResult[] = [];

  for (const suite of testSuites) {
    const res = runSuite(suite.file, suite.group, suite.name);
    results.push(res);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n===============================================================`);
  console.log(`                    BẢNG TỔNG KẾT KIỂM THỬ                     `);
  console.log(`===============================================================`);
  console.log(`| Nhóm    | Tên Phân Hệ                     | Tổng | PASS | FAIL | SKIP |`);
  console.log(`|---------|---------------------------------|------|------|------|------|`);

  let grandTotal = 0;
  let grandPass = 0;
  let grandFail = 0;
  let grandSkip = 0;

  for (const r of results) {
    grandTotal += r.total;
    grandPass += r.pass;
    grandFail += r.fail;
    grandSkip += r.skip;

    const groupStr = r.group.padEnd(7);
    const nameStr = r.name.padEnd(31);
    const totalStr = String(r.total).padStart(4);
    const passStr = String(r.pass).padStart(4);
    const failStr = String(r.fail).padStart(4);
    const skipStr = String(r.skip).padStart(4);

    console.log(`| ${groupStr} | ${nameStr} | ${totalStr} | ${passStr} | ${failStr} | ${skipStr} |`);
  }

  console.log(`|---------|---------------------------------|------|------|------|------|`);
  console.log(
    `| TỔNG CỘNG                                 | ${String(grandTotal).padStart(4)} | ${String(grandPass).padStart(4)} | ${String(grandFail).padStart(4)} | ${String(grandSkip).padStart(4)} |`
  );
  console.log(`===============================================================`);
  console.log(`⏱  Thời gian chạy: ${duration}s`);
  console.log(`Trạng thái chung: ${grandFail > 0 ? '❌ CÓ BÀI TEST THẤT BẠI (FAIL/RED)' : '✅ TẤT CẢ ĐẠT YÊU CẦU'}`);
  console.log(`===============================================================\n`);
}

main();
