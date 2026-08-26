const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const {
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
} = require('../scripts/anson-sync');
const {
  assert,
  assertEqual,
  assertDeepEqual,
  assertThrows,
  assertFileExists,
} = require('./assert');

function tempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n');
}

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function makeRepoFixture() {
  const root = tempDir('anson-sync-repo-');
  const remote = tempDir('anson-sync-remote-');
  git(remote, ['init', '--bare', '-q']);
  git(root, ['init', '-q']);
  git(root, ['config', 'user.email', 'anson-test@example.invalid']);
  git(root, ['config', 'user.name', 'Anson Test']);
  fs.writeFileSync(path.join(root, 'README.md'), 'v1\n');
  git(root, ['add', 'README.md']);
  git(root, ['commit', '-qm', 'initial']);
  git(root, ['branch', '-M', 'main']);
  git(root, ['remote', 'add', 'origin', remote]);
  git(root, ['push', '-qu', 'origin', 'main']);
  return { root, remote };
}

module.exports = {
  'loadConfig rejects a case root inside the repository': () => {
    assertThrows(
      () => loadConfig({
        repoPath: '/tmp/repo',
        branch: 'main',
        caseRoot: '/tmp/repo/cases',
        syncOnLogin: true,
        installDependenciesOnLockfileChange: false,
      }),
      'caseRoot'
    );
  },

  'symlinked case root inside the repository is rejected': () => {
    const repoPath = tempDir('anson-sync-repo-');
    const outside = tempDir('anson-sync-outside-');
    const link = path.join(repoPath, 'linked-cases');
    fs.symlinkSync(outside, link, 'dir');
    assertEqual(validateCaseRoot({ repoPath, caseRoot: link }).caseStatus, 'error');
  },

  'clean checkout fast-forwards to upstream HEAD': () => {
    const fixture = makeRepoFixture();
    const second = tempDir('anson-sync-second-');
    git(second, ['clone', '-q', '-b', 'main', fixture.remote, '.']);
    git(second, ['config', 'user.email', 'anson-test@example.invalid']);
    git(second, ['config', 'user.name', 'Anson Test']);
    fs.writeFileSync(path.join(fixture.root, 'README.md'), 'v2\n');
    git(fixture.root, ['commit', '-qam', 'update']);
    git(fixture.root, ['push', '-q']);
    const caseRoot = tempDir('anson-sync-cases-');
    const result = syncCode(loadConfig({
        repoPath: second,
        branch: 'main',
        caseRoot,
        syncOnLogin: true,
        installDependenciesOnLockfileChange: false,
      }), { writeStatus: false });
    assertEqual(result.codeStatus, 'updated');
    assertEqual(git(second, ['rev-parse', 'HEAD']), git(fixture.root, ['rev-parse', 'HEAD']));
  },

  'dirty checkout is not modified': () => {
    const fixture = makeRepoFixture();
    fs.writeFileSync(path.join(fixture.root, 'README.md'), 'local-only\n');
    const before = fs.readFileSync(path.join(fixture.root, 'README.md'), 'utf8');
    const result = syncCode(loadConfig({
        repoPath: fixture.root,
        branch: 'main',
        caseRoot: tempDir('anson-sync-cases-'),
        syncOnLogin: true,
        installDependenciesOnLockfileChange: false,
      }), { writeStatus: false });
    assertEqual(result.codeStatus, 'blocked');
    assertEqual(fs.readFileSync(path.join(fixture.root, 'README.md'), 'utf8'), before);
    assert(result.dirtyFiles.includes('README.md'));
  },

  'diverged checkout stays blocked without merging': () => {
    const fixture = makeRepoFixture();
    const remoteClone = tempDir('anson-sync-remote-clone-');
    git(remoteClone, ['clone', '-q', '-b', 'main', fixture.remote, '.']);
    git(remoteClone, ['config', 'user.email', 'anson-test@example.invalid']);
    git(remoteClone, ['config', 'user.name', 'Anson Test']);
    fs.writeFileSync(path.join(remoteClone, 'README.md'), 'remote\n');
    git(remoteClone, ['commit', '-qam', 'remote']);
    git(remoteClone, ['push', '-q']);
    fs.writeFileSync(path.join(fixture.root, 'README.md'), 'local\n');
    git(fixture.root, ['commit', '-qam', 'local']);
    const before = git(fixture.root, ['rev-parse', 'HEAD']);
    const result = syncCode(loadConfig({
      repoPath: fixture.root,
      branch: 'main',
      caseRoot: tempDir('anson-sync-cases-'),
      syncOnLogin: true,
      installDependenciesOnLockfileChange: false,
    }), { writeStatus: false });
    assertEqual(result.codeStatus, 'blocked');
    assertEqual(git(fixture.root, ['rev-parse', 'HEAD']), before);
  },

  'remote failure preserves local checkout': () => {
    const fixture = makeRepoFixture();
    const before = git(fixture.root, ['rev-parse', 'HEAD']);
    git(fixture.root, ['remote', 'set-url', 'origin', path.join(fixture.root, 'missing-remote')]);
    const result = syncCode(loadConfig({
      repoPath: fixture.root,
      branch: 'main',
      caseRoot: tempDir('anson-sync-cases-'),
      syncOnLogin: true,
      installDependenciesOnLockfileChange: false,
    }), { writeStatus: false });
    assertEqual(result.codeStatus, 'error');
    assertEqual(git(fixture.root, ['rev-parse', 'HEAD']), before);
  },

  'disabled dependency installation does not require a package manager': () => {
    const fixture = makeRepoFixture();
    fs.writeFileSync(path.join(fixture.root, 'package.json'), '{"private":true}\n');
    git(fixture.root, ['add', 'package.json']);
    git(fixture.root, ['commit', '-qm', 'package']);
    git(fixture.root, ['push', '-q']);
    const remoteClone = tempDir('anson-sync-remote-clone-');
    git(remoteClone, ['clone', '-q', '-b', 'main', fixture.remote, '.']);
    git(remoteClone, ['config', 'user.email', 'anson-test@example.invalid']);
    git(remoteClone, ['config', 'user.name', 'Anson Test']);
    fs.writeFileSync(path.join(remoteClone, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n');
    git(remoteClone, ['add', 'pnpm-lock.yaml']);
    git(remoteClone, ['commit', '-qm', 'lockfile']);
    git(remoteClone, ['push', '-q']);
    const result = syncCode(loadConfig({
      repoPath: fixture.root,
      branch: 'main',
      caseRoot: tempDir('anson-sync-cases-'),
      syncOnLogin: true,
      installDependenciesOnLockfileChange: false,
      packageManager: 'command-that-does-not-exist',
    }), { writeStatus: false });
    assertEqual(result.codeStatus, 'updated');
  },

  'unavailable case root does not create an empty directory': () => {
    const repoPath = tempDir('anson-sync-repo-');
    const caseRoot = path.join(tempDir('anson-sync-parent-'), 'missing');
    const result = validateCaseRoot({ repoPath, caseRoot });
    assertEqual(result.caseStatus, 'unavailable');
    assert(!fs.existsSync(caseRoot));
  },

  'repository boundary keeps real cases outside tracked files': () => {
    const result = validateRepositoryBoundary(path.resolve(__dirname, '..'));
    assertEqual(result.status, 'ready');
    assertDeepEqual(result.trackedCaseFiles, []);
  },

  'meeting records use unique device and session paths': () => {
    const repoPath = tempDir('anson-sync-repo-');
    const caseRoot = tempDir('anson-sync-cases-');
    const config = {
      repoPath,
      caseRoot,
      branch: 'main',
      syncOnLogin: true,
      installDependenciesOnLockfileChange: false,
    };
    const desktop = writeMeetingRecord({
      ...config, caseId: 'case-demo', kind: 'transcript', sessionId: 's1', deviceId: 'desktop',
      occurredAt: '2026-08-25T12:00:00.000Z', content: '桌機紀錄\n',
    });
    const laptop = writeMeetingRecord({
      ...config, caseId: 'case-demo', kind: 'transcript', sessionId: 's1', deviceId: 'laptop',
      occurredAt: '2026-08-25T12:00:00.000Z', content: '筆電紀錄\n',
    });
    assert(desktop.relativePath !== laptop.relativePath);
    assertFileExists(desktop.filePath);
    assertFileExists(laptop.filePath);
    assert(fs.readFileSync(desktop.filePath, 'utf8').includes('deviceId: desktop'));
  },

  'artifact registration writes metadata and sha256': () => {
    const repoPath = tempDir('anson-sync-repo-');
    const caseRoot = tempDir('anson-sync-cases-');
    const caseDir = path.join(caseRoot, 'case-demo');
    fs.mkdirSync(path.join(caseDir, 'deliverables'), { recursive: true });
    const artifactPath = path.join(caseDir, 'deliverables', 'proposal-v1.html');
    fs.writeFileSync(artifactPath, '<h1>demo</h1>\n');
    const result = registerArtifact({
      repoPath,
      caseRoot,
      branch: 'main',
      syncOnLogin: true,
      installDependenciesOnLockfileChange: false,
      caseId: 'case-demo',
      relativePath: 'deliverables/proposal-v1.html',
      artifactId: 'proposal',
      version: 1,
      kind: 'demo',
      promotionStatus: 'pending',
      deviceId: 'laptop',
      createdAt: '2026-08-25T12:00:00.000Z',
    });
    assertEqual(result.artifact.deviceId, 'laptop');
    assertEqual(result.artifact.promotionStatus, 'pending');
    assert(result.artifact.sha256.length === 64);
    assertFileExists(path.join(caseDir, '.anson-sync', 'artifacts.json'));
  },

  'conflicting artifact versions are reported without deleting either file': () => {
    const repoPath = tempDir('anson-sync-repo-');
    const caseRoot = tempDir('anson-sync-cases-');
    const caseDir = path.join(caseRoot, 'case-demo');
    fs.mkdirSync(path.join(caseDir, 'deliverables'), { recursive: true });
    fs.writeFileSync(path.join(caseDir, 'deliverables', 'quote-desktop.html'), 'desktop\n');
    fs.writeFileSync(path.join(caseDir, 'deliverables', 'quote-laptop.html'), 'laptop\n');
    const common = {
      branch: 'main', syncOnLogin: true, installDependenciesOnLockfileChange: false,
      artifactId: 'quote', version: 2, kind: 'quotation', promotionStatus: 'pending',
    };
    registerArtifact({ ...common, repoPath, caseRoot, caseId: 'case-demo', relativePath: 'deliverables/quote-desktop.html', deviceId: 'desktop' });
    registerArtifact({ ...common, repoPath, caseRoot, caseId: 'case-demo', relativePath: 'deliverables/quote-laptop.html', deviceId: 'laptop' });
    const result = syncCase({
      repoPath,
      caseRoot,
      branch: 'main',
      syncOnLogin: true,
      installDependenciesOnLockfileChange: false,
      deviceId: 'desktop',
    }, { writeStatus: false });
    assertEqual(result.caseStatus, 'conflict');
    assert(result.conflictFiles.length === 2);
    assert(fs.existsSync(path.join(caseDir, 'deliverables', 'quote-desktop.html')));
    assert(fs.existsSync(path.join(caseDir, 'deliverables', 'quote-laptop.html')));
  },

  'launchd plist runs without an IDE or Agent': () => {
    const plist = renderLaunchdPlist({
      commandPath: '/tmp/anson-sync.js',
      configPath: '/tmp/anson-config.json',
      label: 'com.example.anson-sync-test',
    });
    assert(plist.includes('com.example.anson-sync-test'));
    assert(plist.includes('login'));
    assert(plist.includes('/tmp/anson-sync.js'));
    assert(plist.includes('/opt/homebrew/bin:/usr/local/bin'));
    assert(plist.includes('<key>StartInterval</key><integer>300</integer>'));
  },

  'launchd XML escapes a user-provided label': () => {
    const plist = renderLaunchdPlist({
      commandPath: '/tmp/anson-sync.js',
      configPath: '/tmp/anson-config.json',
      label: 'com.example.&sync',
    });
    assert(plist.includes('com.example.&amp;sync'));
    assert(!plist.includes('com.example.&sync</string>'));
  },

  'CLI status reads the machine-readable sync status': () => {
    const repoPath = tempDir('anson-sync-repo-');
    const caseRoot = tempDir('anson-sync-cases-');
    const configPath = path.join(tempDir('anson-sync-config-'), 'config.json');
    writeJson(configPath, {
      repoPath,
      branch: 'main',
      caseRoot,
      syncOnLogin: true,
      installDependenciesOnLockfileChange: false,
      deviceId: 'desktop',
    });
    const cliPath = path.resolve(__dirname, '../scripts/anson-sync.js');
    const caseOutput = execFileSync(process.execPath, [cliPath, 'sync-case', '--config', configPath], { encoding: 'utf8' });
    assert(caseOutput.includes('"caseStatus": "ready"'));
    const statusOutput = execFileSync(process.execPath, [cliPath, 'status', '--config', configPath], { encoding: 'utf8' });
    assert(statusOutput.includes('"schemaVersion": 1'));
    assert(statusOutput.includes('"deviceId": "desktop"'));
  },

  'installLaunchd writes a login job without an IDE dependency': () => {
    const homeDir = tempDir('anson-sync-home-');
    const target = installLaunchd({
      homeDir,
      commandPath: '/tmp/anson-sync.js',
      configPath: '/tmp/anson-config.json',
      label: 'com.example.anson-sync-test',
    });
    assertFileExists(target);
    assert(fs.readFileSync(target, 'utf8').includes('<key>RunAtLoad</key><true/>'));
  },

  'CLI login writes a timestamped status without an Agent session': () => {
    const fixture = makeRepoFixture();
    const caseRoot = tempDir('anson-sync-cases-');
    const configPath = path.join(tempDir('anson-sync-config-'), 'config.json');
    writeJson(configPath, {
      repoPath: fixture.root,
      branch: 'main',
      caseRoot,
      syncOnLogin: true,
      installDependenciesOnLockfileChange: false,
      deviceId: 'laptop',
    });
    const cliPath = path.resolve(__dirname, '../scripts/anson-sync.js');
    execFileSync(process.execPath, [cliPath, 'login', '--config', configPath], { encoding: 'utf8' });
    const statusPath = path.join(caseRoot, '.anson-sync', 'status.json');
    assertFileExists(statusPath);
    const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
    assertEqual(status.deviceId, 'laptop');
    assert(typeof status.lastCodeSyncAt === 'string' && status.lastCodeSyncAt.length > 10);
  },

  'unavailable case root writes fallback status outside the iCloud parent': () => {
    const repoPath = tempDir('anson-sync-repo-');
    const caseRoot = path.join(tempDir('anson-sync-parent-'), 'missing');
    const fallbackStatusDir = tempDir('anson-sync-status-');
    const result = writeStatus({ repoPath, caseRoot, deviceId: 'laptop' }, {
      codeStatus: 'up-to-date',
      caseStatus: 'unavailable',
      message: '案件根目錄不存在或尚未掛載',
    }, { fallbackStatusDir });
    assertEqual(result.statusPath, path.join(fallbackStatusDir, '.anson-sync-laptop-status.json'));
    assertFileExists(result.statusPath);
    assert(!result.statusPath.startsWith(path.dirname(caseRoot)));
  },

  'two-device fixture syncs code and a laptop artifact back to desktop': () => {
    const fixture = makeRepoFixture();
    const laptopRepo = tempDir('anson-sync-laptop-repo-');
    git(laptopRepo, ['clone', '-q', '-b', 'main', fixture.remote, '.']);
    const desktopCases = tempDir('anson-sync-desktop-cases-');
    const laptopCases = tempDir('anson-sync-laptop-cases-');
    const desktopConfig = loadConfig({
      repoPath: fixture.root, branch: 'main', caseRoot: desktopCases,
      syncOnLogin: true, installDependenciesOnLockfileChange: false, deviceId: 'desktop',
    });
    const laptopConfig = loadConfig({
      repoPath: laptopRepo, branch: 'main', caseRoot: laptopCases,
      syncOnLogin: true, installDependenciesOnLockfileChange: false, deviceId: 'laptop',
    });
    fs.writeFileSync(path.join(fixture.root, 'README.md'), 'desktop-update\n');
    git(fixture.root, ['commit', '-qam', 'desktop update']);
    git(fixture.root, ['push', '-q']);
    const codeResult = syncCode(laptopConfig, { writeStatus: false });
    assertEqual(codeResult.codeStatus, 'updated');
    fs.mkdirSync(path.join(laptopCases, 'case-demo', 'deliverables'), { recursive: true });
    fs.writeFileSync(path.join(laptopCases, 'case-demo', 'deliverables', 'demo-v1.html'), '<h1>laptop demo</h1>\n');
    registerArtifact({
      ...laptopConfig, caseId: 'case-demo', relativePath: 'deliverables/demo-v1.html',
      artifactId: 'demo', version: 1, kind: 'demo', promotionStatus: 'pending', deviceId: 'laptop',
    });
    fs.cpSync(laptopCases, desktopCases, { recursive: true });
    const caseResult = syncCase(desktopConfig, { writeStatus: false });
    assertEqual(caseResult.caseStatus, 'ready');
    assertEqual(caseResult.changedFiles, 1);
    assertFileExists(path.join(desktopCases, 'case-demo', '.anson-sync', 'artifacts.json'));
    assertEqual(git(laptopRepo, ['rev-parse', 'HEAD']), git(fixture.root, ['rev-parse', 'HEAD']));
  },
};
