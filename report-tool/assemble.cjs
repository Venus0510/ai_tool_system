/**
 * 章节组装脚本
 * 用法：node report-tool/assemble.cjs <项目名>
 * 功能：读取项目 config.json，合并所有 status=done 的章节 HTML，输出完整报告
 */
const fs = require('fs');
const path = require('path');

const PROJECTS_DIR = path.join(__dirname, 'projects');

function main() {
  const projectName = process.argv[2];
  if (!projectName) {
    console.error('用法: node report-tool/assemble.cjs <项目名>');
    console.error('示例: node report-tool/assemble.cjs 货币基金分析报告');
    process.exit(1);
  }

  const projectDir = path.join(PROJECTS_DIR, projectName);
  if (!fs.existsSync(projectDir)) {
    console.error(`错误: 项目目录不存在: ${projectDir}`);
    process.exit(1);
  }

  const configPath = path.join(projectDir, 'config.json');
  if (!fs.existsSync(configPath)) {
    console.error(`错误: config.json 不存在: ${configPath}`);
    process.exit(1);
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    console.error('错误: config.json 解析失败:', e.message);
    process.exit(1);
  }

  const chapters = config.chapters || [];
  const doneChapters = chapters.filter(c => c.status === 'done');

  if (doneChapters.length === 0) {
    console.error('错误: 没有已完成（status=done）的章节，无法组装。');
    console.error(`当前状态: ${chapters.map(c => `${c.title}(${c.status})`).join(', ')}`);
    process.exit(1);
  }

  const pendingChapters = chapters.filter(c => c.status !== 'done');
  if (pendingChapters.length > 0) {
    console.warn(`警告: 以下章节尚未完成，将不包含在组装结果中:`);
    pendingChapters.forEach(c => console.warn(`  - ${c.title} (${c.status})`));
  }

  // 按 order 排序
  doneChapters.sort((a, b) => a.order - b.order);

  // 收集所有章节的 body 内容
  const bodies = [];
  for (const ch of doneChapters) {
    const chFile = path.join(projectDir, `chapter-${String(ch.order).padStart(2, '0')}-${ch.id}.html`);
    if (!fs.existsSync(chFile)) {
      // 尝试模糊匹配
      const files = fs.readdirSync(projectDir).filter(f =>
        f.startsWith('chapter-') && f.endsWith('.html') && f.includes(ch.id)
      );
      if (files.length === 0) {
        console.warn(`警告: 未找到章节文件 chapter-${String(ch.order).padStart(2, '0')}-${ch.id}.html，跳过`);
        continue;
      }
      const html = fs.readFileSync(path.join(projectDir, files[0]), 'utf8');
      const body = extractBody(html);
      if (body) bodies.push({ title: ch.title, body });
    } else {
      const html = fs.readFileSync(chFile, 'utf8');
      const body = extractBody(html);
      if (body) bodies.push({ title: ch.title, body });
    }
  }

  if (bodies.length === 0) {
    console.error('错误: 无法从任何章节文件中提取内容。');
    process.exit(1);
  }

  // 读取主题和版式信息
  const layout = config.layout || 'a4-landscape';
  const theme = config.theme || 'business-bluewhite';

  // 组装完整 HTML
  const fullHtml = assembleFullHtml(config.projectName, bodies, layout, theme);

  // 输出
  const outputDir = path.join(projectDir, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, 'full-report.html');
  fs.writeFileSync(outputPath, fullHtml, 'utf8');

  console.log(`✓ 组装完成！`);
  console.log(`  项目: ${config.projectName}`);
  console.log(`  章节数: ${bodies.length}`);
  console.log(`  输出: ${outputPath}`);
}

function extractBody(html) {
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!match) return null;

  let bodyContent = match[1];

  // 移除 <script> 标签（将在组装时统一处理）
  bodyContent = bodyContent.replace(/<script[\s\S]*?<\/script>/gi, '');

  return bodyContent.trim();
}

function assembleFullHtml(projectName, bodies, layout, theme) {
  const isLandscape = layout === 'a4-landscape';
  const pageStyle = isLandscape
    ? '@page { size: A4 landscape; margin: 0; }'
    : '';

  const themePath = `../../UI-lib/tokens/${theme}.css`;

  const sections = bodies.map((b, i) => {
    const pageClass = isLandscape ? 'a4-page' : 'section';
    const footer = isLandscape
      ? `<div class="page-footer"><span>${b.title}</span><span>${String(i + 1).padStart(2, '0')}</span></div>`
      : '';
    return `
  <!-- 第${i + 1}页: ${b.title} -->
  <section class="${pageClass}">
    ${b.body}
    ${footer}
  </section>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>${projectName}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
  <link id="token-css" rel="stylesheet" href="${themePath}" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
      background: #f3f6fb;
      color: var(--text, #1f2937);
    }
    ${pageStyle}
    .a4-page {
      width: 297mm;
      height: 210mm;
      padding: 18mm 22mm;
      page-break-after: always;
      break-after: page;
      background: var(--bg, #f8fafc);
      position: relative;
      overflow: hidden;
      margin: 20px auto;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .a4-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .page-footer {
      position: absolute;
      bottom: 10mm;
      left: 22mm;
      right: 22mm;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--text-muted, #94a3b8);
    }
    .section {
      max-width: 1180px;
      margin: 0 auto;
      padding: 40px 24px;
    }
    @media print {
      html, body {
        width: 297mm;
        height: 210mm;
        background: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .a4-page {
        margin: 0;
        box-shadow: none;
      }
    }
    @media (max-width: 768px) {
      .a4-page {
        width: 100%;
        height: auto;
        min-height: 100vh;
        padding: 20px 16px;
        margin: 0;
      }
    }
  </style>
</head>
<body>
${sections}
</body>
</html>
`;
}

main();
