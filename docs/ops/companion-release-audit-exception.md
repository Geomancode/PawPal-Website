# Companion 网站发布：依赖审计例外提案（用户决定暂缓）

日期：2026-10-16（Europe/Brussels）。状态：**用户已决定暂缓网站上线，等待上游修复；例外未批准、未启用**。本文件仅保留当时评估结果，不修改 CI、不豁免任何现有检查，也不授权推送、Preview、合并或部署。后续恢复时应优先重新核对上游修复与完整审计结果；本次决定不授权任何自动恢复发布。

## 当前发现

升级 Next.js 运行时至 16.4.2、MapLibre 至 6.14.0、PostCSS 至 8.5.30，并更新受影响的传递依赖后，`npm audit --omit=dev --audit-level=high` 返回 0，报告 **0 漏洞**。完整 `npm audit` 仍报告 **5 high、0 critical**；5 个节点均来自同一根 advisory，而不是 5 个独立漏洞。

- 唯一根 advisory：[GHSA-vfj7-8cjw-p6xm / CVE-2026-93687](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)。`braces <=3.0.3`，无已发布修复版本。
- 唯一依赖路径：`eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces@3.0.3`，全部仅开发依赖。
- 触发输入：调用者控制深度嵌套的花括号／括号模式，进入 `braces` 的递归 AST 处理后耗尽 JavaScript 调用栈。字符总长度限制不足以约束嵌套深度。
- 项目实际调用边界：Next ESLint 的 `dist/utils/get-root-dirs.js` 只在 `context.settings.next.rootDir` 是字符串或字符串数组时调用 `fast-glob`。当前 `eslint.config.mjs` 没有配置该项，默认使用 `context.cwd`，不进入该 glob 调用。请求正文、宠物记忆、聊天消息均不传入此工具链。
- 上述路径说明限定当前依赖树和配置；不能据此宣称依赖已修复，也不能泛化为所有开发依赖都安全。

## 上游状态与替代方案

截至本次核对，npm `braces` latest 仍为 3.0.3；GitHub Advisory API 的 `first_patched_version` 为 null。[修复 PR #72](https://github.com/micromatch/braces/pull/72) 提出深度限制与 AST 防护，但 2026-10-05 已关闭且没有合并，候选 SHA 为 `28d440b5dd449dbf1fe6f3506cf94ecca4d02660`。上游 master 仍为 2025-01-19 的 `e53730e6f935498326c72d768889ac194eedc0e0`，没有“已合并但未发布”的修复。

Next ESLint 的最新稳定 16.4.2 和 canary 16.5.0-canary.14 均仍依赖 `fast-glob@3.3.1`；fast-glob latest 3.3.3、micromatch latest 4.0.8 仍引入 braces。fast-glob 的 master 标记为 4.0.0，但仍直接依赖 `braces@^3.0.3`；micromatch master 也仍依赖同一版本。升级这些稳定版、预发布源码或主分支均不能移除根因。`npm audit fix --force` 的建议包含将 eslint-config-next 降至 14.2.35，不能作为当前 Next 16 工程的安全发布修复。

可选后续方案是等待上游修复，或单独审查并维护一个补丁／替代 glob 实现；后者引入新的维护与供应链责任，不能靠重命名包、伪造版本号或直接采用未合并 fork 来声称审计通过。本轮没有实施这些方案。

## 建议的最小例外规则

以下仅为历史建议，本次用户未批准且已选择暂缓，不应实施。原建议截止 **2026-10-30 23:59 Europe/Brussels**，届时自动失效：

1. 仍运行并保存完整 `npm audit --json`，不得丢弃完整报告、改为只扫描生产依赖或关闭 audit 步骤。
2. 仅允许根 advisory 为 `GHSA-vfj7-8cjw-p6xm` 的上述 5 个已列明节点，而且必须逐个通过 lockfile 确认所有实例都为 `dev: true`；依赖链或生产引用发生变化即拒绝。
3. 再独立运行 `npm audit --omit=dev --audit-level=high`，必须成功且没有 high/critical。当前生产审计为 0 漏洞；例外不允许新增生产漏洞。
4. 任何其他 advisory、未知传递路径、无法解析的 JSON、审计网络／认证错误、过期日期均继续阻断。不得笼统允许 high 或全部开发依赖。
5. 在 CI 和交付报告明确输出“仅此开发依赖 advisory 经批准暂时允许”，不得输出“0 漏洞”描述全依赖树。
6. 后续版本出现修复后移除例外并恢复原始完整审计硬门槛；本提案本身不创建监控任务。

## 验证材料

证据位于根目录 `evidence/companion-rollout/web/`：`audit-before.json`、`audit-after.json`、`audit-production.log`、`upstream-advisory-status.json`。升级兼容性、构建与浏览器回归结果由同目录交付记录汇总。当前 `.github/workflows/quality-gate.yml` 未修改；用户决定等待上游修复，现有全量 audit 门槛继续阻止发布。经验证的例外候选仅保存在根目录 evidence，不作为本次发布配置。
