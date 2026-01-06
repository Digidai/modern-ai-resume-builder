# Sitemap 自动更新和提交配置指南

## 概述

本项目已经配置了自动化机制，可以定期更新 sitemap 并提交到 Google Search Console，帮助 Google 更好地收录网站内容。

## 工作原理

### 1. 自动化流程

GitHub Actions 工作流 `.github/workflows/sitemap-update.yml` 会：

- **每周日**凌晨 2:00 自动运行
- 当 `src/data/jobTitles.json` 文件更新时触发
- 支持手动触发（workflow_dispatch）

### 2. 工作流步骤

1. **构建项目**：生成最新的 sitemap.xml
2. **提交到 Google**：调用 Google Search Console API
3. **保存结果**：上传 sitemap 作为 artifact（保留30天）
4. **生成报告**：在 Actions 页面显示执行摘要

## 配置步骤

### 步骤 1：创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 记录项目 ID

### 步骤 2：启用 Search Console API

1. 在 Google Cloud Console 中
2. 导航到 **APIs & Services** > **Library**
3. 搜索 "Search Console API"
4. 点击启用

### 步骤 3：创建服务账号（Service Account）

1. 在 Google Cloud Console 中
2. 导航到 **IAM & Admin** > **Service Accounts**
3. 点击 **Create Service Account**
4. 填写服务账号信息：
   - **Name**: `github-actions-sitemap`（或其他名称）
   - **Service account description**: `GitHub Actions for sitemap submission`
5. 点击 **Create and Continue**
6. 跳过权限设置（直接点击 Done）
7. 点击新创建的服务账号
8. 切换到 **Keys** 标签
9. 点击 **Add Key** > **Create new key**
10. 选择 **JSON** 格式
11. 点击 **Create** - 会自动下载 JSON 密钥文件
12. **妥善保管这个文件**（后续步骤需要）

### 步骤 4：配置 Google Search Console

1. 访问 [Google Search Console](https://search.google.com/search-console)
2. 确保你的网站已经添加并验证
3. 在左侧菜单选择 **Settings**
4. 点击 **Users and permissions**
5. 点击 **Add user**
6. 输入服务账号邮箱（格式：`xxx@xxx.iam.gserviceaccount.com`）
7. 授予 **Owner** 权限
   - **重要**：Service Account 需要 Owner 权限才能提交 sitemap

### 步骤 5：配置 GitHub Secrets

在你的 GitHub 仓库中配置以下 Secrets：

1. 访问仓库的 **Settings** > **Secrets and variables** > **Actions**
2. 点击 **New repository secret**

#### 需要添加的 Secrets：

##### 1. GOOGLE_SERVICE_ACCOUNT_EMAIL
- **值**：服务账号邮箱地址
- **来源**：从步骤3下载的 JSON 文件中找到 `client_email` 字段
- **示例**：`github-actions-sitemap@your-project.iam.gserviceaccount.com`

##### 2. GOOGLE_PRIVATE_KEY
- **值**：服务账号私钥
- **来源**：从步骤3下载的 JSON 文件中找到 `private_key` 字段
- **重要**：需要保留原始的换行符（不要移除 `\n`）
- **格式**：
  ```
  -----BEGIN RSA PRIVATE KEY-----
  ...很多行...
  -----END RSA PRIVATE KEY-----
  ```

**添加私钥的步骤**：
1. 复制 JSON 文件中 `private_key` 的完整值
2. 直接粘贴到 GitHub Secret 的值字段
3. GitHub 会自动处理换行符
4. **不要**手动替换 `\n` 为实际的换行符

### 步骤 6：配置 GitHub Variables

在 GitHub 仓库中配置 Variables：

1. 在 **Settings** > **Secrets and variables** > **Actions**
2. 切换到 **Variables** 标签
3. 点击 **New repository variable**

#### 需要添加的 Variables：

##### 1. SITE_URL
- **值**：你的网站 URL
- **示例**：`https://genedai.cv`
- **注意**：不要在末尾添加斜杠 `/`

## 验证配置

### 1. 手动触发工作流

1. 访问 GitHub 仓库
2. 点击 **Actions** 标签
3. 选择 **Update Sitemap and Submit to Google** 工作流
4. 点击 **Run workflow**
5. 点击 **Run workflow** 按钮

### 2. 查看执行结果

1. 等待工作流完成（约1-2分钟）
2. 查看工作流日志
3. 应该看到以下成功消息：
   - ✅ Sitemap submitted successfully!
   - ✅ Sitemap information retrieved

### 3. 在 Google Search Console 验证

1. 访问 [Google Search Console](https://search.google.com/search-console)
2. 选择你的网站
3. 导航到 **Indexing** > **Sitemaps**
4. 应该能看到你的 sitemap（`https://genedai.cv/sitemap.xml`）

## 本地测试

可以在本地测试 sitemap 提交：

```bash
# 设置环境变量
export SITE_URL="https://genedai.cv"
export GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@xxx.iam.gserviceaccount.com"
export GOOGLE_PRIVATE_KEY="$(cat path/to/your/key.json | jq -r '.private_key')"

# 运行提交脚本
npm run sitemap:submit
```

## 维护和监控

### 查看工作流历史

1. GitHub 仓库 > **Actions**
2. 查看 **Update Sitemap and Submit to Google** 工作流
3. 检查最近的运行状态

### 常见问题

#### 1. 认证失败（403 Error）

**原因**：服务账号未添加为 Search Console 站点所有者

**解决**：
1. 确保服务账号邮箱已添加到 Search Console
2. 确保授予了 **Owner** 权限（不是 Full 或 Restricted）

#### 2. 站点未找到（404 Error）

**原因**：站点未在 Search Console 中验证

**解决**：
1. 在 Search Console 添加并验证你的网站
2. 确保 `SITE_URL` 变量与 Search Console 中的 URL 完全一致

#### 3. 私钥格式错误

**原因**：私钥中的换行符未正确保留

**解决**：
1. 重新从 JSON 文件复制 `private_key` 字段的完整值
2. 直接粘贴到 GitHub Secret，不要手动修改
3. 确保包含 `-----BEGIN RSA PRIVATE KEY-----` 和 `-----END RSA PRIVATE KEY-----`

#### 4. API 未启用

**原因**：Search Console API 未在 Google Cloud 中启用

**解决**：
1. 在 Google Cloud Console 启用 Search Console API
2. 等待几分钟后重试

## 自动化频率

默认配置：每周日运行一次

可以根据需要修改 `.github/workflows/sitemap-update.yml` 中的 cron 表达式：

```yaml
schedule:
  - cron: '0 2 * * 0'  # 每周日凌晨2点
```

常见的时间设置：
- `0 2 * * *` - 每天凌晨2点
- `0 2 * * 0` - 每周日凌晨2点
- `0 2 1 * *` - 每月1号凌晨2点
- `*/6 * * * *` - 每6小时一次

**注意**：GitHub Actions 最小间隔为5分钟

## 最佳实践

1. **定期检查**：每月在 Search Console 检查 sitemap 状态
2. **监控覆盖率**：使用 Search Console 的 **Coverage** 报告查看索引状态
3. **处理错误**：及时处理 Search Console 报告的索引问题
4. **更新内容**：添加新职位时，会自动触发 sitemap 更新
5. **查看日志**：定期查看 GitHub Actions 日志，确保工作流正常运行

## 相关链接

- [Google Search Console](https://search.google.com/search-console)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Search Console API Documentation](https://developers.google.com/webmaster-tools/search-console-api-original)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 支持

如果遇到问题：

1. 查看 GitHub Actions 日志
2. 检查 Google Cloud Console 的 API 状态
3. 验证 Search Console 中的权限设置
4. 查阅本文档的常见问题部分
