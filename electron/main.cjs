const { app, BrowserWindow, session } = require('electron');
const path = require('path');

// 将用户数据（缓存/GPU/crashpad）移到 %APPDATA%，避免锁定应用目录
app.setPath('userData', path.join(app.getPath('appData'), 'MoYuXiuXian'));

// 禁用GPU硬件加速，防止DLL被Windows缓存锁定导致关闭后文件夹无法移动
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-software-rasterizer');

// 单实例锁（系统级）
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 860,
    minWidth: 380,
    minHeight: 700,
    title: '摸鱼修仙',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  // 加载构建后的 index.html
  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // 释放单实例锁
  app.releaseSingleInstanceLock();
  app.quit();
});

// 确保退出时清理所有资源
app.on('before-quit', () => {
  if (mainWindow) {
    mainWindow.removeAllListeners('close');
    mainWindow.close();
  }
});

app.on('will-quit', () => {
  // 清除所有 session 数据缓存，释放文件句柄
  session.defaultSession.clearCache().catch(() => {});
});

app.on('quit', () => {
  process.exit(0);
});
