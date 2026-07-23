import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workspaceRoot = path.resolve(__dirname, '..');
const distDir = path.join(workspaceRoot, 'dist');
const assetsDir = path.join(distDir, 'assets');

console.log('Starting standalone HTML bundling...');

try {
  // Find JS and CSS files in dist/assets
  const files = fs.readdirSync(assetsDir);
  const jsFile = files.find(f => f.endsWith('.js') && f.startsWith('index-'));
  const cssFile = files.find(f => f.endsWith('.css') && f.startsWith('index-'));

  if (!jsFile || !cssFile) {
    throw new Error('Could not find compiled JS or CSS file in dist/assets!');
  }

  console.log(`Found compiled JS: ${jsFile}`);
  console.log(`Found compiled CSS: ${cssFile}`);

  // Read the built files
  const jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf-8');
  const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), 'utf-8');
  let htmlContent = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

  // Remove the script tag from head
  const scriptRegex = /<script\b[^>]*src="[^"]*assets\/index-[^"]*\.js"[^>]*><\/script>/i;
  htmlContent = htmlContent.replace(scriptRegex, '');

  // Replace link stylesheet tag with inline style tag using a callback function
  const cssRegex = /<link\b[^>]*href="[^"]*assets\/index-[^"]*\.css"[^>]*>/i;
  const inlineStyle = `<style>\n${cssContent}\n</style>`;
  htmlContent = htmlContent.replace(cssRegex, () => inlineStyle);

  // Add support for dynamic initialization from settings download (replace placeholders if they exist)
  // Let's add a script block at the top of the body to support pre-loaded data!
  const injectorScript = `
    <script>
      // Standalone app pre-loaded data placeholders
      window.INITIAL_MASTER_DATA = "__INITIAL_MASTER_DATA_PLACEHOLDER__";
      window.INITIAL_ACTIVITY_LOGS = "__INITIAL_ACTIVITY_LOGS_PLACEHOLDER__";
    </script>
  `;
  htmlContent = htmlContent.replace('<body>', `<body>\n${injectorScript}`);

  // Place the main JavaScript at the bottom of the body (before </body>) to guarantee DOM is fully parsed first
  const inlineScript = `<script>\n${jsContent}\n</script>`;
  htmlContent = htmlContent.replace('</body>', `${inlineScript}\n</body>`);

  // Ensure the public directory exists
  const publicDir = path.join(workspaceRoot, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  // Save as .html in public and dist folder (handled securely in dev server via middleware)
  const outputPublicPath = path.join(publicDir, 'standalone.html');
  fs.writeFileSync(outputPublicPath, htmlContent, 'utf-8');

  const outputDistPath = path.join(distDir, 'standalone.html');
  fs.writeFileSync(outputDistPath, htmlContent, 'utf-8');

  // Clean up legacy/temporary txt files to keep workspace tidy
  const obsoletePublicTxt = path.join(publicDir, 'standalone.txt');
  if (fs.existsSync(obsoletePublicTxt)) {
    fs.unlinkSync(obsoletePublicTxt);
  }
  const obsoleteDistTxt = path.join(distDir, 'standalone.txt');
  if (fs.existsSync(obsoleteDistTxt)) {
    fs.unlinkSync(obsoleteDistTxt);
  }
  const legacyRootHtml = path.join(workspaceRoot, 'standalone.html');
  if (fs.existsSync(legacyRootHtml)) {
    fs.unlinkSync(legacyRootHtml);
  }

  console.log(`Successfully bundled whole app as a single working standalone HTML app at: ${outputPublicPath} and ${outputDistPath}`);
} catch (error) {
  console.error('Error bundling standalone HTML app:', error);
  process.exit(1);
}
