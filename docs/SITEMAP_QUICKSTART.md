# Sitemap 自动更新和提交系统

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Google Search Console

**必须完成以下步骤才能启用自动提交：**

#### 步骤 1: 创建 Google Cloud 项目和服务账号

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建服务账号并下载 JSON 密钥文件
3. 在密钥文件中找到：
   - `client_email`: 服务账号邮箱
   - `private_key`: 私钥（保留所有 `\n` 换行符）

#### 步骤 2: 配置 Google Search Console

1. 访问 [Google Search Console](https://search.google.com/search-console)
2. 添加服务账号邮箱为站点 Owner
3. 确保你的网站已验证

#### 步骤 3: 配置 GitHub Secrets

在你的 GitHub 仓库中添加以下 Secrets：

**Secrets:**
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: 服务账号邮箱（从 JSON 文件中的 `client_email` 字段）
- `GOOGLE_PRIVATE_KEY`: 私钥（从 JSON 文件中的 `private_key` 字段，完整复制包括换行符）

**Variables:**
- `SITE_URL`: 你的网站 URL（例如：`https://genedai.cv`，不要末尾斜杠）

### 3. 验证配置

#### 手动触发工作流

1. 访问 GitHub 仓库的 **Actions** 页面
2. 选择 **Update Sitemap and Submit to Google** 工作流
3. 点击 **Run workflow**
4. 查看执行结果

#### 本地测试

```bash
# 设置环境变量
export SITE_URL="https://genedai.cv"
export GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@xxx.iam.gserviceaccount.com"
export GOOGLE_PRIVATE_KEY="$(cat /path/to/key.json | jq -r '.private_key')"

# 测试 sitemap 提交
npm run sitemap:submit
```

## 工作原理

### 自动化流程

GitHub Actions 工作流会：

1. **每周日**凌晨 2:00 自动运行
2. 当 `src/data/jobTitles.json` 更新时自动触发
3. 执行以下步骤：
   - 构建项目并生成最新的 sitemap.xml
   - 提交 sitemap 到 Google Search Console
   - 保存执行结果和日志

### 文件说明

- `.github/workflows/sitemap-update.yml` - GitHub Actions 工作流配置
- `scripts/submit-sitemap.mjs` - Google Search Console API 提交脚本
- `scripts/seo-postbuild.mjs` - sitemap 生成脚本（构建时自动运行）
- `docs/SITEMAP_AUTO_SUBMISSION.md` - 详细配置文档

## 本地命令

```bash
# 构建并生成 sitemap
npm run build

# 仅生成 sitemap（不构建）
npm run seo:postbuild

# 提交 sitemap 到 Google（需要配置环境变量）
npm run sitemap:submit
```

## 监控和维护

### 查看工作流历史

访问 GitHub 仓库 > **Actions** > **Update Sitemap and Submit to Google**

### 在 Google Search Console 检查状态

1. 访问 [Google Search Console](https://search.google.com/search-console)
2. 选择你的网站
3. 导航到 **Indexing** > **Sitemaps**
4. 查看 sitemap 状态和收录情况

## 常见问题

### 1. 认证失败（403）

确保服务账号邮箱已添加为 Search Console 站点的 **Owner**（不是 Full 或 Restricted）

### 2. 站点未找到（404）

确保：
- 网站已在 Search Console 中验证
- `SITE_URL` 变量与 Search Console 中的 URL 完全一致

### 3. 私钥格式错误

重新复制 JSON 文件中的 `private_key` 字段，确保保留所有换行符

## 支持

遇到问题？查看详细文档：`docs/SITEMAP_AUTO_SUBMISSION.md`
