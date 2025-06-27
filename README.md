# 🚀 TARDIS Navigation

**Time And Relative Dimension In Space** - 個人數字時空導航門戶

一個基於 Doctor Who TARDIS 主題的個人導航網站，提供優雅的時空門戶體驗，幫助您快速訪問常用的數字資源。

## ✨ 特色功能

- **🎨 TARDIS 主題設計**：深色主題配金色點綴，營造科幻氛圍
- **🔍 智能搜索**：實時搜索門戶，支持標籤和描述匹配
- **📱 響應式設計**：完美適配桌面和移動設備
- **⌨️ 鍵盤快捷鍵**：提升操作效率
- **🌓 主題切換**：支持深色/淺色主題
- **🎭 流暢動畫**：優雅的過渡和交互效果

## 🚀 快速開始

### 本地開發

1. 克隆項目
```bash
git clone https://github.com/ccc333bbb/ccc333bbb.github.io.git
cd ccc333bbb.github.io
```

2. 使用本地服務器運行
```bash
# 使用 Python
python -m http.server 8000

# 或使用 Node.js
npx serve .

# 或使用 PHP
php -S localhost:8000
```

3. 訪問 `http://localhost:8000`

### 部署到 GitHub Pages

1. 推送代碼到 GitHub
```bash
git add .
git commit -m "feat: implement TARDIS navigation website"
git push origin main
```

2. 在 GitHub 倉庫設置中啟用 GitHub Pages
3. 訪問 `https://ccc333bbb.github.io`

## ⌨️ 鍵盤快捷鍵

| 快捷鍵 | 功能 |
|--------|------|
| `Ctrl/Cmd + K` | 聚焦搜索框 |
| `ESC` | 清空搜索 |
| `1-5` | 快速切換分類 |
| `T` | 切換主題 |

## 📁 項目結構

```
ccc333bbb.github.io/
├── index.html              # 主頁
├── css/
│   └── style.css           # 主樣式文件
├── js/
│   ├── portals-data.js     # 門戶數據
│   ├── search.js           # 搜索功能
│   └── main.js             # 主腳本
└── README.md               # 項目文檔
```

## 🎯 門戶配置

在 `js/portals-data.js` 中配置您的門戶：

```javascript
{
    id: 1,
    title: "📝 Memo 知識庫",
    description: "個人知識管理系統",
    url: "/memo/",
    icon: "📝",
    category: "tech",
    tags: ["blog", "knowledge"],
    featured: true
}
```

### 門戶屬性

- `id`: 唯一標識符
- `title`: 門戶標題
- `description`: 描述文字
- `url`: 目標鏈接
- `icon`: 顯示圖標
- `category`: 分類 (tech/life/entertainment/tools)
- `tags`: 搜索標籤
- `featured`: 是否為特色門戶
- `external`: 是否為外部鏈接
- `subPortals`: 子門戶列表

## 🎨 自定義主題

### 顏色變量

在 `css/style.css` 中修改 CSS 變量：

```css
:root {
    --tardis-blue: #003b6f;
    --tardis-light-blue: #0066cc;
    --tardis-gold: #ffd700;
    --tardis-dark: #001a33;
    /* ... */
}
```

### 添加新分類

1. 在 HTML 中添加分類標籤
2. 在 JavaScript 中更新分類映射
3. 在門戶數據中使用新分類

## 🔧 技術棧

- **HTML5**: 語義化標記
- **CSS3**: 現代樣式和動畫
- **JavaScript ES6+**: 模塊化功能
- **Google Fonts**: Noto Sans SC 字體
- **GitHub Pages**: 靜態託管

## 📱 瀏覽器支持

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🤝 貢獻指南

1. Fork 項目
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 許可證

MIT License - 詳見 [LICENSE](LICENSE) 文件

## 🙏 致謝

- Doctor Who 系列提供的 TARDIS 靈感
- [Awesome Navigation](https://github.com/eryajf/awesome-navigation) 項目參考
- 所有開源社區的貢獻

---

**歡迎來到 TARDIS Navigation，開始您的數字時空之旅！** 🚀

# TARDIS Navigation System

> A comprehensive navigation portal with intelligent resource monitoring and MCP ecosystem tracking

## 🌟 專案簡介

TARDIS Navigation System 是一個智能化的資源聚合平台，專注於：

- **📝 Memo Knowledge Base** - 個人知識管理系統
- **🆓 FTDD Resources** - 自動監控的免費開發者資源清單
- **🔌 MCP Ecosystem** - Model Context Protocol Server 生態系統追蹤
- **📊 Academic Frontier** - 前沿研究和論文追蹤（規劃中）

## 🚀 核心特色

### 自動化監控
- **實時健康檢查**：GitHub Actions 自動監控服務狀態
- **智能變更檢測**：自動發現政策變更和服務異常
- **準確性保證**：95% 以上的資源信息準確率

### FTDD (Free Tier Driven Development)
- **500+ 免費資源**：涵蓋託管、數據庫、CI/CD、API 等各類服務
- **詳細額度說明**：每個服務的免費限制和使用條件
- **替代方案推薦**：相似服務的對比和推薦

### MCP 生態追蹤
- **Server 發現**：自動發現新的 MCP Server 項目
- **兼容性矩陣**：與主要 AI 模型的兼容性測試
- **安裝指南**：詳細的配置和使用教程

## 📁 專案結構

```
ccc333bbb.github.io/
├── css/                    # 樣式文件
├── js/                     # JavaScript 功能模組
│   ├── main.js            # 主要功能和初始化
│   ├── portals-data.js    # Portal 數據配置
│   └── search.js          # 搜索和過濾功能
├── data/                   # 數據文件
│   ├── ftdd-resources.json # FTDD 資源數據
│   ├── mcp-servers.json   # MCP Server 數據
│   └── update-log.json    # 更新日誌
├── scripts/               # 自動化腳本
│   ├── monitor-ftdd.js    # FTDD 資源監控
│   ├── scan-mcp.js        # MCP 生態掃描
│   └── health-check.js    # 健康檢查腳本
├── docs/                  # 專案文檔
│   └── project-spec.md    # 專案規格文檔
└── .github/workflows/     # GitHub Actions 工作流
```

## 🛠️ 技術棧

- **前端**：HTML5, CSS3, JavaScript (ES6+)
- **數據存儲**：JSON 文件 + Git 版本控制
- **自動化**：GitHub Actions
- **監控**：Node.js + REST APIs
- **部署**：GitHub Pages

## 📊 專案狀態

### 目前進展
- ✅ **基礎架構** - TARDIS Navigation 核心功能
- ✅ **Portal 系統** - 模組化的入口設計
- 🚧 **FTDD 監控** - 免費資源追蹤系統開發中
- 🚧 **MCP 追蹤** - Server 生態系統掃描開發中

### 近期目標
- [ ] 完成 FTDD 資源監控系統
- [ ] 實現 MCP Server 自動發現
- [ ] 建立社群貢獻機制
- [ ] 部署自動化監控流程

## 📋 開發計劃

詳細的開發計劃和任務拆分請參考：[專案規格文檔](docs/project-spec.md)

### Phase 1: 基礎建設 (Week 1-2)
- FTDD 資源數據架構設計
- MCP Server 追蹤機制開發
- 基礎監控腳本實現

### Phase 2: 自動化與智能化 (Week 3-4)
- GitHub Actions 工作流配置
- 智能分析和異常檢測
- 社群反饋系統建立

### Phase 3: 擴展與優化 (Week 5+)
- 學術追蹤系統整合
- 個人化推薦機制
- API 生態完善

## 🤝 參與貢獻

我們歡迎各種形式的貢獻：

### 資源貢獻
- 新增免費服務資源
- 報告失效或變更的資源
- 提供 MCP Server 資訊

### 技術貢獻
- 改進監控算法
- 優化前端體驗
- 擴展數據分析功能

### 文檔貢獻
- 完善使用指南
- 翻譯多語言版本
- 撰寫最佳實踐

## 📈 成功指標

- **資源覆蓋**：500+ FTDD 資源，200+ MCP Servers
- **準確性**：95% 資源信息準確率
- **響應速度**：頁面加載時間 < 2 秒
- **社群參與**：50+ 活躍貢獻者

## 📞 聯繫方式

- **專案主頁**：[https://ccc333bbb.github.io](https://ccc333bbb.github.io)
- **問題回報**：[GitHub Issues]
- **功能建議**：[GitHub Discussions]

## 📄 授權條款

本專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 文件

---

**最後更新**：2024-01-15  
**專案版本**：v2.0-dev  
**維護團隊**：TARDIS Navigation Team
