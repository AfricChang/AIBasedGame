# Game App

基于Cordova的游戏应用。

## 项目设置

1. 安装依赖：
```bash
npm install
```

2. 配置构建环境：
   - 复制 `gradle.properties.example` 到 `gradle.properties` 并设置你的配置
   - 复制 `build-with-proxy.bat.example` 到 `build-with-proxy.bat` 并设置你的代理（如果需要）

3. 添加平台：
```bash
cordova platform add android
```

## 构建说明

详细的构建说明请参考 [cordova-build-guide.md](cordova-build-guide.md)。

## 开发注意事项

1. 不要提交敏感信息
2. 使用模板文件（*.example）来共享配置结构
3. 遵循.gitignore规则
4. 在提交代码前检查是否包含敏感信息

## 目录结构

- `www/` - 源代码目录
- `platforms/` - 平台特定的构建文件（不提交）
- `plugins/` - Cordova插件（不提交）
- `config.xml` - Cordova配置文件
- `build.json` - 构建配置
