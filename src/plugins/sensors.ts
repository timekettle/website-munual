import sensors from 'sa-sdk-javascript'

const serverUrl = import.meta.env.VITE_SENSORS_SERVER_URL

if (serverUrl) {
  sensors.init({
    // 数据接收地址，形如 https://xxx.datasink.sensorsdata.cn/sa?project=xxx&token=xxx
    server_url: serverUrl,
    // 页面浏览改用自定义事件 X1ProHelpSite_PageView（在路由 afterEach 里埋），
    // 故关闭 SDK 默认的 $pageview 自动采集，避免重复统计
    // 使用客户端时间，避免设备时区偏差
    use_client_time: true,
    // 使用 beacon 发送（不支持时自动降级），页面卸载也能上报
    send_type: 'beacon',
    // 开发环境打印埋点日志，便于排查
    show_log: !import.meta.env.PROD,
    heatmap: {
      // 可视化全埋点 / 点击图：默认关闭，需要时改为 'default' 并在后台开启对应能力
      clickmap: 'not_collect',
      scroll_notice_map: 'not_collect',
    },
  })
} else if (import.meta.env.DEV) {
  console.warn(
    '[sensors] 未配置 VITE_SENSORS_SERVER_URL，神策埋点未初始化。请在 .env 或 .env.production 中配置。'
  )
}

export default sensors
