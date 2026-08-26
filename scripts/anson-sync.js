#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const STATUS_VALUES = new Set(['up-to-date', 'updated', 'blocked', 'unavailable', 'error']);
const CASE_STATUS_VALUES = new Set(['ready', 'unavailable', 'conflict', 'error']);

function fail(message) {
  throw new Error(message);
}

function isInside(parent, child) {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function ensureAbsolute(name, value) {
  if (typeof value !== 'string' || !path.isAbsolute(value)) {
    fail(`${name} 必須是絕對路徑`);
  }
  return path.normalize(value);
}

function loadConfig(input) {
  const config = typeof input === 'string' ? JSON.parse(fs.readFileSync(input, 'utf8')) : { ...input };
  const required = ['repoPath', 'branch', 'caseRoot', 'syncOnLogin', 'installDependenciesOnLockfileChange'];
  for (const key of required) {
    if (!(key in config)) fail(`缺少設定欄位：${key}`);
  }
  const normalized = {
    ...config,
    repoPath: ensureAbsolute('repoPath', config.repoPath),
    caseRoot: ensureAbsolute('caseRoot', config.caseRoot),
    branch: String(config.branch),
    syncOnLogin: config.syncOnLogin === true,
    installDependenciesOnLockfileChange: config.installDependenciesOnLockfileChange === true,
    deviceId: config.deviceId || process.env.ANSON_DEVICE_ID || os.hostname(),
  };
  if (!normalized.branch) fail('branch 不得為空');
  if (isInside(normalized.repoPath, normalized.caseRoot) || isInside(normalized.caseRoot, normalized.repoPath)) {
    fail('caseRoot 必須與 repoPath 分離');
  }
  return normalized;
}

function configFilePath() {
  return process.env.ANSON_SYNC_CONFIG || path.join(os.homedir(), '.config', 'anson-sync', 'config.json');
}

function readConfigFile(filePath = configFilePath()) {
  if (!fs.existsSync(filePath)) fail(`找不到設定檔：${filePath}`);
  return loadConfig(filePath);
}

function git(repoPath, args, options = {}) {
  try {
    return execFileSync('git', args, {
      cwd: repoPath,
      encoding: 'utf8',
      stdio: options.quiet === false ? 'inherit' : ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const detail = [error.stdout, error.stderr].filter(Boolean).join(' ').trim();
    const wrapped = new Error(detail || `git ${args.join(' ')} 失敗`);
    wrapped.code = error.status || 1;
    throw wrapped;
  }
}

function gitStatus(repoPath) {
  const output = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], {
    cwd: repoPath,
    encoding: 'utf8',
  }).trimEnd();
  return output
    .split('\n')
    .map((line) => line.slice(3).trim())
    .filter(Boolean);
}

function validateCaseRoot(config) {
  const { repoPath, caseRoot } = config;
  if (!fs.existsSync(caseRoot)) return { caseStatus: 'unavailable', message: '案件根目錄不存在或尚未掛載' };
  let stat;
  try {
    stat = fs.statSync(caseRoot);
    fs.accessSync(caseRoot, fs.constants.R_OK | fs.constants.W_OK);
  } catch (error) {
    return { caseStatus: 'unavailable', message: `案件根目錄不可讀寫：${error.message}` };
  }
  if (!stat.isDirectory()) return { caseStatus: 'unavailable', message: '案件根目錄不是資料夾' };
  if (isInside(repoPath, caseRoot) || isInside(caseRoot, repoPath)) {
    return { caseStatus: 'error', message: '案件根目錄與 repoPath 不能互相包含' };
  }
  const realRepoPath = fs.realpathSync(repoPath);
  const realCaseRoot = fs.realpathSync(caseRoot);
  if (isInside(realRepoPath, realCaseRoot) || isInside(realCaseRoot, realRepoPath)) {
    return { caseStatus: 'error', message: '案件根目錄與 repoPath 不能互相包含' };
  }
  return { caseStatus: 'ready', message: '案件根目錄可用' };
}

function validateRepositoryBoundary(repoPath) {
  const ignorePath = path.join(repoPath, '.gitignore');
  if (!fs.existsSync(ignorePath)) return { status: 'error', message: '找不到 .gitignore' };
  const ignore = fs.readFileSync(ignorePath, 'utf8');
  if (!ignore.split('\n').some((line) => line.trim() === 'cases/*/')) {
    return { status: 'error', message: '缺少 cases/*/ 的案件資料排除規則' };
  }
  let trackedCaseFiles = [];
  try {
    trackedCaseFiles = git(repoPath, ['ls-files', 'cases'])
      .split('\n')
      .filter((file) => file && file !== 'cases/README.md');
  } catch (error) {
    return { status: 'error', message: `無法檢查 Git tracked files：${error.message}` };
  }
  if (trackedCaseFiles.length > 0) {
    return { status: 'error', message: '真實案件檔案不能進 Git', trackedCaseFiles };
  }
  return { status: 'ready', trackedCaseFiles: [] };
}

function statusFilePath(caseRoot) {
  return path.join(caseRoot, '.anson-sync', 'status.json');
}

function writeStatus(config, result, options = {}) {
  const caseCheck = validateCaseRoot(config);
  const fallbackStatusDir = options.fallbackStatusDir || path.join(os.homedir(), '.config', 'anson-sync', 'status');
  const target = caseCheck.caseStatus === 'ready'
    ? statusFilePath(config.caseRoot)
    : path.join(fallbackStatusDir, `.anson-sync-${config.deviceId}-status.json`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const status = {
    schemaVersion: 1,
    deviceId: config.deviceId,
    lastCodeSyncAt: new Date().toISOString(),
    codeStatus: STATUS_VALUES.has(result.codeStatus) ? result.codeStatus : 'error',
    caseStatus: CASE_STATUS_VALUES.has(result.caseStatus) ? result.caseStatus : caseCheck.caseStatus,
    changedFiles: Number.isInteger(result.changedFiles) ? result.changedFiles : 0,
    conflictFiles: Array.isArray(result.conflictFiles) ? result.conflictFiles : [],
    message: result.message || caseCheck.message,
  };
  fs.writeFileSync(target, JSON.stringify(status, null, 2) + '\n', { mode: 0o600 });
  return { ...status, statusPath: target };
}

function maybeWriteStatus(config, result, options) {
  return options.writeStatus === false ? result : writeStatus(config, result);
}

function syncCode(config, options = {}) {
  const normalized = loadConfig(config);
  const result = { codeStatus: 'error', changedFiles: 0, dirtyFiles: [], conflictFiles: [] };
  try {
    if (!fs.existsSync(normalized.repoPath)) fail(`repoPath 不存在：${normalized.repoPath}`);
    const currentBranch = git(normalized.repoPath, ['rev-parse', '--abbrev-ref', 'HEAD']);
    if (currentBranch !== normalized.branch) {
      result.codeStatus = 'blocked';
      result.message = `目前分支是 ${currentBranch}，設定要求 ${normalized.branch}`;
      return maybeWriteStatus(normalized, result, options);
    }
    result.dirtyFiles = gitStatus(normalized.repoPath);
    if (result.dirtyFiles.length > 0) {
      result.codeStatus = 'blocked';
      result.message = `工作樹有未提交變更：${result.dirtyFiles.join(', ')}`;
      return maybeWriteStatus(normalized, result, options);
    }
    const before = git(normalized.repoPath, ['rev-parse', 'HEAD']);
    git(normalized.repoPath, ['fetch', '--prune', 'origin', normalized.branch]);
    const upstream = git(normalized.repoPath, ['rev-parse', '@{u}']);
    if (before === upstream) {
      result.codeStatus = 'up-to-date';
      result.message = '程式碼已是最新版本';
      return maybeWriteStatus(normalized, result, options);
    }
    try {
      git(normalized.repoPath, ['merge-base', '--is-ancestor', before, upstream]);
    } catch (_) {
      result.codeStatus = 'blocked';
      result.message = '本機分支與 upstream 已分叉，未自動合併';
      return maybeWriteStatus(normalized, result, options);
    }
    git(normalized.repoPath, ['merge', '--ff-only', upstream]);
    const changed = git(normalized.repoPath, ['diff', '--name-only', `${before}..${upstream}`])
      .split('\n').filter(Boolean);
    result.changedFiles = changed.length;
    if (normalized.installDependenciesOnLockfileChange && changed.some((file) => /(^|\/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock)$/.test(file))) {
      if (fs.existsSync(path.join(normalized.repoPath, 'package.json'))) {
        const packageManager = normalized.packageManager || 'pnpm';
        try {
          execFileSync(packageManager, ['install', '--frozen-lockfile'], { cwd: normalized.repoPath, stdio: 'pipe' });
        } catch (error) {
          result.codeStatus = 'error';
          result.message = `依賴安裝失敗：${error.message}`;
          return maybeWriteStatus(normalized, result, options);
        }
      }
    }
    result.codeStatus = 'updated';
    result.message = `程式碼已更新，${result.changedFiles} 個檔案變更`;
    return maybeWriteStatus(normalized, result, options);
  } catch (error) {
    result.codeStatus = 'error';
    result.message = error.message;
    return maybeWriteStatus(normalized, result, options);
  }
}

function readCaseManifests(caseRoot) {
  const manifests = [];
  for (const entry of fs.readdirSync(caseRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === '.anson-sync') continue;
    const manifestPath = path.join(caseRoot, entry.name, '.anson-sync', 'artifacts.json');
    if (!fs.existsSync(manifestPath)) continue;
    const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    for (const artifact of data.artifacts || []) {
      manifests.push({ ...artifact, caseId: entry.name });
    }
  }
  return manifests;
}

function syncCase(config, options = {}) {
  const normalized = loadConfig(config);
  const result = { codeStatus: 'up-to-date', changedFiles: 0, conflictFiles: [] };
  const check = validateCaseRoot(normalized);
  if (check.caseStatus !== 'ready') {
    result.caseStatus = check.caseStatus;
    result.message = check.message;
    return maybeWriteStatus(normalized, result, options);
  }
  try {
    const artifacts = readCaseManifests(normalized.caseRoot);
    result.changedFiles = artifacts.length;
    const grouped = new Map();
    for (const artifact of artifacts) {
      const key = `${artifact.caseId}:${artifact.artifactId}:${artifact.version}`;
      const existing = grouped.get(key) || [];
      existing.push(artifact);
      grouped.set(key, existing);
    }
    for (const entries of grouped.values()) {
      const hashes = new Set(entries.map((entry) => entry.sha256));
      if (hashes.size > 1) {
        result.conflictFiles.push(...entries.map((entry) => `${entry.caseId}/${entry.relativePath}`));
      }
    }
    result.caseStatus = result.conflictFiles.length > 0 ? 'conflict' : 'ready';
    result.message = result.caseStatus === 'conflict'
      ? `發現 ${result.conflictFiles.length} 個產出物版本衝突`
      : `案件資料可用，已檢查 ${result.changedFiles} 個產出物`;
    return maybeWriteStatus(normalized, result, options);
  } catch (error) {
    result.caseStatus = 'error';
    result.message = `案件 manifest 讀取失敗：${error.message}`;
    return maybeWriteStatus(normalized, result, options);
  }
}

function safeCasePath(caseRoot, caseId, relativePath) {
  if (!caseId || path.isAbsolute(relativePath) || relativePath.split(path.sep).includes('..')) {
    fail('案件檔案路徑不安全');
  }
  const caseDir = path.resolve(caseRoot, caseId);
  const filePath = path.resolve(caseDir, relativePath);
  if (!isInside(caseDir, filePath)) fail('案件檔案路徑超出案件資料夾');
  return { caseDir, filePath };
}

function registerArtifact(input) {
  const config = loadConfig(input);
  const check = validateCaseRoot(config);
  if (check.caseStatus !== 'ready') fail(check.message);
  const { caseDir, filePath } = safeCasePath(config.caseRoot, input.caseId, input.relativePath);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) fail(`找不到產出物：${input.relativePath}`);
  const metadataDir = path.join(caseDir, '.anson-sync');
  const manifestPath = path.join(metadataDir, 'artifacts.json');
  fs.mkdirSync(metadataDir, { recursive: true });
  const manifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    : { schemaVersion: 1, artifacts: [] };
  const artifact = {
    artifactId: String(input.artifactId),
    relativePath: input.relativePath,
    version: String(input.version),
    createdAt: input.createdAt || new Date().toISOString(),
    deviceId: input.deviceId || config.deviceId,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex'),
    kind: String(input.kind),
    promotionStatus: input.promotionStatus || 'pending',
  };
  manifest.artifacts = (manifest.artifacts || []).filter((entry) => !(
    entry.artifactId === artifact.artifactId &&
    entry.version === artifact.version &&
    entry.relativePath === artifact.relativePath &&
    entry.deviceId === artifact.deviceId
  ));
  manifest.artifacts.push(artifact);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', { mode: 0o600 });
  return { artifact, manifestPath };
}

function writeMeetingRecord(input) {
  const config = loadConfig(input);
  const check = validateCaseRoot(config);
  if (check.caseStatus !== 'ready') fail(check.message);
  if (!input.sessionId || !input.kind) fail('meeting record 需要 sessionId 與 kind');
  const caseDir = path.resolve(config.caseRoot, input.caseId);
  if (!isInside(config.caseRoot, caseDir)) fail('案件識別碼不安全');
  const occurredAt = input.occurredAt || new Date().toISOString();
  const timestamp = new Date(occurredAt).toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const deviceId = input.deviceId || config.deviceId;
  const base = `${timestamp}-${deviceId}-${input.sessionId}-${input.kind}`;
  const recordDir = path.join(caseDir, 'meeting');
  fs.mkdirSync(recordDir, { recursive: true });
  let suffix = 1;
  let fileName = `${base}.md`;
  while (fs.existsSync(path.join(recordDir, fileName))) {
    suffix += 1;
    fileName = `${base}-${suffix}.md`;
  }
  const filePath = path.join(recordDir, fileName);
  const content = `---\nrecordType: ${input.kind}\ncreatedAt: ${occurredAt}\ndeviceId: ${deviceId}\nsessionId: ${input.sessionId}\n---\n\n${input.content || ''}`;
  fs.writeFileSync(filePath, content, { mode: 0o600 });
  return { filePath, relativePath: path.relative(caseDir, filePath), deviceId, sessionId: input.sessionId, createdAt: occurredAt };
}

function renderLaunchdPlist({ commandPath, configPath, label = 'com.fishtv.anson-sync' }) {
  const args = [process.execPath, commandPath, 'login', '--config', configPath]
    .map((value) => `    <string>${escapeXml(value)}</string>`)
    .join('\n');
  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">",
    "<plist version=\"1.0\">",
    "<dict>",
    `  <key>Label</key><string>${escapeXml(label)}</string>`,
    "  <key>ProgramArguments</key>",
    "  <array>",
    args,
    "  </array>",
    "  <key>EnvironmentVariables</key>",
    "  <dict><key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string></dict>",
    "  <key>RunAtLoad</key><true/>",
    "  <key>StartInterval</key><integer>300</integer>",
    "  <key>StandardOutPath</key><string>/tmp/anson-sync.log</string>",
    "  <key>StandardErrorPath</key><string>/tmp/anson-sync.error.log</string>",
    "</dict>",
    "</plist>",
  ].join("\n") + "\n";
}

function installLaunchd({ homeDir = os.homedir(), commandPath = path.resolve(__filename), configPath = configFilePath(), label = 'com.fishtv.anson-sync' }) {
  const target = path.join(homeDir, 'Library', 'LaunchAgents', `${label}.plist`);
  const content = renderLaunchdPlist({ commandPath, configPath, label });
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (fs.existsSync(target) && fs.readFileSync(target, 'utf8') !== content) {
    fail(`已有不同的 launchd 設定，未覆蓋：${target}`);
  }
  fs.writeFileSync(target, content, { mode: 0o600 });
  return target;
}

function parseArgs(argv) {
  const result = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) result[arg.slice(2)] = argv[++i];
    else result._.push(arg);
  }
  return result;
}

function cli(argv) {
  const args = parseArgs(argv);
  const command = args._[0] || 'status';
  if (command === 'render-launchd') {
    process.stdout.write(renderLaunchdPlist({
      commandPath: path.resolve(__filename),
      configPath: args.config || configFilePath(),
      label: args.label,
    }));
    return 0;
  }
  if (command === 'install-login') {
    const target = installLaunchd({ configPath: args.config || configFilePath(), label: args.label });
    process.stdout.write(JSON.stringify({ status: 'installed', path: target }, null, 2) + '\n');
    return 0;
  }
  const config = readConfigFile(args.config);
  let result;
  if (command === 'sync-code') result = syncCode(config);
  else if (command === 'sync-case') result = syncCase(config);
  else if (command === 'sync' || command === 'login') {
    if (command === 'login' && !config.syncOnLogin) result = { codeStatus: 'up-to-date', caseStatus: 'ready', message: '已停用登入同步' };
    else {
      const code = syncCode(config);
      const cases = syncCase(config);
      result = { ...code, ...cases, codeStatus: code.codeStatus, caseStatus: cases.caseStatus, conflictFiles: cases.conflictFiles || [] };
      if (result.caseStatus === 'ready' && result.codeStatus !== 'error') writeStatus(config, result);
    }
  } else if (command === 'status') {
    const check = validateCaseRoot(config);
    const statusPath = check.caseStatus === 'ready' ? statusFilePath(config.caseRoot) : null;
    result = statusPath && fs.existsSync(statusPath) ? JSON.parse(fs.readFileSync(statusPath, 'utf8')) : { ...check, codeStatus: 'unavailable', changedFiles: 0, conflictFiles: [] };
  } else if (command === 'conflict-report') result = syncCase(config);
  else if (command === 'register-artifact') result = registerArtifact({ ...config, caseId: args.case, relativePath: args.path, artifactId: args.artifact, version: args.version, kind: args.kind, promotionStatus: args['promotion-status'] });
  else fail(`未知命令：${command}`);
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  return result.codeStatus === 'blocked' || result.codeStatus === 'error' || result.caseStatus === 'unavailable' || result.caseStatus === 'conflict' ? 1 : 0;
}

if (require.main === module) {
  try {
    process.exitCode = cli(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`anson-sync: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  loadConfig,
  validateCaseRoot,
  syncCode,
  syncCase,
  registerArtifact,
  writeMeetingRecord,
  writeStatus,
  validateRepositoryBoundary,
  renderLaunchdPlist,
  installLaunchd,
};
