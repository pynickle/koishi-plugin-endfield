# koishi-plugin-endfield

[![npm](https://img.shields.io/npm/v/koishi-plugin-endfield?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-endfield)
[![license](https://img.shields.io/github/license/pynickle/koishi-plugin-endfield?style=flat-square)](https://github.com/pynickle/koishi-plugin-endfield/blob/main/LICENSE)

终末地 Endfield 插件 for Koishi，提供角色绑定、每日签到、角色详情卡片、抽卡记录查询等功能。

## 功能特性

- **用户绑定**：通过 Framework Token 共享实现用户绑定
- **每日签到**：支持手动签到和自动签到
- **角色详情**：获取角色详情卡片
- **抽卡记录**：获取抽卡记录，支持分页，显示 up 角色和 up 武器
- **体力信息**：获取体力和每日活跃度信息
- **订阅提醒**：
  - 每日活跃度提醒：在指定时间提醒用户完成每日任务
  - 体力恢复提醒：在体力即将恢复满时提醒用户
- **自动任务**：
  - 每日 00:01 自动签到
  - 每日 12:00 自动更新角色池信息
  - 每分钟检查订阅提醒
- **本地化支持**：全中文本地化

## 安装

### 方法一：通过 npm 安装

```bash
npm install koishi-plugin-endfield
```

### 方法二：通过 Koishi 插件市场安装

在 Koishi 管理界面中，搜索 `endfield` 并安装。

## 配置

在 Koishi 管理界面中，找到 `endfield` 插件并配置以下选项：

| 配置项          | 类型     | 说明                     |
|--------------|--------|------------------------|
| `apiKey`     | string | Endfield API 的 API Key |
| `apiBaseUrl` | string | Endfield API 的基础 URL   |
| `clientUrl`  | string | Endfield API 的客户端 URL  |
| `adminQQ`    | string | 管理员 QQ 号，用于接收自动签到通知    |

## 使用方法

### 1. 用户绑定

```
endfield.auth
```

执行此命令后，会生成一个授权 URL，用户需要访问该 URL 进行授权，授权成功后会自动绑定用户信息。

### 2. 每日签到

```
endfield.sign
```

执行此命令后，会尝试为当前用户进行签到，并返回签到结果。

### 3. 获取角色详情

```
endfield.char <角色名称>
```

执行此命令后，会获取指定角色的详情卡片并发送。

### 4. 获取抽卡记录

```
endfield.gacha
endfield.gacha -n
```

- `endfield.gacha`：同步并获取抽卡记录
- `endfield.gacha -n`：直接获取抽卡记录，不同步

执行此命令后，会获取用户的抽卡记录，并生成一个包含抽卡统计和详情的 HTML 页面。

### 5. 获取体力信息

```
endfield.stamina
```

执行此命令后，会获取用户的体力和每日活跃度信息。

### 6. 订阅每日活跃度提醒

```
endfield.subscribe <时间>
endfield.unsubscribe
```

- `endfield.subscribe <时间>`：订阅每日活跃度提醒，时间格式为 HH:MM，例如 23:50
- `endfield.unsubscribe`：取消订阅每日活跃度提醒

执行此命令后，会在指定时间检查用户的每日活跃度，如果未达标则提醒用户。

### 7. 订阅体力恢复提醒

```
endfield.stamina.subscribe <时间间隔>
endfield.stamina.unsubscribe
```

- `endfield.stamina.subscribe <时间间隔>`：订阅体力恢复提醒，时间间隔格式为类似 3h 或 3h30m30s
- `endfield.stamina.unsubscribe`：取消订阅体力恢复提醒

执行此命令后，当体力即将恢复满时会提醒用户。

### 8. 扫码登录

```
endfield.qr
```

执行此命令后，会生成并发送登录二维码，用户扫描后完成登录，登录信息会自动保存到数据库中。

## 技术实现

- **API 调用**：使用 axios 进行 HTTP 请求
- **数据存储**：使用 Koishi 数据库存储用户绑定信息、角色池信息和订阅信息
- **定时任务**：使用 koishi-plugin-cron 实现定时任务
- **页面渲染**：使用 koishi-plugin-puppeteer 渲染 HTML 页面
- **颜色提取**：使用 colorthief 提取角色图片的主色调
- **时间处理**：使用 dayjs 处理时间和日期

## 自动任务

### 自动签到

- **时间**：每日 00:01
- **功能**：为所有绑定的用户自动签到
- **通知**：向管理员 QQ 发送签到统计信息

### 角色池更新

- **时间**：每日 12:00
- **功能**：更新角色池信息

## 抽卡记录渲染

抽卡记录页面包含以下内容：

- **全局统计**：总抽卡数、六星总数、平均出货率、UP 平均花费
- **限定卡池**：按版本分组显示，包含角色池和武器池
- **常驻卡池**：显示常驻武器申领和常驻/新手卡池
- **UP 标识**：标记 up 角色和 up 武器
- **不歪率**：显示角色池和武器池的不歪率

## 依赖

- koishi：Koishi 核心
- axios：HTTP 客户端
- dayjs：时间处理库
- koishi-plugin-cron：定时任务
- koishi-plugin-puppeteer：页面渲染
- colorthief：颜色提取

## 第三方资源声明

本项目使用了 [Lucide Icon](https://lucide.dev/) 图标库，其许可证为 [ISC License](https://lucide.dev/license)。

## 许可证

AGPL 3.0 License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 致谢

- [Koishi](https://koishi.chat/)：强大的 QQ 机器人框架
- [Endfield API](https://end.shallow.ink/)：提供终末地相关 API

## 更新日志

详细的更新日志请查看 [CHANGELOG.md](CHANGELOG.md) 文件。
