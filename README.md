# swagger-mcp-tools

[![npm version](https://img.shields.io/npm/v/swagger-mcp-tools)](https://www.npmjs.com/package/swagger-mcp-tools)
[![npm downloads](https://img.shields.io/npm/dm/swagger-mcp-tools)](https://www.npmjs.com/package/swagger-mcp-tools)
[![License](https://img.shields.io/npm/l/swagger-mcp-tools)](https://github.com/dyq086/swagger-mcp-tools/blob/main/LICENSE)

一个用于 Cursor 等 MCP (Model Context Protocol) 客户端的 Swagger/OpenAPI 文档查询工具。通过 MCP 协议，AI 助手可以轻松查询和分析 Swagger API 文档，获取接口类型信息。

## 简介

`swagger-mcp-tools` 是一个 MCP 服务器，它可以将 Swagger/OpenAPI 文档转换为 MCP 工具，让 AI 助手（如 Cursor）能够：

- 📚 浏览和搜索 API 文档
- 🔍 查询接口的详细类型信息
- 💡 在编写代码时获取准确的 API 类型定义
- 🚀 提高开发效率，减少查阅文档的时间

## 功能特性

- 🔍 **模块查询** - 获取 Swagger API 的所有模块列表
- 📋 **接口列表** - 获取指定模块下的所有接口
- 📝 **类型信息** - 获取接口的详细类型信息（参数、请求体、响应类型）
- 🔄 **多格式支持** - 支持 Swagger 2.0 和 OpenAPI 3.0 格式
- ⚙️ **灵活配置** - 支持配置文件、环境变量等多种配置方式

## 安装

### 方式一：使用 npx（推荐，无需安装）

无需全局安装，直接使用 npx 运行：

```bash
# 无需安装，直接使用 npx
npx swagger-mcp-tools
```

### 方式二：全局安装

如果需要全局安装：

```bash
npm install -g swagger-mcp-tools
# 或
yarn global add swagger-mcp-tools
```

### 方式三：从源码构建

```bash
git clone https://github.com/dyq086/swagger-mcp-tools.git
cd swagger-mcp-tools
npm install
npm run build
```

构建完成后，可以使用以下方式运行：

```bash
# 直接运行构建后的文件
node dist/mcp-server.js

# 或使用 npm link 进行本地开发
npm link
swagger-mcp-tools
```


## 使用方法

### 1. 配置 Cursor MCP

在 Cursor 的 MCP 配置文件中（通常是 `~/.cursor/mcp.json` 或项目根目录的 `.cursor/mcp.json`）添加：

```json
{
  "mcpServers": {
    "swagger": {
      "command": "npx",
      "args": ["swagger-mcp-tools@latest"],
      "env": {
        "SWAGGER_URL": "http://your-api.com/v3/api-docs",
        "SWAGGER_TOKEN": "your-token-here"
      }
    }
  }
}
```

### 2. 使用配置文件（推荐）

在项目根目录创建 `.swagger-mcp.json`：

```json
{
  "swaggerUrl": "http://your-api.com/v3/api-docs",
  "token": "your-token-here"
}
```

然后在 MCP 配置中使用：

```json
{
  "mcpServers": {
    "swagger": {
      "command": "npx",
      "args": ["swagger-mcp-tools@latest"]
    }
  }
}
```

## 配置优先级

配置加载优先级从高到低：

1. **项目配置文件** - `.swagger-mcp.json` 或 `swagger-mcp.config.json`
   - 项目根目录查找优先级：
     1. 环境变量 `SWAGGER_MCP_PROJECT_ROOT` 指定的目录（如果设置）
     2. Cursor/IDE 环境变量 `WORKSPACE_FOLDER_PATHS`（自动获取，无需配置）
     3. 从 `process.cwd()`（当前工作目录）向上查找（**默认，动态获取**）
     4. 从模块目录向上查找
2. **默认环境变量** - `SWAGGER_URL` 和 `SWAGGER_TOKEN`

**项目根目录环境变量说明：**
- `SWAGGER_MCP_PROJECT_ROOT`（可选）：
  - **未设置**：自动使用 `WORKSPACE_FOLDER_PATHS` 或 `process.cwd()`，动态获取，无需配置
  - `$CWD` 或 `$PWD`：显式使用当前工作目录
  - 绝对路径：`/path/to/project`
  - 相对路径：相对于当前工作目录的路径
- `WORKSPACE_FOLDER_PATHS`（自动，无需配置）：
  - Cursor 等 IDE 会自动提供此环境变量，指向当前打开的工作区路径
  - 如果存在，会自动使用第一个路径作为项目根目录

## 使用示例

### 在 Cursor 中使用

1. 在项目根目录创建 `.swagger-mcp.json`：
```json
{
  "swaggerUrl": "http://localhost:8080/v3/api-docs",
  "token": "your-api-token"
}
```

2. 配置 Cursor MCP（`~/.cursor/mcp.json` 或项目 `.cursor/mcp.json`）：
```json
{
  "mcpServers": {
    "swagger": {
      "command": "npx",
      "args": ["swagger-mcp-tools@latest"]
    }
  }
}
```

3. 重启 Cursor，现在你可以在 AI 对话中询问 API 相关信息了！

> 💡 **提示**：使用 `npx` 方式无需全局安装，npx 会自动下载并使用最新版本的包。

### 示例对话

- "获取用户管理模块的所有接口"
- "查询 `/api/user/list` 接口的参数类型"
- "获取订单创建接口的请求体结构"

## 可用工具

### getModules

获取 Swagger API 的所有模块列表。

**返回示例：**
```json
[
  {
    "name": "用户管理",
    "description": "用户相关的接口"
  },
  {
    "name": "订单管理",
    "description": "订单相关的接口"
  }
]
```

### getApis

获取指定模块下的所有接口列表。

**参数：**
- `module` (string) - 模块名称

**返回示例：**
```json
[
  {
    "path": "/api/user/list",
    "method": "GET",
    "summary": "获取用户列表"
  },
  {
    "path": "/api/user/create",
    "method": "POST",
    "summary": "创建用户"
  }
]
```

### getApi

获取指定接口的参数和返回值类型信息。

**参数：**
- `path` (string) - 接口路径，如 `/api/user/list`
- `method` (string) - HTTP 方法，如 `GET`, `POST`, `PUT`, `DELETE`

**返回示例：**
```json
{
  "path": "/api/user/list",
  "method": "GET",
  "summary": "获取用户列表",
  "description": "分页查询用户列表",
  "parameters": [
    {
      "name": "page",
      "in": "query",
      "type": "integer",
      "required": false
    }
  ],
  "requestBody": null,
  "responseType": {
    "type": "object",
    "properties": {
      "code": { "type": "integer" },
      "data": { "type": "array", "items": { "$ref": "#/components/schemas/User" } }
    }
  }
}
```

## 开发

### 本地开发

```bash
# 安装依赖
npm install

# 开发模式运行（使用 tsx 直接运行 TypeScript）
npm run dev

# 构建为 JavaScript
npm run build
```

### 测试

在开发模式下，MCP 服务器通过 stdio 通信，日志会输出到 stderr。你可以通过以下方式测试：

```bash
# 设置环境变量
export SWAGGER_URL="http://your-api.com/v3/api-docs"
export SWAGGER_TOKEN="your-token"

# 运行服务器
npm run dev
```

### 发布

```bash
# 构建项目
npm run build

# 发布到 npm（需要先登录）
npm login
npm publish
```

### 项目结构

```
swagger-mcp-tools/
├── mcp-server.ts    # 主服务器文件
├── types.ts         # TypeScript 类型定义
├── package.json     # 项目配置
├── tsconfig.json    # TypeScript 配置（用于 IDE）
├── README.md        # 说明文档
├── CHANGELOG.md     # 变更日志
├── LICENSE          # MIT 许可证
├── .gitignore       # Git 忽略文件
└── dist/            # 构建输出目录
    └── mcp-server.js # 构建后的 JavaScript 文件
```

## 常见问题

### Q: 如何查看服务器是否正常运行？

A: MCP 服务器通过 stdio 通信，日志会输出到 stderr。如果配置正确，你应该能看到类似以下的日志：

```
Swagger MCP Server running on stdio
Swagger URL: http://your-api.com/v3/api-docs
Token: *** (已设置)
```

### Q: 支持哪些 Swagger/OpenAPI 版本？

A: 支持 Swagger 2.0 和 OpenAPI 3.0 格式。

### Q: 如何处理认证？

A: 支持通过配置文件或环境变量设置 token。如果 API 需要认证，请在配置中设置 `token` 或 `SWAGGER_TOKEN`。

### Q: 可以在其他 MCP 客户端中使用吗？

A: 可以。只要支持 MCP 协议的客户端都可以使用，包括 Cursor、Claude Desktop 等。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 相关链接

- [GitHub 仓库](https://github.com/dyq086/swagger-mcp-tools)
- [npm 包](https://www.npmjs.com/package/swagger-mcp-tools)
- [Model Context Protocol 文档](https://modelcontextprotocol.io/)
- [Swagger 文档](https://swagger.io/)
- [OpenAPI 规范](https://swagger.io/specification/)

## Star History

如果这个项目对你有帮助，欢迎给个 ⭐️ Star！

[![Star History Chart](https://api.star-history.com/svg?repos=dyq086/swagger-mcp-tools&type=Date)](https://star-history.com/#dyq086/swagger-mcp-tools&Date)
