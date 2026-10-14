# 云笺听雨构建经验与标准化工作流

验证日期：2026-10-14。适用于此仓库的 React/Vite 本地手机界面、Android WebView 壳与内置 Via 合并构建；适合源码审查后生成独立版候选包、导出UI、验收原签名覆盖安装。它不是通用 Gradle 工程教程，也不适用于随意替换 Via 二进制或改包名的迁移。

## 1. 使用方法与输入

准备完整源码、原独立版签名目录、旧版独立APK、Node >=22.13、Python、完整JDK、Android platform35/Build Tools35.0.0、Apktool3.0.3、Chromium。本次实际 Node24.16.0、TS5.9.3、Vite8.0.13、JBR25.0.4。依赖版本由锁文件决定，不能用全局新版构建器代替。

Apktool SHA256 必须是 `dbf930b076c6b9be08d57c449cacefc3bdd6b71ebd59b3066fc0e1f5b14f9423`；Via原件由构建脚本固定校验。签名目录需包含 `cloudlet-release.p12` 与 `signing.json`，本独立版 alias为yunjian-v002，证书SHA256为 `6a597e2d26f69840694fb027d7a1c7a2a9df4376095e22a63994be9c9c09c8b1`。凭据由项目维护者现有安全渠道提供；不在源码或压缩包中携带，不生成替代证书。

在 Git checkout 根目录操作；若用源码ZIP，先 `git init`、`git add .`、创建本地基线提交，让清单和差异工具有明确基准（这不是远端历史）。首次依赖安装：进入 `outputs/mori-phone` 执行 `npm run install:ci`；`work/qa` 按其package-lock执行 `npm ci`，浏览器依赖按QA README准备。只复用锁文件完全一致的缓存，记录这不是全新安装。独立UI包自带另一份使用README。

## 2. 固定源码与审核边界

记录 main、每份草稿head、当前本地提交、工作区状态和PR原始需求。先比祖先关系，再看语义差异；保留主线更新的修复。每份草稿明确完整性、可用性、缺陷、构建影响和采纳/整合/暂缓，避免旧设置、旧schema或旧发布脚本倒退。

长任务继续时再次读取远端。此次最终基线 main32bd064、PR33/69a14f4；#28/#29/#30来自aa15e297的有序链。局部移植保留完整原文记忆和分段备份；旧稿不能整体覆盖。最终源码commit和APK SHA见随包build-result.json。

## 3. 本地验证门槛

从仓库根运行：

```powershell
python scripts/verify-delivery.py
python work/check-release.py
node outputs/mori-phone/scripts/verify-media.mjs
node outputs/mori-phone/scripts/verify-p0.mjs
node outputs/mori-phone/node_modules/vite/bin/vite.js build --config outputs/mori-phone/android-web/vite.config.ts --outDir ../../../work/feature-build
$env:FEATURE_BUILD_DIR=(Resolve-Path work/feature-build).Path
python work/verify-apk-assets.py
node work/qa/features.mjs
node work/qa/connection-ui.mjs
node work/qa/roleplay.mjs
node work/qa/card-library.mjs
node work/qa/p0-reliability.mjs
node work/qa/storage.mjs
node work/qa/p0-storage-scale.mjs
node work/qa/reference-sky.mjs
node work/qa/save-recovery.mjs
node work/qa/visual-cleanup.mjs
node work/qa/draft-ui.mjs
node work/qa/media-save-retry.mjs
```

每步检查退出码，失败后停止依赖该结果的步骤；不要让后续成功掩盖前一步失败。浏览器脚本会写生成报告/截图，收集到外部证据目录后恢复历史被跟踪报告，再同步最终源码清单。不要删除产品源码或用户文件。清单新增文件需先补 `sync-file-inventory.py` 描述、加入Git索引，再执行清单同步和verify-delivery。

重点用例：事务中止、重复保存失败与紧急备份；满额请求前状态全等；旧RC3带sourceDigest状态和无hash旧备份；新默认角色与旧多角色/群；完整原文的否定/条件/剧情；三主题、小屏/横屏、减少动态效果、真实图片解码。用合成数据，不因测试角色精简而删除旧数据断言。

## 4. Windows ASCII暂存与版本设置

已知 aapt2 对中文输出路径会失败；用ASCII物理目录暂存原生工程，SDK也使用可访问的ASCII路径。下例在源码根执行，路径需替换为本机真实安装路径。`$apkStage` 必须是本任务新建目录；已存在时检查归属并选择新目录，不递归删除未知位置。

```powershell
$apkStage='D:\CodexBuild\work\yunjian-candidate-14'
if (Test-Path -LiteralPath $apkStage) { throw '请检查归属并换一个新暂存目录' }
New-Item -ItemType Directory -Path $apkStage | Out-Null
Copy-Item -LiteralPath outputs/android -Destination "$apkStage/android" -Recurse
$env:YUNJIAN_STAGE=$apkStage
@'
import os, pathlib, xml.etree.ElementTree as ET
p=pathlib.Path(os.environ['YUNJIAN_STAGE'])/'android/AndroidManifest.xml'
t=ET.parse(p); n='{http://schemas.android.com/apk/res/android}'
assert t.getroot().get(n+'versionCode')=='8'
t.getroot().set(n+'versionCode','14')
t.getroot().set(n+'versionName','0.0.3.2')
t.write(p,encoding='utf-8',xml_declaration=True)
'@ | python -
```

源码模板保留0.0.2/code8是为了历史交付校验；候选暂存覆盖为0.0.3.2/code14。后续版本必须大于所有已交付候选，且同步构建报告、工作流校验与升级脚本参数，不能重复用本例14作为未来版本。`--independent` 将最终包名设为chat.cloudlet.phone.v002；不要与非独立旧版chat.cloudlet.phone混淆。

## 5. 构建新鲜Vite图与签名APK

必须由最终源码构建，Vite配置需 `manifest:true`。不要把仓库历史 assets/web 当当前生产构建。构建脚本通过manifest递归收集动态模块、静态资源与许可；动态公共资源使用完整URL或明确清单，模板拼接不一定可发现。

```powershell
$sdkPath='D:\AndroidSDK'
$jdkPath='D:\IntelliJ IDEA 2026.2.2\jbr'
$keyPath='D:\Private\yunjian-v002-signing'
$apktoolPath='D:\Tools\apktool-3.0.3.jar'
$freshWeb=(Resolve-Path work/feature-build).Path
$publicSource=(Resolve-Path outputs/mori-phone/public).Path
python "$apkStage/android/build-apk.py" --sdk $sdkPath --java $jdkPath --independent --web-build $freshWeb --public-dir $publicSource --signing $keyPath --apktool $apktoolPath --output "$apkStage/yunjian-tingyu-0.0.3.2-integrated.apk"
```

无原签名时只能用 `--unsigned` 替代 `--signing ...` 做结构验证，不能将其作为可安装更新交付。本次保持javac --release8，遇本机JDK缺失支持后改用完整JBR通过，未修改编译契约。

## 6. 直接验收最终裁剪目录及APK

```powershell
$env:FEATURE_BUILD_DIR="$apkStage/android/build/assets/web"
node work/qa/apk-assets.mjs
node work/qa/draft-ui.mjs
& "$jdkPath/bin/java.exe" -jar "$sdkPath/build-tools/35.0.0/lib/apksigner.jar" verify --verbose --print-certs "$apkStage/yunjian-tingyu-0.0.3.2-integrated.apk"
& "$sdkPath/build-tools/35.0.0/zipalign.exe" -c 4 "$apkStage/yunjian-tingyu-0.0.3.2-integrated.apk"
& "$sdkPath/build-tools/35.0.0/aapt2.exe" dump badging "$apkStage/yunjian-tingyu-0.0.3.2-integrated.apk"
Get-FileHash -Algorithm SHA256 -LiteralPath "$apkStage/yunjian-tingyu-0.0.3.2-integrated.apk"
```

另用同一apksigner读取旧独立APK，逐字比较证书SHA256；检查包名、版本码、mark.via.phonev02 authority、CRC、重复ZIP条目、classes2.dex与本次D8输出、每个asset-report资源的字节和摘要。Via原DEX及其资源ID必须保留。此构建器已执行结构门槛；交付前再把最终APK抽取资源与浏览器被测build/assets/web逐文件核对，避免打错目录。

## 7. 覆盖升级和发布门槛

本次未完成新包覆盖安装。运行时验收须使用全新、可销毁模拟器，不卸载或清理旧版数据后假装升级；旧版先写合成纸条/草稿/多角色/群，`adb install -r` 同一包名的新APK，再核对内容、断网force-stop、冷启动。禁止将验收脚本指向含用户数据的设备：脚本可能清理已安装样本以初始化环境。

新包验收调用必须显式传入本次SHA和code，不能用脚本的历史rc2默认值：

```powershell
python work/qa/android-upgrade-smoke.py --old-apk 'D:\Samples\yunjian-tingyu-v0.0.2-standalone.apk' --new-apk "$apkStage/yunjian-tingyu-0.0.3.2-integrated.apk" --expected-sha256 '22d2225aa3f3dba11efa0fded5f0c5988bf28a52a315017711ff50b44abb4b6d' --expected-code 14 --output work/android-acceptance/evidence
```

上面的SHA只适用本次交付，重建后必须取新值。项目 `.github/workflows/build-agent-v003-candidate.yml` 已保留#30同次产物绑定并同步14/0.0.3.2；远端触发属于另一次操作，本轮没有触发。只有Verify、Package、Upgrade均成功且SHA一致，才能写“升级验收通过”。物理设备、真实Key/VPN和大容量备份内存仍需独立结果。

## 8. 导出、清单和交付

```powershell
python scripts/export-frontend.py --build work/feature-build --output 'D:\Deliveries\yunjian-frontend-ui.zip'
python scripts/sync-file-inventory.py
python scripts/verify-delivery.py
```

导出前提交最终源码，确保包内sourceCommit正确且工作区无产品改动；依赖驱动导出会改写独立UI package脚本与TS配置以便单独构建，原依赖锁保留。将预览按HTTP服务打开。验证ZIP CRC、逐文件摘要、UI独立typecheck/build和实际预览资源。完整源码用Git跟踪白名单归档，不带.git、node_modules、签名、口令、恢复材料或临时QA目录；历史APK可以保留，但明确其历史身份。

交付同时记录：源提交、草稿取舍、测试命令/退出码、APK包名/版本/证书/摘要、关键资源校验、未验收事项。校验证书完成后清理本任务临时私钥和恢复口令，保留公开证书摘要。此流程追求可核对的结果；不承诺不同JDK或构建时间下APK字节必然一致。
