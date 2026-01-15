# 五子棋 AI 对弈系统

用于测试不同 AI 模型博弈能力的五子棋对弈平台。

## 核心设计

- **game.json**: 共享棋盘状态
- **wuziqi.js**: AI 可调用的下棋脚本
- 两个 AI 在不同终端/会话中对弈

## 快速开始

### 0. 启动观战页面（可选）
```bash
node server.js
# 打开浏览器访问 http://localhost:3000
```

### 1. 重置游戏
```bash
node wuziqi.js reset
```

### 2. AI 黑方加入（终端 1）
```bash
export PLAYER_ID=ai_black
node wuziqi.js join
node wuziqi.js watch   # 监听对手落子
```

### 3. AI 白方加入（终端 2）
```bash
export PLAYER_ID=ai_white
node wuziqi.js join
# 白方加入后，黑方先手
```

### 4. 对弈流程
```bash
# 黑方落子（终端 1）
node wuziqi.js move 7 7

# 白方落子（终端 2）
node wuziqi.js move 7 8

# 查看状态
node wuziqi.js status
```

## 命令说明

| 命令 | 说明 |
|------|------|
| `join` | 加入游戏，自动分配黑/白方 |
| `move <x> <y>` | 在坐标 (x,y) 落子 |
| `status` | 查看棋盘状态和 JSON 数据 |
| `watch` | 监听棋盘变化，等待轮到自己 |
| `reset` | 重置游戏 |

## 坐标系统

```
     0  1  2  3  4  5  6  7  8  9  A  B  C  D  E
 0   ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·
 1   ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·
 ...
 7   ·  ·  ·  ·  ·  ·  ·  ●  ·  ·  ·  ·  ·  ·  ·  <- (7,7) 中心点
 ...
```

- x: 0-14（横向，从左到右）
- y: 0-14（纵向，从上到下）

## AI 对弈指南

### 给 AI 的 Prompt 模板

**黑方 AI（先监听）**:
```
你是五子棋黑方玩家。使用以下命令：
1. 设置身份: export PLAYER_ID=ai_black
2. 加入游戏: node wuziqi.js join
3. 监听变化: node wuziqi.js watch
4. 落子: node wuziqi.js move <x> <y>

规则：
- 你是黑方，先手
- 等待白方加入后开始
- 五子连珠获胜
- 坐标范围 0-14
```

**白方 AI（后加入）**:
```
你是五子棋白方玩家。使用以下命令：
1. 设置身份: export PLAYER_ID=ai_white
2. 加入游戏: node wuziqi.js join
3. 查看状态: node wuziqi.js status
4. 落子: node wuziqi.js move <x> <y>

规则：
- 你是白方，后手
- 黑方先落子后轮到你
- 五子连珠获胜
- 坐标范围 0-14
```

## JSON 数据结构

```json
{
  "board_size": 15,
  "board": [
    {"x": 7, "y": 7, "color": "black", "move_number": 1}
  ],
  "current_player": "white",
  "move_count": 1,
  "last_move": {"x": 7, "y": 7, "color": "black", "move_number": 1},
  "players": {
    "black": "ai_black",
    "white": "ai_white"
  },
  "status": "playing",
  "winner": null,
  "history": [{"x": 7, "y": 7, "color": "black"}]
}
```

### 字段说明

| 字段 | 说明 |
|------|------|
| `board` | 棋盘上所有棋子 |
| `current_player` | 当前轮到谁 (black/white) |
| `status` | waiting/playing/finished |
| `last_move` | 最后一步棋 |
| `winner` | 胜者 (black/white/draw/null) |

## 测试不同 AI 模型

1. 在两个不同的 Claude Code 会话中分别扮演黑白方
2. 或使用不同的 AI 模型（GPT-4, Claude, Gemini 等）
3. 观察各模型的策略和决策能力

## 观战页面

启动本地服务器后，打开 `http://localhost:3000` 即可实时观看对弈：

- 实时显示棋盘状态（500ms 刷新）
- 显示双方玩家信息
- 高亮当前回合玩家
- 最后落子位置闪烁提示
- 落子历史记录
- 胜负结果弹窗

```bash
node server.js       # 默认 3000 端口
node server.js 8080  # 自定义端口
```

## 文件结构

```
wuziqi/
├── game.json     # 棋盘状态数据
├── wuziqi.js     # AI 调用脚本
├── server.js     # 本地观战服务器
├── viewer.html   # 观战页面
└── README.md     # 说明文档
```
