module.exports = {
    // 檢查超時設置
    timeout: {
        http: 15000,
        github: 5000
    },
    
    // 響應時間閾值
    responseTime: {
        warning: 8000,
        critical: 15000
    },
    
    // 檢查間隔（毫秒）
    checkInterval: 1500,
    
    // 服務停止關鍵詞
    discontinuedKeywords: [
        'end of life', 'discontinued', 'no longer available',
        'service terminated', 'sunset', 'deprecated',
        'will discontinue', 'shutting down', 'closing down',
        'service has been discontinued', 'no longer supported',
        '停止服務', '不再提供', '已下線', '即將停止'
    ],
    
    // 上下文分析的正面指標
    contextIndicators: [
        'will be', 'has been', 'is being', 'announcement',
        'effective', 'as of', 'september', 'december'
    ],
    
    // 項目活躍度閾值（月）
    activityThreshold: 6,
    
    // 健康分數權重
    scoring: {
        healthy: 100,
        warning: 70,
        discontinued: 0,
        unhealthy: 0
    },
    
    // 狀態閾值
    statusThresholds: {
        healthy: 90,
        warning: 70
    },
    
    // 特殊檢查規則
    specialChecks: {
        redhat: {
            patterns: ['redhat.com', 'openshift'],
            keywords: ['end of life', 'september']
        },
        github: {
            patterns: ['github.com'],
            statusUrl: 'https://www.githubstatus.com/api/v2/status.json'
        },
        cloudProviders: {
            patterns: ['vercel.com', 'netlify.com'],
            keywords: ['incident', 'outage']
        }
    }
}; 