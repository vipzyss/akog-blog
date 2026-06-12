/**
 * 数据迁移脚本 — 从 JSON 文件导入到 Supabase
 * 
 * 使用方式：
 *   cd akog-blog && npx ts-node --esm scripts/migrate-data.ts
 * 
 * 或者在本地开发环境运行：
 *   在项目根目录执行: node --import tsx scripts/migrate-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://erblbcfygonhtsrpdzcm.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ESgeljlGkICvTv-iAjap1Q_udO6nX_m';

const supabase = createClient(supabaseUrl, supabaseKey);

// 数据目录
const DATA_DIR = path.resolve(__dirname, '../data');

function readJSON<T>(filePath: string, defaultVal: T): T {
  try {
    if (!fs.existsSync(filePath)) return defaultVal;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return defaultVal;
  }
}

async function migrateTable(tableName: string, jsonFile: string, transform?: (item: any) => any) {
  const filePath = path.join(DATA_DIR, jsonFile);
  const data = readJSON<any[]>(filePath, []);
  
  if (data.length === 0) {
    console.log(`  ${tableName}: 无数据`);
    return;
  }

  console.log(`  ${tableName}: 正在导入 ${data.length} 条记录...`);
  
  // 清空表（避免重复导入）
  const { error: deleteError } = await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteError && deleteError.code !== 'PGRST116') {
    console.error(`  ${tableName} 清空失败:`, deleteError.message);
  }

  // 批量插入，每批 50 条
  const batchSize = 50;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize).map(transform || ((item) => item));
    const { error } = await supabase.from(tableName).insert(batch);
    if (error) {
      console.error(`  ${tableName} 第 ${i/batchSize + 1} 批插入失败:`, error.message);
    }
  }
  
  console.log(`  ✅ ${tableName}: 迁移完成`);
}

async function main() {
  console.log('🚀 开始迁移数据到 Supabase...\n');

  // 1. 用户表
  await migrateTable('users', 'users.json');

  // 2. 读者表
  await migrateTable('readers', 'readers.json');

  // 3. 分类表
  await migrateTable('categories', 'categories.json');

  // 4. 标签表
  await migrateTable('tags', 'tags.json');

  // 5. 文章表（需要转换 tagIds 为数组格式）
  await migrateTable('posts', 'posts.json', (post) => ({
    ...post,
    tagIds: post.tagIds || [],
    // 确保 Supabase 能正确识别数组
  }));

  // 6. 评论表
  await migrateTable('comments', 'comments.json');

  // 7. 友链表
  await migrateTable('friend_links', 'friend-links.json');

  // 8. 留言板表
  await migrateTable('guestbook', 'guestbook.json', (msg) => ({
    id: msg.id,
    author: msg.author,
    content: msg.content,
    approved: msg.approved,
    readerId: msg.readerId || null,
    createdAt: msg.createdAt,
  }));

  // 9. 站点设置
  const settings = readJSON<any>(path.join(DATA_DIR, 'settings.json'), null);
  if (settings) {
    await supabase.from('site_settings').upsert({
      id: 1,
      siteName: settings.siteName || '瞬云的尽头',
      siteDescription: settings.siteDescription || '探索虚拟世界的无限可能',
    });
    console.log('  ✅ site_settings: 迁移完成');
  }

  // 10. 迁移 viewedIPs（如果有的话）
  await migrateTable('viewed_ips', 'viewedIPs.json');

  console.log('\n🎉 数据迁移完成！所有 JSON 数据已导入 Supabase。');
  console.log('   你现在可以直接本地 npm run dev 测试了！');
}

main().catch(console.error);
