#!/usr/bin/env node
/**
 * 五子棋 AI 对弈系统
 *
 * 使用方式:
 *   node wuziqi.js join              # 加入游戏（自动分配黑/白方）
 *   node wuziqi.js move <x> <y>      # 在坐标 (x, y) 落子
 *   node wuziqi.js status            # 查看当前棋盘状态
 *   node wuziqi.js reset             # 重置游戏
 */

const fs = require('fs');
const path = require('path');

const GAME_FILE = path.join(__dirname, 'game.json');
const BOARD_SIZE = 15;

// ============ 核心数据操作 ============

function readGame() {
  try {
    return JSON.parse(fs.readFileSync(GAME_FILE, 'utf-8'));
  } catch (e) {
    return createInitialState();
  }
}

function writeGame(state) {
  fs.writeFileSync(GAME_FILE, JSON.stringify(state, null, 2));
}

function createInitialState() {
  return {
    board_size: BOARD_SIZE,
    board: [],
    current_player: 'black',
    move_count: 0,
    last_move: null,
    players: { black: null, white: null },
    status: 'waiting',
    winner: null,
    history: []
  };
}

// ============ 游戏逻辑 ============

function join(playerId) {
  const state = readGame();

  if (state.players.black && state.players.white) {
    console.log('❌ 游戏已满，两位玩家已就位');
    return false;
  }

  if (state.players.black === playerId || state.players.white === playerId) {
    console.log('⚠️ 你已经在游戏中');
    return true;
  }

  if (!state.players.black) {
    state.players.black = playerId;
    state.status = 'waiting';
    writeGame(state);
    console.log(`✅ 你是【黑方】，等待白方加入...`);
    console.log('💡 黑方先手，白方加入后你将收到通知');
    return true;
  }

  if (!state.players.white) {
    state.players.white = playerId;
    state.status = 'playing';
    writeGame(state);
    console.log(`✅ 你是【白方】，游戏开始！`);
    console.log('💡 当前轮到【黑方】落子');
    return true;
  }
}

function move(x, y, playerId) {
  const state = readGame();

  // 检查游戏状态
  if (state.status === 'waiting') {
    console.log('❌ 游戏尚未开始，等待另一位玩家加入');
    return false;
  }

  if (state.status === 'finished') {
    console.log(`❌ 游戏已结束，胜者: ${state.winner}`);
    return false;
  }

  // 检查是否轮到该玩家
  const playerColor = state.players.black === playerId ? 'black' :
                      state.players.white === playerId ? 'white' : null;

  if (!playerColor) {
    console.log('❌ 你不是游戏参与者');
    return false;
  }

  if (state.current_player !== playerColor) {
    console.log(`❌ 还没轮到你，当前是【${state.current_player === 'black' ? '黑方' : '白方'}】回合`);
    return false;
  }

  // 检查坐标有效性
  if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
    console.log(`❌ 坐标越界，有效范围: 0-${BOARD_SIZE - 1}`);
    return false;
  }

  // 检查位置是否已有棋子
  const existingPiece = state.board.find(p => p.x === x && p.y === y);
  if (existingPiece) {
    console.log(`❌ 位置 (${x}, ${y}) 已有棋子`);
    return false;
  }

  // 落子
  const piece = { x, y, color: playerColor, move_number: state.move_count + 1 };
  state.board.push(piece);
  state.last_move = piece;
  state.move_count++;
  state.history.push({ x, y, color: playerColor });

  // 检查胜负
  if (checkWin(state.board, x, y, playerColor)) {
    state.status = 'finished';
    state.winner = playerColor;
    writeGame(state);
    console.log(`🎉 【${playerColor === 'black' ? '黑方' : '白方'}】获胜！`);
    printBoard(state);
    return true;
  }

  // 检查平局
  if (state.board.length >= BOARD_SIZE * BOARD_SIZE) {
    state.status = 'finished';
    state.winner = 'draw';
    writeGame(state);
    console.log('🤝 平局！');
    printBoard(state);
    return true;
  }

  // 切换玩家
  state.current_player = playerColor === 'black' ? 'white' : 'black';
  writeGame(state);

  console.log(`✅ 落子成功: (${x}, ${y})`);
  console.log(`➡️ 轮到【${state.current_player === 'black' ? '黑方' : '白方'}】`);
  printBoard(state);
  return true;
}

function checkWin(board, x, y, color) {
  const directions = [
    [1, 0],   // 水平
    [0, 1],   // 垂直
    [1, 1],   // 对角线
    [1, -1]   // 反对角线
  ];

  const getStone = (bx, by) => {
    return board.find(p => p.x === bx && p.y === by && p.color === color);
  };

  for (const [dx, dy] of directions) {
    let count = 1;

    // 正方向
    for (let i = 1; i < 5; i++) {
      if (getStone(x + dx * i, y + dy * i)) count++;
      else break;
    }

    // 反方向
    for (let i = 1; i < 5; i++) {
      if (getStone(x - dx * i, y - dy * i)) count++;
      else break;
    }

    if (count >= 5) return true;
  }

  return false;
}

function status() {
  const state = readGame();

  console.log('\n========== 游戏状态 ==========');
  console.log(`状态: ${state.status}`);
  console.log(`黑方: ${state.players.black || '等待加入'}`);
  console.log(`白方: ${state.players.white || '等待加入'}`);
  console.log(`回合数: ${state.move_count}`);

  if (state.status === 'playing') {
    console.log(`当前回合: ${state.current_player === 'black' ? '黑方' : '白方'}`);
  }

  if (state.last_move) {
    console.log(`最后落子: (${state.last_move.x}, ${state.last_move.y}) by ${state.last_move.color}`);
  }

  if (state.winner) {
    console.log(`胜者: ${state.winner}`);
  }

  printBoard(state);

  // 输出 JSON 供 AI 解析
  console.log('\n========== JSON 数据 ==========');
  console.log(JSON.stringify(state, null, 2));
}

function printBoard(state) {
  console.log('\n   ' + Array.from({length: BOARD_SIZE}, (_, i) =>
    (i).toString(16).toUpperCase().padStart(2, ' ')
  ).join(''));

  for (let y = 0; y < BOARD_SIZE; y++) {
    let row = y.toString(16).toUpperCase().padStart(2, ' ') + ' ';
    for (let x = 0; x < BOARD_SIZE; x++) {
      const piece = state.board.find(p => p.x === x && p.y === y);
      if (piece) {
        row += piece.color === 'black' ? ' ●' : ' ○';
      } else {
        row += ' ·';
      }
    }
    console.log(row);
  }
}

function reset() {
  writeGame(createInitialState());
  console.log('✅ 游戏已重置');
}

function watch(playerId) {
  console.log(`👀 开始监听游戏变化... (玩家: ${playerId})`);
  console.log('💡 按 Ctrl+C 退出监听\n');

  let lastState = JSON.stringify(readGame());

  const checkChange = () => {
    const currentState = JSON.stringify(readGame());
    if (currentState !== lastState) {
      lastState = currentState;
      const state = JSON.parse(currentState);

      console.log('\n🔔 ========== 棋盘变化 ==========');

      // 判断是否轮到自己
      const playerColor = state.players.black === playerId ? 'black' :
                          state.players.white === playerId ? 'white' : null;

      if (state.status === 'finished') {
        console.log(`🏁 游戏结束！胜者: ${state.winner}`);
        printBoard(state);
        process.exit(0);
      }

      if (state.status === 'playing' && playerColor && state.current_player === playerColor) {
        console.log(`\n⚡ 轮到你了！你是【${playerColor === 'black' ? '黑方' : '白方'}】`);
        if (state.last_move) {
          console.log(`对手落子: (${state.last_move.x}, ${state.last_move.y})`);
        }
        printBoard(state);
        console.log('\n💡 使用命令落子: node wuziqi.js move <x> <y>');
      } else if (state.status === 'playing') {
        console.log(`等待对手落子...`);
      }
    }
  };

  // 立即检查一次
  checkChange();

  // 每 500ms 检查一次
  setInterval(checkChange, 500);
}

// ============ CLI 入口 ============

const args = process.argv.slice(2);
const command = args[0];

// 生成唯一玩家 ID（基于进程 ID 和时间戳）
const PLAYER_ID = process.env.PLAYER_ID || `player_${process.pid}_${Date.now()}`;

switch (command) {
  case 'join':
    join(PLAYER_ID);
    console.log(`\n你的玩家 ID: ${PLAYER_ID}`);
    console.log('💡 设置环境变量保持身份: export PLAYER_ID=' + PLAYER_ID);
    break;

  case 'move':
    const x = parseInt(args[1]);
    const y = parseInt(args[2]);
    if (isNaN(x) || isNaN(y)) {
      console.log('❌ 用法: node wuziqi.js move <x> <y>');
      console.log('   示例: node wuziqi.js move 7 7');
    } else {
      move(x, y, PLAYER_ID);
    }
    break;

  case 'status':
    status();
    break;

  case 'reset':
    reset();
    break;

  case 'watch':
    watch(PLAYER_ID);
    break;

  default:
    console.log(`
五子棋 AI 对弈系统
==================

命令:
  node wuziqi.js join              加入游戏（自动分配黑/白方）
  node wuziqi.js move <x> <y>      在坐标 (x, y) 落子
  node wuziqi.js status            查看当前棋盘状态
  node wuziqi.js watch             监听游戏变化（等待对手落子）
  node wuziqi.js reset             重置游戏

坐标系统:
  x: 0-14 (横向，从左到右)
  y: 0-14 (纵向，从上到下)

示例:
  node wuziqi.js move 7 7          在棋盘中心落子

玩家身份:
  设置 PLAYER_ID 环境变量来保持身份
  export PLAYER_ID=ai_black
`);
}
