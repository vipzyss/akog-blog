/**
 * 数据迁移脚本 — 从 JSON 文件导入到 Supabase
 * 
 * 使用方式：
 *   cd akog-blog && node scripts/migrate-data.mjs
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

function readJSON(filePath, defaultVal) {
  try {
    if (!fs.existsSync(filePath)) return defaultVal;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return defaultVal;
  }
}

async function migrateTable(tableName, jsonFile, transform) {
  const filePath = path.join(DATA_DIR, jsonFile);
  const data = readJSON(filePath, []);
  
  if (!data || data.length === 0) {
    console.log(`  ${tableName}: 无数据`);
    return;
  }

  console.log(`  ${tableName}: 正在导入 ${data.length} 条记录...`);
  
  // 清空表
  const { error: deleteError } = await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteError && deleteError.code !== 'PGRST116') {
    console.log(`  ${tableName} 清空提示 (首次导入不用管): ${deleteError.message}`);
  }

  // 批量插入
  const batchSize = 50;
  let successCount = 0;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize).map(transform || ((item) => item));
    const { error } = await supabase.from(tableName).insert(batch);
    if (error) {
      console.error(`  ${tableName} 第 ${Math.floor(i/batchSize) + 1} 批失败:`, error.message);
    } else {
      successCount += batch.length;
    }
  }
  
  console.log(`  ✅ ${tableName}: 成功导入 ${successCount}/${data.length} 条`);
}

async function main() {
  console.log('🚀 开始迁移数据到 Supabase...\n');

// 1. 用户表（处理非 UUID 的 id）
await migrateTable('users', 'users.json', (user) => ({
  ...user,
  // 如果 id 不是有效的 UUID 格式，生成新的 UUID
  id: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id) 
    ? user.id 
    : crypto.randomUUID(),
}));

  // 2. 读者表
  await migrateTable('readers', 'readers.json');

  // 3. 分类表
  await migrateTable('categories', 'categories.json');

  // 4. 标签表
  await migrateTable('tags', 'tags.json');

  // 5. 文章表
  await migrateTable('posts', 'posts.json', (post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || '',
    content: post.content || '',
    richContent: post.richContent || '',
    coverImage: post.coverImage || '',
    categoryId: post.categoryId || null,
    tagIds: post.tagIds || [],
    status: post.status || 'draft',
    publishedAt: post.publishedAt || null,
    scheduledAt: post.scheduledAt || null,
    views: post.views || 0,
    likes: post.likes || 0,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  }));

  // 6. 评论表
  await migrateTable('comments', 'comments.json');

  // 7. 友链表
  await migrateTable('friend_links', 'friend-links.json');

  // 8. 留言板表
  await migrateTable('guestbook_messages', 'guestbook.json');

  // 9. 站点设置
  const settings = readJSON(path.join(DATA_DIR, 'settings.json'), null);
  if (settings) {
    await supabase.from('site_settings').upsert({
      id: 1,
      siteName: settings.siteName || '瞬云的尽头',
      siteDescription: settings.siteDescription || '探索虚拟世界的无限可能',
    });
    console.log('  ✅ site_settings: 迁移完成');
  }

  // 10. 浏览 IP 去重
  await migrateTable('viewed_ips', 'viewedIPs.json');

  console.log('\n🎉 数据迁移完成！');
  console.log('   本地测试: cd akog-blog && npm run dev');
}

main().catch(console.error);
