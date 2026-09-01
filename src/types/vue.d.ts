export {}

declare module 'vue' {
  interface ComponentCustomProperties {
    $sensors: import('sa-sdk-javascript').SensorsSDK
  }
}
