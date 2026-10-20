import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const assetsDir = path.join(rootDir, 'assets');
const docsDir = path.join(rootDir, 'docs');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  // 1. Copy built assets to root assets/ directory
  const distAssets = path.join(distDir, 'assets');
  if (fs.existsSync(distAssets)) {
    if (fs.existsSync(assetsDir)) {
      fs.rmSync(assetsDir, { recursive: true, force: true });
    }
    copyDirRecursive(distAssets, assetsDir);
    console.log('✓ Synced dist/assets to root assets/');
  }

  // 2. Copy all dist files to docs/ (for GitHub Pages /docs folder option)
  if (fs.existsSync(distDir)) {
    if (fs.existsSync(docsDir)) {
      fs.rmSync(docsDir, { recursive: true, force: true });
    }
    copyDirRecursive(distDir, docsDir);
    console.log('✓ Synced dist to docs/ for GitHub Pages /docs option');
  }

  // 3. Ensure .nojekyll exists in root, dist, and docs
  const nojekyll = '# Disable Jekyll for GitHub Pages\n';
  fs.writeFileSync(path.join(rootDir, '.nojekyll'), nojekyll);
  fs.writeFileSync(path.join(distDir, '.nojekyll'), nojekyll);
  fs.writeFileSync(path.join(docsDir, '.nojekyll'), nojekyll);
  console.log('✓ Created .nojekyll in root, dist/, and docs/');

  // 4. Ensure 404.html exists in root and docs for SPA fallback
  const dist404 = path.join(distDir, '404.html');
  if (fs.existsSync(dist404)) {
    fs.copyFileSync(dist404, path.join(rootDir, '404.html'));
    fs.copyFileSync(dist404, path.join(docsDir, '404.html'));
    console.log('✓ Synced 404.html');
  }

  console.log('Build and deployment sync completed successfully.');
} catch (err) {
  console.error('Error during sync-dist:', err);
  process.exit(1);
}
