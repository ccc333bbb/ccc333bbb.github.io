# 文件管理和搜索索引更新系統

## 概述

本系統提供了完整的文件管理和搜索索引更新解決方案，包括：

- **新聞文件清理和歸檔**：自動管理新聞文件的存儲空間
- **搜索索引更新**：確保搜索功能與最新數據同步
- **自動化任務調度**：定時執行維護任務
- **客戶端自動更新檢測**：實時更新搜索索引

## 系統架構

```
src/server/
├── news/
│   ├── cleanup-news.js          # 新聞文件清理管理器
│   └── update-all-news.js       # 整合的新聞更新腳本
├── search/
│   └── update-indexes.js        # 搜索索引更新器
└── scheduler/
    └── automated-tasks.js       # 自動化任務調度器

config/
└── scheduler.config.js          # 調度器配置文件

data/
├── news/                        # 活躍新聞文件
├── news-archive/                # 歸檔新聞文件
├── news-compressed/             # 壓縮新聞文件
├── cleanup-log.json             # 清理操作日誌
├── search-update-log.json       # 搜索更新日誌
├── search-update-signal.json    # 搜索更新信號
└── scheduler-log.json           # 調度器日誌
```

## 新聞文件管理

### 清理策略

系統採用三層清理策略：

1. **壓縮階段**（7天後）
   - 移除不必要的字段
   - 保留核心信息
   - 節省約30-50%存儲空間

2. **歸檔階段**（14天後）
   - 移動到歸檔目錄
   - 保持完整數據結構
   - 便於歷史查詢

3. **刪除階段**（30天後）
   - 永久刪除過期文件
   - 釋放存儲空間
   - 維護歸檔目錄大小限制

### 使用方法

```bash
# 運行完整清理流程
npm run cleanup:run

# 生成清理報告
npm run cleanup:report

# 測試清理功能（使用較短的保留期限）
npm run cleanup:test
```

### 配置選項

在 `src/server/news/cleanup-news.js` 中可以調整：

```javascript
this.config = {
    retentionDays: 30,        // 保留30天
    compressionDays: 7,        // 7天後壓縮
    archiveDays: 14,           // 14天後歸檔
    maxArchiveSize: 100 * 1024 * 1024, // 100MB 歸檔限制
};
```

## 搜索索引更新

### 更新策略

1. **增量更新**
   - 檢查數據文件變更
   - 僅在必要時更新索引
   - 提高更新效率

2. **完整更新**
   - 重新驗證所有數據
   - 生成完整統計信息
   - 確保數據一致性

3. **自動更新檢測**
   - 客戶端定期檢查更新信號
   - 頁面可見性變化時檢查
   - 無縫更新體驗

### 使用方法

```bash
# 執行完整搜索索引更新
npm run search:update

# 執行增量更新檢查
npm run search:incremental

# 生成搜索更新報告
npm run search:report

# 驗證數據完整性
npm run search:validate

# 清理舊的更新信號
npm run search:cleanup
```

### 更新信號機制

系統使用 `search-update-signal.json` 文件作為更新信號：

```json
{
    "timestamp": "2024-01-01T12:00:00.000Z",
    "version": "1.0",
    "dataFiles": {
        "ranked-news-index.json": {
            "exists": true,
            "lastModified": "2024-01-01T12:00:00.000Z",
            "size": 1024000,
            "recordCount": 100
        }
    }
}
```

## 自動化任務調度

### 預設任務

1. **新聞更新任務**
   - 頻率：每6小時
   - 類型：完整更新
   - 包含：關鍵詞、新聞、處理、清理、搜索更新

2. **清理任務**
   - 頻率：每天凌晨2點
   - 類型：文件清理
   - 包含：壓縮、歸檔、刪除

3. **搜索更新任務**
   - 頻率：每2小時
   - 類型：增量更新
   - 包含：索引驗證和更新

### 使用方法

```bash
# 啟動調度器
npm run scheduler:start

# 停止調度器
npm run scheduler:stop

# 查看調度器狀態
npm run scheduler:status

# 立即執行特定任務
npm run scheduler:news
npm run scheduler:cleanup
npm run scheduler:search

# 重新加載配置
npm run scheduler:reload
```

### 配置調度器

編輯 `config/scheduler.config.js`：

```javascript
module.exports = {
    enabled: true,
    tasks: {
        newsUpdate: {
            enabled: true,
            schedule: '0 */6 * * *', // 每6小時
            type: 'full'
        },
        cleanup: {
            enabled: true,
            schedule: '0 2 * * *', // 每天凌晨2點
            type: 'cleanup'
        },
        searchUpdate: {
            enabled: true,
            schedule: '0 */2 * * *', // 每2小時
            type: 'incremental'
        }
    },
    notifications: {
        enabled: true,
        webhook: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
        email: {
            host: 'smtp.gmail.com',
            port: 587,
            user: 'your@email.com',
            pass: 'your-password'
        }
    }
};
```

### Cron 表達式格式

```
* * * * *
│ │ │ │ │
│ │ │ │ └── 星期幾 (0-7, 0和7都代表星期日)
│ │ │ └──── 月份 (1-12)
│ │ └────── 日期 (1-31)
│ └──────── 小時 (0-23)
└────────── 分鐘 (0-59)
```

常用表達式：
- `0 */6 * * *` - 每6小時
- `0 2 * * *` - 每天凌晨2點
- `0 */2 * * *` - 每2小時
- `0 0 * * 0` - 每週日午夜

## 客戶端自動更新

### 更新檢測機制

1. **定期檢查**：每5分鐘檢查一次更新信號
2. **頁面可見性**：頁面重新可見時檢查更新
3. **狀態指示**：實時顯示搜索系統狀態
4. **無縫更新**：後台更新，不影響用戶體驗

### 狀態指示器

- 🟢 **Ready**：搜索系統正常運行
- 🟡 **Loading**：正在索引或更新數據
- 🔴 **Error**：搜索系統出現錯誤
- 🔵 **Info**：一般信息狀態

### 更新通知

當搜索索引更新時，會顯示通知：

```
🔄 Search indexes updated
```

通知會在3秒後自動消失，也可以手動關閉。

## 整合使用

### 完整更新流程

```bash
# 1. 更新新聞和關鍵詞
npm run news:update-all

# 2. 清理舊文件
npm run cleanup:run

# 3. 更新搜索索引
npm run search:update

# 4. 查看報告
npm run news:report
npm run cleanup:report
npm run search:report
```

### 快速更新流程

```bash
# 快速更新（新聞處理 + 搜索索引）
npm run news:quick-update
```

### 自動化流程

```bash
# 啟動自動化調度器
npm run scheduler:start

# 查看調度器狀態
npm run scheduler:status
```

## 監控和日誌

### 日誌文件

- `data/cleanup-log.json` - 清理操作日誌
- `data/search-update-log.json` - 搜索更新日誌
- `data/scheduler-log.json` - 調度器日誌
- `data/update-log.json` - 新聞更新日誌

### 日誌格式

```json
{
    "operations": [
        {
            "timestamp": "2024-01-01T12:00:00.000Z",
            "operation": "cleanup",
            "details": {
                "success": true,
                "summary": {
                    "compressed": 5,
                    "archived": 3,
                    "deleted": 2
                }
            }
        }
    ],
    "lastUpdated": "2024-01-01T12:00:00.000Z"
}
```

### 健康檢查

```bash
# 檢查系統健康狀態
npm run health-check
```

## 故障排除

### 常見問題

1. **清理失敗**
   - 檢查文件權限
   - 確認目錄存在
   - 查看錯誤日誌

2. **搜索更新失敗**
   - 驗證數據文件完整性
   - 檢查文件格式
   - 確認依賴項

3. **調度器不工作**
   - 檢查配置文件
   - 確認 cron 表達式格式
   - 查看調度器日誌

### 調試命令

```bash
# 測試清理功能
npm run cleanup:test

# 驗證搜索數據
npm run search:validate

# 查看詳細報告
npm run scheduler:status
```

## 性能優化

### 存儲優化

- 壓縮可節省30-50%存儲空間
- 歸檔管理防止無限增長
- 自動清理過期文件

### 更新優化

- 增量更新減少處理時間
- 智能檢測避免不必要的更新
- 後台更新不影響用戶體驗

### 監控優化

- 詳細日誌便於問題診斷
- 狀態報告提供系統概覽
- 自動通知及時發現問題

## 最佳實踐

1. **定期監控**：定期檢查系統狀態和日誌
2. **備份重要數據**：定期備份配置和重要數據
3. **測試更新**：在生產環境前測試更新流程
4. **監控存儲**：定期檢查存儲使用情況
5. **優化配置**：根據實際使用情況調整配置

## 更新日誌

### v1.0.0 (2024-01-01)
- 初始版本發布
- 實現新聞文件清理和歸檔
- 實現搜索索引自動更新
- 實現自動化任務調度
- 實現客戶端自動更新檢測 