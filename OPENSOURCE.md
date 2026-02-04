# 开源指南

本文档说明如何将 `swagger-mcp-tools` 项目开源到 GitHub。

## 准备工作

1. 确保已安装 Git
2. 确保已登录 GitHub 账号 (https://github.com/dyq086)
3. 确保项目已构建成功

## 步骤

### 1. 在 GitHub 上创建仓库

1. 访问 https://github.com/new
2. 仓库名称填写：`swagger-mcp-tools`
3. 描述填写：`Swagger MCP Server - 一个用于 Cursor 等 MCP 客户端的 Swagger API 文档查询工具`
4. 选择 Public（公开）
5. **不要**勾选 "Initialize this repository with a README"（因为本地已有文件）
6. 点击 "Create repository"

### 2. 初始化 Git 仓库（如果还没有）

```bash
cd /Users/dengyongqing/Documents/workspace/portal/tools/swagger-mcp-tools

# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: swagger-mcp-tools v0.1.0"
```

### 3. 连接到 GitHub 仓库

```bash
# 添加远程仓库
git remote add origin https://github.com/dyq086/swagger-mcp-tools.git

# 或者使用 SSH（如果已配置）
# git remote add origin git@github.com:dyq086/swagger-mcp-tools.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 4. 创建 Release（可选）

1. 访问 https://github.com/dyq086/swagger-mcp-tools/releases/new
2. Tag version: `v0.1.0`
3. Release title: `v0.1.0 - 首次发布`
4. 描述内容：
   ```
   ## 首次发布 🎉
   
   - ✨ 支持获取 Swagger API 模块列表
   - ✨ 支持获取指定模块下的接口列表
   - ✨ 支持获取接口的详细类型信息
   - ✨ 支持 Swagger 2.0 和 OpenAPI 3.0 格式
   - ✨ 支持多种配置方式
   ```
5. 点击 "Publish release"

### 5. 发布到 npm（可选）

```bash
# 确保已登录 npm
npm login

# 发布包
npm publish

# 如果包名冲突，可以使用 scoped package
# npm publish --access public
```

## 后续维护

### 更新代码并推送

```bash
# 修改代码后
git add .
git commit -m "feat: 添加新功能"
git push origin main
```

### 发布新版本

1. 更新 `package.json` 中的版本号
2. 更新 `CHANGELOG.md`
3. 提交并推送：
   ```bash
   git add .
   git commit -m "chore: bump version to 0.2.0"
   git tag v0.2.0
   git push origin main --tags
   ```
4. 在 GitHub 上创建新的 Release
5. 发布到 npm：`npm publish`

## 推荐设置

### GitHub 仓库设置

1. **Topics（标签）**：添加以下标签以便搜索
   - `swagger`
   - `openapi`
   - `mcp`
   - `model-context-protocol`
   - `cursor`
   - `api-documentation`
   - `typescript`

2. **Description（描述）**：
   ```
   Swagger MCP Server - 一个用于 Cursor 等 MCP 客户端的 Swagger API 文档查询工具
   ```

3. **Website（网站）**：可以留空或填写 npm 包地址

4. **启用 Issues**：在 Settings > Features 中启用 Issues

5. **添加 README 徽章**（可选）：在 README.md 顶部添加：

   ```markdown
   ![npm version](https://img.shields.io/npm/v/swagger-mcp-tools)
   ![npm downloads](https://img.shields.io/npm/dm/swagger-mcp-tools)
   ![License](https://img.shields.io/npm/l/swagger-mcp-tools)
   ```

## 注意事项

1. **不要提交敏感信息**：确保 `.swagger-mcp.json` 等配置文件已添加到 `.gitignore`
2. **构建产物**：`dist/` 目录应该提交（因为 npm 包需要），但确保构建是最新的
3. **依赖版本**：确保 `package-lock.json` 或 `yarn.lock` 已提交（如果使用）

## 完成！

项目已成功开源！🎉

访问 https://github.com/dyq086/swagger-mcp-tools 查看你的仓库。
