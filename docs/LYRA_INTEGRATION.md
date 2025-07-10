# Lyra 全文搜索整合文檔

## 概述

本項目已成功整合 [Lyra](https://github.com/aldingithub/lyra) 全文搜索引擎，提供高性能的跨內容類型搜索功能。

## 功能特性

### 🔍 全局搜索
- **統一搜索體驗**：一個搜索框搜索所有內容類型
- **快捷鍵支持**：`Ctrl+K` (Windows/Linux) 或 `Cmd+K` (Mac) 快速打開搜索
- **實時搜索**：輸入時即時顯示結果
- **智能排序**：基於相關性分數排序結果

### 📊 多內容類型支持
- **門戶搜索**：搜索所有門戶和子門戶
- **新聞搜索**：搜索 RSS 新聞文章
- **AI 工具搜索**：搜索 AI 工具和服務
- **思維模型搜索**：搜索思維框架和模型
- **MCP 服務器搜索**：搜索 MCP 協議服務器

### 🎯 高級搜索功能
- **模糊匹配**：支持拼寫錯誤和部分匹配
- **標籤搜索**：基於標籤和分類的智能過濾
- **相關性評分**：顯示搜索結果的相關性分數
- **搜索建議**：智能搜索建議功能

## 技術架構

### 核心組件

#### 1. Lyra 搜索服務 (`src/client/components/lyra-search.js`)
```javascript
// 主要功能
- 初始化多個搜索索引
- 數據索引和更新
- 跨類型搜索
- 搜索建議生成
```

#### 2. 全局搜索組件 (`src/client/components/global-search.js`)
```javascript
// 主要功能
- 搜索 UI 界面
- 搜索結果展示
- 鍵盤快捷鍵處理
- 響應式設計
```

#### 3. 更新後的門戶搜索 (`src/client/components/search.js`)
```javascript
// 主要功能
- 與 Lyra 整合的門戶搜索
- 向後兼容的搜索邏輯
- 性能優化
```

### 搜索索引結構

#### 門戶索引
```javascript
{
  id: 'string',
  title: 'string',
  description: 'string',
  category: 'string',
  tags: 'string',
  url: 'string',
  featured: 'boolean',
  disabled: 'boolean'
}
```

#### 新聞索引
```javascript
{
  articleId: 'string',
  title: 'string',
  description: 'string',
  source: 'string',
  category: 'string',
  tags: 'string',
  pubDate: 'string',
  url: 'string',
  relevanceScore: 'number'
}
```

#### AI 工具索引
```javascript
{
  id: 'string',
  name: 'string',
  description: 'string',
  category: 'string',
  tags: 'string',
  url: 'string',
  features: 'string'
}
```

## 使用方法

### 1. 全局搜索
1. 點擊右上角的搜索按鈕 🔍
2. 或使用快捷鍵 `Ctrl+K` / `Cmd+K`
3. 輸入搜索關鍵詞
4. 查看分類顯示的搜索結果

### 2. 門戶搜索
1. 在主頁搜索框中輸入關鍵詞
2. 使用分類標籤過濾結果
3. 點擊門戶卡片進入對應頁面

### 3. 新聞搜索
1. 在新聞頁面使用搜索功能
2. 支持按來源、分類、標籤過濾
3. 查看相關性評分

## 性能優化

### 索引策略
- **懶加載**：按需初始化搜索索引
- **增量更新**：只更新變化的數據
- **內存優化**：合理的索引大小限制

### 搜索優化
- **防抖處理**：避免頻繁搜索請求
- **結果緩存**：緩存常用搜索結果
- **分頁加載**：大量結果的分頁顯示

## 配置選項

### 搜索設置
```javascript
// 在 lyra-search.js 中配置
const searchConfig = {
  defaultLanguage: 'english',
  maxResults: 50,
  searchTimeout: 300, // 防抖延遲
  enableSuggestions: true
};
```

### 索引配置
```javascript
// 自定義索引屬性
const customSchema = {
  // 添加自定義字段
  customField: 'string',
  // 調整搜索權重
  searchProperties: ['title', 'description', 'tags']
};
```

## 故障排除

### 常見問題

#### 1. 搜索不工作
- 檢查 Lyra 庫是否正確安裝
- 確認數據文件是否存在
- 查看瀏覽器控制台錯誤信息

#### 2. 搜索結果不準確
- 檢查數據索引是否正確
- 確認搜索關鍵詞是否合適
- 調整搜索權重配置

#### 3. 性能問題
- 減少索引數據量
- 優化搜索查詢
- 啟用結果緩存

### 調試工具
```javascript
// 在瀏覽器控制台中調試
console.log(lyraSearch.searchIndexes); // 查看索引狀態
console.log(await lyraSearch.globalSearch('test')); // 測試搜索
```

## 未來改進

### 計劃功能
- [ ] 搜索歷史記錄
- [ ] 搜索結果導出
- [ ] 高級過濾器
- [ ] 搜索分析統計
- [ ] 多語言搜索支持

### 性能優化
- [ ] 服務端搜索索引
- [ ] 搜索結果預取
- [ ] 智能搜索建議
- [ ] 搜索結果聚類

## 相關文檔

- [Lyra 官方文檔](https://github.com/aldingithub/lyra)
- [項目架構文檔](./SYSTEM_LOGIC.md)
- [API 文檔](./api/README.md)

## 貢獻指南

如需改進搜索功能，請：

1. 創建功能分支
2. 實現改進功能
3. 添加相應測試
4. 更新文檔
5. 提交 Pull Request

## 許可證

本整合遵循 MIT 許可證，與原項目保持一致。 