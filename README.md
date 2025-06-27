# 🚀 TARDIS Navigation

**Time And Relative Dimension In Space** - 個人數字時空導航門戶

一個基於 Doctor Who TARDIS 主題的個人導航網站，提供智能資源監控、AI工具聚合和MCP生態系統追蹤。

## ✨ 核心功能

### 🤖 AI Tools Hub
- **65+ AI工具資源**：涵蓋免費LLM推理API、AI平台、工具等
- **智能篩選**：支持免費/試用/付費分類，模型類型篩選
- **實時狀態**：自動監控服務可用性和響應時間
- **詳細信息**：支持模型、定價、功能特性展示

### 🛠️ FTDD Resources  
- **免費開發資源**：託管、數據庫、CI/CD、監控等服務
- **健康監控**：智能檢測服務狀態，識別已停服平台
- **詳細額度**：每個服務的免費限制和使用條件
- **響應時間**：實時監控服務性能

### 🔌 MCP Ecosystem
- **MCP服務器追蹤**：Model Context Protocol生態系統
- **GitHub集成**：自動獲取項目統計和活躍度
- **兼容性信息**：支持的AI模型和功能特性
- **安裝指南**：詳細的配置和使用說明

### 🧠 Thinking Models
- **思維模型研究**：追蹤最新的AI思維方法
- **論文收集**：相關研究論文和實現
- **效果評估**：不同模型的性能對比
- **應用案例**：實際應用場景和最佳實踐

### 📰 News Aggregation
- **智能新聞聚合**：自動抓取科技新聞和趨勢
- **關鍵詞追蹤**：熱門技術關鍵詞監控
- **內容排序**：基於相關性和重要性排序
- **搜索功能**：支持全文搜索和篩選

## 📚 文檔中心

📖 **[完整文檔](./docs/README.md)** - 查看詳細的技術文檔和開發指南

- 🚀 **[項目實施摘要](./docs/IMPLEMENTATION_SUMMARY.md)** - 詳細的技術實施和架構說明
- 🏗️ **架構文檔** - 健康檢查系統、目錄結構、配置系統
- 🤖 **功能模塊** - AI工具集成、FTDD監控、MCP生態、新聞聚合
- 🔧 **開發指南** - 本地開發、GitHub Actions、數據結構規範
- 🤝 **貢獻指南** - 參與方式、代碼規範、測試指南

## 🏗️ 項目架構

### 新的目錄結構
```
ccc333bbb.github.io/
├── src/
│   ├── client/              # 前端代碼
│   │   ├── pages/          # 頁面特定JavaScript
│   │   │   ├── main.js
│   │   │   ├── ai-tools.js
│   │   │   ├── ftdd-resources.js
│   │   │   ├── mcp-servers.js
│   │   │   ├── thinking-models.js
│   │   │   └── news-search.js
│   │   ├── components/     # 共用組件
│   │   │   └── search.js
│   │   └── data/          # 靜態數據
│   │       └── portals-data.js
│   └── server/             # 後端腳本
│       ├── news/          # 新聞聚合系統
│       │   ├── fetch-keywords.js
│       │   ├── fetch-news.js
│       │   ├── process-news.js
│       │   ├── rank-news.js
│       │   └── update-all-news.js
│       ├── monitoring/    # 健康監控
│       │   └── health-check.js
│       └── utils/         # 工具函數
├── config/                 # 配置文件
│   └── health-check.config.js
├── data/                   # 數據文件
├── css/                    # 樣式文件
├── ai-tools/               # AI工具頁面
├── ftdd/                   # FTDD資源頁面
├── mcp/                    # MCP生態頁面
├── thinking-models/        # 思維模型頁面
└── .github/workflows/      # GitHub Actions
```

## 🚀 快速開始

### 本地開發

1. 克隆項目
```bash
git clone https://github.com/ccc333bbb/ccc333bbb.github.io.git
cd ccc333bbb.github.io
```

2. 安裝依賴
```bash
npm install
```

3. 啟動本地服務器
```bash
# 使用 Python
python3 -m http.server 8000

# 或使用 npm 腳本
npm run dev
```

4. 訪問 `http://localhost:8000`

### 運行健康檢查
```bash
# 檢查所有服務狀態
npm run health-check

# 更新新聞內容
npm run news:update-all

# 獲取熱門關鍵詞
npm run news:update-keywords
```

## 🔍 智能健康檢查系統

### 檢查邏輯
- **HTTP狀態檢查**：基本可用性測試
- **內容分析**：檢測服務停止關鍵詞
- **上下文分析**：避免誤判新聞報導
- **特殊服務邏輯**：針對不同平台的專門檢查
- **響應時間監控**：性能指標追蹤

### 狀態分類
| 狀態 | 圖標 | 描述 | 權重 |
|------|------|------|------|
| 正常運行 | ✅ | 服務正常，響應快速 | 100 |
| 部分問題 | ⚠️ | 響應慢或有小問題 | 70 |
| 服務異常 | ❌ | 無法訪問或錯誤 | 0 |
| 已停服 | 🚫 | 官方確認停止服務 | 0 |

### 配置系統
```javascript
// config/health-check.config.js
module.exports = {
    timeout: { http: 15000, github: 5000 },
    responseTime: { warning: 8000, critical: 15000 },
    discontinuedKeywords: [
        'end of life', 'discontinued', 'service terminated',
        '停止服務', '不再提供', '已下線'
    ],
    specialChecks: {
        redhat: { patterns: ['redhat.com', 'openshift'] },
        github: { statusUrl: 'https://www.githubstatus.com/api/v2/status.json' }
    }
};
```

## 🤖 AI工具生態

### 免費LLM推理API
- **OpenRouter**：統一API接口，20 req/min免費
- **Google AI Studio**：Gemini模型，1M tokens/day
- **Groq**：超快推理速度，14,400 req/day
- **Cerebras**：30M tokens/month
- **NVIDIA NIM**：企業級優化，1000 req/month

### 篩選功能
- **🆓 免費APIs**：專門的免費服務篩選
- **模型支持**：按支持的AI模型篩選
- **功能特性**：根據功能需求篩選
- **搜索**：支持名稱、描述、模型搜索

## 📊 自動化工作流

### GitHub Actions
- **健康檢查**：每日6點UTC自動執行
- **新聞更新**：手動觸發（節省資源）
- **數據同步**：自動提交更新結果
- **錯誤處理**：完善的異常處理機制

### 數據管理
- **JSON存儲**：結構化數據文件
- **Git版本控制**：完整的變更歷史
- **增量更新**：只更新變化的部分
- **備份機制**：自動備份重要數據

## ⌨️ 鍵盤快捷鍵

| 快捷鍵 | 功能 |
|--------|------|
| `Ctrl/Cmd + K` | 聚焦搜索框 |
| `ESC` | 清空搜索 |
| `/` | 快速搜索 |
| `?` | 顯示幫助 |

## 🎨 主題設計

### TARDIS主題特色
- **深藍色調**：經典TARDIS藍色
- **金色點綴**：時間漩渦金色
- **科幻動畫**：流暢的過渡效果
- **響應式設計**：完美適配各種設備

### 自定義CSS變量
```css
:root {
    --tardis-blue: #003b6f;
    --tardis-gold: #ffd700;
    --tardis-glow: #00d4ff;
    --tardis-dark: #001a33;
    --tardis-text: #e0e6ed;
}
```

## 🔧 技術棧

### 前端技術
- **HTML5/CSS3**：現代網頁標準
- **Vanilla JavaScript**：無框架依賴
- **響應式設計**：移動端優先

### 後端技術
- **Node.js**：服務器端JavaScript
- **Axios**：HTTP客戶端
- **Cheerio**：HTML解析
- **RSS Parser**：新聞源解析

### 開發工具
- **GitHub Actions**：CI/CD自動化
- **GitHub Pages**：靜態網站託管
- **npm**：包管理器

## 📈 性能指標

### 監控統計
- **FTDD資源**：50+服務，90%+健康率
- **AI工具**：65+工具，實時狀態追蹤
- **MCP服務器**：25+項目，活躍度監控
- **新聞文章**：每日更新，智能排序

### 響應性能
- **頁面加載**：<2秒首屏渲染
- **搜索響應**：<100ms實時搜索
- **狀態更新**：每日自動同步

## 🤝 貢獻指南

### 添加新資源
1. Fork項目
2. 在對應的JSON文件中添加資源
3. 測試健康檢查功能
4. 提交Pull Request

### 報告問題
- 服務狀態錯誤
- 新資源推薦
- 功能改進建議
- 界面優化意見

## 📄 許可證

MIT License - 詳見 [LICENSE](LICENSE) 文件

## 🙏 致謝

- **Doctor Who**：TARDIS設計靈感
- **cheahjs/free-llm-api-resources**：免費API資源參考
- **Stack on a Budget**：FTDD概念啟發
- **開源社區**：各種優秀的工具和庫

---

**歡迎來到 TARDIS Navigation，開始您的數字時空之旅！** 🚀

> 訪問網站：[https://ccc333bbb.github.io](https://ccc333bbb.github.io)
