package chat.cloudlet.phone;

import android.app.*;
import android.content.*;
import android.database.Cursor;
import android.net.Uri;
import android.os.*;
import android.view.*;
import android.webkit.*;
import org.json.*;
import java.io.*;
import java.lang.ref.WeakReference;
import java.util.*;

/** Only the trusted local WebView can issue commands; Via pages receive no native interface. */
final class BrowserAgent {
    private static WeakReference<Activity> current=new WeakReference<>(null);
    private final MainActivity owner;
    private final Handler handler=new Handler(Looper.getMainLooper());
    private final Set<Long> downloads=new HashSet<>();
    private final ArrayDeque<String> history=new ArrayDeque<>();
    private volatile String session;
    private String script;
    private volatile int generation;
    private volatile boolean opened;
    private AlertDialog confirmation;
    BrowserAgent(MainActivity owner){this.owner=owner;}
    static void resumed(Activity activity){if(activity.getClass().getName().startsWith("mark.via."))current=new WeakReference<>(activity);}
    static void destroyed(Activity activity){if(current.get()==activity)current.clear();}
    synchronized String begin(){end();opened=false;session=UUID.randomUUID().toString();return session;}
    synchronized void end(){generation++;session=null;handler.post(()->{downloads.clear();history.clear();if(confirmation!=null){confirmation.dismiss();confirmation=null;}});}
    synchronized void end(String token){if(session!=null&&session.equals(token))end();}
    private WebView findWeb(View view){
        if(view instanceof WebView && view.isShown() && view.hasFocus())return (WebView)view;
        if(view instanceof ViewGroup){ViewGroup group=(ViewGroup)view;for(int i=group.getChildCount()-1;i>=0;i--){WebView found=findWeb(group.getChildAt(i));if(found!=null)return found;}}
        return null;
    }
    private WebView anyWeb(View view){
        if(view instanceof WebView && view.isShown())return (WebView)view;
        if(view instanceof ViewGroup){ViewGroup group=(ViewGroup)view;for(int i=group.getChildCount()-1;i>=0;i--){WebView found=anyWeb(group.getChildAt(i));if(found!=null)return found;}}
        return null;
    }
    private WebView web(){Activity activity=current.get();if(activity==null||activity.isDestroyed())return null;View root=activity.getWindow().getDecorView();WebView w=findWeb(root);return w==null?anyWeb(root):w;}
    private boolean validUrl(String value){try{Uri u=Uri.parse(value);return ("http".equals(u.getScheme())||"https".equals(u.getScheme()))&&u.getHost()!=null&&u.getUserInfo()==null;}catch(Exception e){return false;}}
    void command(String token,String id,String json){handler.post(()->{
        if(session==null||!session.equals(token)){owner.browserResult(id,"{\"ok\":false,\"error\":\"浏览器任务已结束\"}");return;}
        final int turn=generation;
        try{
            if(json.length()>16000)throw new IOException("操作内容过长");
            JSONObject op=new JSONObject(json);String action=op.getString("action");
            if("open".equals(action)){
                String requested=op.getString("url");if(!validUrl(requested))throw new IOException("需要 HTTP/HTTPS 地址");
                Uri uri=Uri.parse(requested);String url=uri.getPath()==null||uri.getPath().isEmpty()?uri.buildUpon().path("/").build().toString():requested;
                Runnable navigate=()->{try{WebView previous=web();String previousUrl=previous==null?null:previous.getUrl();
                    Intent intent=new Intent(Intent.ACTION_VIEW,Uri.parse(url));intent.setClassName(owner.getPackageName(),"mark.via.Shell");owner.startActivity(intent);
                    opened=true;handler.postDelayed(()->awaitOpened(id,turn,SystemClock.uptimeMillis()+30000,url,previousUrl),500);
                }catch(Exception e){fail(id,e);}};
                if(opened)confirm(id,"允许 Agent 打开网页？",url,turn,navigate);else navigate.run();return;
            }
            if("downloadStatus".equals(action)){long download=op.getLong("downloadId");if(!downloads.contains(download))throw new IOException("下载不属于当前任务");
                DownloadManager manager=(DownloadManager)owner.getSystemService(Context.DOWNLOAD_SERVICE);
                try(Cursor cursor=manager.query(new DownloadManager.Query().setFilterById(download))){
                    if(cursor==null||!cursor.moveToFirst())throw new IOException("找不到下载记录");
                    int status=cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
                    owner.browserResult(id,new JSONObject().put("ok",true).put("downloadId",download).put("status",status==DownloadManager.STATUS_SUCCESSFUL?"completed":status==DownloadManager.STATUS_FAILED?"failed":"pending").toString());
                }return;
            }
            if("read".equals(action)){awaitPage(id,turn,SystemClock.uptimeMillis()+15000,null);return;}
            if(!Arrays.asList("click","fill","select","scroll","download","back").contains(action))throw new IOException("不支持的浏览器操作");
            WebView browser=web();if(browser==null)throw new IOException("请先打开 Via 网页");
            if("back".equals(action)){if(history.size()<2)throw new IOException("当前任务没有上一页");String previous=browser.getUrl();history.removeLast();if(browser.canGoBack())browser.goBack();else browser.loadUrl(history.peekLast());handler.postDelayed(()->awaitOpened(id,turn,SystemClock.uptimeMillis()+15000,"",previous),300);return;}
            if(!validUrl(browser.getUrl())||!browser.getUrl().equals(op.optString("url")))throw new IOException("页面已改变，请重新读取");
            if(op.optString("value").length()>8000)throw new IOException("填写内容过长");
            Runnable perform=()->evaluate(browser,id,op,turn);
            // Always review write-like actions in the browser; page text cannot authorize them.
            if(Arrays.asList("click","fill","select","download").contains(action)){
                Activity activity=current.get();if(activity==null)throw new IOException("Via 已关闭");
                String target=op.optJSONObject("element")==null?"":op.optJSONObject("element").optString("label");
                String destination=op.optJSONObject("element")==null?"":op.optJSONObject("element").optString("href");
                String label="click".equals(action)?"点击":"fill".equals(action)?"填写":"select".equals(action)?"选择":"下载";
                confirm(id,"允许 Agent 操作网页？",browser.getUrl()+"\n"+label+" · "+target+(destination.isEmpty()?"":"\n目标链接："+destination)+(op.has("value")?"\n填写内容："+op.optString("value"):""),turn,perform);
            }else perform.run();
        }catch(Exception e){fail(id,e);}
    });}
    private void confirm(String id,String title,String message,int turn,Runnable action){
        if(confirmation!=null){fail(id,new IOException("请先处理当前网页操作确认"));return;}
        Activity activity=current.get();if(activity==null||activity.isDestroyed())activity=owner;
        final AlertDialog dialog=new AlertDialog.Builder(activity).setTitle(title).setMessage(message)
            .setPositiveButton("允许",(d,w)->{if(turn==generation)action.run();})
            .setNegativeButton("拒绝",(d,w)->owner.browserResult(id,"{\"ok\":false,\"error\":\"用户拒绝该操作\"}"))
            .setOnCancelListener(d->owner.browserResult(id,"{\"ok\":false,\"error\":\"用户取消该操作\"}")).create();
        confirmation=dialog;dialog.setOnDismissListener(d->{if(confirmation==dialog)confirmation=null;});dialog.show();
    }
    private void awaitOpened(String id,int turn,long deadline,String expected,String previous){
        if(turn!=generation)return;WebView browser=web();
        if(browser!=null&&validUrl(browser.getUrl())&&(expected.equals(browser.getUrl())||!browser.getUrl().equals(previous))){awaitPage(id,turn,deadline,null);return;}
        if(SystemClock.uptimeMillis()>=deadline){fail(id,new IOException("Via 未打开目标页面，请检查浏览器"));return;}
        handler.postDelayed(()->awaitOpened(id,turn,deadline,expected,previous),300);
    }
    private void awaitPage(String id,int turn,long deadline,String expected){
        if(turn!=generation)return;WebView browser=web();
        if(browser==null||browser.getProgress()<100||!validUrl(browser.getUrl())||(expected!=null&&!expected.equals(browser.getUrl())&&browser.getProgress()==0)){
            if(SystemClock.uptimeMillis()>=deadline){fail(id,new IOException("Via 页面尚未就绪，请返回检查网页后重试"));return;}
            handler.postDelayed(()->awaitPage(id,turn,deadline,expected),300);return;
        }
        handler.postDelayed(()->{if(turn==generation)try{evaluate(browser,id,new JSONObject().put("action","read"),turn);}catch(Exception e){fail(id,e);}},500);
    }
    private String script() throws IOException {
        if(script==null)try(InputStream input=owner.getAssets().open("native/browser-agent-dom.js");ByteArrayOutputStream out=new ByteArrayOutputStream()){
            byte[] bytes=new byte[4096];int n;while((n=input.read(bytes))!=-1)out.write(bytes,0,n);script=out.toString("UTF-8");}
        return script;
    }
    private void evaluate(WebView browser,String id,JSONObject op,int turn){
        try{browser.evaluateJavascript("("+script()+")("+op.toString()+")",value->{if(turn!=generation)return;try{
            Object raw=new JSONTokener(value).nextValue();JSONObject result=new JSONObject((String)raw);
            if(result.has("downloadId")||result.has("status")||result.has("note"))throw new IOException("网页不能提供系统下载回执");
            if(result.optBoolean("ok")&&result.has("page")){
                if(!"read".equals(op.optString("action"))||!browser.getUrl().equals(result.getJSONObject("page").optString("url")))throw new IOException("读取期间页面地址发生变化，请重新读取");
                if(history.isEmpty()||!history.peekLast().equals(browser.getUrl()))history.addLast(browser.getUrl());
                if(history.size()>30)history.removeFirst();
            }
            if(result.has("downloadUrl")&&(!"download".equals(op.optString("action"))||op.optJSONObject("element")==null||!result.optString("downloadUrl").equals(op.optJSONObject("element").optString("href"))))throw new IOException("网页返回了未经确认的下载地址");
            if(result.optBoolean("ok")&&"download".equals(op.optString("action"))&&!result.has("downloadUrl"))throw new IOException("网页没有提供有效下载链接");
            if(result.optBoolean("ok")&&"download".equals(op.optString("action"))&&result.has("downloadUrl")){
                String url=result.getString("downloadUrl");if(!validUrl(url)||downloads.size()>=5)throw new IOException("下载地址无效或任务下载数量已达上限");
                DownloadManager.Request request=new DownloadManager.Request(Uri.parse(url));
                String cookie=CookieManager.getInstance().getCookie(url);if(cookie!=null)request.addRequestHeader("Cookie",cookie);
                request.addRequestHeader("User-Agent",browser.getSettings().getUserAgentString());
                String name=URLUtil.guessFileName(url,null,null).replaceAll("[^\\p{L}\\p{N}._-]","_");
                request.setDestinationInExternalFilesDir(owner,Environment.DIRECTORY_DOWNLOADS,UUID.randomUUID()+"-"+name);
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                long download=((DownloadManager)owner.getSystemService(Context.DOWNLOAD_SERVICE)).enqueue(request);downloads.add(download);
                result=new JSONObject().put("ok",true).put("downloadId",download).put("status","pending").put("note","下载已交给系统，完成状态需另行查询；可在系统下载通知中打开");
            }
            owner.browserResult(id,result.toString());
        }catch(Exception e){fail(id,e);}});}catch(Exception e){fail(id,e);}
    }
    private void fail(String id,Exception e){try{owner.browserResult(id,new JSONObject().put("ok",false).put("error",e.getMessage()==null?"浏览器操作失败":e.getMessage()).toString());}catch(JSONException ignored){}}
}
