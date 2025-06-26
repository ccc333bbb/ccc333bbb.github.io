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
