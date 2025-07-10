module.exports = {
    enabled: true,
    tasks: {
        newsUpdate: {
            enabled: true,
            schedule: '0 */6 * * *', // 每6小時執行一次
            type: 'full' // full, quick, keywords
        },
        cleanup: {
            enabled: true,
            schedule: '0 2 * * *', // 每天凌晨2點執行
            type: 'cleanup'
        },
        searchUpdate: {
            enabled: true,
            schedule: '0 */2 * * *', // 每2小時執行一次
            type: 'incremental' // incremental, full
        }
    },
    notifications: {
        enabled: true,
        webhook: null, // 例如: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        email: null // 例如: { host: 'smtp.gmail.com', port: 587, user: 'your@email.com', pass: 'your-password' }
    }
}; 