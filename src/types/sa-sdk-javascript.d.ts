declare module 'sa-sdk-javascript' {
  export interface SensorsSDK {
    /** 初始化 SDK */
    init(para: Record<string, any>): void

    /** 埋一个自定义事件 */
    track(eventName: string, properties?: Record<string, any>, callback?: any): void
    /** 触发预置/自动采集事件 */
    quick(eventName: string, properties?: any, target?: any, callback?: any): any
    /** 使用插件 */
    use(name: string, option: Record<string, any>): any

    /** 设置用户 ID */
    identify(id: string, isSave?: boolean): any
    resetAnonymousIdentity(id: string): void
    login(id: string, callback?: any): void
    logout(isChangeId?: boolean): void
    bind(bindKey: string, bindValue: string): void
    unbind(itemName: string, itemValue: string): void

    /** 用户属性 */
    setOnceProfile(prop: Record<string, any>, callback?: any): void
    setProfile(prop: Record<string, any>, callback?: any): void
    appendProfile(prop: Record<string, any>, callback?: any): void
    incrementProfile(prop: Record<string, any>, callback?: any): void
    deleteProfile(callback?: any): void
    unsetProfile(prop: Record<string, any>, callback?: any): void

    /** 公共属性 */
    registerPage(obj: Record<string, any>): void
    clearPageRegister(arr: any): void
    clearAllRegister(arr: any): void

    /** 物品维度 */
    deleteItem(type: string, id: string): void
    setItem(type: string, id: string, p: Record<string, any>): void

    /** 其他 */
    registerPropertyPlugin(arg: any): void
    getPresetProperties(): any

    [key: string]: any
  }

  const sensors: SensorsSDK
  export default sensors
}
