# Changelog

所有重要的变更都会记录在这个文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [0.1.0] - 2026-02-04

### 新增

- ✨ 支持获取 Swagger API 模块列表 (`getModules` 工具)
- ✨ 支持获取指定模块下的接口列表 (`getApis` 工具)
- ✨ 支持获取接口的详细类型信息 (`getApi` 工具)
  - 支持查询接口参数（query、path、header 等）
  - 支持查询请求体类型（requestBody）
  - 支持查询响应类型（responseType）
- ✨ 支持 Swagger 2.0 和 OpenAPI 3.0 格式
- ✨ 支持多种配置方式
  - 项目配置文件 (`.swagger-mcp.json`)
  - 项目名称环境变量 (`SWAGGER_URL_<PROJECT_NAME>`)
  - 默认环境变量 (`SWAGGER_URL`)
- 📦 支持构建打包为独立的 npm 包
- 📝 完整的 TypeScript 类型定义
- 🔄 自动解析引用类型，支持循环引用检测
- ⚙️ 灵活的配置加载机制，支持多级配置优先级

### 技术细节

- 使用 `@modelcontextprotocol/sdk` 实现 MCP 协议
- 使用 `esbuild` 进行快速构建
- 使用 `zod` 进行参数验证
- 支持 ES Modules (ESM)
