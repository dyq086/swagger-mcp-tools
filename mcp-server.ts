/**
 * Swagger MCP 服务器 - 独立版本
 * 可以在 Cursor 等 MCP 客户端中直接使用
 *
 * 使用方法：
 * 1. 配置 Cursor MCP 设置
 * 2. 或直接运行: node tools/swagger-mcp-tools/mcp-server.ts
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  SchemaObject,
  SwaggerDocument,
  ParameterObject,
  BodyParameterObject,
  OperationObject,
} from './types.js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class SwaggerMcpServer {
  private swaggerUrl: string;
  private token?: string;
  private swaggerDoc?: SwaggerDocument;
  private swaggerDocPromise?: Promise<SwaggerDocument>;

  constructor(swaggerUrl: string, token?: string) {
    this.swaggerUrl = swaggerUrl;
    this.token = token;
  }

  /**
   * 加载 Swagger 文档，带缓存机制
   */
  private async loadSwagger(): Promise<SwaggerDocument> {
    // 如果已有缓存的文档，直接返回
    if (this.swaggerDoc) {
      return this.swaggerDoc;
    }

    // 如果正在加载中，等待加载完成
    if (this.swaggerDocPromise) {
      return this.swaggerDocPromise;
    }

    // 开始加载
    this.swaggerDocPromise = (async () => {
      try {
        const res = await fetch(this.swaggerUrl, {
          headers: this.token ? { Authorization: `${this.token}` } : {},
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch Swagger doc: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        console.log(data);
        this.swaggerDoc = data as SwaggerDocument;
        return this.swaggerDoc;
      } catch (error) {
        // 清除 promise，允许重试
        this.swaggerDocPromise = undefined;
        throw error;
      }
    })();

    return this.swaggerDocPromise;
  }

  /**
   * 获取模块列表
   * @returns 模块列表，包含名称和描述
   */
  async getModules(): Promise<Array<{ name: string; description: string }>> {
    try {
      const doc = await this.loadSwagger();
      return (doc.tags ?? []).map((t) => ({
        name: t.name,
        description: t.description || '',
      }));
    } catch (error) {
      throw new Error(
        `Failed to get modules: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 从引用路径中提取类型名称
   * @param ref 引用路径，如 "#/components/schemas/ResponseResultPasswordSettingVo" 或 "ResponseResultPasswordSettingVo"
   * @returns 类型名称
   */
  private extractRefName(ref: string): string {
    // 处理 OpenAPI 3.0 格式: #/components/schemas/TypeName
    if (ref.startsWith('#/components/schemas/')) {
      return ref.replace('#/components/schemas/', '');
    }
    // 处理 Swagger 2.0 格式: #/definitions/TypeName
    if (ref.startsWith('#/definitions/')) {
      return ref.replace('#/definitions/', '');
    }
    // 如果已经是类型名称，直接返回
    return ref;
  }

  /**
   * 递归解析引用类型，获取最底层类型定义
   * @param doc Swagger文档对象
   * @param ref 引用路径（支持 OpenAPI 3.0 和 Swagger 2.0 格式）
   * @param visited 已访问的引用路径，用于防止循环引用
   * @returns 最底层的类型定义
   */
  private resolveRef(
    doc: SwaggerDocument,
    ref?: string,
    visited: Set<string> = new Set(),
  ): SchemaObject | undefined {
    if (!ref) return undefined;

    const refName = this.extractRefName(ref);

    // 防止循环引用
    if (visited.has(refName)) {
      console.warn(`Circular reference detected: ${refName}`);
      return undefined;
    }
    visited.add(refName);

    // 优先从 OpenAPI 3.0 的 components.schemas 获取
    let definition = doc.components?.schemas?.[refName];

    // 如果没有，从 Swagger 2.0 的 definitions 获取
    if (!definition) {
      definition = doc.definitions?.[refName];
    }

    if (!definition) {
      console.warn(`Definition not found: ${refName} (from ref: ${ref})`);
      return undefined;
    }

    // 如果定义是引用类型，继续解析
    if (definition.originalRef && definition.originalRef !== refName) {
      const resolved = this.resolveRef(doc, definition.originalRef, visited);
      if (resolved) {
        return resolved;
      }
    }
    // 处理 OpenAPI 3.0 的 $ref
    if (definition.$ref) {
      const resolved = this.resolveRef(doc, definition.$ref, visited);
      if (resolved) {
        return resolved;
      }
    }

    // 创建深拷贝以避免修改原始定义
    const resolved: SchemaObject = { ...definition };

    // 递归解析 properties 中的引用
    if (resolved.properties) {
      resolved.properties = { ...resolved.properties };
      for (const [key, prop] of Object.entries(resolved.properties)) {
        if (prop.originalRef) {
          const resolvedProp = this.resolveRef(doc, prop.originalRef, new Set(visited));
          if (resolvedProp) {
            resolved.properties[key] = { ...prop, ...resolvedProp };
          }
        }
        // 处理 OpenAPI 3.0 的 $ref
        if (prop.$ref) {
          const resolvedProp = this.resolveRef(doc, prop.$ref, new Set(visited));
          if (resolvedProp) {
            resolved.properties[key] = { ...prop, ...resolvedProp };
          }
        }
        // 处理数组类型的 items 引用
        if (prop.items?.originalRef) {
          const resolvedItems = this.resolveRef(doc, prop.items.originalRef, new Set(visited));
          if (resolvedItems) {
            resolved.properties[key] = {
              ...prop,
              items: { ...prop.items, ...resolvedItems },
            };
          }
        }
        if (prop.items?.$ref) {
          const resolvedItems = this.resolveRef(doc, prop.items.$ref, new Set(visited));
          if (resolvedItems) {
            resolved.properties[key] = {
              ...prop,
              items: { ...prop.items, ...resolvedItems },
            };
          }
        }
      }
    }

    // 处理 items 本身的引用（数组类型）
    if (resolved.items?.originalRef) {
      const resolvedItems = this.resolveRef(doc, resolved.items.originalRef, new Set(visited));
      if (resolvedItems) {
        resolved.items = { ...resolved.items, ...resolvedItems };
      }
    }
    if (resolved.items?.$ref) {
      const resolvedItems = this.resolveRef(doc, resolved.items.$ref, new Set(visited));
      if (resolvedItems) {
        resolved.items = { ...resolved.items, ...resolvedItems };
      }
    }

    // 处理 allOf 中的引用
    if (resolved.allOf) {
      resolved.allOf = resolved.allOf.map((schema) => {
        if (schema.originalRef) {
          return this.resolveRef(doc, schema.originalRef, new Set(visited)) || schema;
        }
        if (schema.$ref) {
          return this.resolveRef(doc, schema.$ref, new Set(visited)) || schema;
        }
        return schema;
      });
    }

    return resolved;
  }

  /**
   * 获取某模块下的接口列表
   * @param module 模块名称
   * @returns 接口列表，包含路径、方法和摘要
   */
  async getModuleApis(
    module: string,
  ): Promise<Array<{ path: string; method: string; summary: string }>> {
    if (!module) {
      throw new Error('Module name is required');
    }

    try {
      const doc = await this.loadSwagger();
      const apis: Array<{ path: string; method: string; summary: string }> = [];

      for (const [path, pathItem] of Object.entries(doc.paths)) {
        for (const [method, operation] of Object.entries(pathItem)) {
          // 跳过非 HTTP 方法的键（如 parameters）
          if (!operation || typeof operation !== 'object' || !('tags' in operation)) {
            continue;
          }

          // 检查是否属于指定模块
          if (operation.tags?.includes(module)) {
            apis.push({
              path,
              method: method.toUpperCase(),
              summary: operation.summary || '',
            });
          }
        }
      }

      return apis;
    } catch (error) {
      throw new Error(
        `Failed to get module APIs for "${module}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * 获取某个接口的类型信息
   * @param path 接口路径
   * @param method HTTP 方法（GET, POST, PUT, DELETE 等）
   * @returns 接口类型信息，包含参数和响应类型
   */
  async getApiTypes(
    path: string,
    method: string,
  ): Promise<{
    path: string;
    method: string;
    summary?: string;
    description?: string;
    parameters?: ParameterObject[];
    requestBody?: SchemaObject;
    responseType?: SchemaObject;
    operation: OperationObject;
  }> {
    if (!path || !method) {
      throw new Error('Path and method are required');
    }

    try {
      const doc = await this.loadSwagger();
      const methodLower = method.toLowerCase();
      const operation = doc.paths[path]?.[methodLower];

      if (!operation) {
        throw new Error(`API not found: ${method.toUpperCase()} ${path}`);
      }

      // 解析响应类型
      // 支持 OpenAPI 3.0 和 Swagger 2.0 两种格式
      const response200 = operation.responses?.['200'];
      let responseSchema: SchemaObject | undefined;

      // OpenAPI 3.0 格式: responses.200.content['application/json'].schema
      if (response200?.content) {
        // 优先查找 application/json，如果没有则取第一个
        const contentType =
          response200.content['application/json'] ||
          response200.content['*/*'] ||
          Object.values(response200.content)[0];
        responseSchema = contentType?.schema;
      }
      // Swagger 2.0 格式: responses.200.schema
      else if (response200?.schema) {
        responseSchema = response200.schema;
      }

      // 解析引用
      let resolvedResponseType: SchemaObject | undefined;
      if (responseSchema) {
        // 处理 OpenAPI 3.0 的 $ref
        if (responseSchema.$ref) {
          resolvedResponseType = this.resolveRef(doc, responseSchema.$ref);
        }
        // 处理 Swagger 2.0 的 originalRef
        else if (responseSchema.originalRef) {
          resolvedResponseType = this.resolveRef(doc, responseSchema.originalRef);
        }
        // 如果没有引用，直接使用 schema
        else {
          resolvedResponseType = responseSchema;
        }
      }

      // 解析请求体类型
      // 支持 OpenAPI 3.0 的 requestBody 和 Swagger 2.0 的 body 参数
      let requestBodyType: SchemaObject | undefined;

      // OpenAPI 3.0 格式: requestBody.content['application/json'].schema
      if (operation.requestBody?.content) {
        const contentType =
          operation.requestBody.content['application/json'] ||
          operation.requestBody.content['*/*'] ||
          Object.values(operation.requestBody.content)[0];
        const requestSchema = contentType?.schema;
        if (requestSchema) {
          if (requestSchema.$ref) {
            requestBodyType = this.resolveRef(doc, requestSchema.$ref);
          } else if (requestSchema.originalRef) {
            requestBodyType = this.resolveRef(doc, requestSchema.originalRef);
          } else {
            requestBodyType = requestSchema;
          }
        }
      }
      // Swagger 2.0 格式: parameters 中的 body 参数
      else {
        const bodyParam = operation.parameters?.find(
          (p): p is BodyParameterObject => p.in === 'body',
        );
        if (bodyParam?.schema) {
          if (bodyParam.schema.originalRef) {
            requestBodyType = this.resolveRef(doc, bodyParam.schema.originalRef);
          } else if (bodyParam.schema.$ref) {
            requestBodyType = this.resolveRef(doc, bodyParam.schema.$ref);
          } else {
            requestBodyType = bodyParam.schema;
          }
        }
      }

      return {
        path,
        method: method.toUpperCase(),
        summary: operation.summary,
        description: operation.description,
        parameters: operation.parameters,
        requestBody: requestBodyType,
        responseType: resolvedResponseType,
        operation,
      };
    } catch (error) {
      throw new Error(
        `Failed to get API types for ${method.toUpperCase()} ${path}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

/**
 * 读取项目配置
 * 优先级：项目配置文件 > 项目名称环境变量 > 默认环境变量
 */
function loadConfig(): { swaggerUrl: string; token?: string } {
  // 1. 尝试读取项目配置文件
  const projectRoot = process.cwd();

  // 获取当前文件所在目录（支持源码和构建后的路径）
  const currentDir = __dirname || dirname(fileURLToPath(import.meta.url));

  const configFiles = [
    join(projectRoot, '.swagger-mcp.json'),
    join(projectRoot, 'swagger-mcp.config.json'),
    join(currentDir, '../../.swagger-mcp.json'),
    join(currentDir, '../../swagger-mcp.config.json'),
  ];

  for (const configFile of configFiles) {
    if (existsSync(configFile)) {
      try {
        const configContent = readFileSync(configFile, 'utf-8');
        const config = JSON.parse(configContent);
        if (config.swaggerUrl || config.SWAGGER_URL) {
          console.error(`[Swagger MCP] 使用配置文件: ${configFile}`);
          return {
            swaggerUrl: config.swaggerUrl || config.SWAGGER_URL,
            token: config.token || config.SWAGGER_TOKEN || config.TOKEN,
          };
        }
      } catch (error) {
        console.error(`[Swagger MCP] 读取配置文件失败 ${configFile}:`, error);
      }
    }
  }

  // 2. 尝试根据项目名称读取环境变量
  try {
    const packageJsonPath = join(projectRoot, 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const projectName = packageJson.name || packageJson.moduleAlias || '';

      if (projectName) {
        // 将项目名称转换为环境变量格式（如 skechers-front-portal -> SKECHERS_FRONT_PORTAL）
        const envSuffix = projectName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        const projectSwaggerUrl = process.env[`SWAGGER_URL_${envSuffix}`];
        const projectToken =
          process.env[`SWAGGER_TOKEN_${envSuffix}`] || process.env[`TOKEN_${envSuffix}`];

        if (projectSwaggerUrl) {
          console.error(`[Swagger MCP] 使用项目环境变量: ${projectName}`);
          return {
            swaggerUrl: projectSwaggerUrl,
            token: projectToken,
          };
        }
      }
    }
  } catch (error) {
    console.error('[Swagger MCP] 读取项目配置失败:', error);
  }

  // 3. 使用默认环境变量
  return {
    swaggerUrl: process.env.SWAGGER_URL,
    token: process.env.SWAGGER_TOKEN || process.env.TOKEN,
  };
}

const { swaggerUrl: SWAGGER_URL, token: TOKEN } = loadConfig();

// 创建服务器实例
const swaggerServer = new SwaggerMcpServer(SWAGGER_URL, TOKEN);

// 创建 MCP 服务器
const server = new McpServer({
  name: 'swagger-mcp-tools',
  version: '0.1.0',
});

// 注册工具：获取模块列表
server.registerTool(
  'getModules',
  {
    description: '获取 Swagger API 的所有模块列表',
  },
  async () => {
    try {
      const modules = await swaggerServer.getModules();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(modules, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: error instanceof Error ? error.message : String(error),
            }),
          },
        ],
      };
    }
  },
);

// 注册工具：获取模块下的接口
server.registerTool(
  'getApis',
  {
    description: '获取指定模块下的所有接口列表',
    inputSchema: {
      module: z.string().describe('模块名称'),
    },
  },
  async ({ module }) => {
    try {
      if (!module) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: '模块名称不能为空' }),
            },
          ],
        };
      }
      const apis = await swaggerServer.getModuleApis(module);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(apis, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: error instanceof Error ? error.message : String(error),
            }),
          },
        ],
      };
    }
  },
);

// 注册工具：获取接口类型
server.registerTool(
  'getApi',
  {
    description: '获取指定接口的参数和返回值类型信息',
    inputSchema: {
      path: z.string().describe('接口路径，如 /api/channelType/list'),
      method: z.string().describe('HTTP 方法，如 GET, POST, PUT, DELETE'),
    },
  },
  async ({ path, method }) => {
    try {
      if (!path || !method) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: '路径和方法不能为空' }),
            },
          ],
        };
      }
      const types = await swaggerServer.getApiTypes(path, method);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(types, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: error instanceof Error ? error.message : String(error),
            }),
          },
        ],
      };
    }
  },
);

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Swagger MCP Server running on stdio');
  console.error(`Swagger URL: ${SWAGGER_URL}`);
  if (TOKEN) {
    console.error(`Token: *** (已设置)`);
  } else {
    console.error(`Token: 未设置 (如果 API 需要认证，请设置 SWAGGER_TOKEN 环境变量)`);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
