# Cordova Android 项目构建指南

## 环境要求
- Node.js 和 npm
- Java JDK
- Android SDK
- Gradle
- Cordova CLI

## 构建步骤

### 1. 基本构建命令
```bash
cordova build android
```

### 2. 常见问题及解决方案

#### 2.1 网络连接问题
在中国大陆地区，由于网络原因可能无法访问Google Maven仓库，导致依赖下载失败。

**症状：**
- 出现连接超时错误
- 无法下载androidx相关依赖
- 错误信息包含：`Could not GET 'https://dl.google.com/dl/android/maven2/'`

**解决方案：**

1. 配置Gradle代理
在项目根目录的`gradle.properties`文件中添加以下配置：
```properties
# 设置HTTP和HTTPS代理
systemProp.http.proxyHost=127.0.0.1
systemProp.http.proxyPort=7890
systemProp.https.proxyHost=127.0.0.1
systemProp.https.proxyPort=7890
systemProp.http.nonProxyHosts=localhost|127.*|[::1]
systemProp.https.nonProxyHosts=localhost|127.*|[::1]
```

2. 创建带代理的构建脚本
创建`build-with-proxy.bat`：
```batch
@echo off
set HTTP_PROXY=http://127.0.0.1:7890
set HTTPS_PROXY=http://127.0.0.1:7890
set JAVA_OPTS=-Dhttp.proxyHost=127.0.0.1 -Dhttp.proxyPort=7890 -Dhttps.proxyHost=127.0.0.1 -Dhttps.proxyPort=7890
cordova build android
```

#### 2.2 SDK版本兼容性问题
新版本的androidx库要求更高版本的Android SDK。

**症状：**
- 错误信息提示需要compileSdkVersion 33或更高版本
- 依赖库版本不兼容

**解决方案：**

在`config.xml`中更新Android SDK版本设置：
```xml
<platform name="android">
    <preference name="android-compileSdkVersion" value="33" />
    <preference name="android-targetSdkVersion" value="33" />
    <preference name="android-minSdkVersion" value="22" />
</platform>
```

### 3. 构建输出
成功构建后，APK文件位置：
```
platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

## 注意事项（踩坑记录）

1. **代理设置**
   - 单独设置`gradle.properties`可能不够，需要同时设置系统环境变量
   - 使用批处理文件可以确保所有必要的代理设置都已配置
   - 确保代理服务器支持HTTPS协议

2. **SDK版本**
   - androidx库对SDK版本要求较高，需要及时更新compileSdkVersion
   - 更新compileSdkVersion不会影响应用的最低支持版本(minSdkVersion)
   - targetSdkVersion建议与compileSdkVersion保持一致

3. **Gradle配置**
   - 注意Gradle版本兼容性
   - 当前项目使用Gradle 8.7，但有些特性在Gradle 9.0中将被废弃
   - RenderScript API已被废弃，将在Android Gradle plugin 9.0中移除

4. **构建性能**
   - 首次构建时间较长，因为需要下载所有依赖
   - 使用`cordova clean`命令可以清理缓存，解决一些构建问题
   - 代理可能会影响构建速度，建议使用稳定的代理服务器

## 常用命令

```bash
# 清理项目
cordova clean

# 构建debug版本
cordova build android

# 构建release版本（需要签名配置）
cordova build android --release

# 使用代理构建（Windows）
build-with-proxy.bat
```

## 故障排除

如果遇到构建问题，可以尝试以下步骤：

1. 清理项目：`cordova clean`
2. 删除平台后重新添加：
   ```bash
   cordova platform remove android
   cordova platform add android
   ```
3. 检查代理设置是否正确
4. 确认SDK版本配置
5. 查看详细构建日志：`cordova build android --verbose`
