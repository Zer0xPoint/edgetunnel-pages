const fs = require('fs');
const jsConfuser = require('js-confuser');

const UPSTREAM_URL = 'https://raw.githubusercontent.com/cmliu/edgetunnel/main/_worker.js';

async function main() {
  console.log('1. 正在拉取上游 cmliu/edgetunnel 最新 _worker.js...');
  const res = await fetch(UPSTREAM_URL);
  if (!res.ok) {
    throw new Error(`获取上游代码失败: HTTP ${res.status} ${res.statusText}`);
  }
  const raw = await res.text();
  console.log(`上游原始文件大小: ${(raw.length / 1024 / 1024).toFixed(2)} MB`);

  // 2. 提取经文注释块暂存
  let scripture = '';
  let code = raw;
  const scriptureMatch = raw.match(/\/\*\s*Genesis[\s\S]*?\*\//);
  if (scriptureMatch) {
    scripture = scriptureMatch[0];
    code = raw.replace(scriptureMatch[0], '');
    console.log(`成功提取经文注释: ${(scripture.length / 1024 / 1024).toFixed(2)} MB`);
  } else {
    console.log('未检测到 Genesis 经文注释块');
  }
  console.log(`待混淆核心代码大小: ${(code.length / 1024).toFixed(2)} KB`);

  // 3. 执行 js-confuser 深度混淆
  // 注意：必须关闭 deadCode，否则会注入 Node.js 模板 (如 require('big-integer')) 导致 Cloudflare Pages 打包失败
  console.log('2. 正在执行 js-confuser 深度混淆 (兼容 Cloudflare Pages esbuild 打包)...');
  const t0 = Date.now();
  const obfuscated = await jsConfuser.obfuscate(code, {
    target: 'browser',
    preset: 'medium',
    pack: false,
    deadCode: false,        // 禁用注入 Node.js 依赖型死代码
    stringEncoding: true,   // 开启字符串深度扰乱
    renameVariables: true   // 开启变量重命名
  });
  const confusedCode = typeof obfuscated === 'string' ? obfuscated : obfuscated.code;
  console.log(`混淆完成，耗时: ${Date.now() - t0}ms，代码大小: ${(confusedCode.length / 1024).toFixed(2)} KB`);

  // 4. 将经文原样拼回文件尾部
  const finalOutput = scripture ? (confusedCode + '\n\n' + scripture) : confusedCode;
  console.log(`最终输出文件大小: ${(finalOutput.length / 1024 / 1024).toFixed(2)} MB`);

  fs.writeFileSync('_worker.js', finalOutput, 'utf8');
  console.log('3. 成功生成 _worker.js！');
}

main().catch(err => {
  console.error('构建过程出错:', err);
  process.exit(1);
});
