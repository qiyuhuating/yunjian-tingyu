package chat.cloudlet.phone;
import android.Manifest;
import android.app.Activity;
import android.content.*;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.*;
import android.speech.tts.*;
import android.util.Base64;
import android.webkit.*;
import android.widget.Toast;
import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;

public final class MainActivity extends Activity {
    private static final String HOST="appassets.androidplatform.net";
    private WebView web;
    private ValueCallback<Uri[]> picker;
    private PermissionRequest mediaPermission;
    private final ExecutorService workers=Executors.newFixedThreadPool(4);
    private final ConcurrentHashMap<String,HttpsJob> jobs=new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String,File> downloads=new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String,String[]> downloadInfo=new ConcurrentHashMap<>();
    private final ArrayDeque<String> readyExports=new ArrayDeque<>();
    private File exportFile; private String exportId; private boolean recoveringPicker;
    private TextToSpeech tts; private volatile boolean ttsReady;
    private static final class HttpsJob { volatile boolean cancelled; volatile HttpURLConnection connection; }
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        BrowserIntegration.install(getApplication());
        if(!compatibleWebView())return;
        getWindow().setFlags(android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN,android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN);
        // Allow the wallpaper and the WebView to cover the camera cutout zone.
        // Android 11+ supports ALWAYS; API 28-29 use SHORT_EDGES.
        if(Build.VERSION.SDK_INT>=28){
            android.view.WindowManager.LayoutParams layout=getWindow().getAttributes();
            layout.layoutInDisplayCutoutMode=Build.VERSION.SDK_INT>=30
                ?android.view.WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
                :android.view.WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(layout);
        }
        getWindow().setNavigationBarColor(android.graphics.Color.rgb(242,246,248));
        web=new WebView(this);android.widget.FrameLayout frame=new android.widget.FrameLayout(this);frame.addView(web,new android.widget.FrameLayout.LayoutParams(-1,-1));setContentView(frame);
        frame.setOnApplyWindowInsetsListener((v,insets)->{int bottom=Build.VERSION.SDK_INT>=30?Math.max(insets.getInsets(android.view.WindowInsets.Type.navigationBars()).bottom,insets.getInsets(android.view.WindowInsets.Type.ime()).bottom):insets.getSystemWindowInsetBottom();int left=0,top=0,right=0;if(Build.VERSION.SDK_INT>=28&&insets.getDisplayCutout()!=null){android.view.DisplayCutout cutout=insets.getDisplayCutout();left=cutout.getSafeInsetLeft();right=cutout.getSafeInsetRight();}v.setPadding(left,top,right,bottom);return insets;});
        WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);settings.setAllowFileAccessFromFileURLs(false);settings.setAllowUniversalAccessFromFileURLs(false);settings.setAllowContentAccess(true);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(false);settings.setSupportMultipleWindows(false);
        android.webkit.CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
        web.addJavascriptInterface(new Bridge(),"Android");
        web.setWebViewClient(new WebViewClient(){
            @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
                Uri uri=request.getUrl();if(!HOST.equals(uri.getHost()))return null;if(!trustedOrigin(uri))return new WebResourceResponse("text/plain","UTF-8",403,"Forbidden",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));
                try {String path=uri.getPath();if(path==null||path.equals("/"))path="/index.html";
                    if(path.contains(".."))throw new IOException();String mime=URLConnection.guessContentTypeFromName(path);
                    if(path.endsWith(".js")||path.endsWith(".mjs"))mime="application/javascript";if(path.endsWith(".css"))mime="text/css";if(path.endsWith(".woff2"))mime="font/woff2";
                    Map<String,String> headers=new HashMap<>();headers.put("Cache-Control",path.startsWith("/assets/")?"public, max-age=31536000, immutable":"no-cache");headers.put("X-Content-Type-Options","nosniff");headers.put("Content-Security-Policy","default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; media-src 'self' blob:; connect-src 'self' https: blob:; font-src 'self'; worker-src 'self' blob:; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'");
                    return new WebResourceResponse(mime==null?"application/octet-stream":mime,(mime!=null&&(mime.startsWith("text/")||mime.contains("javascript")||mime.contains("json")||mime.contains("svg")))?"UTF-8":null,200,"OK",headers,getAssets().open("web"+path));
                } catch(IOException e){return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){if(trustedOrigin(request.getUrl()))return false;openExternal(request.getUrl().toString());return true;}
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params){
                if(picker!=null)picker.onReceiveValue(null);picker=callback;
                Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("*/*");
                List<String> types=new ArrayList<>();for(String type:params.getAcceptTypes())if(type.contains("/"))types.add(type);
                if(!types.isEmpty())intent.putExtra(Intent.EXTRA_MIME_TYPES,types.toArray(new String[0]));
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,params.getMode()==FileChooserParams.MODE_OPEN_MULTIPLE);
                try{startActivityForResult(intent,100);}catch(ActivityNotFoundException e){picker.onReceiveValue(null);picker=null;notice("未找到系统文件选择器。");}return true;
            }
            @Override public void onPermissionRequest(PermissionRequest request){runOnUiThread(()->{
                if(!trustedOrigin(request.getOrigin())){request.deny();return;}mediaPermission=request;
                List<String> missing=new ArrayList<>();for(String resource:request.getResources()){
                    String permission=PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)?Manifest.permission.RECORD_AUDIO:PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)?Manifest.permission.CAMERA:null;
                    if(permission==null){request.deny();mediaPermission=null;return;}
                    if(checkSelfPermission(permission)!=PackageManager.PERMISSION_GRANTED)missing.add(permission);
                }
                if(missing.isEmpty()){request.grant(request.getResources());mediaPermission=null;}else requestPermissions(missing.toArray(new String[0]),101);
            });}
            @Override public void onPermissionRequestCanceled(PermissionRequest request){if(mediaPermission==request)mediaPermission=null;}
        });
        tts=new TextToSpeech(this,status->{ttsReady=status==TextToSpeech.SUCCESS;if(ttsReady)tts.setLanguage(Locale.SIMPLIFIED_CHINESE);});
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener(){public void onStart(String id){}public void onDone(String id){speechEnd(id,false);}public void onError(String id){notice("设备朗读失败，请安装中文语音或改用云端TTS。");speechEnd(id,true);}});
        recoveringPicker=state!=null&&state.getBoolean("picker-pending");recoverExport();cleanOldDownloads();web.loadUrl("https://"+HOST+"/");
        if(state==null&&exportFile!=null)showExportRecovery();
    }
    private boolean compatibleWebView(){
        try{
            android.content.pm.PackageInfo provider=null;
            if(Build.VERSION.SDK_INT>=26)provider=WebView.getCurrentWebViewPackage();
            else for(String name:new String[]{"com.google.android.webview","com.android.webview","com.android.chrome"})try{provider=getPackageManager().getPackageInfo(name,0);break;}catch(PackageManager.NameNotFoundException ignored){}
            if(provider!=null&&Integer.parseInt(provider.versionName.split("\\.")[0])>=120)return true;
        }catch(Exception ignored){}
        new android.app.AlertDialog.Builder(this).setTitle("先更新一下浏览器内核").setMessage("小手机需要 Android System WebView 120 或更新版本。请在应用商店更新 Android System WebView，然后重新打开；聊天数据不会被清除。").setPositiveButton("知道了",(dialog,which)->finish()).setCancelable(false).show();
        return false;
    }
    private void speechEnd(String id,boolean failed){js("window.NativeSpeechEnd&&window.NativeSpeechEnd("+JSONObject.quote(id)+","+failed+")");}
    private void js(String script){runOnUiThread(()->{if(web!=null)web.evaluateJavascript(script,null);});}
    private void notice(String message){runOnUiThread(()->Toast.makeText(this,message,Toast.LENGTH_LONG).show());}
    private boolean trustedOrigin(Uri uri){return "https".equals(uri.getScheme())&&HOST.equals(uri.getHost())&&uri.getUserInfo()==null&&(uri.getPort()==-1||uri.getPort()==443);}
    private Intent externalIntent(String value) throws Exception {
        if(value==null||value.length()>8192)throw new IllegalArgumentException();
        Uri uri=Uri.parse(value);String targetPackage=null;
        if("intent".equals(uri.getScheme())){Intent parsed=Intent.parseUri(value,Intent.URI_INTENT_SCHEME);uri=parsed.getData();targetPackage=parsed.getPackage();}
        if(uri==null||!Arrays.asList("https","http","orpheus","qqmusic","kugou","spotify","music").contains(uri.getScheme())||uri.getUserInfo()!=null)throw new IllegalArgumentException();
        if(Arrays.asList("https","http").contains(uri.getScheme())&&(uri.getHost()==null||HOST.equals(uri.getHost())))throw new IllegalArgumentException();
        Intent intent=new Intent(Intent.ACTION_VIEW,uri);intent.addCategory(Intent.CATEGORY_BROWSABLE);
        if(targetPackage!=null&&targetPackage.matches("[A-Za-z0-9_]+(?:\\.[A-Za-z0-9_]+)+"))intent.setPackage(targetPackage);
        return intent;
    }
    private void openExternal(String value){runOnUiThread(()->{try{startActivity(externalIntent(value));}catch(Exception e){notice("没有找到能够打开这个链接的应用。");}});}
    private void callback(String method,String id,String value){js("window.NativeHTTP&&window.NativeHTTP."+method+"("+JSONObject.quote(id)+(value.isEmpty()?"":","+value)+")");}
    // Certain device VPNs resolve HTTPS API hosts to 198.18/15 Fake-IP addresses.
    // They are intentionally not public DNS addresses. For exact built-in provider
    // hosts only, allow DNS proxying; HttpURLConnection still validates the exact
    // host's TLS certificate and never follows a redirect.
    private static final Set<String> OFFICIAL_API_HOSTS=Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
        "api.deepseek.com","api.openai.com","api.anthropic.com","generativelanguage.googleapis.com",
        "openrouter.ai","api.siliconflow.cn","dashscope.aliyuncs.com","api.moonshot.cn",
        "open.bigmodel.cn","api.x.ai")));
    private boolean trustedProviderHost(String hostname){
        return OFFICIAL_API_HOSTS.contains(hostname.toLowerCase(Locale.ROOT));
    }
    private boolean allowed(URL url) throws Exception {
        if(!"https".equals(url.getProtocol())||url.getUserInfo()!=null||url.getPort()!=-1&&url.getPort()!=443)return false;
        if(trustedProviderHost(url.getHost()))return true;
        // Custom endpoints retain the original DNS/private-network SSRF guard.
        for(InetAddress address:InetAddress.getAllByName(url.getHost()))if(!publicAddress(address))return false;
        return true;
    }
    private boolean publicAddress(InetAddress address){
        if(address.isAnyLocalAddress()||address.isLoopbackAddress()||address.isLinkLocalAddress()||address.isSiteLocalAddress()||address.isMulticastAddress())return false;
        byte[] bytes=address.getAddress();int first=bytes[0]&255,second=bytes[1]&255;
        if(bytes.length==4)return first!=0&&first<224&&!(first==100&&second>=64&&second<=127)&&!(first==198&&(second==18||second==19));
        return bytes.length==16&&(first&0xe0)==0x20&&!(first==0x20&&second==0x01&&(bytes[2]&255)==0x0d&&(bytes[3]&255)==0xb8);
    }
    private final class Bridge {
        @JavascriptInterface public void request(String id,String target,String method,String headerJSON,String body){
            requestBody(id,target,method,headerJSON,body,false);
        }
        @JavascriptInterface public void requestBase64(String id,String target,String method,String headerJSON,String body){requestBody(id,target,method,headerJSON,body,true);}
        private void requestBody(String id,String target,String method,String headerJSON,String body,boolean encoded){
            HttpsJob job=new HttpsJob();jobs.put(id,job);workers.execute(()->{try{
                URL url=new URL(target);if(!allowed(url))throw new IOException();
                HttpURLConnection connection=(HttpURLConnection)url.openConnection();job.connection=connection;
                if(job.cancelled)return;connection.setInstanceFollowRedirects(false);connection.setConnectTimeout(30000);connection.setReadTimeout(300000);connection.setRequestMethod(method);
                JSONObject headers=new JSONObject(headerJSON);for(Iterator<String> it=headers.keys();it.hasNext();){String key=it.next();if(Arrays.asList("authorization","content-type","accept","x-api-key","anthropic-version","anthropic-beta","x-goog-api-key","openai-organization","openai-project","http-referer","x-title","api-key","x-api-version").contains(key.toLowerCase(Locale.ROOT)))connection.setRequestProperty(key,headers.getString(key));}
                if(!body.isEmpty()){if(body.length()>24*1024*1024)throw new IOException();byte[] data=encoded?Base64.decode(body,Base64.DEFAULT):body.getBytes(StandardCharsets.UTF_8);connection.setDoOutput(true);connection.setFixedLengthStreamingMode(data.length);try(OutputStream output=connection.getOutputStream()){output.write(data);}}
                int status=connection.getResponseCode();if(status<100||status>599)throw new IOException();if(status>=300&&status<400&&status!=304)throw new RedirectException();if(job.cancelled)return;
                JSONObject result=new JSONObject();String type=connection.getContentType();if(type!=null)result.put("content-type",type);
                result.put("cache-control","no-store");callback("headers",id,status+","+JSONObject.quote(result.toString()));
                InputStream stream=status>=400?connection.getErrorStream():connection.getInputStream();if(stream!=null)try(InputStream input=stream){byte[] data=new byte[16384];long total=0;int n;while(!job.cancelled&&(n=input.read(data))!=-1){total+=n;if(total>64L*1024*1024)throw new IOException();callback("chunk",id,JSONObject.quote(Base64.encodeToString(data,0,n,Base64.NO_WRAP)));}}
                if(!job.cancelled)callback("end",id,"");
            }catch(Exception e){if(!job.cancelled)callback("error",id,networkError(e));}finally{jobs.remove(id);if(job.connection!=null)job.connection.disconnect();}});
        }
        @JavascriptInterface public void cancel(String id){HttpsJob job=jobs.get(id);if(job!=null){job.cancelled=true;if(job.connection!=null)job.connection.disconnect();}}
        @JavascriptInterface public void finishAfterSave(){runOnUiThread(()->finish());}
        @JavascriptInterface public void openUrl(String url){openExternal(url);}
        @JavascriptInterface public void openBrowser(String value){runOnUiThread(()->{try{Intent browser=new Intent();browser.setClassName(getPackageName(),"mark.via.Shell");if(!value.isEmpty()){Uri uri=Uri.parse(value);if(!Arrays.asList("https","http").contains(uri.getScheme())||uri.getHost()==null||uri.getUserInfo()!=null)throw new IllegalArgumentException();browser.setAction(Intent.ACTION_VIEW);browser.setData(uri);}startActivity(browser);}catch(Exception e){notice("内置 Via 未能打开，请重新安装完整 APK。");}});}
        @JavascriptInterface public void copyText(String text){runOnUiThread(()->((ClipboardManager)getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("云笺听雨",text)));}
        @JavascriptInterface public void speak(String text,float rate,String id){runOnUiThread(()->{if(!ttsReady){notice("设备语音尚未就绪，请稍后再试。");speechEnd(id,true);return;}int result=tts.setLanguage(Locale.SIMPLIFIED_CHINESE);if(result<0){notice("设备缺少中文语音，请安装中文音色或选择云端TTS。");speechEnd(id,true);return;}tts.setSpeechRate(rate);if(tts.speak(text,TextToSpeech.QUEUE_FLUSH,null,id)==TextToSpeech.ERROR)speechEnd(id,true);});}
        @JavascriptInterface public void stopSpeech(){runOnUiThread(()->{if(tts!=null)tts.stop();});}
        @JavascriptInterface public boolean startDownload(String id,String name,String mime){if(downloads.size()>=32||downloads.containsKey(id))return false;try{File file=File.createTempFile("cloudlet-",".download",getCacheDir());downloads.put(id,file);downloadInfo.put(id,new String[]{name,mime});return true;}catch(IOException e){notice("附件导出空间不足。");return false;}}
        @JavascriptInterface public boolean downloadChunk(String id,String chunk){File file=downloads.get(id);if(file==null)return false;try(OutputStream out=new FileOutputStream(file,true)){out.write(Base64.decode(chunk,Base64.DEFAULT));return true;}catch(Exception e){cancelDownload(id);notice("附件导出失败，请检查空间。");return false;}}
        @JavascriptInterface public void cancelDownload(String id){runOnUiThread(()->{if(id.equals(exportId)||readyExports.contains(id))return;File file=downloads.remove(id);downloadInfo.remove(id);if(file!=null)file.delete();});}
        @JavascriptInterface public boolean finishDownload(String id){if(!downloads.containsKey(id))return false;runOnUiThread(()->{if(id.equals(exportId)||readyExports.contains(id))return;readyExports.addLast(id);try{journalExport();nextExport();}catch(Exception e){notice("导出队列未能保存，请保持应用打开并重试。");}});return true;}
    }
    private static final class RedirectException extends IOException {}
    private String networkError(Exception error){String code="network",message="网络连接失败，请检查网络与 API 地址。";
        if(error instanceof UnknownHostException){code="dns";message="无法解析服务商地址，请检查网络或 API 地址。";}
        else if(error instanceof SocketTimeoutException){code="timeout";message="服务商响应超时，请稍后重试或选择更快的模型。";}
        else if(error instanceof javax.net.ssl.SSLException){code="tls";message="服务商的安全连接校验失败，请检查证书和设备时间。";}
        else if(error instanceof ConnectException){code="connect";message="无法连接服务商，请检查网络和服务商可用性。";}
        else if(error instanceof RedirectException){code="redirect";message="接口返回了重定向，请在设置中填写最终的 HTTPS 接口地址。";}
        try{return new JSONObject().put("code",code).put("message",message).toString();}catch(JSONException ignored){return "";}
    }
    private File exportJournal(){return new File(getCacheDir(),"pending-export.json");}
    private JSONObject exportRow(String id) throws Exception {String[] info=downloadInfo.get(id);File file=downloads.get(id);if(info==null||file==null)throw new IOException();return new JSONObject().put("id",id).put("file",file.getName()).put("name",info[0]).put("mime",info[1]);}
    private void journalExport() throws Exception {JSONArray rows=new JSONArray();if(exportId!=null)rows.put(exportRow(exportId));for(String id:readyExports)rows.put(exportRow(id));android.util.AtomicFile journal=new android.util.AtomicFile(exportJournal());if(rows.length()==0){journal.delete();return;}FileOutputStream output=journal.startWrite();try{output.write(rows.toString().getBytes(StandardCharsets.UTF_8));journal.finishWrite(output);}catch(IOException e){journal.failWrite(output);throw e;}}
    private void recoverExport(){try{File journal=exportJournal();byte[] bytes;try(DataInputStream input=new DataInputStream(new android.util.AtomicFile(journal).openRead())){if(journal.length()>65536)throw new IOException();bytes=new byte[(int)journal.length()];input.readFully(bytes);}String text=new String(bytes,StandardCharsets.UTF_8);JSONArray rows=text.trim().startsWith("[")?new JSONArray(text):new JSONArray().put(new JSONObject(text));if(rows.length()>32)throw new IOException();for(int index=0;index<rows.length();index++){JSONObject row=rows.getJSONObject(index);File file=new File(getCacheDir(),row.getString("file"));if(!file.getCanonicalFile().getParentFile().equals(getCacheDir().getCanonicalFile())||!file.getName().startsWith("cloudlet-")||!file.exists())continue;String id=row.getString("id");if(downloads.containsKey(id))continue;downloads.put(id,file);downloadInfo.put(id,new String[]{row.getString("name"),row.getString("mime")});readyExports.addLast(id);}if(!readyExports.isEmpty()){exportId=readyExports.removeFirst();exportFile=downloads.get(exportId);}journalExport();}catch(Exception e){new android.util.AtomicFile(exportJournal()).delete();exportFile=null;exportId=null;readyExports.clear();}}
    private void cleanOldDownloads(){File[] files=getCacheDir().listFiles();if(files!=null)for(File file:files)if(file.getName().startsWith("cloudlet-")&&file.getName().endsWith(".download")&&!downloads.containsValue(file)&&file.lastModified()<System.currentTimeMillis()-86400000L)file.delete();}
    private void showExportRecovery(){if(exportFile!=null)new android.app.AlertDialog.Builder(this).setTitle("文件还没有保存完").setMessage("原文件仍在，可以重新选择保存位置。其他文件会依次保存。").setPositiveButton("继续保存",(dialog,which)->launchExport()).setNegativeButton("取消这个文件",(dialog,which)->finishExport()).show();}
    private void nextExport(){if(exportFile!=null||readyExports.isEmpty())return;exportId=readyExports.removeFirst();exportFile=downloads.get(exportId);try{journalExport();launchExport();}catch(Exception e){notice("保存准备失败，原文件仍在。");showExportRecovery();}}
    private void launchExport(){if(exportId==null)return;String[] info=downloadInfo.get(exportId);if(exportFile==null||info==null)return;Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType(info[1]);intent.putExtra(Intent.EXTRA_TITLE,info[0]);try{startActivityForResult(intent,102);}catch(ActivityNotFoundException e){notice("未找到系统保存文件窗口；原文件仍在，下次打开可继续保存。");}}
    private void finishExport(){File file=exportFile;if(exportId!=null){downloads.remove(exportId);downloadInfo.remove(exportId);}exportFile=null;exportId=null;try{journalExport();}catch(Exception e){notice("保存队列未能更新，请保持应用打开。");}if(file!=null)file.delete();nextExport();}
    @Override protected void onSaveInstanceState(Bundle state){state.putBoolean("picker-pending",picker!=null||recoveringPicker);super.onSaveInstanceState(state);}
    @Override public void onConfigurationChanged(android.content.res.Configuration configuration){super.onConfigurationChanged(configuration);}
    @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);
        if(request==100){if(picker!=null){List<Uri> selected=new ArrayList<>();if(result==RESULT_OK&&data!=null){if(data.getClipData()!=null){for(int i=0;i<data.getClipData().getItemCount();i++)selected.add(data.getClipData().getItemAt(i).getUri());}else if(data.getData()!=null)selected.add(data.getData());}picker.onReceiveValue(selected.isEmpty()?null:selected.toArray(new Uri[0]));picker=null;}else if(recoveringPicker&&result==RESULT_OK)notice("系统重新打开了小手机，请再选一次文件；原文件没有被移动或删除。");recoveringPicker=false;}
        if(request==102&&exportFile!=null){if(result!=RESULT_OK||data==null||data.getData()==null){finishExport();return;}File file=exportFile;String id=exportId;Uri target=data.getData();workers.execute(()->{boolean saved=false;try{try(InputStream input=new FileInputStream(file);OutputStream out=getContentResolver().openOutputStream(target)){if(out==null)throw new IOException();byte[] buffer=new byte[65536];int n;while((n=input.read(buffer))!=-1)out.write(buffer,0,n);out.flush();}saved=true;notice("文件已保存。");}catch(IOException e){notice("文件保存失败，原文件仍在，下次打开可以继续保存。");}finally{if(saved)runOnUiThread(()->{if(id.equals(exportId))finishExport();else{downloads.remove(id);downloadInfo.remove(id);file.delete();}});else runOnUiThread(()->{if(!isFinishing()&&!isDestroyed())showExportRecovery();});}});}
    }

    @Override public void onRequestPermissionsResult(int request,String[] permissions,int[] results){super.onRequestPermissionsResult(request,permissions,results);if(request==101&&mediaPermission!=null){boolean granted=results.length>0;for(int value:results)granted&=value==PackageManager.PERMISSION_GRANTED;if(granted)mediaPermission.grant(mediaPermission.getResources());else mediaPermission.deny();mediaPermission=null;}}
    @Override public void onBackPressed(){if(web==null){finish();return;}web.evaluateJavascript("(()=>{if(window.NativeBack&&window.NativeBack())return true;const b=document.querySelector('.app-header button[aria-label=\"返回桌面\"]');if(b&&b.getClientRects().length){b.click();return true;}if(window.NativeFlush){window.NativeFlush().then(()=>window.Android.finishAfterSave()).catch(()=>{if(confirm('本机保存尚未成功。退出会失去未保存的内容；建议先取消退出并导出备份。仍要退出吗？'))window.Android.finishAfterSave();});return true;}return false;})()",value->{if(!"true".equals(value))finish();});}
    @Override protected void onPause(){super.onPause();js("window.NativeFlush&&window.NativeFlush().catch(()=>{})");if(web!=null)web.onPause();}
    @Override public void onWindowFocusChanged(boolean focused){super.onWindowFocusChanged(focused);if(focused&&web!=null)BrowserIntegration.hideSystemBars(this);}
    @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);if(intent.getBooleanExtra("browser-return",false))js("window.dispatchEvent(new Event(\"cloudlet-browser-return\"))");}
    @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
    @Override protected void onDestroy(){for(HttpsJob job:jobs.values()){job.cancelled=true;if(job.connection!=null)job.connection.disconnect();}workers.shutdownNow();if(picker!=null){picker.onReceiveValue(null);picker=null;}if(tts!=null){tts.stop();tts.shutdown();}if(web!=null){web.removeJavascriptInterface("Android");web.destroy();web=null;}super.onDestroy();}
}

