window.__ModuleLoader__.load({
  id: '@wangnanshan/dsh-nanshan-publish-manager',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'nanshan-publish-manager'
    const API = '/api/nanshan-publish-manager'
    const PANEL_ID = 'nanshan-publish-manager'
    const VERSION_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/
    let localeService = null
    let runtimeCtx = null

    const DICTIONARIES = {
      zh: {
        'nav.title': '【南山】DSH发布Npm助手',
        'page.title': '【南山】DSH发布Npm助手',
        'page.subtitle': '把本机 DSH 组件按官方 npm 形式发布：配置、预检查、发布与记录。',
        'page.footnote': '官方发布形式：npm 包 + cordis.patch.yml（dsh.bundle）+ dsh.client。发布后，其他人可以在 DSH 插件页安装这个包名，组件就能直接使用。',
        'page.npmMissing': '没有找到 npm：请先安装 Node.js / npm，再刷新本页。',
        'action.refresh': '刷新',
        'action.refreshing': '刷新中…',
        'action.add': '添加组件',
        'action.adding': '选择中…',
        'action.back': '返回清单',
        'action.runChecks': '发布预检查',
        'action.runningChecks': '预检查中…',
        'action.saveSettings': '保存设置',
        'action.saving': '保存中…',
        'action.dryRun': '仅演练',
        'action.dryRunning': '演练中…',
        'action.publish': '正式发布',
        'action.publishTerminal': '采用终端发布（推荐）',
        'action.reconsider': '再想想',
        'action.terminalWaiting': '等待终端…',
        'action.publishing': '发布中…',
        'action.cancel': '再想想',
        'action.confirmPublish': '确认发布',
        'action.retry': '重试',
        'action.copy': '复制',
        'action.copied': '已复制',
        'list.title': '组件清单',
        'list.searchPlaceholder': '搜索组件名、包名或路径…',
        'list.filter.all': '全部',
        'list.filter.published': '已发布',
        'list.filter.pending': '待发布',
        'list.filter.unpublished': '未发布',
        'list.filter.attention': '需关注',
        'list.count': '共 {n} 个组件',
        'list.emptyTitle': '还没有发现组件',
        'list.emptyHint': '把组件放在当前工作区，或点「添加组件」选择组件目录。组件需要带有 dsh.bundle 或 dsh.client。',
        'list.errorTitle': '清单没有加载出来',
        'list.errorHint': '本机接口没有响应，刷新页面或重启 DSH 后再试。',
        'list.warnings': '扫描提示（{n}）',
        'list.scanned': '已检查 {n} 个目录',
        'card.version': '版本',
        'card.records': '{n} 条记录',
        'card.never': '还没有发布过',
        'card.lastPublish': '最近发布 v{version} · {time}',
        'card.open': '查看详情',
        'card.attention': '上次失败',
        'status.published': '已发布',
        'status.pending': '待发布',
        'status.unpublished': '未发布',
        'badge.bundle': 'Bundle',
        'badge.client': 'Client',
        'badge.host': 'Host',
        'badge.bundlePatch': '含 patch',
        'detail.records': '发布记录',
        'npmInfo.title': 'NPM信息查询',
        'npmInfo.open': 'NPM查看该组件',
        'npmInfo.hint': '在 npm 网站查看版本、README 与安装信息；未发布时可能显示 404。',
        'npmInfo.last7': '近 7 天下载',
        'npmInfo.chartLabel': '近 7 天每日下载量柱形图',
        'npmInfo.loading': '查询中…',
        'npmInfo.empty': '暂无下载数据（新包或未发布）',
        'npmInfo.unavailable': '下载数据暂时不可用',
        'npmInfo.source': '数据来源：npm downloads API',
        'detail.synopsis': '发布状态',
        'detail.noRecords': '还没有发布记录',
        'detail.noRecordsHint': '完成第一次演练或正式发布后，记录会按时间出现在这里。',
        'section.version.title': '版本与标签',
        'section.version.subtitle': '决定这次发布的版本号、npm tag 与可见范围。',
        'section.target.title': '发布目标与选项',
        'section.target.subtitle': '选择 registry，配置预检查、构建与版本号写入方式。',
        'section.checks.title': '发布预检查',
        'section.checks.subtitle': '按官方 bundle 形式逐项预检查包清单、patch、入口、图标、locale 与打包内容。',
        'section.execute.title': '确认与执行',
        'section.execute.subtitle': '先确认发布摘要，再决定演练还是正式发布。',
        'field.currentVersion': '当前版本',
        'field.targetVersion': '目标版本',
        'field.registry': 'npm registry',
        'field.tag': 'npm tag',
        'field.access': '可见范围',
        'field.buildScript': '构建脚本',
        'field.note': '发布备注',
        'field.otp': '一次性密码 OTP',
        'hint.targetVersion': '正式发布会把版本号写回 package.json；演练不会修改文件，已发布的版本也不能被覆盖。',
        'hint.versionWillUpdate': '正式发布前会把 package.json 的版本改为 {version}；演练只临时使用。',
        'hint.versionSame': '目标版本与当前一致；首次发布可以直接使用。',
        'hint.registry': 'npm 会使用你自己的登录配置；这里不需要填写 token。',
        'hint.buildScript': '可选：填写 package.json 中的脚本名（例如 build），发布前先执行。',
        'hint.note': '写进发布记录，例如本次更新内容或发布原因。',
        'hint.otp': 'npm 要求 2FA 时填写；每次发布尝试都需要新的验证码，不要求时可留空。',
        'hint.otpFinal': 'OTP 只在点击「正式发布」后的确认弹窗中填写。',
        'hint.currentPrivate': '当前 package.json 标记了 private，发布前需要移除。',
        'hint.prereleaseTag': '目标版本是预发布版本，建议把 npm tag 改为 beta / next，而不是 latest。',
        'access.unscoped': '无作用域包只能发布为 public。',
        'bump.patch': '修订 +',
        'bump.minor': '次版本 +',
        'bump.major': '主版本 +',
        'toggle.dryRunFirst': '发布前先演练',
        'toggle.dryRunFirst.hint': '正式发布前建议先跑一次 npm publish --dry-run。',
        'toggle.requireChecks': '自动运行发布预检查',
        'toggle.requireChecks.hint': '发布预检查有阻断项时服务端会拒绝发布。',
        'toggle.writeVersion': '自动写入版本号',
        'toggle.writeVersion.hint': '目标版本与 package.json 不一致时自动修改。',
        'checks.summary': '{pass} 通过 · {warn} 提醒 · {fail} 阻断',
        'checks.ranAt': '预检查于 {time}',
        'checks.notRun': '还没运行发布预检查',
        'checks.none': '没有预检查项',
        'execute.modePublish': '正式发布',
        'execute.dryFirstNote': '建议先演练',
        'execute.confirmLabel': '我确认这是要发布出去的版本',
        'execute.confirmHint': '发布后 registry 上的版本不可撤回，只能发布更高版本。',
        'execute.needChecks': '先运行一次发布预检查',
        'execute.blockedHint': '预检查有阻断项，先处理后再发布',
        'execute.authHint': 'npm 未登录：先在终端执行 npm login，再重新运行发布预检查',
        'execute.invalidVersion': '目标版本号不合法',
        'execute.needConfirm': '请先勾选确认',
        'execute.resultTitle': '本次操作输出',
        'execute.resultOk': '成功',
        'execute.resultFail': '失败',
        'execute.outputEmpty': '没有输出',
        'execute.allowDisabled': '当前插件配置禁止正式发布，演练仍可用。',
        'auth.title': '发布验证方式',
        'auth.legacyNotice': 'npm 已于 2025-12-09 永久撤销经典 Token。这里只提供当前仍受支持的三种发布验证方式：2 小时本机登录会话（发布强制 2FA）、Granular Access Token、OIDC 可信发布。',
        'auth.session.title': '本机登录会话',
        'auth.session.desc': '2 小时本机登录会话，发布时按需 OTP。',
        'auth.session.badge': '默认',
        'auth.token.title': '细粒度令牌',
        'auth.token.desc': '一次性 Granular Token，建议开启 Bypass 2FA。',
        'auth.token.badge': '自动化',
        'auth.oidc.title': 'OIDC 可信发布',
        'auth.oidc.desc': 'CI 自动换发短期令牌；本地不可用。',
        'auth.oidc.badge': 'CI',
        'auth.mode.session': '本机会话',
        'auth.mode.token': '细粒度令牌',
        'auth.mode.oidc': 'OIDC 可信发布',
        'auth.sessionUser': '本机会话已登录：{name}',
        'auth.sessionIdle': '运行发布预检查以确认本机会话状态',
        'auth.sessionSignedOut': 'npm 未登录：请在终端运行 npm login（2 小时会话）',
        'auth.sessionHint': '会话仅 2 小时有效；过期后请在终端运行 npm login（默认网页授权）再发布。页面 OTP 仅支持身份验证器 TOTP；安全密钥型 2FA 请在终端发布，或使用开启 Bypass 2FA 的令牌。',
        'auth.tokenUser': '令牌对应账号：{name}',
        'auth.tokenUnverified': '令牌已填写；发布预检查可验证账号（发布结果为准）',
        'auth.tokenHint': '只用于本次发布，不保存、不写日志；未开启 Bypass 2FA 时仍需 2FA，页面不会弹出浏览器。',
        'auth.tokenPlaceholder': '粘贴 npm_... 令牌',
        'auth.needToken': '请填写 Granular Access Token',
        'auth.oidcReady': 'OIDC 已就绪（{provider}）',
        'auth.oidcUnavailable': '当前环境未检测到 OIDC：本地 DSH 不可用，需在 CI 中发布。',
        'auth.oidcUnavailableShort': '当前环境没有 OIDC',
        'auth.oidcNotHere': '当前环境不可用',
        'auth.oidcProvider.github-actions': 'GitHub Actions',
        'auth.oidcProvider.gitlab': 'GitLab CI',
        'auth.oidcHint': 'npm 会在发布时用 CI 的 ID Token 自动换取短期发布令牌，无需在这里填写任何凭据。',
        'authInfo.flow': '发布流程',
        'authInfo.key': '关键信息',
        'authInfo.use': '使用此方式',
        'authInfo.session.title': '本机登录会话 + OTP',
        'authInfo.session.intro': '使用 npm login 创建的 2 小时会话发布；npm 在写入时强制 2FA。',
        'authInfo.session.step1': '在终端运行 npm login（默认网页授权），生成 2 小时会话。',
        'authInfo.session.step2': '在组件详情运行「发布预检查」，确认登录状态与包内容。',
        'authInfo.session.step3': '点击「正式发布」，在确认弹窗输入刚生成的 6 位 OTP。',
        'authInfo.session.step4': 'npm 通过 npm-otp 请求头把验证码发给 registry。',
        'authInfo.session.step5': '验证通过后发布；验证码一次性、约 30 秒有效。',
        'authInfo.session.key1': 'OTP 来源：npm 账号绑定的身份验证器 App。',
        'authInfo.session.key2': '在 npm Account Settings → Two-Factor Authentication 启用 2FA。',
        'authInfo.session.key3': 'OTP 通过环境变量 npm_config_otp 传递，不写命令/日志/记录。',
        'authInfo.session.key4': '安全密钥/网页型 2FA 无法在页面代填，请在终端发布或使用 Bypass 2FA 令牌。',
        'authInfo.session.key5': '适用：本机交互发布；会话过期后重新 npm login。',
        'authInfo.token.title': '细粒度访问令牌（Granular Access Token）',
        'authInfo.token.intro': '用一次性令牌发布，适合自动化或 2FA 不便交互的场景。',
        'authInfo.token.step1': '登录 npmjs.com → 头像 → Access Tokens → Generate New Token → Granular Access Token（或 npm token create）。',
        'authInfo.token.step2': '选择 Read and write，勾选目标包/作用域，设置有效期（写令牌最长 90 天）。',
        'authInfo.token.step3': '无人值守发布请开启 Bypass 2FA（npm token create --bypass-2fa）。',
        'authInfo.token.step4': '把令牌粘贴到「访问令牌」，运行「发布预检查」。',
        'authInfo.token.step5': '点击「正式发布」；插件写入权限 0600 的临时 npmrc，发布后立即删除。',
        'authInfo.token.key1': '是什么：npm 当前的细粒度访问令牌，替代已撤销的经典 Token。',
        'authInfo.token.key2': '权限：Read and write，仅限选中的包/作用域。',
        'authInfo.token.key3': 'Bypass 2FA：开启后不需要 OTP；未开启时 npm 会要求 2FA，插件不会弹出浏览器，请改用 Bypass 令牌或本机会话 + OTP。',
        'authInfo.token.key4': '存储：不保存、不写日志；临时 npmrc 发布后删除。',
        'authInfo.token.key5': '安全：泄露后立即在 npm 网站撤销。',
        'authInfo.oidc.title': 'OIDC 可信发布',
        'authInfo.oidc.intro': 'CI 用 OIDC ID Token 自动换发短期令牌，无需长期 Token。',
        'authInfo.oidc.step1': '在 npm 包的 Settings → Trusted Publisher 绑定仓库/工作流。',
        'authInfo.oidc.step2': 'GitHub Actions 给 job 配置 permissions: id-token: write。',
        'authInfo.oidc.step3': 'GitLab CI 配置 NPM_ID_TOKEN 的 id_tokens，audience 为 npm:registry.npmjs.org。',
        'authInfo.oidc.step4': '在 CI 中运行发布，npm 自动交换短期令牌。',
        'authInfo.oidc.step5': '本地 DSH 没有 OIDC 环境，该方式显示为不可用。',
        'authInfo.oidc.key1': '来源：CI 的 OIDC ID Token。',
        'authInfo.oidc.key2': '不需要长期 Token 或 OTP；npm 自动管理。',
        'authInfo.oidc.key3': '需要 npm 包配置 Trusted Publisher，且 CI 身份匹配。',
        'authInfo.oidc.key4': '适用：GitHub Actions / GitLab CI。',
        'authInfo.oidc.key5': '本地 DSH 不可用。',
        'auth.session.infoButton': '会话说明',
        'auth.token.infoButton': '令牌说明',
        'auth.oidc.infoButton': 'OIDC 说明',
        'auth.legacyShort': '只提供当前可用的三种验证方式；经典 Token 已于 2025-12-09 撤销。',
        'action.close': '关闭',
        'source.auth': '来源：你的选择；默认复用本机 npm login 的 2 小时会话。',
        'source.session': '来源：本机 npm login 会话（~/.npmrc）；这里不需要粘贴令牌。',
        'source.otp': '来源：npm 账号绑定的身份验证器 App；在 npm 账号设置中启用 2FA。',
        'source.token': '来源：npm 网站 Access Tokens 或终端 npm token create；只用于本次发布。',
        'source.oidc': '来源：CI 的 OIDC ID Token；需在 npm 包设置中配置 Trusted Publisher。',
        'source.summary': '以上数据：包名与版本来自组件 package.json 和上方目标版本；registry 默认读取 ~/.npmrc；tag 与 access 来自「版本与标签」；验证方式与凭据来自本步骤。',
        'source.confirm': '来源：你的显式确认；仅对本次发布有效；修改版本、registry、tag、access 或验证方式后会重置。',
        'help.token.title': 'Granular Access Token 是什么？从哪里获取？',
        'help.token.what': 'npm 当前的细粒度访问令牌，用来替代已撤销的经典 Token。可以限定可访问的包/作用域、读写权限和有效期；写令牌最长 90 天。',
        'help.token.where': '获取：登录 npmjs.com → 头像菜单 → Access Tokens（或 Settings → Tokens）→ Generate New Token → Granular Access Token；也可以在终端运行 npm token create。',
        'help.token.permissions': '发布权限：选择 Read and write，勾选目标包或作用域；无人值守发布请开启 Bypass 2FA（网站勾选，或 npm token create --bypass-2fa）。',
        'help.token.usage': '本插件只用于这一次发布：写入权限 0600 的临时 npmrc，发布结束立即删除；不保存、不写日志。',
        'help.token.security': '不要把令牌粘贴到聊天或公开日志；如果泄露，请立刻在 npm 网站撤销。',
        'help.otp.title': 'OTP 从哪里来？',
        'help.otp.what': 'OTP 是你 npm 账号绑定的身份验证器 App（Google Authenticator、1Password、Microsoft Authenticator 等）生成的 6 位动态码。',
        'help.otp.enable': '在 npm 网站 Account Settings → Two-Factor Authentication 启用；每次发布挑战都需要新的码，一次性、约 30 秒有效。',
        'help.otp.usage': '验证码通过环境变量 npm_config_otp 交给 npm，不写命令或日志。',
        'help.otp.securityKey': '如果账号使用安全密钥/网页型 2FA，页面无法代填；请在终端执行 npm publish，或使用开启 Bypass 2FA 的 Granular Token。',
        'help.oidc.title': 'OIDC 可信发布如何配置？',
        'help.oidc.what': 'npm 在 CI 中用 OIDC ID Token 换发一次性发布令牌，不需要长期 Token。',
        'help.oidc.where': 'GitHub Actions：给 job 配置 permissions: id-token: write；GitLab CI：配置 NPM_ID_TOKEN 的 id_tokens，audience 为 npm:registry.npmjs.org。',
        'help.oidc.trusted': '然后在 npm 包的 Settings → Trusted Publisher 绑定仓库/工作流。本地 DSH 没有 OIDC 环境，无法使用。',
        'auth.showToken': '显示',
        'auth.hideToken': '隐藏',
        'modal.authNote': '验证方式：{mode}。凭据只用于本次发布，不会保存或写入记录。',
        'field.accessToken': '访问令牌',
        'check.token-format.label': 'Granular Token 已填写',
        'check.token-format.hint': '切到「细粒度令牌」后粘贴有效的 Granular Access Token；建议开启 Bypass 2FA。',
        'check.token-bypass.label': 'Bypass 2FA 状态',
        'check.token-bypass.hint': 'Bypass 2FA 是服务端令牌属性，令牌字符串本身不包含它；请确认创建时已勾选，否则发布时仍会被要求 2FA。',
        'check.oidc-env.label': 'OIDC 发布环境',
        'check.oidc-env.hint': 'OIDC 仅在 GitHub Actions（id-token: write）或 GitLab CI（NPM_ID_TOKEN）中可用。',
        'checkDetail.tokenUnverified': '令牌已提供，但 whoami 未通过；发布时以 registry 结果为准',
        'checkDetail.oidcAtPublish': 'OIDC 将在发布时自动交换令牌',
        'checkDetail.tokenEmpty': '未填写令牌',
        'checkDetail.tokenFilled': '已填写',
        'checkDetail.cannotDetect': '无法从令牌本身判断；请确认创建时已开启 Bypass 2FA',
        'checkDetail.oidcGithub': 'GitHub Actions 环境',
        'checkDetail.oidcGitlab': 'GitLab CI 环境',
        'checkDetail.oidcUnavailable': '未检测到 OIDC 环境',
        'modal.publishTitle': '真的要发布这一版吗？',
        'modal.publishBody': '将把 {name}@{version} 发布到 {registry}，发布后无法撤回。',
        'modal.publishWarning': '请确认版本号、tag 与可见范围都正确；公开包会立刻被其他人安装到。',
        'modal.dryFirstHint': '本次设置启用了「发布前先演练」，你还没有在本次会话里演练；确认后仍会直接正式发布。',
        'modal.publishOk': '确认发布',
        'modal.otpPublish': '采用 OTP 发布',
        'modal.otpHint': '请填写刚生成的验证码；一次性、约 30 秒有效。',
        'modal.terminalHint': '推荐用系统终端发布：npm 会在终端里询问 OTP 或打开浏览器完成 2FA，插件等待结果并写入记录。也可以填写上方 OTP，改用「采用 OTP 发布」。',
        'modal.buildBeforeOtp': '当前配置了构建脚本：发布前会先执行构建，耗时较长时验证码可能过期；建议使用开启 Bypass 2FA 的 Granular Token。',
        'toast.settingsSaved': '发布设置已保存',
        'toast.checkDone': '预检查完成',
        'toast.publishOk': '发布成功，记录已写入',
        'toast.publishFail': '发布没有完成',
        'error.publishTitle': '发布失败',
        'error.dryTitle': '演练失败',
        'error.terminalTitle': '终端发布失败',
        'error.terminalHint': '如果终端已打开，请查看完整输出；若未打开，请检查系统终端设置后重试。',
        'error.checkTitle': '发布预检查失败',
        'error.saveTitle': '保存设置失败',
        'error.publishHint': '完整命令输出见发布板块下方的结果区域。',
        'toast.dryOk': '演练完成，包内容可以发布',
        'toast.dryFail': '演练失败，请查看输出',
        'toast.added': '已添加组件目录',
        'toast.copied': '已复制',
        'record.mode.publish': '发布',
        'record.mode.dry': '演练',
        'record.ok': '成功',
        'record.fail': '失败',
        'record.showLog': '查看输出（{n}）',
        'record.hideLog': '收起输出',
        'record.otp': '含 OTP',
        'record.terminal': '终端',
        'stage.build': '构建阶段',
        'stage.checks': '预检查阶段',
        'stage.publish': '发布阶段',
        'synopsis.package': '包名',
        'synopsis.version': '版本',
        'synopsis.records': '记录',
        'synopsis.lastPublish': '最近发布',
        'synopsis.npm': 'npm 状态',
        'synopsis.npmUser': '已登录 {name}',
        'synopsis.npmUnknown': '未确认登录状态',
        'synopsis.npmIdle': '运行发布预检查后确认',
        'synopsis.never': '尚未发布',
        'common.loading': '加载中…',
        'common.error': '出错了',
        'common.retry': '重试',
        'common.noDescription': '这个组件还没有写描述。',
        'common.unknown': '未知',
        'check.manifest.label': 'package.json 可读',
        'check.name.label': '包名符合 npm 规范',
        'check.name.hint': '包名只能使用小写字母、数字和 - . _ ~，作用域包需要 @scope/name 形式。',
        'check.version.label': '版本号符合语义化版本',
        'check.version.hint': '版本号应形如 1.2.3 或 1.3.0-beta.1。',
        'check.private.label': '未标记 private',
        'check.private.hint': '发布前移除 package.json 里的 "private": true。',
        'check.description.label': '包含描述',
        'check.description.hint': 'description 会显示在 npm 与插件页上。',
        'check.license.label': '声明许可证',
        'check.license.hint': '发布公开包前请补充 license 字段。',
        'check.name-scope.label': '使用可发布的作用域',
        'check.name-scope.hint': '@local 只是本机占位作用域；发布前改成你自己的 npm 作用域，或使用无作用域包名。',
        'check.patch-file.label': 'bundle patch 文件存在',
        'check.patch-file.hint': 'dsh.bundle.patch 应指向存在的 cordis.patch.yml，并确保它会被打包。',
        'check.patch-row.label': 'patch 的 name 与包名一致',
        'check.patch-row.hint': 'patch 中 insert 的 name 必须等于 package.json 的 name。',
        'check.client-entry.label': 'dsh.client 入口存在',
        'check.client-entry.hint': '声明了 dsh.client 时，client.js 入口必须存在并被打包。',
        'check.exports-locale.label': '导出 locale 资源',
        'check.exports-locale.hint': '在 exports 中导出 ./locale/*.json，插件管理器才能读取标题和描述。',
        'check.exports-icon.label': '导出图标',
        'check.exports-icon.hint': '在 exports 中导出 ./icon，插件列表会显示这个图标。',
        'check.files.label': 'files 覆盖运行文件',
        'check.files.hint': '把 index.js、client.js、cordis.patch.yml、图标与 locale 加入 files。',
        'check.icon.label': '图标有效',
        'check.icon.hint': '使用 SVG / PNG / JPEG / WebP 图标，且不超过 256 KiB。',
        'check.locale-meta.label': 'locale 包含标题与描述',
        'check.locale-meta.hint': '在 locale/zh.json 与 locale/en.json 写入 meta.title 和 meta.description。',
        'check.readme.label': '包含 README',
        'check.readme.hint': '添加 README.md，说明安装、使用方式与发布说明。',
        'check.npm-cli.label': '找到 npm',
        'check.npm-cli.hint': '安装 Node.js / npm 后重新运行发布预检查。',
        'check.npm-auth.label': 'npm 身份验证',
        'check.npm-auth.hint': '本机会话需要 npm login；令牌需要有效；OIDC 在发布时自动交换。',
        'check.registry.label': 'registry 可访问',
        'check.registry.hint': '检查网络、registry 地址与代理设置；首次发布时 404 属于正常。',
        'check.version-free.label': '目标版本未被占用',
        'check.version-free.hint': '已发布的版本不能被覆盖，请提升版本号。',
        'check.version-order.label': '版本高于已发布版本',
        'check.version-order.hint': '通常应发布比最新版更高的版本，除非你有意发布旧版本线。',
        'check.prerelease-tag.label': '预发布版本使用非 latest tag',
        'check.prerelease-tag.hint': '预发布版本建议使用 beta / next 等 tag，避免覆盖正式版的 latest。',
        'check.pack-files.label': 'npm 打包内容完整',
        'check.pack-files.hint': '检查 files 与 .npmignore，确保运行文件和资源都会进入 npm 包。',
        'check.build-script.label': '构建脚本存在',
        'check.build-script.hint': '在 package.json 的 scripts 中添加该脚本，或清空构建脚本设置。',
        'checkDetail.newPackage': '首次发布：registry 上还没有这个包',
        'checkDetail.notLoggedIn': '未登录：先在终端执行 npm login',
        'checkDetail.loggedInAs': '已登录：{name}',
        'checkDetail.emptyList': 'npm pack 没有返回文件列表',
      },
      en: {
        'nav.title': 'Nanshan DSH npm publish assistant',
        'page.title': 'Nanshan DSH npm publish assistant',
        'page.subtitle': 'Publish local DSH components the official npm way: configure, pre-check, publish, and record.',
        'page.footnote': 'Official bundle form: an npm package with cordis.patch.yml (dsh.bundle) and dsh.client. Once published, anyone can install the package from the DSH plugin page.',
        'page.npmMissing': 'npm was not found. Install Node.js / npm, then refresh this page.',
        'action.refresh': 'Refresh',
        'action.refreshing': 'Refreshing…',
        'action.add': 'Add component',
        'action.adding': 'Choosing…',
        'action.back': 'Back to list',
        'action.runChecks': 'Publish pre-check',
        'action.runningChecks': 'Pre-checking…',
        'action.saveSettings': 'Save settings',
        'action.saving': 'Saving…',
        'action.dryRun': 'Dry run',
        'action.dryRunning': 'Dry running…',
        'action.publish': 'Publish',
        'action.publishTerminal': 'Publish in terminal (recommended)',
        'action.reconsider': 'Reconsider',
        'action.terminalWaiting': 'Waiting for terminal…',
        'action.publishing': 'Publishing…',
        'action.cancel': 'Not yet',
        'action.confirmPublish': 'Publish now',
        'action.retry': 'Retry',
        'action.copy': 'Copy',
        'action.copied': 'Copied',
        'list.title': 'Components',
        'list.searchPlaceholder': 'Search title, package name, or path…',
        'list.filter.all': 'All',
        'list.filter.published': 'Published',
        'list.filter.pending': 'Pending',
        'list.filter.unpublished': 'Unpublished',
        'list.filter.attention': 'Needs attention',
        'list.count': '{n} components',
        'list.emptyTitle': 'No components found yet',
        'list.emptyHint': 'Keep components in this workspace, or use “Add component” to choose a directory. A component needs dsh.bundle or dsh.client.',
        'list.errorTitle': 'The list did not load',
        'list.errorHint': 'The local endpoint did not answer. Refresh the page or restart DSH.',
        'list.warnings': 'Scan notes ({n})',
        'list.scanned': 'Checked {n} directories',
        'card.version': 'Version',
        'card.records': '{n} records',
        'card.never': 'Never published',
        'card.lastPublish': 'Last publish v{version} · {time}',
        'card.open': 'Details',
        'card.attention': 'Last attempt failed',
        'status.published': 'Published',
        'status.pending': 'Pending',
        'status.unpublished': 'Unpublished',
        'badge.bundle': 'Bundle',
        'badge.client': 'Client',
        'badge.host': 'Host',
        'badge.bundlePatch': 'patch',
        'detail.records': 'Publish history',
        'npmInfo.title': 'npm information',
        'npmInfo.open': 'View this component on npm',
        'npmInfo.hint': 'View versions, README and install info on npm; a 404 means it is not published yet.',
        'npmInfo.last7': 'Downloads · last 7 days',
        'npmInfo.chartLabel': 'Daily downloads over the last 7 days',
        'npmInfo.loading': 'Loading…',
        'npmInfo.empty': 'No download data yet (new or unpublished package)',
        'npmInfo.unavailable': 'Download data is temporarily unavailable',
        'npmInfo.source': 'Source: npm downloads API',
        'detail.synopsis': 'Release status',
        'detail.noRecords': 'No publish records yet',
        'detail.noRecordsHint': 'After the first dry run or publish, entries appear here in order.',
        'section.version.title': 'Version and tag',
        'section.version.subtitle': 'Choose the version, npm tag, and visibility for this release.',
        'section.target.title': 'Target and options',
        'section.target.subtitle': 'Pick a registry and configure the pre-check, build, and version writing.',
        'section.checks.title': 'Publish pre-check',
        'section.checks.subtitle': 'Pre-check the manifest, patch, entry, icon, locale, and packed contents against the official bundle form.',
        'section.execute.title': 'Confirm and run',
        'section.execute.subtitle': 'Review the summary, then dry run or publish.',
        'field.currentVersion': 'Current version',
        'field.targetVersion': 'Target version',
        'field.registry': 'npm registry',
        'field.tag': 'npm tag',
        'field.access': 'Access',
        'field.buildScript': 'Build script',
        'field.note': 'Release note',
        'field.otp': 'One-time password',
        'hint.targetVersion': 'A real publish writes the version back to package.json; a dry run leaves files untouched, and published versions cannot be reused.',
        'hint.versionWillUpdate': 'A real publish sets package.json to {version}; a dry run only uses it temporarily.',
        'hint.versionSame': 'Same as the current version; fine for a first publish.',
        'hint.registry': 'npm uses your own login configuration; no token is entered here.',
        'hint.buildScript': 'Optional: a script name from package.json (for example build) to run first.',
        'hint.note': 'Stored with the record, for example what changed in this release.',
        'hint.otp': 'Fill when npm requires 2FA; each publish attempt needs a fresh code; leave empty when not required.',
        'hint.otpFinal': 'The OTP is entered only in the confirmation dialog after you click Publish.',
        'hint.currentPrivate': 'package.json is marked private and must be changed before publishing.',
        'hint.prereleaseTag': 'The target version is a prerelease; prefer a beta/next npm tag instead of latest.',
        'access.unscoped': 'Unscoped packages can only be published as public.',
        'bump.patch': 'Patch +',
        'bump.minor': 'Minor +',
        'bump.major': 'Major +',
        'toggle.dryRunFirst': 'Dry run first',
        'toggle.dryRunFirst.hint': 'It is wise to run npm publish --dry-run before the real publish.',
        'toggle.requireChecks': 'Automatic publish pre-check',
        'toggle.requireChecks.hint': 'The server refuses to publish while a blocking pre-check fails.',
        'toggle.writeVersion': 'Write the version',
        'toggle.writeVersion.hint': 'Update package.json when the target version differs.',
        'checks.summary': '{pass} passed · {warn} warnings · {fail} blocking',
        'checks.ranAt': 'Pre-checked at {time}',
        'checks.notRun': 'The publish pre-check has not run yet',
        'checks.none': 'No pre-check items',
        'execute.modePublish': 'Publish',
        'execute.dryFirstNote': 'dry run recommended',
        'execute.confirmLabel': 'I confirm this version should be published',
        'execute.confirmHint': 'A published version cannot be withdrawn from the registry; publish a higher version instead.',
        'execute.needChecks': 'Run the publish pre-check first',
        'execute.blockedHint': 'Blocking pre-checks must be fixed first',
        'execute.authHint': 'npm is not signed in: run npm login in a terminal, then run the publish pre-check again',
        'execute.invalidVersion': 'The target version is not valid',
        'execute.needConfirm': 'Tick the confirmation first',
        'execute.resultTitle': 'Output of this run',
        'execute.resultOk': 'Succeeded',
        'execute.resultFail': 'Failed',
        'execute.outputEmpty': 'No output',
        'execute.allowDisabled': 'Publishing is disabled by this plugin’s configuration; dry runs still work.',
        'auth.title': 'Publish authentication',
        'auth.legacyNotice': 'npm permanently revoked classic tokens on 2025-12-09. Only the currently supported forms are offered here: two-hour local login sessions (2FA enforced for writes), granular access tokens, and OIDC trusted publishing.',
        'auth.session.title': 'Local login session',
        'auth.session.desc': 'Two-hour local login session; OTP as needed at publish time.',
        'auth.session.badge': 'Default',
        'auth.token.title': 'Granular token',
        'auth.token.desc': 'One-off granular token; Bypass 2FA recommended.',
        'auth.token.badge': 'Automation',
        'auth.oidc.title': 'OIDC trusted publishing',
        'auth.oidc.desc': 'CI exchanges a short-lived token; unavailable locally.',
        'auth.oidc.badge': 'CI',
        'auth.mode.session': 'Local session',
        'auth.mode.token': 'Granular token',
        'auth.mode.oidc': 'OIDC trusted publishing',
        'auth.sessionUser': 'Signed in with the local session: {name}',
        'auth.sessionIdle': 'Run the publish pre-check to confirm the local session',
        'auth.sessionSignedOut': 'npm is not signed in: run npm login in a terminal (two-hour session)',
        'auth.sessionHint': 'Sessions last two hours; when expired, run npm login (web authorization by default) in a terminal. Page OTP supports authenticator TOTP only; security-key 2FA must publish from a terminal or use a token with Bypass 2FA.',
        'auth.tokenUser': 'Token account: {name}',
        'auth.tokenUnverified': 'Token provided; the publish pre-check can verify the account (the publish result is authoritative)',
        'auth.tokenHint': 'Used only for this publish; never saved or logged. Without Bypass 2FA, npm still requires 2FA and this page does not open a browser.',
        'auth.tokenPlaceholder': 'Paste an npm_... token',
        'auth.needToken': 'Enter a granular access token',
        'auth.oidcReady': 'OIDC ready ({provider})',
        'auth.oidcUnavailable': 'No OIDC in this environment: local DSH cannot use it; publish from CI instead.',
        'auth.oidcUnavailableShort': 'No OIDC in this environment',
        'auth.oidcNotHere': 'Unavailable here',
        'auth.oidcProvider.github-actions': 'GitHub Actions',
        'auth.oidcProvider.gitlab': 'GitLab CI',
        'auth.oidcHint': 'npm exchanges the CI ID token for a short-lived publish token automatically; no credential is entered here.',
        'authInfo.flow': 'Publish flow',
        'authInfo.key': 'Key facts',
        'authInfo.use': 'Use this method',
        'authInfo.session.title': 'Local login session + OTP',
        'authInfo.session.intro': 'Publish with the two-hour session from npm login; npm enforces 2FA for writes.',
        'authInfo.session.step1': 'Run npm login in a terminal (web authorization by default) to create a two-hour session.',
        'authInfo.session.step2': 'Run Publish pre-check in the component to confirm the session and package contents.',
        'authInfo.session.step3': 'Click Publish and enter a freshly generated 6-digit OTP in the confirmation dialog.',
        'authInfo.session.step4': 'npm sends the code to the registry in the npm-otp request header.',
        'authInfo.session.step5': 'After validation the package is published; codes are single-use and last about 30 seconds.',
        'authInfo.session.key1': 'OTP source: the authenticator app bound to the npm account.',
        'authInfo.session.key2': 'Enable 2FA in npm Account Settings → Two-Factor Authentication.',
        'authInfo.session.key3': 'The OTP is passed through the npm_config_otp environment variable, never into commands, logs, or records.',
        'authInfo.session.key4': 'Security-key or web-based 2FA cannot be entered here; publish from a terminal or use a token with Bypass 2FA.',
        'authInfo.session.key5': 'Best for interactive local releases; run npm login again when the session expires.',
        'authInfo.token.title': 'Granular access token',
        'authInfo.token.intro': 'Publish with a one-off token, suited to automation or when interactive 2FA is inconvenient.',
        'authInfo.token.step1': 'Sign in at npmjs.com → avatar → Access Tokens → Generate New Token → Granular Access Token (or run npm token create).',
        'authInfo.token.step2': 'Choose Read and write, select the package/scope, and set an expiry (write tokens last up to 90 days).',
        'authInfo.token.step3': 'For unattended releases enable Bypass 2FA (npm token create --bypass-2fa).',
        'authInfo.token.step4': 'Paste the token into Access token and run Publish pre-check.',
        'authInfo.token.step5': 'Click Publish; the plugin writes a temporary npmrc with mode 0600 and deletes it right after the publish.',
        'authInfo.token.key1': 'What it is: npm’s current fine-grained token, replacing revoked classic tokens.',
        'authInfo.token.key2': 'Permissions: Read and write, limited to the selected package/scope.',
        'authInfo.token.key3': 'Bypass 2FA: no OTP once enabled; without it npm requires 2FA, and this plugin does not open a browser—use a Bypass token or the local session + OTP.',
        'authInfo.token.key4': 'Storage: never saved or logged; the temporary npmrc is removed after publishing.',
        'authInfo.token.key5': 'Security: revoke it on npmjs.com immediately if it leaks.',
        'authInfo.oidc.title': 'OIDC trusted publishing',
        'authInfo.oidc.intro': 'CI exchanges an OIDC ID token for a short-lived publish token, with no long-lived token.',
        'authInfo.oidc.step1': 'Bind the repository/workflow under the npm package Settings → Trusted Publisher.',
        'authInfo.oidc.step2': 'GitHub Actions: give the job permissions: id-token: write.',
        'authInfo.oidc.step3': 'GitLab CI: configure an NPM_ID_TOKEN id_token with the audience npm:registry.npmjs.org.',
        'authInfo.oidc.step4': 'Publish from CI; npm exchanges the short-lived token automatically.',
        'authInfo.oidc.step5': 'Local DSH has no OIDC environment, so this method is shown as unavailable.',
        'authInfo.oidc.key1': 'Source: the CI OIDC ID token.',
        'authInfo.oidc.key2': 'No long-lived token or OTP; npm manages the exchange.',
        'authInfo.oidc.key3': 'The npm package needs a Trusted Publisher and the CI identity must match.',
        'authInfo.oidc.key4': 'Best for GitHub Actions / GitLab CI.',
        'authInfo.oidc.key5': 'Unavailable in local DSH.',
        'auth.session.infoButton': 'Session guide',
        'auth.token.infoButton': 'Token guide',
        'auth.oidc.infoButton': 'OIDC guide',
        'auth.legacyShort': 'Only the three current methods are offered; classic tokens were revoked on 2025-12-09.',
        'action.close': 'Close',
        'source.auth': 'Source: your choice; the default reuses the two-hour npm login session on this machine.',
        'source.session': 'Source: the local npm login session (~/.npmrc); no token is pasted here.',
        'source.otp': 'Source: the authenticator app bound to the npm account; enable 2FA in the npm account settings.',
        'source.token': 'Source: npm Access Tokens or npm token create; used only for this publish.',
        'source.oidc': 'Source: the CI OIDC ID token; configure a Trusted Publisher in the npm package settings.',
        'source.summary': 'Where this comes from: package name and version from the component package.json and the target version above; registry defaults to ~/.npmrc; tag and access from Version and tag; authentication from this step.',
        'source.confirm': 'Source: your explicit confirmation; valid only for this publish and reset after changing version, registry, tag, access, or authentication.',
        'help.token.title': 'What is a Granular Access Token, and where do I get one?',
        'help.token.what': 'It is npm’s current fine-grained access token, replacing revoked classic tokens. It scopes packages/scopes, read/write permission, and expiry; write tokens last up to 90 days.',
        'help.token.where': 'Get one at npmjs.com → avatar menu → Access Tokens (or Settings → Tokens) → Generate New Token → Granular Access Token, or run npm token create in a terminal.',
        'help.token.permissions': 'For publishing choose Read and write and select the package or scope; for unattended releases enable Bypass 2FA (tick it on the website, or use npm token create --bypass-2fa).',
        'help.token.usage': 'This plugin uses it for one publish only: a temporary npmrc with mode 0600, deleted immediately afterwards; never saved or logged.',
        'help.token.security': 'Do not paste the token into chats or public logs; revoke it on npmjs.com immediately if it leaks.',
        'help.otp.title': 'Where does the OTP come from?',
        'help.otp.what': 'The OTP is the 6-digit code generated by the authenticator app bound to the npm account (Google Authenticator, 1Password, Microsoft Authenticator, and so on).',
        'help.otp.enable': 'Enable it in npm Account Settings → Two-Factor Authentication; every publish challenge needs a fresh code, single-use and valid for about 30 seconds.',
        'help.otp.usage': 'The code is passed to npm through the npm_config_otp environment variable, never into the command or logs.',
        'help.otp.securityKey': 'If the account uses a security key or web-based 2FA, this page cannot fill it in; publish from a terminal or use a Granular Access Token with Bypass 2FA.',
        'help.oidc.title': 'How do I configure OIDC trusted publishing?',
        'help.oidc.what': 'npm exchanges the CI OIDC ID token for a one-time publish token, so no long-lived token is needed.',
        'help.oidc.where': 'GitHub Actions: give the job permissions: id-token: write. GitLab CI: configure an NPM_ID_TOKEN id_token with the audience npm:registry.npmjs.org.',
        'help.oidc.trusted': 'Then bind the repository/workflow under the npm package Settings → Trusted Publisher. Local DSH has no OIDC environment, so it is unavailable here.',
        'auth.showToken': 'Show',
        'auth.hideToken': 'Hide',
        'modal.authNote': 'Authentication: {mode}. Credentials are used for this publish only and are never saved or recorded.',
        'field.accessToken': 'Access token',
        'check.token-format.label': 'Granular token provided',
        'check.token-format.hint': 'Select “Granular token” and paste a valid token; enabling Bypass 2FA is recommended.',
        'check.token-bypass.label': 'Bypass 2FA status',
        'check.token-bypass.hint': 'Bypass 2FA is server-side token metadata, not part of the token string; confirm it was enabled when the token was created, or npm will still require 2FA at publish.',
        'check.oidc-env.label': 'OIDC publish environment',
        'check.oidc-env.hint': 'OIDC works only in GitHub Actions (id-token: write) or GitLab CI (NPM_ID_TOKEN).',
        'checkDetail.tokenUnverified': 'Token provided, but whoami failed; the registry result at publish time is authoritative',
        'checkDetail.oidcAtPublish': 'OIDC exchanges its token automatically at publish time',
        'checkDetail.tokenEmpty': 'No token entered',
        'checkDetail.tokenFilled': 'Entered',
        'checkDetail.cannotDetect': 'Cannot be determined from the token itself; confirm Bypass 2FA was enabled at creation',
        'checkDetail.oidcGithub': 'GitHub Actions environment',
        'checkDetail.oidcGitlab': 'GitLab CI environment',
        'checkDetail.oidcUnavailable': 'No OIDC environment detected',
        'modal.publishTitle': 'Publish this version?',
        'modal.publishBody': '{name}@{version} will be published to {registry}; this cannot be undone.',
        'modal.publishWarning': 'Double-check the version, tag, and access. A public package becomes installable immediately.',
        'modal.dryFirstHint': '“Dry run first” is enabled but no dry run has happened in this session; confirming publishes directly.',
        'modal.publishOk': 'Publish',
        'modal.otpPublish': 'Publish with OTP',
        'modal.otpHint': 'Enter a freshly generated code; single-use and valid for about 30 seconds.',
        'modal.terminalHint': 'Recommended: publish in the system terminal. npm handles OTP or web 2FA there, and the plugin records the result. You can also enter an OTP above and use “Publish with OTP”.',
        'modal.buildBeforeOtp': 'A build script is configured: the build runs before publishing and may outlast the OTP; a Granular Access Token with Bypass 2FA is recommended.',
        'toast.settingsSaved': 'Release settings saved',
        'toast.checkDone': 'Pre-check finished',
        'toast.publishOk': 'Published; the record was saved',
        'toast.publishFail': 'The publish did not complete',
        'error.publishTitle': 'Publish failed',
        'error.dryTitle': 'Dry run failed',
        'error.terminalTitle': 'Terminal publish failed',
        'error.terminalHint': 'If the terminal opened, read its full output; otherwise check your system terminal setup and retry.',
        'error.checkTitle': 'Publish pre-check failed',
        'error.saveTitle': 'Could not save settings',
        'error.publishHint': 'The full command output is shown below in the publish result area.',
        'toast.dryOk': 'Dry run finished; the package can be published',
        'toast.dryFail': 'The dry run failed; see the output',
        'toast.added': 'Component directory added',
        'toast.copied': 'Copied',
        'record.mode.publish': 'Publish',
        'record.mode.dry': 'Dry run',
        'record.ok': 'OK',
        'record.fail': 'Failed',
        'record.showLog': 'Show output ({n})',
        'record.hideLog': 'Hide output',
        'record.otp': 'OTP sent',
        'record.terminal': 'Terminal',
        'stage.build': 'Build stage',
        'stage.checks': 'Pre-check stage',
        'stage.publish': 'Publish stage',
        'synopsis.package': 'Package',
        'synopsis.version': 'Version',
        'synopsis.records': 'Records',
        'synopsis.lastPublish': 'Last publish',
        'synopsis.npm': 'npm',
        'synopsis.npmUser': 'Signed in as {name}',
        'synopsis.npmUnknown': 'Login not confirmed',
        'synopsis.npmIdle': 'Confirm with the publish pre-check',
        'synopsis.never': 'Not published yet',
        'common.loading': 'Loading…',
        'common.error': 'Something went wrong',
        'common.retry': 'Retry',
        'common.noDescription': 'This component has no description yet.',
        'common.unknown': 'Unknown',
        'check.manifest.label': 'package.json is readable',
        'check.name.label': 'Package name is valid',
        'check.name.hint': 'Use lowercase letters, digits, and - . _ ~; scoped packages use @scope/name.',
        'check.version.label': 'Version is semver',
        'check.version.hint': 'Use a version such as 1.2.3 or 1.3.0-beta.1.',
        'check.private.label': 'Not marked private',
        'check.private.hint': 'Remove "private": true from package.json before publishing.',
        'check.description.label': 'Has a description',
        'check.description.hint': 'description appears on npm and in the plugin page.',
        'check.license.label': 'Declares a license',
        'check.license.hint': 'Add a license field before publishing a public package.',
        'check.name-scope.label': 'Publishable scope',
        'check.name-scope.hint': '@local is a local placeholder; use your own npm scope or an unscoped name before publishing.',
        'check.patch-file.label': 'Bundle patch exists',
        'check.patch-file.hint': 'dsh.bundle.patch must point at an existing cordis.patch.yml that is included in the package.',
        'check.patch-row.label': 'Patch row name matches',
        'check.patch-row.hint': 'The inserted row name must equal package.json name.',
        'check.client-entry.label': 'dsh.client entry exists',
        'check.client-entry.hint': 'When dsh.client is declared, client.js must exist and be packed.',
        'check.exports-locale.label': 'Exports locale resources',
        'check.exports-locale.hint': 'Export ./locale/*.json so the plugin manager can read title and description.',
        'check.exports-icon.label': 'Exports an icon',
        'check.exports-icon.hint': 'Export ./icon so the plugin list can show it.',
        'check.files.label': 'files covers runtime files',
        'check.files.hint': 'Add index.js, client.js, cordis.patch.yml, the icon, and locale files to files.',
        'check.icon.label': 'Icon is valid',
        'check.icon.hint': 'Use an SVG, PNG, JPEG, or WebP icon no larger than 256 KiB.',
        'check.locale-meta.label': 'Locale has title and description',
        'check.locale-meta.hint': 'Set meta.title and meta.description in locale/zh.json and locale/en.json.',
        'check.readme.label': 'Has a README',
        'check.readme.hint': 'Add README.md with install, usage, and release notes.',
        'check.npm-cli.label': 'npm found',
        'check.npm-cli.hint': 'Install Node.js / npm, then run the publish pre-check again.',
        'check.npm-auth.label': 'npm authentication',
        'check.npm-auth.hint': 'Local sessions need npm login; tokens must be valid; OIDC exchanges at publish time.',
        'check.registry.label': 'Registry reachable',
        'check.registry.hint': 'Check the network, registry URL, and proxy; a 404 on first publish is expected.',
        'check.version-free.label': 'Version is available',
        'check.version-free.hint': 'Published versions cannot be reused; raise the version.',
        'check.version-order.label': 'Version is above the latest',
        'check.version-order.hint': 'Publish a higher version unless you intentionally release an older line.',
        'check.prerelease-tag.label': 'Prerelease uses a non-latest tag',
        'check.prerelease-tag.hint': 'Prefer beta/next for prereleases so latest keeps pointing at the stable release.',
        'check.pack-files.label': 'Packed contents are complete',
        'check.pack-files.hint': 'Review files and .npmignore so runtime files and resources enter the npm package.',
        'check.build-script.label': 'Build script exists',
        'check.build-script.hint': 'Add the script to package.json scripts, or clear the build script setting.',
        'checkDetail.newPackage': 'First publish: the registry does not have this package',
        'checkDetail.notLoggedIn': 'Not signed in: run npm login in a terminal',
        'checkDetail.loggedInAs': 'Signed in as {name}',
        'checkDetail.emptyList': 'npm pack returned no file list',
      },
    }

    const STYLES = `.np{
  --np-ink:var(--dsw-alias-label-primary);
  --np-ink-soft:var(--dsw-alias-label-secondary);
  --np-paper:var(--dsw-alias-bg-base);
  --np-sheet:var(--dsw-alias-bg-layer-1);
  --np-sheet2:var(--dsw-alias-bg-layer-2);
  --np-line:var(--dsw-alias-border-l1);
  --np-line-strong:var(--dsw-alias-border-l2);
  --np-accent:var(--dsw-alias-brand-primary);
  --np-ok:var(--dsw-alias-state-success-primary);
  --np-warn:var(--dsw-alias-state-warn-primary);
  --np-bad:var(--dsw-alias-state-error-primary);
  --np-idle:var(--dsw-alias-state-idle-primary);
  --np-ring:0 0 0 3px color-mix(in srgb,var(--np-accent) 18%,transparent);
  --np-shadow:0 1px 2px rgba(16,24,40,.04),0 1px 3px rgba(16,24,40,.05);
  position:relative;height:100%;overflow-y:auto;color:var(--np-ink);font-family:inherit;-webkit-font-smoothing:antialiased;
  background-color:var(--np-paper);
  background-image:radial-gradient(1200px 420px at 50% -180px,var(--np-sheet2),transparent 70%);
}
.np *{box-sizing:border-box}
.np__inner{position:relative;max-width:1120px;margin:0 auto;padding:calc(var(--dsh-frame-top-clearance,0px) + 28px) 32px 64px}
.np__header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap}
.np__heading{display:flex;align-items:center;gap:12px;min-width:0}
.np__mark{flex:none;width:42px;height:42px;display:grid;place-items:center;background:transparent;border:0;box-shadow:none}
.np__mark svg{display:block;width:100%;height:100%}
.np-glass-mark{filter:drop-shadow(0 6px 14px rgba(0,0,0,.24))}
.np__titles{min-width:0}
.np__title{margin:0;font-size:23px;font-weight:600;line-height:1.25;letter-spacing:-.02em}
.np__subtitle{margin:4px 0 0;max-width:680px;font-size:13px;line-height:1.6;color:var(--np-ink-soft)}
.np__actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.np-btn{appearance:none;display:inline-flex;text-decoration:none;align-items:center;justify-content:center;gap:6px;height:32px;padding:0 12px;border:1px solid var(--np-line-strong);border-radius:8px;background:var(--np-sheet);color:var(--np-ink);font:inherit;font-size:13px;font-weight:500;line-height:1;cursor:pointer;box-shadow:var(--np-shadow);transition:background-color .14s ease,border-color .14s ease,color .14s ease,opacity .14s ease;white-space:nowrap}
.np-btn:hover:not(:disabled){background:var(--np-sheet2);border-color:var(--np-line-strong)}
.np-btn:active:not(:disabled){background:var(--np-sheet2)}
.np-btn:disabled{opacity:.45;cursor:not-allowed;box-shadow:none}
.np-btn:focus-visible{outline:2px solid var(--np-accent);outline-offset:2px}
.np-btn--primary{background:var(--np-ink);border-color:var(--np-ink);color:var(--np-paper)}
.np-btn--primary:hover:not(:disabled){background:var(--np-ink);border-color:var(--np-ink);opacity:.88}
.np-btn--danger{color:var(--np-bad);border-color:var(--np-line-strong)}
.np-btn--danger:hover:not(:disabled){background:color-mix(in srgb,var(--np-bad) 8%,transparent);border-color:color-mix(in srgb,var(--np-bad) 40%,var(--np-line-strong))}
.np-btn--ghost{border-color:transparent;background:transparent;box-shadow:none;color:var(--np-ink-soft)}
.np-btn--ghost:hover:not(:disabled){background:var(--np-sheet2);color:var(--np-ink)}
.np-btn--small{height:26px;padding:0 9px;font-size:12px;border-radius:6px}
.np-input,.np-select,.np-textarea{appearance:none;-webkit-appearance:none;width:100%;height:34px;padding:0 10px;border:1px solid var(--np-line-strong);border-radius:8px;background:var(--np-sheet);color:var(--np-ink);font:inherit;font-size:13px;line-height:1.4;box-shadow:none;transition:border-color .14s ease,box-shadow .14s ease}
.np-select{padding-right:28px;background-image:linear-gradient(45deg,transparent 50%,currentColor 50%),linear-gradient(135deg,currentColor 50%,transparent 50%);background-position:calc(100% - 15px) 55%,calc(100% - 10px) 55%;background-size:5px 5px,5px 5px;background-repeat:no-repeat;cursor:pointer}
.np-textarea{height:auto;min-height:76px;padding:8px 10px;line-height:1.55;resize:vertical}
.np-input:focus,.np-select:focus,.np-textarea:focus{outline:none;border-color:var(--np-accent);box-shadow:var(--np-ring)}
.np-input::placeholder,.np-textarea::placeholder{color:var(--np-ink-soft);opacity:.7}
.np-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11.5px;letter-spacing:0}
.np-list-title{margin:24px 0 0;font-size:13px;font-weight:600;line-height:1.3;color:var(--np-ink)}
.np-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px}
.np-search{position:relative;flex:1 1 240px;max-width:320px}
.np-search .np-ico{position:absolute;left:10px;top:50%;transform:translateY(-50%);display:block;color:var(--np-ink-soft);pointer-events:none}
.np-search .np-input{padding-left:30px}
.np-search .np-input::-webkit-search-decoration,.np-search .np-input::-webkit-search-cancel-button{-webkit-appearance:none;appearance:none}
.np-tabs{display:flex;gap:4px;flex-wrap:wrap}
.np-tab{appearance:none;height:28px;padding:0 10px;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--np-ink-soft);font:inherit;font-size:12.5px;font-weight:500;cursor:pointer;transition:background-color .14s ease,color .14s ease,border-color .14s ease}
.np-tab:hover{background:var(--np-sheet2);color:var(--np-ink)}
.np-tab.is-on{border-color:var(--np-line);background:var(--np-sheet);color:var(--np-ink);box-shadow:var(--np-shadow)}
.np-tab:focus-visible{outline:2px solid var(--np-accent);outline-offset:2px}
.np-toolbar__spacer{flex:1}
.np-count{font-size:12px;color:var(--np-ink-soft);font-variant-numeric:tabular-nums;white-space:nowrap}
.np-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin-top:16px}
.np-card{position:relative;display:flex;flex-direction:column;gap:10px;padding:16px;border:1px solid var(--np-line);border-radius:12px;background:var(--np-sheet);color:var(--np-ink);text-align:left;font:inherit;cursor:pointer;box-shadow:var(--np-shadow);transition:border-color .16s ease,box-shadow .16s ease,transform .16s ease}
.np-card:hover{border-color:var(--np-line-strong);box-shadow:0 4px 12px rgba(16,24,40,.06);transform:translateY(-1px)}
.np-card:active{transform:none}
.np-card:focus-visible{outline:2px solid var(--np-accent);outline-offset:2px}
.np-card__head{display:flex;align-items:flex-start;gap:11px}
.np-card__icon{flex:none;width:38px;height:38px;display:grid;place-items:center;border:0;background:transparent;overflow:visible}
.np-card__icon img{width:100%;height:100%;object-fit:contain;border-radius:9px;filter:drop-shadow(0 4px 10px rgba(0,0,0,.16))}
.np-card__titles{flex:1;min-width:0}
.np-card__title{display:block;font-size:14px;font-weight:600;line-height:1.4;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.np-card__name{display:block;margin-top:2px;color:var(--np-ink-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.np-card__desc{margin:0;height:38px;font-size:12.5px;line-height:1.55;color:var(--np-ink-soft);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.np-card__tags{display:flex;flex-wrap:wrap;gap:6px}
.np-card__foot{display:flex;align-items:center;gap:10px;margin-top:auto;padding-top:10px;border-top:1px solid var(--np-line);font-size:12px;color:var(--np-ink-soft)}
.np-card__version{flex:none;font-size:12.5px;font-weight:600;color:var(--np-ink);font-variant-numeric:tabular-nums}
.np-card__version-label{margin-right:4px;font-size:11px;font-weight:400;color:var(--np-ink-soft)}
.np-card__last{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.np-card__open{display:inline-flex;align-items:center;gap:4px;flex:none;font-size:12px;font-weight:500;color:var(--np-accent)}
.np-chip{display:inline-flex;align-items:center;gap:4px;height:20px;padding:0 7px;border:1px solid var(--np-line);border-radius:6px;background:transparent;font-size:11px;font-weight:500;line-height:1;color:var(--np-ink-soft);white-space:nowrap}
.np-chip--ok{color:var(--np-ok);border-color:color-mix(in srgb,var(--np-ok) 35%,var(--np-line));background:color-mix(in srgb,var(--np-ok) 7%,transparent)}
.np-chip--warn{color:var(--np-warn);border-color:color-mix(in srgb,var(--np-warn) 35%,var(--np-line));background:color-mix(in srgb,var(--np-warn) 7%,transparent)}
.np-chip--fail{color:var(--np-bad);border-color:color-mix(in srgb,var(--np-bad) 35%,var(--np-line));background:color-mix(in srgb,var(--np-bad) 7%,transparent)}
.np-chip--accent{color:var(--np-accent);border-color:color-mix(in srgb,var(--np-accent) 35%,var(--np-line));background:color-mix(in srgb,var(--np-accent) 7%,transparent)}
.np-status{display:inline-flex;align-items:center;gap:5px;flex:none;height:22px;padding:0 8px;border:1px solid var(--np-line);border-radius:999px;background:transparent;color:var(--np-ink-soft);font-size:11.5px;font-weight:500;line-height:1;white-space:nowrap}
.np-status--published{color:var(--np-ok);border-color:color-mix(in srgb,var(--np-ok) 30%,var(--np-line));background:color-mix(in srgb,var(--np-ok) 7%,transparent)}
.np-status--pending{color:var(--np-warn);border-color:color-mix(in srgb,var(--np-warn) 30%,var(--np-line));background:color-mix(in srgb,var(--np-warn) 7%,transparent)}
.np-status--unpublished{color:var(--np-ink-soft)}
.np-status__dot{width:6px;height:6px;border-radius:50%;background:currentColor}
.np-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:48px 20px;margin-top:16px;border:1px dashed var(--np-line-strong);border-radius:12px;text-align:center;color:var(--np-ink-soft);background:transparent}
.np-empty h3{margin:0;font-size:14px;font-weight:600;color:var(--np-ink)}
.np-empty p{margin:0;max-width:440px;font-size:12.5px;line-height:1.65}
.np-empty--small{padding:22px 14px;margin-top:8px;gap:6px}
.np-skeleton{height:168px;border:1px solid var(--np-line);border-radius:12px;background:linear-gradient(100deg,transparent 18%,var(--np-sheet2) 42%,transparent 66%);background-size:220% 100%;animation:np-shimmer 1.7s linear infinite}
.np-skeleton--wide{height:120px}
@keyframes np-shimmer{to{background-position:-220% 0}}
.np-warnbar{margin-top:12px;border:1px solid color-mix(in srgb,var(--np-warn) 35%,var(--np-line));border-radius:8px;background:color-mix(in srgb,var(--np-warn) 7%,transparent);padding:8px 11px;font-size:12px;line-height:1.6;color:var(--np-ink)}
.np-warnbar summary{cursor:pointer;font-weight:500;color:var(--np-warn)}
.np-warnbar ul{margin:6px 0 0;padding-left:18px;color:var(--np-ink-soft)}
.np-warnbar li{margin:2px 0;word-break:break-all}
.np-footnote{margin-top:18px;padding:10px 12px;border:1px solid var(--np-line);border-radius:8px;background:var(--np-sheet2);font-size:12px;line-height:1.6;color:var(--np-ink-soft)}
.np-detail__head{display:flex;flex-direction:column;gap:10px}
.np-identity{display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap}
.np-identity__icon{flex:none;width:48px;height:48px;display:grid;place-items:center;border:0;background:transparent;overflow:visible}
.np-identity__icon img{width:100%;height:100%;object-fit:contain;border-radius:10px;filter:drop-shadow(0 6px 14px rgba(0,0,0,.18))}
.np-identity__main{flex:1;min-width:220px}
.np-identity__title{margin:0;font-size:22px;font-weight:600;line-height:1.25;letter-spacing:-.02em}
.np-identity__meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:4px;font-size:12px;line-height:1.5;color:var(--np-ink-soft)}
.np-identity__actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.np-path{display:inline-flex;align-items:center;gap:5px;min-width:0;color:var(--np-ink-soft);word-break:break-all}
.np-detail__grid{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(320px,1fr);gap:20px;margin-top:20px;align-items:start}
.np-flow{display:flex;flex-direction:column;gap:14px;min-width:0}
.np-rail{display:flex;flex-direction:column;gap:12px;position:sticky;top:16px;min-width:0}
.np-rail-action{width:100%;justify-content:center;height:34px}
.np-section{position:relative;padding:18px;background:var(--np-sheet);border:1px solid var(--np-line);border-radius:12px;box-shadow:var(--np-shadow)}
.np-section__head{display:flex;align-items:flex-start;gap:10px;margin-bottom:14px}
.np-section__num{flex:none;width:24px;height:24px;display:grid;place-items:center;border:1px solid var(--np-line);border-radius:6px;background:var(--np-sheet2);font-size:11px;font-weight:600;color:var(--np-ink-soft);font-variant-numeric:tabular-nums}
.np-section__titles{flex:1;min-width:0}
.np-section__title{margin:0;font-size:14px;font-weight:600;line-height:1.4;letter-spacing:-.01em}
.np-section__hint{margin:2px 0 0;font-size:12px;line-height:1.55;color:var(--np-ink-soft)}
.np-section__body{display:flex;flex-direction:column;gap:12px}
.np-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.np-row--one{grid-template-columns:minmax(0,1fr)}
.np-field{display:flex;flex-direction:column;gap:6px;min-width:0}
.np-label{font-size:12px;font-weight:500;line-height:1.4;color:var(--np-ink)}
.np-hint{font-size:11.5px;line-height:1.55;color:var(--np-ink-soft)}
.np-hint--warn{color:var(--np-warn)}
.np-version-row{display:flex;align-items:flex-end;gap:8px;flex-wrap:wrap}
.np-version-row .np-field{flex:1 1 160px}
.np-bumps{display:flex;gap:4px;flex-wrap:wrap}
.np-current{display:inline-flex;align-items:center;min-height:34px;padding:0 10px;border:1px solid var(--np-line);border-radius:8px;background:var(--np-sheet2);font-size:13px;font-weight:500;color:var(--np-ink);font-variant-numeric:tabular-nums}
.np-toggles{display:flex;flex-direction:column;gap:2px}
.np-toggle{position:relative;display:flex;align-items:flex-start;gap:9px;padding:6px 0;cursor:pointer}
.np-toggle input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
.np-toggle__box{flex:none;position:relative;width:30px;height:18px;margin-top:1px;border-radius:999px;background:var(--np-line-strong);transition:background-color .16s ease}
.np-toggle__box::after{content:"";position:absolute;left:2px;top:2px;width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(16,24,40,.24);transition:transform .16s ease}
.np-toggle input:checked + .np-toggle__box{background:var(--np-accent)}
.np-toggle input:checked + .np-toggle__box::after{transform:translateX(12px)}
.np-toggle input:focus-visible + .np-toggle__box{outline:2px solid var(--np-accent);outline-offset:2px}
.np-toggle__text{font-size:12px;line-height:1.55;color:var(--np-ink-soft)}
.np-toggle__text b{display:block;font-size:12.5px;font-weight:500;color:var(--np-ink)}
.np-authnotice{display:flex;align-items:flex-start;gap:7px;padding:8px 10px;border:1px solid var(--np-line);border-radius:8px;background:var(--np-sheet2);font-size:11.5px;line-height:1.55;color:var(--np-ink-soft)}
.np-authnotice .np-ico{flex:none;margin-top:1px;color:var(--np-ink-soft)}
.np-authmodes,.np-authhelp{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px}
.np-authhelp{margin-top:2px}
.np-authhelp__btn{width:100%;justify-content:center}
.np-authmode{appearance:none;display:flex;align-items:flex-start;gap:8px;padding:10px;border:1px solid var(--np-line);border-radius:8px;background:var(--np-sheet);color:var(--np-ink);text-align:left;font:inherit;cursor:pointer;transition:border-color .14s ease,background-color .14s ease,box-shadow .14s ease}
.np-authmode:hover:not(:disabled){border-color:var(--np-line-strong);background:var(--np-sheet2)}
.np-authmode.is-on{border-color:var(--np-accent);background:color-mix(in srgb,var(--np-accent) 5%,var(--np-sheet));box-shadow:inset 0 0 0 1px var(--np-accent)}
.np-authmode:disabled{opacity:.5;cursor:not-allowed}
.np-authmode:focus-visible{outline:2px solid var(--np-accent);outline-offset:2px}
.np-authmode__radio{flex:none;width:16px;height:16px;margin-top:1px;display:grid;place-items:center;border:1px solid var(--np-line-strong);border-radius:50%;background:var(--np-sheet);color:var(--np-accent)}
.np-authmode.is-on .np-authmode__radio{border-color:var(--np-accent)}
.np-authmode__body{flex:1;min-width:0}
.np-authmode__title{display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;line-height:1.4}
.np-authmode__desc{display:block;margin-top:2px;font-size:11.5px;line-height:1.5;color:var(--np-ink-soft)}
.np-authmode__note{display:block;margin-top:2px;font-size:11px;color:var(--np-warn)}
.np-authstatus{display:flex;align-items:flex-start;gap:7px;padding:8px 10px;border:1px solid var(--np-line);border-radius:8px;background:var(--np-sheet2);font-size:12px;line-height:1.5}
.np-tokenrow{display:flex;align-items:center;gap:6px}
.np-tokenrow .np-input{flex:1;min-width:0}
.np-tokenrow .np-btn{flex:none}
.np-checks__summary{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding-bottom:2px}
.np-checks__counts{display:flex;gap:10px;flex-wrap:wrap;font-size:12px;font-weight:500}
.np-checks__counts .is-ok{color:var(--np-ok)}
.np-checks__counts .is-warn{color:var(--np-warn)}
.np-checks__counts .is-fail{color:var(--np-bad)}
.np-checks{display:flex;flex-direction:column;gap:4px}
.np-check{display:flex;align-items:flex-start;gap:8px;padding:7px 9px;border:1px solid var(--np-line);border-radius:8px;background:transparent}
.np-check--warn{border-color:color-mix(in srgb,var(--np-warn) 35%,var(--np-line));background:color-mix(in srgb,var(--np-warn) 5%,transparent)}
.np-check--fail{border-color:color-mix(in srgb,var(--np-bad) 35%,var(--np-line));background:color-mix(in srgb,var(--np-bad) 5%,transparent)}
.np-check__icon{flex:none;margin-top:1px}
.np-check__label{flex:1;min-width:0;font-size:12px;line-height:1.5}
.np-check__detail{margin-top:1px;font-size:11.5px;line-height:1.5;color:var(--np-ink-soft);word-break:break-word}
.np-check__hint{margin-top:2px;font-size:11px;line-height:1.5;color:var(--np-ink-soft)}
.np-ico--ok{color:var(--np-ok)}
.np-ico--warn{color:var(--np-warn)}
.np-ico--bad{color:var(--np-bad)}
.np-ico--idle{color:var(--np-idle)}
.np-summary{display:flex;flex-direction:column;gap:4px;padding:10px 12px;border:1px solid var(--np-line);border-radius:8px;background:var(--np-sheet2);font-size:12px;line-height:1.55}
.np-summary code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;word-break:break-all}
.np-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.np-result{margin-top:4px;border:1px solid var(--np-line);border-radius:10px;background:var(--np-sheet2);overflow:hidden}
.np-result__head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:9px 11px;border-bottom:1px solid var(--np-line);font-size:12.5px;font-weight:500}
.np-result__head .np-count{margin-left:auto}
.np-result__close{appearance:none;flex:none;display:grid;place-items:center;width:22px;height:22px;padding:0;border:1px solid color-mix(in srgb,var(--np-bad) 28%,var(--np-line));border-radius:6px;background:color-mix(in srgb,var(--np-bad) 7%,transparent);color:var(--np-bad);cursor:pointer}
.np-result__close:hover{background:color-mix(in srgb,var(--np-bad) 14%,transparent);border-color:color-mix(in srgb,var(--np-bad) 50%,var(--np-line));color:var(--np-bad)}
.np-result__close:focus-visible{outline:2px solid var(--np-bad);outline-offset:2px}
.np-result__cmd{padding:7px 11px;border-bottom:1px solid var(--np-line);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;line-height:1.55;color:var(--np-ink-soft);word-break:break-all}
.np-log{margin:0;padding:10px 12px;max-height:260px;overflow:auto;white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;line-height:1.55;color:var(--np-ink-soft)}
.np-downloads{display:flex;flex-direction:column;gap:8px;padding-top:2px}
.np-downloads__head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-size:11.5px;color:var(--np-ink-soft)}
.np-downloads__head strong{font-size:14px;font-weight:600;color:var(--np-ink);font-variant-numeric:tabular-nums}
.np-downloads__loading{font-size:11px;color:var(--np-ink-soft)}
.np-bars{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));align-items:end;gap:5px;height:96px;padding-top:14px}
.np-bar{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:3px;min-width:0}
.np-bar__value{font-size:9px;line-height:1;color:var(--np-ink-soft);font-variant-numeric:tabular-nums;white-space:nowrap}
.np-bar__track{display:flex;align-items:flex-end;width:100%;max-width:18px;height:62px;overflow:hidden;border-radius:3px;background:var(--np-sheet2)}
.np-bar__fill{display:block;width:100%;min-height:2px;border-radius:3px 3px 0 0;background:var(--np-accent);opacity:.9}
.np-bar__label{font-size:9px;line-height:1;color:var(--np-ink-soft);white-space:nowrap}
.np-downloads__hint{font-size:10px;line-height:1.5;color:var(--np-ink-soft)}
.np-bars--skeleton{height:96px;padding-top:14px}
.np-bar__skeleton{display:block;width:100%;max-width:18px;height:62px;align-self:end;justify-self:center;border-radius:3px;background:linear-gradient(100deg,var(--np-sheet2) 20%,var(--np-line) 45%,var(--np-sheet2) 70%);background-size:200% 100%;animation:np-shimmer 1.5s linear infinite}
.np-railcard{position:relative;padding:16px;background:var(--np-sheet);border:1px solid var(--np-line);border-radius:12px;box-shadow:var(--np-shadow)}
.np-railcard__body{display:flex;flex-direction:column;gap:8px}
.np-railcard__pkg{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;color:var(--np-ink-soft);word-break:break-all}
.np-railcard__hint{font-size:11px;line-height:1.55;color:var(--np-ink-soft)}
.np-railcard__action{width:100%;justify-content:center}
.np-railcard__title{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 12px;font-size:13px;font-weight:600;line-height:1.3}
.np-dl{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px 12px;margin:0;font-size:12px;line-height:1.5}
.np-dl dt{color:var(--np-ink-soft)}
.np-dl dd{margin:0;min-width:0;word-break:break-word}
.np-records{display:flex;flex-direction:column;max-height:420px;overflow-y:auto;padding-right:2px}
.np-record{position:relative;margin-left:3px;padding:0 0 14px 18px;border-left:1px solid var(--np-line)}
.np-record:last-child{border-left-color:transparent;padding-bottom:2px}
.np-record__dot{position:absolute;left:-4px;top:4px;width:7px;height:7px;border-radius:50%;background:var(--np-line-strong);box-shadow:0 0 0 2px var(--np-sheet)}
.np-record--ok .np-record__dot{background:var(--np-ok)}
.np-record--fail .np-record__dot{background:var(--np-bad)}
.np-record__top{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.np-record__version{font-size:12.5px;font-weight:600}
.np-record__time{margin-top:2px;font-size:11px;line-height:1.5;color:var(--np-ink-soft)}
.np-record__note{margin-top:2px;font-size:11.5px;line-height:1.5;color:var(--np-ink-soft);word-break:break-word}
.np-record__logs{margin-top:5px}
.np-record__toggle{appearance:none;border:0;background:none;padding:0;color:var(--np-accent);font:inherit;font-size:11.5px;font-weight:500;cursor:pointer;text-decoration:none}
.np-record__toggle:hover{text-decoration:underline}
.np-record__toggle:focus-visible{outline:2px solid var(--np-accent);outline-offset:2px}
.np-record .np-log{max-height:180px;margin-top:5px;border:1px solid var(--np-line);border-radius:6px}
.np-modal{position:fixed;inset:0;z-index:80;display:grid;place-items:center;padding:24px;background:rgba(15,23,42,.35);backdrop-filter:blur(4px)}
.np-dialog{position:relative;width:min(480px,100%);max-height:calc(100vh - 48px);overflow-y:auto;padding:20px;background:var(--np-sheet);border:1px solid var(--np-line);border-radius:14px;box-shadow:0 24px 48px rgba(15,23,42,.18)}
.np-dialog h2{margin:0 0 8px;font-size:16px;font-weight:600;line-height:1.35;letter-spacing:-.01em}
.np-dialog p{margin:0 0 8px;font-size:12.5px;line-height:1.65;color:var(--np-ink-soft)}
.np-dialog .np-field{margin:2px 0 10px}
.np-dialog__warn{padding:8px 10px;border:1px solid color-mix(in srgb,var(--np-bad) 30%,var(--np-line));border-radius:8px;background:color-mix(in srgb,var(--np-bad) 6%,transparent);color:var(--np-bad)!important}
.np-dialog__actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
.np-dialog__actions--split{justify-content:space-between;flex-wrap:wrap}
.np-dialog__actions-right{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-left:auto}
.np-dialog.np-dialog--info{width:min(560px,100%)}
.np-dialog.np-dialog--error{width:min(540px,100%)}
.np-dialog--error .np-info__head h2{margin:0;flex:1;min-width:0}
.np-error__message{max-height:320px;overflow:auto;padding:10px 12px;border:1px solid color-mix(in srgb,var(--np-bad) 30%,var(--np-line));border-radius:8px;background:color-mix(in srgb,var(--np-bad) 5%,transparent);color:var(--np-ink);font-size:12.5px;line-height:1.65;white-space:pre-wrap;word-break:break-word;user-select:text}
.np-dialog--error .np-error__detail{margin:8px 0 0;font-size:11.5px;line-height:1.55;color:var(--np-ink-soft);word-break:break-word}
.np-dialog--info .np-info__head h2{margin:0;flex:1;min-width:0}
.np-dialog--info .np-info__intro{margin:8px 0 4px}
.np-info__head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.np-info__intro{margin:8px 0 4px;font-size:12.5px;line-height:1.65;color:var(--np-ink-soft)}
.np-info__title{margin:14px 0 6px;font-size:12px;font-weight:600;line-height:1.3;color:var(--np-ink)}
.np-info__steps,.np-info__keys{margin:0;padding-left:18px;font-size:12px;line-height:1.65;color:var(--np-ink-soft)}
.np-info__steps li,.np-info__keys li{margin:3px 0}
.np-info__steps li::marker{color:var(--np-accent);font-weight:600}
.np-info__actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
.np-modal__auth{margin:2px 0 8px}
.np-modal__auth .np-authmode__title{margin-bottom:6px}
.np-toast{position:fixed;right:20px;bottom:20px;z-index:90;display:flex;align-items:center;gap:8px;max-width:min(430px,calc(100vw - 40px));padding:9px 12px;border:1px solid var(--np-line);border-radius:10px;background:var(--np-sheet);box-shadow:0 8px 24px rgba(15,23,42,.14);font-size:12.5px;line-height:1.5}
.np-toast--ok{border-color:color-mix(in srgb,var(--np-ok) 35%,var(--np-line))}
.np-toast--error{border-color:color-mix(in srgb,var(--np-bad) 35%,var(--np-line))}
.np-spin{animation:np-spin 1.1s linear infinite}
@keyframes np-spin{to{transform:rotate(360deg)}}
.np-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media (max-width:980px){
  .np-detail__grid{grid-template-columns:minmax(0,1fr)}
  .np-rail{position:static}
}
@media (max-width:720px){
  .np__inner{padding-left:20px;padding-right:20px;padding-bottom:48px}
  .np__title{font-size:21px}
  .np__mark{width:38px;height:38px}
  .np__actions{width:100%}
  .np-grid{grid-template-columns:minmax(0,1fr)}
  .np-row{grid-template-columns:minmax(0,1fr)}
  .np-search{max-width:none}
  .np-identity__title{font-size:20px}
  .np-toast{right:14px;bottom:14px}
}
@media (prefers-reduced-motion:reduce){
  .np *,.np *::before,.np *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}
}

`

    /* --------------------------------------------------------------- helpers */

    function useText() {
      const [, setTick] = React.useState(0)
      React.useEffect(() => {
        if (!localeService || typeof localeService.subscribe !== 'function') return undefined
        return localeService.subscribe(() => setTick((value) => value + 1))
      }, [])
      return [localized, tr]
    }

    function activeLocale() {
      if (localeService && typeof localeService.getSnapshot === 'function') {
        const snapshot = localeService.getSnapshot()
        if (snapshot && typeof snapshot.active === 'string' && snapshot.active !== '') return snapshot.active
      }
      if (typeof navigator !== 'undefined' && typeof navigator.language === 'string' && navigator.language !== '') return navigator.language
      return 'en'
    }

    function systemLocale() {
      if (typeof navigator !== 'undefined' && typeof navigator.language === 'string' && navigator.language !== '') return navigator.language
      return ''
    }

    function useChinese() {
      const active = activeLocale().toLowerCase()
      if (active.startsWith('zh')) return true
      if (active.startsWith('en')) return false
      return systemLocale().toLowerCase().startsWith('zh')
    }

    function localized(key) {
      const chinese = useChinese()
      const primary = chinese ? DICTIONARIES.zh : DICTIONARIES.en
      const fallback = chinese ? DICTIONARIES.en : DICTIONARIES.zh
      return primary[key] ?? fallback[key] ?? key
    }

    function tr(key, values) {
      let text = localized(key)
      if (values) {
        for (const [name, value] of Object.entries(values)) {
          text = text.split(`{${name}}`).join(String(value))
        }
      }
      return text
    }

    function formatCount(value) {
      const n = Number(value) || 0
      if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
      if (n >= 10_000) return `${Math.round(n / 1000)}k`
      if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
      return String(n)
    }

    function shortDay(value) {
      const text = String(value || '')
      return text.length >= 10 ? text.slice(5, 10) : text
    }

    function formatDateTime(value) {
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return '—'
      try {
        return date.toLocaleString(useChinese() ? 'zh-CN' : 'en-US', {
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
        })
      } catch {
        return date.toISOString().slice(0, 16).replace('T', ' ')
      }
    }

    function formatTime(value) {
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return '—'
      try {
        return date.toLocaleTimeString(useChinese() ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      } catch {
        return date.toISOString().slice(11, 19)
      }
    }

    function formatShortDate(value) {
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return '—'
      try {
        return date.toLocaleDateString(useChinese() ? 'zh-CN' : 'en-US', { month: '2-digit', day: '2-digit' })
      } catch {
        return date.toISOString().slice(5, 10)
      }
    }

    function formatDuration(ms) {
      const value = Number(ms)
      if (!Number.isFinite(value) || value <= 0) return '0.0s'
      if (value < 10_000) return `${(value / 1000).toFixed(1)}s`
      if (value < 120_000) return `${Math.round(value / 1000)}s`
      return `${Math.floor(value / 60_000)}m${Math.round((value % 60_000) / 1000)}s`
    }

    function validVersion(value) {
      return typeof value === 'string' && VERSION_RE.test(value)
    }

    function validToken(value) {
      return typeof value === 'string' && /^[A-Za-z0-9._~+/=-]{20,512}$/.test(String(value).trim())
    }

    function bumpVersion(version, kind) {
      const match = /^(\d+)\.(\d+)\.(\d+)/.exec(String(version || ''))
      if (!match) return version
      let major = Number(match[1])
      let minor = Number(match[2])
      let patch = Number(match[3])
      if (kind === 'major') {
        major += 1
        minor = 0
        patch = 0
      } else if (kind === 'minor') {
        minor += 1
        patch = 0
      } else {
        patch += 1
      }
      return `${major}.${minor}.${patch}`
    }

    function detailText(detail, t) {
      if (!detail) return ''
      if (detail === 'NEW_PACKAGE') return t('checkDetail.newPackage')
      if (detail === 'NOT_LOGGED_IN') return t('checkDetail.notLoggedIn')
      if (detail === 'EMPTY_LIST') return t('checkDetail.emptyList')
      if (detail === 'TOKEN_UNVERIFIED') return t('checkDetail.tokenUnverified')
      if (detail === 'OIDC_AT_PUBLISH') return t('checkDetail.oidcAtPublish')
      if (detail === 'EMPTY') return t('checkDetail.tokenEmpty')
      if (detail === 'GRANULAR_TOKEN') return t('checkDetail.tokenFilled')
      if (detail === 'CANNOT_DETECT') return t('checkDetail.cannotDetect')
      if (detail === 'github-actions') return t('checkDetail.oidcGithub')
      if (detail === 'gitlab') return t('checkDetail.oidcGitlab')
      if (detail === 'UNAVAILABLE') return t('checkDetail.oidcUnavailable')
      return detail
    }

    async function readPayload(response, allowFailure) {
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload && payload.message ? payload.message : `HTTP ${response.status}`)
      }
      if (!allowFailure && (!payload || payload.ok !== true)) {
        throw new Error(payload && payload.message ? payload.message : tr('common.error'))
      }
      return payload
    }

    async function apiGet(path, signal) {
      const response = await fetch(`${API}${path}`, {
        method: 'GET',
        credentials: 'same-origin',
        headers: { accept: 'application/json' },
        signal,
      })
      return readPayload(response, false)
    }

    async function apiPost(path, body, options = {}) {
      const response = await fetch(`${API}${path}`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify(body || {}),
        signal: options.signal,
      })
      return readPayload(response, options.allowFailure === true)
    }

    let markSeq = 0

    function PageMark(props) {
      const size = typeof props?.size === 'number' ? props.size : 40
      const uidRef = React.useRef('')
      if (uidRef.current === '') {
        markSeq += 1
        uidRef.current = `np-mark-${markSeq}`
      }
      const uid = uidRef.current
      const id = (suffix) => `${uid}-${suffix}`
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 128 128',
        className: 'np-glass-mark',
        'aria-hidden': 'true',
        focusable: 'false',
        style: { display: 'block' },
      },
        h('defs', null,
          h('linearGradient', { id: id('bg'), x1: '18', y1: '10', x2: '110', y2: '120', gradientUnits: 'userSpaceOnUse' },
            h('stop', { offset: '0', stopColor: '#262932' }),
            h('stop', { offset: '.46', stopColor: '#0d0e12' }),
            h('stop', { offset: '1', stopColor: '#050506' }),
          ),
          h('linearGradient', { id: id('glass'), x1: '30', y1: '18', x2: '96', y2: '112', gradientUnits: 'userSpaceOnUse' },
            h('stop', { offset: '0', stopColor: '#ffffff', stopOpacity: '.20' }),
            h('stop', { offset: '.45', stopColor: '#ffffff', stopOpacity: '.04' }),
            h('stop', { offset: '1', stopColor: '#ffffff', stopOpacity: '0' }),
          ),
          h('linearGradient', { id: id('rim'), x1: '14', y1: '12', x2: '114', y2: '118', gradientUnits: 'userSpaceOnUse' },
            h('stop', { offset: '0', stopColor: '#ffffff', stopOpacity: '.58' }),
            h('stop', { offset: '.5', stopColor: '#ffffff', stopOpacity: '.08' }),
            h('stop', { offset: '1', stopColor: '#ffffff', stopOpacity: '.22' }),
          ),
          h('linearGradient', { id: id('mint'), x1: '52', y1: '36', x2: '84', y2: '96', gradientUnits: 'userSpaceOnUse' },
            h('stop', { offset: '0', stopColor: '#d1fae5' }),
            h('stop', { offset: '.45', stopColor: '#6ee7b7' }),
            h('stop', { offset: '1', stopColor: '#0f9f6e' }),
          ),
          h('radialGradient', { id: id('spec'), cx: '.32', cy: '.18', r: '.62' },
            h('stop', { offset: '0', stopColor: '#ffffff', stopOpacity: '.55' }),
            h('stop', { offset: '.55', stopColor: '#ffffff', stopOpacity: '.08' }),
            h('stop', { offset: '1', stopColor: '#ffffff', stopOpacity: '0' }),
          ),
          h('radialGradient', { id: id('violet'), cx: '.2', cy: '.82', r: '.62' },
            h('stop', { offset: '0', stopColor: '#8b5cf6', stopOpacity: '.42' }),
            h('stop', { offset: '1', stopColor: '#8b5cf6', stopOpacity: '0' }),
          ),
          h('radialGradient', { id: id('cyan'), cx: '.82', cy: '.2', r: '.55' },
            h('stop', { offset: '0', stopColor: '#22d3ee', stopOpacity: '.30' }),
            h('stop', { offset: '1', stopColor: '#22d3ee', stopOpacity: '0' }),
          ),
          h('filter', { id: id('blur8'), x: '-40%', y: '-40%', width: '180%', height: '180%' },
            h('feGaussianBlur', { stdDeviation: '8' }),
          ),
          h('filter', { id: id('blur3'), x: '-40%', y: '-40%', width: '180%', height: '180%' },
            h('feGaussianBlur', { stdDeviation: '3' }),
          ),
          h('clipPath', { id: id('clip') }, h('rect', { x: '8', y: '8', width: '112', height: '112', rx: '30' })),
        ),
        h('g', { clipPath: `url(#${id('clip')})` },
          h('rect', { x: '8', y: '8', width: '112', height: '112', rx: '30', fill: `url(#${id('bg')})` }),
          h('ellipse', { cx: '42', cy: '102', rx: '62', ry: '40', fill: `url(#${id('violet')})`, filter: `url(#${id('blur8')})` }),
          h('ellipse', { cx: '96', cy: '32', rx: '48', ry: '34', fill: `url(#${id('cyan')})`, filter: `url(#${id('blur8')})` }),
          h('rect', { x: '8', y: '8', width: '112', height: '112', rx: '30', fill: `url(#${id('glass')})` }),
          h('ellipse', { cx: '42', cy: '26', rx: '44', ry: '22', fill: `url(#${id('spec')})`, filter: `url(#${id('blur3')})` }),
          h('path', { d: 'M22 42c4-18 20-30 42-32', fill: 'none', stroke: '#ffffff', strokeOpacity: '.38', strokeWidth: '3', strokeLinecap: 'round', filter: `url(#${id('blur3')})` }),
          h('path', { d: 'M18 90c12 20 34 28 58 26', fill: 'none', stroke: '#a7f3d0', strokeOpacity: '.16', strokeWidth: '4', strokeLinecap: 'round', filter: `url(#${id('blur3')})` }),
          h('ellipse', { cx: '64', cy: '100', rx: '30', ry: '8', fill: '#000000', opacity: '.35', filter: `url(#${id('blur8')})` }),
        ),
        h('rect', { x: '8.75', y: '8.75', width: '110.5', height: '110.5', rx: '29.25', fill: 'none', stroke: `url(#${id('rim')})`, strokeWidth: '1.5' }),
        h('g', { strokeLinejoin: 'round' },
          h('path', { d: 'M64 34 94 49 64 64 34 49Z', fill: '#ffffff', fillOpacity: '.14', stroke: '#ffffff', strokeOpacity: '.55', strokeWidth: '1.4' }),
          h('path', { d: 'M34 49 64 64v34L34 83Z', fill: '#ffffff', fillOpacity: '.07', stroke: '#ffffff', strokeOpacity: '.28', strokeWidth: '1.2' }),
          h('path', { d: 'M94 49 64 64v34l30-15Z', fill: '#ffffff', fillOpacity: '.035', stroke: '#ffffff', strokeOpacity: '.22', strokeWidth: '1.2' }),
          h('path', { d: 'M64 64v34', stroke: '#ffffff', strokeOpacity: '.18', strokeWidth: '1.2' }),
          h('path', { d: 'M40 48 64 60 88 48', fill: 'none', stroke: '#ffffff', strokeOpacity: '.35', strokeWidth: '1.2' }),
          h('path', { d: 'M64 92V52', fill: 'none', stroke: `url(#${id('mint')})`, strokeWidth: '7', strokeLinecap: 'round' }),
          h('path', { d: 'M51 64 64 51l13 13', fill: 'none', stroke: `url(#${id('mint')})`, strokeWidth: '7', strokeLinecap: 'round', strokeLinejoin: 'round' }),
          h('path', { d: 'M64 88V55', fill: 'none', stroke: '#ffffff', strokeOpacity: '.35', strokeWidth: '1.6', strokeLinecap: 'round' }),
          h('circle', { cx: '96', cy: '36', r: '7', fill: '#ffffff', fillOpacity: '.16', stroke: '#ffffff', strokeOpacity: '.35', strokeWidth: '1' }),
          h('circle', { cx: '93.8', cy: '33.8', r: '2.2', fill: '#ffffff', fillOpacity: '.6' }),
        ),
      )
    }

    function PanelIcon(props) {
      const size = typeof props?.size === 'number' ? props.size : 16
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 16 16',
        'aria-hidden': 'true',
        focusable: 'false',
        style: { display: 'block' },
      },
        h('defs', null,
          h('linearGradient', { id: 'np-pi-bg', x1: '2', y1: '1', x2: '14', y2: '15', gradientUnits: 'userSpaceOnUse' },
            h('stop', { offset: '0', stopColor: '#2a2d36' }),
            h('stop', { offset: '1', stopColor: '#08090c' }),
          ),
          h('linearGradient', { id: 'np-pi-mint', x1: '5', y1: '3', x2: '11', y2: '13', gradientUnits: 'userSpaceOnUse' },
            h('stop', { offset: '0', stopColor: '#d1fae5' }),
            h('stop', { offset: '1', stopColor: '#34d399' }),
          ),
        ),
        h('rect', { x: '.6', y: '.6', width: '14.8', height: '14.8', rx: '4.2', fill: 'url(#np-pi-bg)', stroke: '#ffffff', strokeOpacity: '.20', strokeWidth: '.8' }),
        h('path', { d: 'M3 5.4c0-1.3 1-2.2 2.4-2.4', fill: 'none', stroke: '#ffffff', strokeOpacity: '.45', strokeWidth: '.8', strokeLinecap: 'round' }),
        h('path', { d: 'M8 11.6V4.6', stroke: 'url(#np-pi-mint)', strokeWidth: '1.5', strokeLinecap: 'round' }),
        h('path', { d: 'M5.4 7.2 8 4.6l2.6 2.6', fill: 'none', stroke: 'url(#np-pi-mint)', strokeWidth: '1.5', strokeLinecap: 'round', strokeLinejoin: 'round' }),
        h('path', { d: 'M4.8 13.2h6.4', stroke: '#ffffff', strokeOpacity: '.45', strokeWidth: '.9', strokeLinecap: 'round' }),
      )
    }

    const GLYPH_PATHS = {
      back: [['path', { d: 'M10 3 5 8l5 5' }]],
      refresh: [
        ['path', { d: 'M13.2 8a5.2 5.2 0 1 1-1.7-3.9' }],
        ['path', { d: 'M13.4 2.4v3.1h-3.1' }],
      ],
      search: [
        ['circle', { cx: 7, cy: 7, r: 4.1 }],
        ['path', { d: 'm10.2 10.2 3.3 3.3' }],
      ],
      plus: [['path', { d: 'M8 3v10M3 8h10' }]],
      check: [['path', { d: 'M3.2 8.4 6.4 11.6 12.8 4.6' }]],
      close: [['path', { d: 'M4.2 4.2l7.6 7.6M11.8 4.2l-7.6 7.6' }]],
      minus: [['path', { d: 'M4 8h8' }]],
      alert: [
        ['path', { d: 'M8 3.1v5.6' }],
        ['path', { d: 'M8 12.3v.2' }],
      ],
      clock: [
        ['circle', { cx: 8, cy: 8, r: 5.4 }],
        ['path', { d: 'M8 4.9V8l2.2 1.5' }],
      ],
      box: [
        ['path', { d: 'M2.6 4.9 8 2.4l5.4 2.5v5.9L8 13.5l-5.4-2.7v-5.9Z' }],
        ['path', { d: 'M2.6 4.9 8 7.4l5.4-2.5M8 7.4v6.1' }],
      ],
      arrow: [['path', { d: 'M3 8h9M8.6 4.6 12 8l-3.4 3.4' }]],
      folder: [['path', { d: 'M2.4 4.6h4l1.2 1.5h5.9v6.1H2.4V4.6Z' }]],
      copy: [
        ['rect', { x: 5.4, y: 5.4, width: 7.2, height: 7.2, rx: 1.4 }],
        ['path', { d: 'M10.6 3.4H4.8A1.4 1.4 0 0 0 3.4 4.8v5.8' }],
      ],
      upload: [
        ['path', { d: 'M8 10.6V2.8M4.7 6.1 8 2.8l3.3 3.3' }],
        ['path', { d: 'M2.8 13.2h10.4' }],
      ],
      info: [
        ['circle', { cx: 8, cy: 8, r: 5.4 }],
        ['path', { d: 'M8 7.2v3.4' }],
        ['path', { d: 'M8 4.9v.2' }],
      ],
      lock: [
        ['rect', { x: 3.4, y: 7, width: 9.2, height: 6.2, rx: 1.4 }],
        ['path', { d: 'M5.6 7V5.4a2.4 2.4 0 0 1 4.8 0V7' }],
      ],
      play: [
        ['path', { d: 'M5 3.5 12.5 8 5 12.5V3.5Z' }],
      ],
      terminal: [
        ['rect', { x: 2.2, y: 3.2, width: 11.6, height: 9.6, rx: 1.6 }],
        ['path', { d: 'm4.8 6.1 2.4 2.2-2.4 2.2M8.6 10.5h2.8' }],
      ],
      external: [
        ['path', { d: 'M9.4 2.8H13v3.6M13 2.8 8.2 7.6' }],
        ['path', { d: 'M12 9.2v2.2a1.6 1.6 0 0 1-1.6 1.6H3.8A1.6 1.6 0 0 1 2.2 11.4V4.8a1.6 1.6 0 0 1 1.6-1.6h2.4' }],
      ],
      pencil: [
        ['path', { d: 'M3 13l.9-3.1 6.3-6.3 2.2 2.2-6.3 6.3L3 13Z' }],
        ['path', { d: 'M9.6 4.2 11.8 6.4' }],
      ],
      spark: [
        ['path', { d: 'M8 2.4v3M8 10.6v3M2.4 8h3M10.6 8h3' }],
        ['path', { d: 'm4.1 4.1 1.9 1.9M10 10l1.9 1.9M11.9 4.1 10 6M6 10l-1.9 1.9' }],
      ],
      uploadBox: [
        ['path', { d: 'M2.6 4.9 8 2.4l5.4 2.5v5.9L8 13.5l-5.4-2.7v-5.9Z' }],
        ['path', { d: 'M8 6.1v4.4M6.3 8.9 8 10.6l1.7-1.7' }],
      ],
    }

    function Glyph(props) {
      const name = props && props.name ? props.name : 'box'
      const size = typeof props?.size === 'number' ? props.size : 14
      const shapes = GLYPH_PATHS[name] || GLYPH_PATHS.box
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 16 16',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': 'true',
        focusable: 'false',
        style: { display: 'block', flex: 'none' },
      }, shapes.map((shape, index) => h(shape[0], { key: index, ...shape[1] })))
    }

    function statusGlyph(status) {
      if (status === 'pass') return h('span', { className: 'np-ico np-ico--ok' }, h(Glyph, { name: 'check', size: 13 }))
      if (status === 'warn') return h('span', { className: 'np-ico np-ico--warn' }, h(Glyph, { name: 'alert', size: 13 }))
      if (status === 'fail') return h('span', { className: 'np-ico np-ico--bad' }, h(Glyph, { name: 'close', size: 13 }))
      return h('span', { className: 'np-ico np-ico--idle' }, h(Glyph, { name: 'minus', size: 13 }))
    }

    /* ------------------------------------------------------------- primitives */

    function StatusTag(props) {
      const [t] = useText()
      const status = props.status || { state: 'unpublished' }
      const state = status.state || 'unpublished'
      let label = t('status.unpublished')
      if (state === 'published') label = `${t('status.published')} v${status.version}`
      else if (state === 'pending') label = `${t('status.pending')} v${status.publishedVersion}`
      return h('span', { className: `np-status np-status--${state}` },
        h('span', { className: 'np-status__dot', 'aria-hidden': 'true' }),
        label,
      )
    }

    function Toggle(props) {
      return h('label', { className: 'np-toggle' },
        h('input', {
          type: 'checkbox',
          role: 'switch',
          'aria-checked': props.checked === true,
          checked: props.checked === true,
          disabled: props.disabled === true,
          onChange: (event) => props.onChange && props.onChange(event.target.checked),
        }),
        h('span', { className: 'np-toggle__box', 'aria-hidden': 'true' }),
        h('span', { className: 'np-toggle__text' },
          h('b', null, props.label),
          props.hint ? h('span', null, props.hint) : null,
        ),
      )
    }

    function FlowSection(props) {
      return h('section', { className: 'np-section' },
        h('header', { className: 'np-section__head' },
          h('span', { className: 'np-section__num', 'aria-hidden': 'true' }, String(props.index)),
          h('div', { className: 'np-section__titles' },
            h('h2', { className: 'np-section__title' }, props.title),
            props.hint ? h('p', { className: 'np-section__hint' }, props.hint) : null,
          ),
          props.action || null,
        ),
        h('div', { className: 'np-section__body' }, props.children),
      )
    }

    function CheckRow(props) {
      const [t] = useText()
      const check = props.check
      const labelKey = `check.${check.id}.label`
      const hintKey = `check.${check.id}.hint`
      const label = t(labelKey)
      const hint = t(hintKey)
      const detail = detailText(check.detail, t)
      return h('div', { className: `np-check np-check--${check.status}` },
        h('span', { className: 'np-check__icon' }, statusGlyph(check.status)),
        h('div', { className: 'np-check__label' },
          h('div', null, label === labelKey ? check.id : label),
          detail ? h('div', { className: 'np-check__detail' }, detail) : null,
          check.status === 'fail' && hint !== hintKey ? h('div', { className: 'np-check__hint' }, hint) : null,
          check.status === 'warn' && hint !== hintKey ? h('div', { className: 'np-check__hint' }, hint) : null,
        ),
      )
    }

    function EmptyState(props) {
      return h('div', { className: props.small ? 'np-empty np-empty--small' : 'np-empty' },
        props.icon ? h(Glyph, { name: props.icon, size: props.small ? 22 : 30 }) : h(PageMark, { size: props.small ? 32 : 44 }),
        h('h3', null, props.title),
        props.hint ? h('p', null, props.hint) : null,
        props.action || null,
      )
    }

    function DownloadBars(props) {
      const [t] = useText()
      const status = props.status || 'loading'
      const points = Array.isArray(props.points) ? props.points : []
      const total = Number(props.total) || 0
      if (status === 'loading') {
        return h('div', { className: 'np-downloads' },
          h('div', { className: 'np-downloads__head' },
            h('span', null, t('npmInfo.last7')),
            h('span', { className: 'np-downloads__loading' }, t('npmInfo.loading')),
          ),
          h('div', { className: 'np-bars np-bars--skeleton', 'aria-hidden': 'true' },
            Array.from({ length: 7 }, (_, index) => h('span', { key: index, className: 'np-bar__skeleton' })),
          ),
        )
      }
      if (status === 'unavailable' || status === 'error') {
        return h('div', { className: 'np-downloads' },
          h('div', { className: 'np-downloads__head' }, h('span', null, t('npmInfo.last7'))),
          h('span', { className: 'np-downloads__hint', title: props.error || undefined }, t('npmInfo.unavailable')),
        )
      }
      if (status === 'empty' || points.length === 0) {
        return h('div', { className: 'np-downloads' },
          h('div', { className: 'np-downloads__head' },
            h('span', null, t('npmInfo.last7')),
            h('strong', null, '0'),
          ),
          h('span', { className: 'np-downloads__hint' }, t('npmInfo.empty')),
        )
      }
      const max = Math.max(1, ...points.map((point) => Number(point.downloads) || 0))
      return h('div', { className: 'np-downloads' },
        h('div', { className: 'np-downloads__head' },
          h('span', null, t('npmInfo.last7')),
          h('strong', null, formatCount(total)),
        ),
        h('div', {
          className: 'np-bars',
          role: 'img',
          'aria-label': t('npmInfo.chartLabel'),
          style: { gridTemplateColumns: `repeat(${Math.max(points.length, 1)},minmax(0,1fr))` },
        },
          points.map((point, index) => {
            const value = Number(point.downloads) || 0
            const height = Math.max(2, Math.round((value / max) * 100))
            return h('div', {
              key: point.day || index,
              className: 'np-bar',
              title: `${point.day}: ${formatCount(value)}`,
            },
              h('span', { className: 'np-bar__value' }, value > 0 ? formatCount(value) : ''),
              h('span', { className: 'np-bar__track' },
                h('span', { className: 'np-bar__fill', style: { height: `${height}%` } }),
              ),
              h('span', { className: 'np-bar__label' }, shortDay(point.day)),
            )
          }),
        ),
        h('span', { className: 'np-downloads__hint' }, t('npmInfo.source')),
      )
    }

    function Toast(props) {
      if (!props.toast) return null
      return h('div', { className: `np-toast np-toast--${props.toast.kind}`, role: 'status', 'aria-live': 'polite' },
        statusGlyph(props.toast.kind === 'ok' ? 'pass' : 'fail'),
        h('span', null, props.toast.text),
      )
    }

    function ErrorDialog(props) {
      const [t] = useText()
      const [copied, setCopied] = React.useState(false)
      const message = props.message || t('common.error')
      React.useEffect(() => {
        setCopied(false)
      }, [props.title, props.message])
      React.useEffect(() => {
        const onKeyDown = (event) => {
          if (event.key === 'Escape') props.onClose()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
      }, [props.onClose])
      async function copy() {
        try {
          const parts = [props.title, message, props.detail, props.hint].filter(Boolean)
          await navigator.clipboard.writeText(parts.join('\n\n'))
          setCopied(true)
        } catch {
          // Clipboard may be unavailable; the message stays selectable.
        }
      }
      return h('div', {
        className: 'np-modal',
        role: 'presentation',
        onMouseDown: (event) => {
          if (event.target === event.currentTarget) props.onClose()
        },
      },
        h('div', { className: 'np-dialog np-dialog--error', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'np-error-title' },
          h('div', { className: 'np-info__head' },
            h('h2', { id: 'np-error-title' }, props.title),
            h('button', {
              type: 'button',
              className: 'np-btn np-btn--ghost np-btn--small',
              'aria-label': t('action.close'),
              onClick: props.onClose,
            }, h(Glyph, { name: 'close', size: 13 })),
          ),
          h('div', { className: 'np-error__message' }, message),
          props.detail ? h('p', { className: 'np-error__detail' }, props.detail) : null,
          props.hint ? h('p', { className: 'np-error__detail' }, props.hint) : null,
          h('div', { className: 'np-dialog__actions' },
            h('button', { type: 'button', className: 'np-btn', onClick: copy }, copied ? t('action.copied') : t('action.copy')),
            h('button', { type: 'button', className: 'np-btn np-btn--primary', autoFocus: true, onClick: props.onClose }, t('action.close')),
          ),
        ),
      )
    }

    function useToast() {
      const [toast, setToast] = React.useState(null)
      const timer = React.useRef(null)
      const seq = React.useRef(0)
      const show = React.useCallback((kind, text) => {
        seq.current += 1
        setToast({ kind, text, seq: seq.current })
      }, [])
      React.useEffect(() => {
        if (!toast) return undefined
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setToast(null), 4600)
        return () => clearTimeout(timer.current)
      }, [toast])
      return [toast, show]
    }

    /* -------------------------------------------------------------- list page */

    function matchesFilter(component, query, filter) {
      const text = String(query || '').trim().toLowerCase()
      if (text !== '') {
        const haystack = [component.title, component.name, component.description, component.path].map((value) => String(value || '').toLowerCase())
        if (!haystack.some((value) => value.includes(text))) return false
      }
      if (filter === 'all') return true
      if (filter === 'attention') return Boolean(component.status && component.status.attention) || (component.checks && component.checks.fail > 0)
      return Boolean(component.status) && component.status.state === filter
    }

    function ComponentCard(props) {
      const [t, tr] = useText()
      const component = props.component
      const checks = component.checks || { pass: 0, warn: 0, fail: 0 }
      const tone = checks.fail > 0 ? 'fail' : checks.warn > 0 ? 'warn' : 'ok'
      return h('button', {
        type: 'button',
        className: 'np-card',
        onClick: () => props.onOpen(component.dir),
        'aria-label': `${component.title || component.name} — ${t('card.open')}`,
      },
        h('div', { className: 'np-card__head' },
          h('span', { className: 'np-card__icon' },
            component.icon && component.icon.dataUrl
              ? h('img', { src: component.icon.dataUrl, alt: '' })
              : h(PageMark, { size: 38 }),
          ),
          h('div', { className: 'np-card__titles' },
            h('span', { className: 'np-card__title' }, component.title || component.name),
            h('span', { className: 'np-card__name np-mono' }, component.name),
          ),
          h(StatusTag, { status: component.status }),
        ),
        h('p', { className: 'np-card__desc' }, component.description || t('common.noDescription')),
        h('div', { className: 'np-card__tags' },
          h('span', { className: 'np-chip' }, t(`badge.${component.kind}`)),
          component.patch ? h('span', { className: 'np-chip' }, t('badge.bundlePatch')) : null,
          h('span', {
            className: `np-chip np-chip--${tone}`,
            title: tr('checks.summary', { pass: checks.pass, warn: checks.warn, fail: checks.fail }),
          }, `${checks.pass} / ${checks.warn} / ${checks.fail}`),
          component.status && component.status.attention ? h('span', { className: 'np-chip np-chip--fail' }, t('card.attention')) : null,
          component.recordCount > 0 ? h('span', { className: 'np-chip' }, tr('card.records', { n: component.recordCount })) : null,
        ),
        h('div', { className: 'np-card__foot' },
          h('span', { className: 'np-card__version' },
            h('span', { className: 'np-card__version-label' }, t('card.version')),
            `v${component.version || '0.0.0'}`,
          ),
          h('span', { className: 'np-card__last' },
            component.lastPublish
              ? tr('card.lastPublish', { version: component.lastPublish.version, time: formatShortDate(component.lastPublish.at) })
              : t('card.never'),
          ),
          h('span', { className: 'np-card__open' }, t('card.open'), h(Glyph, { name: 'arrow', size: 13 })),
        ),
      )
    }

    function ListPage(props) {
      const [t, tr] = useText()
      const [query, setQuery] = React.useState('')
      const [filter, setFilter] = React.useState('all')
      const overview = props.overview
      const components = (overview && Array.isArray(overview.components)) ? overview.components : []
      const filtered = React.useMemo(
        () => components.filter((component) => matchesFilter(component, query, filter)),
        [components, query, filter],
      )
      const counts = React.useMemo(() => {
        const result = { all: components.length, published: 0, pending: 0, unpublished: 0, attention: 0 }
        for (const component of components) {
          const state = component.status && component.status.state ? component.status.state : 'unpublished'
          if (Object.prototype.hasOwnProperty.call(result, state)) result[state] += 1
          if ((component.status && component.status.attention) || (component.checks && component.checks.fail > 0)) result.attention += 1
        }
        return result
      }, [components])

      const filters = ['all', 'published', 'pending', 'unpublished', 'attention']
      const loading = props.status === 'loading'

      return h('div', null,
        h('header', { className: 'np__header' },
          h('div', { className: 'np__heading' },
            h('span', { className: 'np__mark' }, h(PageMark, { size: 42 })),
            h('div', { className: 'np__titles' },
              h('h1', { className: 'np__title' }, t('page.title')),
              h('p', { className: 'np__subtitle' }, t('page.subtitle')),
            ),
          ),
          h('div', { className: 'np__actions' },
            h('button', {
              type: 'button',
              className: 'np-btn',
              disabled: props.adding === true,
              onClick: props.onAdd,
            }, props.adding ? h(Glyph, { name: 'clock', size: 14, className: 'np-spin' }) : h(Glyph, { name: 'plus', size: 14 }), props.adding ? t('action.adding') : t('action.add')),
            h('button', {
              type: 'button',
              className: 'np-btn np-btn--primary',
              disabled: props.status === 'refreshing' || loading,
              onClick: props.onRefresh,
            }, h(Glyph, { name: 'refresh', size: 14, className: props.status === 'refreshing' ? 'np-spin' : undefined }), props.status === 'refreshing' ? t('action.refreshing') : t('action.refresh')),
          ),
        ),

        overview && overview.npm && overview.npm.available === false
          ? h('div', { className: 'np-warnbar', role: 'status' }, t('page.npmMissing'))
          : null,

        overview && Array.isArray(overview.warnings) && overview.warnings.length > 0
          ? h('details', { className: 'np-warnbar' },
            h('summary', null, tr('list.warnings', { n: overview.warnings.length })),
            h('ul', null, overview.warnings.map((warning, index) => h('li', { key: index }, warning))),
          )
          : null,

        loading
          ? h('div', { className: 'np-grid' },
            h('div', { className: 'np-skeleton' }),
            h('div', { className: 'np-skeleton' }),
            h('div', { className: 'np-skeleton' }),
          )
          : props.error
            ? h(EmptyState, {
              icon: 'alert',
              title: t('list.errorTitle'),
              hint: `${t('list.errorHint')} ${props.error}`,
              action: h('button', { type: 'button', className: 'np-btn', onClick: props.onRefresh }, h(Glyph, { name: 'refresh', size: 14 }), t('action.retry')),
            })
            : h(React.Fragment, null,
              h('h2', { className: 'np-list-title' }, t('list.title')),
              h('div', { className: 'np-toolbar' },
                h('div', { className: 'np-search' },
                  h('span', { className: 'np-ico', 'aria-hidden': 'true' }, h(Glyph, { name: 'search', size: 14 })),
                  h('input', {
                    className: 'np-input',
                    type: 'search',
                    value: query,
                    placeholder: t('list.searchPlaceholder'),
                    'aria-label': t('list.searchPlaceholder'),
                    onChange: (event) => setQuery(event.target.value),
                    spellCheck: false,
                  }),
                ),
                h('div', { className: 'np-tabs', role: 'tablist' },
                  filters.map((key) => h('button', {
                    key,
                    type: 'button',
                    role: 'tab',
                    'aria-selected': filter === key,
                    className: `np-tab${filter === key ? ' is-on' : ''}`,
                    onClick: () => setFilter(key),
                  }, `${t(`list.filter.${key}`)} ${counts[key]}`)),
                ),
                h('span', { className: 'np-toolbar__spacer' }),
                h('span', { className: 'np-count' }, tr('list.count', { n: filtered.length })),
              ),
              filtered.length === 0
                ? h(EmptyState, {
                  icon: 'box',
                  title: t('list.emptyTitle'),
                  hint: t('list.emptyHint'),
                  action: h('button', { type: 'button', className: 'np-btn np-btn--primary', onClick: props.onAdd }, h(Glyph, { name: 'plus', size: 14 }), t('action.add')),
                })
                : h('div', { className: 'np-grid' },
                  filtered.map((component) => h(ComponentCard, {
                    key: component.dir,
                    component,
                    onOpen: props.onOpen,
                  })),
                ),
            ),

        h('p', { className: 'np-footnote' }, t('page.footnote')),
        h('div', { className: 'np__actions', style: { marginTop: '12px' } },
          overview && overview.scanned
            ? h('span', { className: 'np-count' }, tr('list.scanned', { n: overview.scanned.dirs }))
            : null,
          overview && overview.npm && overview.npm.available
            ? h('span', { className: 'np-chip' }, `npm ${overview.npm.version || ''}`)
            : null,
        ),
        h(Toast, { toast: props.toast }),
      )
    }

    /* ------------------------------------------------------------ detail page */

    function DetailPage(props) {
      const [t, tr] = useText()
      const [payload, setPayload] = React.useState(null)
      const [status, setStatus] = React.useState('loading')
      const [error, setError] = React.useState('')
      const [targetVersion, setTargetVersion] = React.useState('')
      const [settings, setSettings] = React.useState(null)
      const [checks, setChecks] = React.useState([])
      const [checkInfo, setCheckInfo] = React.useState({ ran: false, at: null, npmInfo: null })
      const [busy, setBusy] = React.useState('')
      const [confirmed, setConfirmed] = React.useState(false)
      const [modalOpen, setModalOpen] = React.useState(false)
      const [infoMode, setInfoMode] = React.useState(null)
      const [result, setResult] = React.useState(null)
      const [expandedRecord, setExpandedRecord] = React.useState(null)
      const [otp, setOtp] = React.useState('')
      const [otpEnteredAt, setOtpEnteredAt] = React.useState(0)
      const [accessToken, setAccessToken] = React.useState('')
      const [showToken, setShowToken] = React.useState(false)
      const [toast, showToast] = useToast()
      const [errorDialog, setErrorDialog] = React.useState(null)
      const [downloads, setDownloads] = React.useState({ status: 'loading', points: [], total: 0, error: '' })
      const okButtonRef = React.useRef(null)
      const otpInputRef = React.useRef(null)
      const tokenInputRef = React.useRef(null)
      const payloadRef = React.useRef(null)
      const dir = props.dir

      const load = React.useCallback(async (signal) => {
        setStatus(payloadRef.current ? 'refreshing' : 'loading')
        setError('')
        try {
          const data = await apiGet(`/component?dir=${encodeURIComponent(dir)}`, signal)
          payloadRef.current = data
          setPayload(data)
          setSettings(data.settings)
          setChecks(data.checks)
          setCheckInfo({ ran: false, at: null, npmInfo: null })
          setTargetVersion((previous) => (previous && previous !== '' ? previous : data.component.version))
          setStatus('ready')
        } catch (failure) {
          if (failure && failure.name === 'AbortError') return
          setError(failure && failure.message ? failure.message : t('common.error'))
          setStatus(payloadRef.current ? 'ready' : 'error')
        }
      }, [dir, t])

      React.useEffect(() => {
        const controller = new AbortController()
        load(controller.signal)
        return () => controller.abort()
      }, [load])

      React.useEffect(() => {
        if (!modalOpen) return undefined
        const onKeyDown = (event) => {
          if (event.key === 'Escape') setModalOpen(false)
        }
        document.addEventListener('keydown', onKeyDown)
        const timer = setTimeout(() => {
          if (authMode === 'token') {
            if (tokenInputRef.current && tokenInputRef.current.value === '') tokenInputRef.current.focus()
            else if (okButtonRef.current) okButtonRef.current.focus()
          } else if (authMode === 'session') {
            if (otpInputRef.current && otpInputRef.current.value === '') otpInputRef.current.focus()
            else if (okButtonRef.current) okButtonRef.current.focus()
          } else if (okButtonRef.current) {
            okButtonRef.current.focus()
          }
        }, 30)
        return () => {
          document.removeEventListener('keydown', onKeyDown)
          clearTimeout(timer)
        }
      }, [modalOpen])

      React.useEffect(() => {
        if (!infoMode) return undefined
        const onKeyDown = (event) => {
          if (event.key === 'Escape') setInfoMode(null)
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
      }, [infoMode])

      const summary = React.useMemo(() => {
        const counts = { pass: 0, warn: 0, fail: 0, skip: 0, total: checks.length }
        for (const check of checks) {
          if (counts[check.status] !== undefined) counts[check.status] += 1
        }
        return counts
      }, [checks])

      const component = payload && payload.component ? payload.component : null
      const records = payload && Array.isArray(payload.records) ? payload.records : []
      const npmInfo = checkInfo.npmInfo
      const versionValid = validVersion(targetVersion)
      const versionDiffers = component ? targetVersion !== component.version : false
      const oidcInfo = payload && payload.auth && payload.auth.oidc ? payload.auth.oidc : { available: false, provider: null }
      const authMode = settings
        ? (settings.authMode === 'oidc' && !oidcInfo.available ? 'session' : (settings.authMode || 'session'))
        : 'session'
      const tokenReady = authMode === 'token' && validToken(accessToken)
      const packageName = payload && payload.package && payload.package.name
        ? payload.package.name
        : (component ? component.name : '')
      const isScopedPackage = packageName.startsWith('@')
      const effectiveAccess = isScopedPackage ? (settings ? settings.access : 'public') : 'public'
      const isPrerelease = typeof targetVersion === 'string' && targetVersion.includes('-')

      React.useEffect(() => {
        if (!packageName) return undefined
        const controller = new AbortController()
        setDownloads({ status: 'loading', points: [], total: 0, error: '' })
        apiGet(`/downloads?dir=${encodeURIComponent(dir)}`, controller.signal)
          .then((data) => {
            const points = Array.isArray(data.points) ? data.points : []
            setDownloads({
              status: data.unavailable ? 'unavailable' : points.length > 0 ? 'ready' : 'empty',
              points,
              total: Number(data.total) || 0,
              error: data.error || '',
            })
          })
          .catch((failure) => {
            if (failure && failure.name === 'AbortError') return
            setDownloads({
              status: 'error',
              points: [],
              total: 0,
              error: failure && failure.message ? failure.message : '',
            })
          })
        return () => controller.abort()
      }, [dir, packageName])

      const closeError = React.useCallback(() => setErrorDialog(null), [])
      const showError = React.useCallback((title, message, detail, hint) => {
        setModalOpen(false)
        setInfoMode(null)
        setErrorDialog({
          title,
          message: message || t('common.error'),
          detail,
          hint,
        })
      }, [t])

      async function saveSettings(next, silent) {
        if (!next) return
        setBusy('save')
        try {
          const data = await apiPost('/settings', { dir, settings: next })
          setSettings(data.settings)
          if (!silent) showToast('ok', t('toast.settingsSaved'))
          return data.settings
        } catch (failure) {
          showError(t('error.saveTitle'), failure && failure.message ? failure.message : t('common.error'))
          return null
        } finally {
          setBusy('')
        }
      }

      function invalidateChecks() {
        setCheckInfo({ ran: false, at: null, npmInfo: null })
      }

      function selectAuthMode(mode) {
        if (!settings) return
        setSettings({ ...settings, authMode: mode })
        setConfirmed(false)
        invalidateChecks()
      }

      function changeVersion(value) {
        setTargetVersion(value)
        setConfirmed(false)
        invalidateChecks()
      }

      function changeToken(value) {
        setAccessToken(value)
        // The token itself does not change the package checks; only refresh the
        // local token-format row so entering a token after a failed check does
        // not require a full re-run. The server re-checks at publish time.
        setChecks((previous) => previous.map((check) => check.id === 'token-format'
          ? { ...check, status: validToken(value) ? 'pass' : 'fail', detail: validToken(value) ? 'GRANULAR_TOKEN' : 'EMPTY' }
          : check))
        setCheckInfo((previous) => (previous.ran && previous.npmInfo
          ? { ...previous, npmInfo: { ...previous.npmInfo, username: null, tokenVerified: false } }
          : previous))
      }

      function openPublishDialog() {
        // The OTP is collected only in the final dialog so that the code is
        // fresh when the publish request reaches the registry.
        if (authMode === 'session') {
          setOtp('')
          setOtpEnteredAt(0)
        }
        setModalOpen(true)
      }

      async function runChecks() {
        if (!settings) return
        setBusy('checks')
        try {
          const data = await apiPost('/check', {
            dir,
            version: targetVersion,
            registry: settings.registry,
            tag: settings.tag,
            buildScript: settings.buildScript,
            authMode,
            accessToken: authMode === 'token' ? accessToken : undefined,
          })
          setChecks(Array.isArray(data.checks) ? data.checks : [])
          setCheckInfo({ ran: true, at: Date.now(), npmInfo: data.npmInfo || null })
          showToast('ok', t('toast.checkDone'))
        } catch (failure) {
          showError(t('error.checkTitle'), failure && failure.message ? failure.message : t('common.error'))
        } finally {
          setBusy('')
        }
      }

      async function publish(dryRun) {
        if (!settings) return
        setBusy(dryRun ? 'dry' : 'publish')
        setModalOpen(false)
        try {
          const data = await apiPost('/publish', {
            dir,
            version: targetVersion,
            dryRun,
            authMode: dryRun ? 'session' : authMode,
            otp: dryRun || authMode !== 'session' ? undefined : (otp || undefined),
            otpAgeMs: dryRun || authMode !== 'session' || !otp || !otpEnteredAt ? undefined : Math.max(0, Date.now() - otpEnteredAt),
            accessToken: dryRun || authMode !== 'token' ? undefined : (accessToken || undefined),
            registry: settings.registry,
            tag: settings.tag,
            access: effectiveAccess,
            buildScript: settings.buildScript,
            note: settings.note,
            dryRunFirst: settings.dryRunFirst,
            requireChecks: settings.requireChecks,
            writeVersion: settings.writeVersion,
            checksFresh: !dryRun && settings.requireChecks && checkInfo.ran && summary.fail === 0,
            checksSummary: !dryRun && settings.requireChecks && checkInfo.ran ? summary : undefined,
          }, { allowFailure: true })
          if (data.record) {
            setResult(data.record)
            setExpandedRecord(null)
          }
          if (data.ok) {
            showToast('ok', dryRun ? t('toast.dryOk') : t('toast.publishOk'))
            setConfirmed(false)
            if (!dryRun) {
              setOtp('')
              setOtpEnteredAt(0)
              setAccessToken('')
            }
          } else {
            const failureMessage = data.error
              || (data.record && data.record.message)
              || (dryRun ? t('toast.dryFail') : t('toast.publishFail'))
            const context = dryRun
              ? `${component.name}@${targetVersion} · ${settings.registry}`
              : `${component.name}@${targetVersion} · ${t(`auth.mode.${authMode}`)} · ${settings.registry}`
            showError(
              dryRun ? t('error.dryTitle') : t('error.publishTitle'),
              failureMessage,
              context,
              t('error.publishHint'),
            )
            if (Array.isArray(data.checks) && data.checks.length > 0) {
              setChecks(data.checks)
              setCheckInfo({ ran: true, at: Date.now(), npmInfo: checkInfo.npmInfo })
            }
            if (data.otpRequired === true) {
              setOtp('')
              setOtpEnteredAt(0)
            }
          }
          try {
            const fresh = await apiGet(`/component?dir=${encodeURIComponent(dir)}`)
            payloadRef.current = fresh
            setPayload(fresh)
            setSettings(fresh.settings)
            if (!data.ok) setChecks(Array.isArray(data.checks) && data.checks.length > 0 ? data.checks : fresh.checks)
            if (data.ok) {
              setChecks(fresh.checks)
              setCheckInfo({ ran: false, at: null, npmInfo: null })
            }
            setTargetVersion(fresh.component.version)
          } catch {
            // The publish result is already on screen; a refresh failure must
            // not replace it with a misleading "publish failed" dialog.
          }
        } catch (failure) {
          showError(t('error.publishTitle'), failure && failure.message ? failure.message : t('common.error'))
        } finally {
          setBusy('')
        }
      }

      async function publishInTerminal() {
        if (!settings) return
        setModalOpen(false)
        setOtp('')
        setOtpEnteredAt(0)
        setBusy('terminal')
        try {
          const data = await apiPost('/publish-terminal', {
            dir,
            version: targetVersion,
            authMode,
            registry: settings.registry,
            tag: settings.tag,
            access: effectiveAccess,
            buildScript: settings.buildScript,
            note: settings.note,
            requireChecks: settings.requireChecks,
            checksFresh: settings.requireChecks && checkInfo.ran && summary.fail === 0,
            checksSummary: settings.requireChecks && checkInfo.ran ? summary : undefined,
            writeVersion: settings.writeVersion,
          }, { allowFailure: true })
          if (data.record) {
            setResult(data.record)
            setExpandedRecord(null)
          }
          if (data.ok) {
            showToast('ok', t('toast.publishOk'))
            setConfirmed(false)
          } else {
            showError(
              t('error.terminalTitle'),
              data.error || t('toast.publishFail'),
              `${component.name}@${targetVersion}`,
              t('error.terminalHint'),
            )
          }
          try {
            const fresh = await apiGet(`/component?dir=${encodeURIComponent(dir)}`)
            payloadRef.current = fresh
            setPayload(fresh)
            setSettings(fresh.settings)
            setChecks(fresh.checks)
            setCheckInfo({ ran: false, at: null, npmInfo: null })
            setTargetVersion(fresh.component.version)
          } catch {
            // Keep the terminal result visible.
          }
        } catch (failure) {
          showError(
            t('error.terminalTitle'),
            failure && failure.message ? failure.message : t('common.error'),
            undefined,
            t('error.terminalHint'),
          )
        } finally {
          setBusy('')
        }
      }

      let blocked = ''
      if (!settings) blocked = t('common.loading')
      else if (!versionValid) blocked = t('execute.invalidVersion')
      else if (authMode === 'token' && !tokenReady) blocked = t('auth.needToken')
      else if (settings.requireChecks && !checkInfo.ran) blocked = t('execute.needChecks')
      else if (settings.requireChecks && summary.fail > 0) {
        blocked = checks.some((check) => check.id === 'npm-auth' && check.status === 'fail')
          ? t('execute.authHint')
          : t('execute.blockedHint')
      }
      else if (!confirmed) blocked = t('execute.needConfirm')

      if (status === 'loading' && !component) {
        return h('div', { className: 'np__inner' },
          h('div', { className: 'np-actions', style: { marginBottom: '16px' } },
            h('button', { type: 'button', className: 'np-btn np-btn--ghost np-btn--small', onClick: props.onBack }, h(Glyph, { name: 'back', size: 13 }), t('action.back')),
          ),
          h('div', { className: 'np-skeleton np-skeleton--wide' }),
          h('div', { style: { height: '16px' } }),
          h('div', { className: 'np-skeleton', style: { height: '320px' } }),
          h(Toast, { toast }),
        )
      }

      if (error && !component) {
        return h('div', { className: 'np__inner' },
          h('div', { className: 'np-actions', style: { marginBottom: '16px' } },
            h('button', { type: 'button', className: 'np-btn np-btn--ghost np-btn--small', onClick: props.onBack }, h(Glyph, { name: 'back', size: 13 }), t('action.back')),
          ),
          h(EmptyState, {
            icon: 'alert',
            title: t('list.errorTitle'),
            hint: error,
            action: h('button', { type: 'button', className: 'np-btn', onClick: () => load() }, h(Glyph, { name: 'refresh', size: 14 }), t('action.retry')),
          }),
          h(Toast, { toast }),
        )
      }

      if (!component || !settings) return null

      const recordSummary = component.lastPublish || null
      const npmUrl = packageName ? `https://www.npmjs.com/package/${packageName}` : ''

      return h('div', { className: 'np__inner' },
        h('div', { className: 'np-detail__head' },
          h('div', { className: 'np-actions' },
            h('button', { type: 'button', className: 'np-btn np-btn--ghost np-btn--small', onClick: props.onBack }, h(Glyph, { name: 'back', size: 13 }), t('action.back')),
            h('button', {
              type: 'button',
              className: 'np-btn np-btn--ghost np-btn--small',
              onClick: () => load(),
              disabled: status === 'refreshing',
            }, h(Glyph, { name: 'refresh', size: 13, className: status === 'refreshing' ? 'np-spin' : undefined }), status === 'refreshing' ? t('action.refreshing') : t('action.refresh')),
          ),
          h('div', { className: 'np-identity' },
            h('span', { className: 'np-identity__icon' },
              component.icon && component.icon.dataUrl
                ? h('img', { src: component.icon.dataUrl, alt: '' })
                : h(PageMark, { size: 48 }),
            ),
            h('div', { className: 'np-identity__main' },
              h('h1', { className: 'np-identity__title' }, component.title || component.name),
              h('div', { className: 'np-identity__meta' },
                h('span', { className: 'np-mono' }, packageName),
                h('span', { className: 'np-chip' }, `v${component.version}`),
                h(StatusTag, { status: component.status }),
                h('span', { className: 'np-chip' }, t(`badge.${component.kind}`)),
              ),
              h('div', { className: 'np-identity__meta' },
                h('span', { className: 'np-path np-mono' }, h(Glyph, { name: 'folder', size: 12 }), component.path),
              ),
            ),
          ),
        ),

        error ? h('div', { className: 'np-warnbar', role: 'status' }, error) : null,
        component.private ? h('div', { className: 'np-warnbar', role: 'status' }, t('hint.currentPrivate')) : null,
        payload && payload.allowPublish === false ? h('div', { className: 'np-warnbar', role: 'status' }, t('execute.allowDisabled')) : null,

        h('div', { className: 'np-detail__grid' },
          h('div', { className: 'np-flow' },
            h(FlowSection, {
              index: 1,
              title: t('section.version.title'),
              hint: t('section.version.subtitle'),
            },
              h('div', { className: 'np-row' },
                h('div', { className: 'np-field' },
                  h('span', { className: 'np-label' }, t('field.currentVersion')),
                  h('span', { className: 'np-current' }, `v${component.version || '0.0.0'}`),
                ),
                h('div', { className: 'np-field' },
                  h('label', { className: 'np-label', htmlFor: 'np-target-version' }, t('field.targetVersion')),
                  h('div', { className: 'np-version-row' },
                    h('div', { className: 'np-field' },
                      h('input', {
                        id: 'np-target-version',
                        className: 'np-input np-mono',
                        value: targetVersion,
                        onChange: (event) => changeVersion(event.target.value),
                        spellCheck: false,
                        autoComplete: 'off',
                      }),
                    ),
                    h('div', { className: 'np-bumps' },
                      ['patch', 'minor', 'major'].map((kind) => h('button', {
                        key: kind,
                        type: 'button',
                        className: 'np-btn np-btn--small',
                        onClick: () => changeVersion(bumpVersion(targetVersion || component.version, kind)),
                      }, t(`bump.${kind}`))),
                    ),
                  ),
                  h('span', { className: 'np-hint' }, versionDiffers ? tr('hint.versionWillUpdate', { version: targetVersion }) : t('hint.versionSame')),
                  isPrerelease && settings.tag === 'latest'
                    ? h('span', { className: 'np-hint np-hint--warn' }, t('hint.prereleaseTag'))
                    : null,
                ),
              ),
              h('div', { className: 'np-row' },
                h('div', { className: 'np-field' },
                  h('label', { className: 'np-label', htmlFor: 'np-tag' }, t('field.tag')),
                  h('select', {
                    id: 'np-tag',
                    className: 'np-select',
                    value: settings.tag,
                    onChange: (event) => {
                      setSettings({ ...settings, tag: event.target.value })
                      setConfirmed(false)
                    },
                  }, ['latest', 'beta', 'next', 'alpha', 'canary'].map((tag) => h('option', { key: tag, value: tag }, tag))),
                ),
                h('div', { className: 'np-field' },
                  h('label', { className: 'np-label', htmlFor: 'np-access' }, t('field.access')),
                  h('select', {
                    id: 'np-access',
                    className: 'np-select',
                    value: effectiveAccess,
                    onChange: (event) => {
                      setSettings({ ...settings, access: event.target.value })
                      setConfirmed(false)
                    },
                  }, (isScopedPackage ? ['public', 'restricted'] : ['public']).map((access) => h('option', { key: access, value: access }, access))),
                  isScopedPackage ? null : h('span', { className: 'np-hint' }, t('access.unscoped')),
                ),
              ),
              h('span', { className: 'np-hint' }, t('hint.targetVersion')),
            ),

            h(FlowSection, {
              index: 2,
              title: t('section.target.title'),
              hint: t('section.target.subtitle'),
              action: h('button', {
                type: 'button',
                className: 'np-btn np-btn--small',
                disabled: busy === 'save',
                onClick: () => saveSettings({ ...settings, authMode, access: effectiveAccess }, false),
              }, busy === 'save' ? t('action.saving') : t('action.saveSettings')),
            },
              h('div', { className: 'np-row' },
                h('div', { className: 'np-field' },
                  h('label', { className: 'np-label', htmlFor: 'np-registry' }, t('field.registry')),
                  h('input', {
                    id: 'np-registry',
                    className: 'np-input np-mono',
                    value: settings.registry,
                    onChange: (event) => {
                      setSettings({ ...settings, registry: event.target.value })
                      setConfirmed(false)
                      invalidateChecks()
                    },
                    spellCheck: false,
                    autoComplete: 'off',
                  }),
                  h('span', { className: 'np-hint' }, t('hint.registry')),
                ),
                h('div', { className: 'np-field' },
                  h('label', { className: 'np-label', htmlFor: 'np-build' }, t('field.buildScript')),
                  h('input', {
                    id: 'np-build',
                    className: 'np-input np-mono',
                    value: settings.buildScript,
                    placeholder: 'build',
                    onChange: (event) => {
                      setSettings({ ...settings, buildScript: event.target.value })
                      invalidateChecks()
                    },
                    spellCheck: false,
                    autoComplete: 'off',
                  }),
                  h('span', { className: 'np-hint' }, t('hint.buildScript')),
                ),
              ),
              h('div', { className: 'np-toggles' },
                h(Toggle, {
                  checked: settings.requireChecks,
                  onChange: (value) => setSettings({ ...settings, requireChecks: value }),
                  label: t('toggle.requireChecks'),
                  hint: t('toggle.requireChecks.hint'),
                }),
                h(Toggle, {
                  checked: settings.dryRunFirst,
                  onChange: (value) => setSettings({ ...settings, dryRunFirst: value }),
                  label: t('toggle.dryRunFirst'),
                  hint: t('toggle.dryRunFirst.hint'),
                }),
                h(Toggle, {
                  checked: settings.writeVersion,
                  onChange: (value) => setSettings({ ...settings, writeVersion: value }),
                  label: t('toggle.writeVersion'),
                  hint: t('toggle.writeVersion.hint'),
                }),
              ),
              h('div', { className: 'np-field' },
                h('label', { className: 'np-label', htmlFor: 'np-note' }, t('field.note')),
                h('textarea', {
                  id: 'np-note',
                  className: 'np-textarea',
                  value: settings.note,
                  rows: 3,
                  maxLength: 500,
                  onChange: (event) => setSettings({ ...settings, note: event.target.value }),
                  placeholder: t('hint.note'),
                }),
              ),
            ),

            h(FlowSection, {
              index: 3,
              title: t('section.checks.title'),
              hint: t('section.checks.subtitle'),
              action: h('button', {
                type: 'button',
                className: 'np-btn np-btn--small',
                disabled: busy === 'checks',
                onClick: runChecks,
              }, h(Glyph, { name: 'check', size: 12, className: busy === 'checks' ? 'np-spin' : undefined }), busy === 'checks' ? t('action.runningChecks') : t('action.runChecks')),
            },
              h('div', { className: 'np-checks__summary' },
                h('div', { className: 'np-checks__counts' },
                  h('span', { className: 'is-ok' }, `${summary.pass} ✓`),
                  h('span', { className: 'is-warn' }, `${summary.warn} !`),
                  h('span', { className: 'is-fail' }, `${summary.fail} ✕`),
                ),
                h('span', { className: 'np-hint' }, checkInfo.ran ? tr('checks.ranAt', { time: formatTime(checkInfo.at) }) : t('checks.notRun')),
              ),
              checks.length === 0
                ? h('p', { className: 'np-hint' }, t('checks.none'))
                : h('div', { className: 'np-checks' },
                  checks.map((check) => h(CheckRow, { key: check.id, check })),
                ),
              npmInfo
                ? h('div', { className: 'np-hint' },
                  `${t('synopsis.npm')}: ${npmInfo.username ? tr('synopsis.npmUser', { name: npmInfo.username }) : t('synopsis.npmUnknown')} · ${npmInfo.registry}`,
                )
                : null,
            ),

            h(FlowSection, {
              index: 4,
              title: t('section.execute.title'),
              hint: t('section.execute.subtitle'),
            },
              h('div', { className: 'np-authnotice' },
                h(Glyph, { name: 'lock', size: 13 }),
                h('span', null, t('auth.legacyShort')),
              ),
              h('div', { className: 'np-field' },
                h('span', { className: 'np-label' }, t('auth.title')),
                h('div', { className: 'np-authmodes', role: 'radiogroup', 'aria-label': t('auth.title') },
                  ['session', 'token', 'oidc'].map((id) => {
                    const unavailable = id === 'oidc' && !oidcInfo.available
                    const selected = authMode === id
                    return h('button', {
                      key: id,
                      type: 'button',
                      role: 'radio',
                      'aria-checked': selected,
                      disabled: unavailable,
                      className: `np-authmode${selected ? ' is-on' : ''}`,
                      onClick: () => selectAuthMode(id),
                    },
                      h('span', { className: 'np-authmode__radio', 'aria-hidden': 'true' }, selected ? h(Glyph, { name: 'check', size: 11 }) : null),
                      h('span', { className: 'np-authmode__body' },
                        h('span', { className: 'np-authmode__title' },
                          t(`auth.${id}.title`),
                          h('span', { className: 'np-chip np-chip--accent' }, t(`auth.${id}.badge`)),
                        ),
                        h('span', { className: 'np-authmode__desc' }, t(`auth.${id}.desc`)),
                        unavailable ? h('span', { className: 'np-authmode__note' }, t('auth.oidcNotHere')) : null,
                      ),
                    )
                  }),
                ),
                h('div', { className: 'np-authhelp' },
                  ['session', 'token', 'oidc'].map((id) => h('button', {
                    key: id,
                    type: 'button',
                    className: 'np-btn np-btn--small np-authhelp__btn',
                    onClick: () => setInfoMode(id),
                  }, h(Glyph, { name: 'info', size: 12 }), t(`auth.${id}.infoButton`))),
                ),
              ),
              authMode === 'session'
                ? h('div', { className: 'np-field' }, h('span', { className: 'np-hint' }, t('hint.otpFinal')))
                : null,
              authMode === 'token'
                ? h('div', { className: 'np-field' },
                  h('label', { className: 'np-label', htmlFor: 'np-token' }, t('field.accessToken')),
                  h('div', { className: 'np-tokenrow' },
                    h('input', {
                      id: 'np-token',
                      className: 'np-input np-mono',
                      type: showToken ? 'text' : 'password',
                      value: accessToken,
                      placeholder: t('auth.tokenPlaceholder'),
                      autoComplete: 'off',
                      spellCheck: false,
                      onChange: (event) => changeToken(event.target.value.replace(/\s+/g, '')),
                    }),
                    h('button', {
                      type: 'button',
                      className: 'np-btn np-btn--small',
                      onClick: () => setShowToken((value) => !value),
                    }, showToken ? t('auth.hideToken') : t('auth.showToken')),
                  ),
                  h('span', { className: 'np-hint' }, t('auth.tokenHint')),
                )
                : null,
              h('div', { className: 'np-authstatus' },
                statusGlyph(
                  authMode === 'session'
                    ? (npmInfo && npmInfo.username ? 'pass' : 'warn')
                    : authMode === 'token'
                      ? (tokenReady && npmInfo && npmInfo.tokenVerified === true ? 'pass' : 'warn')
                      : (oidcInfo.available ? 'pass' : 'warn'),
                ),
                h('span', null,
                  authMode === 'session'
                    ? (npmInfo && npmInfo.username
                      ? tr('auth.sessionUser', { name: npmInfo.username })
                      : checkInfo.ran ? t('auth.sessionSignedOut') : t('auth.sessionIdle'))
                    : authMode === 'token'
                      ? (!tokenReady
                        ? t('auth.needToken')
                        : npmInfo && npmInfo.tokenVerified === true && npmInfo.username
                          ? tr('auth.tokenUser', { name: npmInfo.username })
                          : t('auth.tokenUnverified'))
                      : (oidcInfo.available
                        ? tr('auth.oidcReady', { provider: oidcInfo.provider ? t(`auth.oidcProvider.${oidcInfo.provider}`) : t('auth.oidc.title') })
                        : t('auth.oidcUnavailable')),
                ),
              ),

              h('div', { className: 'np-summary' },
                h('div', null, h('code', null, `${packageName}@${targetVersion || component.version}`)),
                h('div', null, `${t('field.registry')}: ${settings.registry}`),
                h('div', null, `${t('field.tag')}: ${settings.tag} · ${t('field.access')}: ${effectiveAccess} · ${t('auth.title')}: ${t(`auth.mode.${authMode}`)}`),
                h('div', null, `${t('execute.modePublish')}${settings.dryRunFirst ? ` · ${t('execute.dryFirstNote')}` : ''}`),
              ),

              h(Toggle, {
                checked: confirmed,
                onChange: setConfirmed,
                label: t('execute.confirmLabel'),
                hint: t('execute.confirmHint'),
              }),

              h('div', { className: 'np-actions' },
                h('button', {
                  type: 'button',
                  className: 'np-btn',
                  disabled: busy !== '' || !versionValid,
                  onClick: () => publish(true),
                }, h(Glyph, { name: 'play', size: 13 }), busy === 'dry' ? t('action.dryRunning') : t('action.dryRun')),
                h('button', {
                  type: 'button',
                  className: 'np-btn np-btn--primary',
                  disabled: busy !== '' || blocked !== '',
                  onClick: openPublishDialog,
                }, h(Glyph, { name: 'upload', size: 13 }), busy === 'terminal' ? t('action.terminalWaiting') : busy === 'publish' ? t('action.publishing') : t('action.publish')),
                blocked
                  ? h('span', { className: 'np-hint' }, blocked)
                  : h('span', { className: 'np-hint' }, t('hint.targetVersion')),
              ),
              result
                ? h('div', { className: 'np-result' },
                  h('div', { className: 'np-result__head' },
                    statusGlyph(result.ok ? 'pass' : 'fail'),
                    h('span', null, t('execute.resultTitle')),
                    h('span', { className: `np-chip ${result.ok ? 'np-chip--ok' : 'np-chip--fail'}` }, result.ok ? t('execute.resultOk') : t('execute.resultFail')),
                    result.authMode && !result.dryRun ? h('span', { className: 'np-chip' }, t(`auth.mode.${result.authMode}`)) : null,
                    result.terminal ? h('span', { className: 'np-chip np-chip--accent' }, t('record.terminal')) : null,
                    h('span', { className: 'np-count' }, `v${result.version} · ${formatDuration(result.durationMs)}`),
                    h('button', {
                      type: 'button',
                      className: 'np-result__close',
                      title: t('action.close'),
                      'aria-label': t('action.close'),
                      onClick: () => setResult(null),
                    }, h(Glyph, { name: 'close', size: 12 })),
                  ),
                  Array.isArray(result.logs) && result.logs.length > 0
                    ? result.logs.map((log, index) => h('div', { key: index },
                      h('div', { className: 'np-result__cmd' }, `$ ${log.command}`),
                      h('pre', { className: 'np-log' }, log.output || t('execute.outputEmpty')),
                    ))
                    : h('pre', { className: 'np-log' }, result.message || t('execute.outputEmpty')),
                )
                : null,
            ),
          ),

          h('aside', { className: 'np-rail' },
            h('button', {
              type: 'button',
              className: 'np-btn np-btn--primary np-rail-action',
              disabled: busy !== '',
              onClick: runChecks,
            }, h(Glyph, { name: 'check', size: 14, className: busy === 'checks' ? 'np-spin' : undefined }), busy === 'checks' ? t('action.runningChecks') : t('action.runChecks')),
            h('section', { className: 'np-railcard' },
              h('h2', { className: 'np-railcard__title' }, t('detail.synopsis')),
              h('dl', { className: 'np-dl' },
                h('dt', null, t('synopsis.package')),
                h('dd', { className: 'np-mono' }, packageName),
                h('dt', null, t('synopsis.version')),
                h('dd', null, `v${component.version}`),
                h('dt', null, t('synopsis.records')),
                h('dd', null, String(records.length)),
                h('dt', null, t('synopsis.lastPublish')),
                h('dd', null, recordSummary ? `v${recordSummary.version} · ${formatDateTime(recordSummary.at)}` : t('synopsis.never')),
                h('dt', null, t('synopsis.npm')),
                h('dd', null, npmInfo ? (npmInfo.username ? tr('synopsis.npmUser', { name: npmInfo.username }) : t('synopsis.npmUnknown')) : t('synopsis.npmIdle')),
              ),
            ),
            h('section', { className: 'np-railcard' },
              h('h2', { className: 'np-railcard__title' }, t('npmInfo.title')),
              h('div', { className: 'np-railcard__body' },
                h('code', { className: 'np-railcard__pkg' }, packageName || '—'),
                h('span', { className: 'np-railcard__hint' }, t('npmInfo.hint')),
                h(DownloadBars, {
                  status: downloads.status,
                  points: downloads.points,
                  total: downloads.total,
                  error: downloads.error,
                }),
                npmUrl
                  ? h('a', {
                    className: 'np-btn np-btn--small np-railcard__action',
                    href: npmUrl,
                    target: '_blank',
                    rel: 'noreferrer noopener',
                  }, h(Glyph, { name: 'external', size: 13 }), t('npmInfo.open'))
                  : h('button', { type: 'button', className: 'np-btn np-btn--small np-railcard__action', disabled: true }, h(Glyph, { name: 'external', size: 13 }), t('npmInfo.open')),
              ),
            ),
            h('section', { className: 'np-railcard' },
              h('h2', { className: 'np-railcard__title' },
                t('detail.records'),
                h('span', { className: 'np-count' }, String(records.length)),
              ),
              records.length === 0
                ? h(EmptyState, { small: true, icon: 'clock', title: t('detail.noRecords'), hint: t('detail.noRecordsHint') })
                : h('div', { className: 'np-records' },
                  records.map((record) => {
                    const expanded = expandedRecord === record.id
                    return h('article', { key: record.id, className: `np-record np-record--${record.ok ? 'ok' : 'fail'}` },
                      h('span', { className: 'np-record__dot', 'aria-hidden': 'true' }),
                      h('div', { className: 'np-record__top' },
                        h('span', { className: 'np-record__version' }, `v${record.version}`),
                        h('span', { className: `np-chip ${record.dryRun ? '' : 'np-chip--accent'}` }, record.dryRun ? t('record.mode.dry') : t('record.mode.publish')),
                        h('span', { className: `np-chip ${record.ok ? 'np-chip--ok' : 'np-chip--fail'}` }, record.ok ? t('record.ok') : t('record.fail')),
                        record.authMode && !record.dryRun ? h('span', { className: 'np-chip' }, t(`auth.mode.${record.authMode}`)) : null,
                        record.otpProvided ? h('span', { className: 'np-chip np-chip--accent' }, t('record.otp')) : null,
                        record.terminal ? h('span', { className: 'np-chip np-chip--accent' }, t('record.terminal')) : null,
                        record.name && record.name !== packageName ? h('span', { className: 'np-chip', title: record.name }, record.name) : null,
                      ),
                      h('div', { className: 'np-record__time' },
                        `${formatDateTime(record.at)} · ${formatDuration(record.durationMs)} · ${record.tag}/${record.access}`,
                      ),
                      record.stage && record.stage !== 'publish' ? h('div', { className: 'np-record__note' }, t(`stage.${record.stage}`)) : null,
                      record.note ? h('div', { className: 'np-record__note' }, record.note) : null,
                      record.message ? h('div', { className: 'np-record__note' }, record.message) : null,
                      Array.isArray(record.logs) && record.logs.length > 0
                        ? h('div', { className: 'np-record__logs' },
                          h('button', {
                            type: 'button',
                            className: 'np-record__toggle',
                            onClick: () => setExpandedRecord(expanded ? null : record.id),
                          }, expanded ? t('record.hideLog') : tr('record.showLog', { n: record.logs.length })),
                          expanded
                            ? record.logs.map((log, index) => h('div', { key: index },
                              h('div', { className: 'np-result__cmd' }, `$ ${log.command}`),
                              h('pre', { className: 'np-log' }, log.output || t('execute.outputEmpty')),
                            ))
                            : null,
                        )
                        : null,
                    )
                  }),
                ),
            ),
          ),
        ),

        modalOpen
          ? h('div', {
            className: 'np-modal',
            role: 'presentation',
            onMouseDown: (event) => {
              if (event.target === event.currentTarget) setModalOpen(false)
            },
          },
            h('div', { className: 'np-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'np-publish-title' },
              h('h2', { id: 'np-publish-title' }, t('modal.publishTitle')),
              h('p', null, tr('modal.publishBody', { name: packageName, version: targetVersion, registry: settings.registry })),
              h('div', { className: 'np-modal__auth' },
                h('div', { className: 'np-authmode__title' },
                  `${t('auth.title')} · ${t(`auth.mode.${authMode}`)}`,
                ),
                authMode === 'session'
                  ? h('div', { className: 'np-field' },
                    h('label', { className: 'np-label', htmlFor: 'np-modal-otp' }, t('field.otp')),
                    h('input', {
                      id: 'np-modal-otp',
                      ref: otpInputRef,
                      className: 'np-input np-mono',
                      value: otp,
                      inputMode: 'numeric',
                      maxLength: 8,
                      autoComplete: 'one-time-code',
                      placeholder: '123456',
                      onChange: (event) => {
                        const value = event.target.value.replace(/[^0-9]/g, '')
                        setOtp(value)
                        setOtpEnteredAt(value === '' ? 0 : Date.now())
                      },
                    }),
                    h('span', { className: 'np-hint' }, t('modal.otpHint')),
                  )
                  : authMode === 'token'
                    ? h('div', { className: 'np-field' },
                      h('label', { className: 'np-label', htmlFor: 'np-modal-token' }, t('field.accessToken')),
                      h('input', {
                        id: 'np-modal-token',
                        ref: tokenInputRef,
                        className: 'np-input np-mono',
                        type: 'password',
                        value: accessToken,
                        placeholder: t('auth.tokenPlaceholder'),
                        autoComplete: 'off',
                        spellCheck: false,
                        onChange: (event) => changeToken(event.target.value.replace(/\s+/g, '')),
                      }),
                      h('span', { className: 'np-hint' }, t('auth.tokenHint')),
                    )
                    : h('div', { className: 'np-authstatus' },
                      statusGlyph(oidcInfo.available ? 'pass' : 'warn'),
                      h('span', null, oidcInfo.available
                        ? tr('auth.oidcReady', { provider: oidcInfo.provider ? t(`auth.oidcProvider.${oidcInfo.provider}`) : t('auth.oidc.title') })
                        : t('auth.oidcUnavailable')),
                    ),
              ),
              h('p', { className: 'np-hint' }, tr('modal.authNote', { mode: t(`auth.mode.${authMode}`) })),
              authMode === 'session' && settings.buildScript ? h('p', { className: 'np-hint' }, t('modal.buildBeforeOtp')) : null,
              authMode === 'session' ? h('p', { className: 'np-hint' }, t('modal.terminalHint')) : null,
              blocked ? h('p', { className: 'np-hint' }, blocked) : null,
              h('p', { className: 'np-dialog__warn' }, t('modal.publishWarning')),
              settings.dryRunFirst && !records.some((record) => record.dryRun === true)
                ? h('p', { className: 'np-hint' }, t('modal.dryFirstHint'))
                : null,
              h('div', { className: 'np-dialog__actions np-dialog__actions--split' },
                h('button', {
                  type: 'button',
                  className: 'np-btn np-btn--ghost',
                  onClick: () => setModalOpen(false),
                }, t('action.reconsider')),
                h('div', { className: 'np-dialog__actions-right' },
                  authMode === 'session'
                    ? h('button', {
                      type: 'button',
                      className: 'np-btn np-btn--primary',
                      disabled: busy !== '' || blocked !== '',
                      onClick: publishInTerminal,
                    }, h(Glyph, { name: 'terminal', size: 13 }), busy === 'terminal' ? t('action.terminalWaiting') : t('action.publishTerminal'))
                    : null,
                  h('button', {
                    type: 'button',
                    className: authMode === 'session' ? 'np-btn' : 'np-btn np-btn--primary',
                    ref: okButtonRef,
                    disabled: busy !== '' || blocked !== '',
                    onClick: () => publish(false),
                  },
                    authMode === 'session' ? h(Glyph, { name: 'upload', size: 13 }) : null,
                    authMode === 'session' ? t('modal.otpPublish') : t('modal.publishOk'),
                  ),
                ),
              ),
            ),
          )
          : null,

        infoMode
          ? h('div', {
            className: 'np-modal',
            role: 'presentation',
            onMouseDown: (event) => {
              if (event.target === event.currentTarget) setInfoMode(null)
            },
          },
            h('div', { className: 'np-dialog np-dialog--info', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'np-info-title' },
              h('div', { className: 'np-info__head' },
                h('h2', { id: 'np-info-title' }, t(`authInfo.${infoMode}.title`)),
                h('button', {
                  type: 'button',
                  className: 'np-btn np-btn--ghost np-btn--small',
                  'aria-label': t('action.close'),
                  onClick: () => setInfoMode(null),
                }, h(Glyph, { name: 'close', size: 13 })),
              ),
              h('p', { className: 'np-info__intro' }, t(`authInfo.${infoMode}.intro`)),
              h('h3', { className: 'np-info__title' }, t('authInfo.flow')),
              h('ol', { className: 'np-info__steps' },
                [1, 2, 3, 4, 5].map((step) => h('li', { key: step }, t(`authInfo.${infoMode}.step${step}`))),
              ),
              h('h3', { className: 'np-info__title' }, t('authInfo.key')),
              h('ul', { className: 'np-info__keys' },
                [1, 2, 3, 4, 5].map((key) => h('li', { key }, t(`authInfo.${infoMode}.key${key}`))),
              ),
              h('div', { className: 'np-info__actions' },
                h('button', { type: 'button', className: 'np-btn np-btn--ghost', onClick: () => setInfoMode(null) }, t('action.close')),
                h('button', {
                  type: 'button',
                  className: 'np-btn np-btn--primary',
                  disabled: infoMode === 'oidc' && !oidcInfo.available,
                  autoFocus: true,
                  onClick: () => {
                    selectAuthMode(infoMode)
                    setInfoMode(null)
                  },
                }, t('authInfo.use')),
              ),
            ),
          )
          : null,

        errorDialog
          ? h(ErrorDialog, {
            title: errorDialog.title,
            message: errorDialog.message,
            detail: errorDialog.detail,
            hint: errorDialog.hint,
            onClose: closeError,
          })
          : null,

        h(Toast, { toast }),
      )
    }

    /* ------------------------------------------------------------------- page */

    function Page() {
      const [overview, setOverview] = React.useState(null)
      const [status, setStatus] = React.useState('loading')
      const [error, setError] = React.useState('')
      const [view, setView] = React.useState({ name: 'list', dir: null })
      const [adding, setAdding] = React.useState(false)
      const [toast, showToast] = useToast()
      const overviewRef = React.useRef(null)

      const load = React.useCallback(async (options = {}) => {
        setStatus(overviewRef.current ? 'refreshing' : 'loading')
        setError('')
        try {
          const data = await apiGet(`?refresh=${options.force === true ? '1' : '0'}`, options.signal)
          overviewRef.current = data
          setOverview(data)
          setStatus('ready')
        } catch (failure) {
          if (failure && failure.name === 'AbortError') return
          setError(failure && failure.message ? failure.message : tr('common.error'))
          setStatus('error')
        }
      }, [])

      React.useEffect(() => {
        const controller = new AbortController()
        load({ signal: controller.signal })
        return () => controller.abort()
        // The first load only; later refreshes are explicit.
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])

      const openDetail = React.useCallback((dir) => {
        setView({ name: 'detail', dir })
        setStatus('ready')
      }, [])

      const back = React.useCallback(() => {
        setView({ name: 'list', dir: null })
        load({ force: true })
      }, [load])

      async function addComponent() {
        const service = runtimeCtx ? runtimeCtx.get('uiWorkspace') : null
        if (!service || typeof service.pickDirectory !== 'function') {
          showToast('error', tr('common.unknown'))
          return
        }
        setAdding(true)
        try {
          const picked = await service.pickDirectory()
          if (!picked) return
          await apiPost('/targets', { action: 'add', dir: picked })
          showToast('ok', tr('toast.added'))
          await load({ force: true })
        } catch (failure) {
          showToast('error', failure && failure.message ? failure.message : tr('common.error'))
        } finally {
          setAdding(false)
        }
      }

      return h('div', { className: 'np' },
        h('style', null, STYLES),
        view.name === 'detail'
          ? h(DetailPage, { key: view.dir, dir: view.dir, onBack: back })
          : h('div', { className: 'np__inner' },
            h(ListPage, {
              overview,
              status,
              error,
              adding,
              toast,
              onOpen: openDetail,
              onRefresh: () => load({ force: true }),
              onAdd: addComponent,
            }),
          ),
      )
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        runtimeCtx = ctx
        localeService = ctx.get('locale')

        if (localeService && typeof localeService.register === 'function') {
          const zhCodes = ['zh', 'zh-CN', 'zh-Hans', 'zh-Hant', 'zh-TW', 'zh-HK']
          const enCodes = ['en', 'en-US', 'en-GB']
          for (const code of zhCodes) {
            ctx.effect(() => localeService.register(NS, code, DICTIONARIES.zh), `nanshan-publish-manager: ${code} strings`)
          }
          for (const code of enCodes) {
            ctx.effect(() => localeService.register(NS, code, DICTIONARIES.en), `nanshan-publish-manager: ${code} strings`)
          }
        }

        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 50,
          label: () => localized('nav.title'),
        }, function PublishManagerIcon(props) {
          return h(PanelIcon, { size: typeof props?.size === 'number' ? props.size : 16 })
        }))

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
        }, Page))
      },
    }
  },
})
