package chat.cloudlet.phone;

import android.app.*;
import android.content.Intent;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.*;
import android.widget.*;

/** Via owns untrusted web pages; the local app's privileged WebView stays separate. */
final class BrowserIntegration implements Application.ActivityLifecycleCallbacks {
    private static boolean installed;
    private final Typeface font;
    private BrowserIntegration(Application app){font=Typeface.createFromAsset(app.getAssets(),"fonts/SourceSerif4Variable-Roman.ttf");}
    static void install(Application app){if(!installed){app.registerActivityLifecycleCallbacks(new BrowserIntegration(app));installed=true;}}
    private boolean isVia(Activity activity){return activity.getClass().getName().startsWith("mark.via.");}
    private void applyFont(View view){
        if(view instanceof TextView){TextView text=(TextView)view;if(text.getTypeface()!=font)text.setTypeface(font);}
        if(view instanceof ViewGroup){ViewGroup group=(ViewGroup)view;for(int i=0;i<group.getChildCount();i++)applyFont(group.getChildAt(i));}
    }
    public void onActivityCreated(Activity activity,Bundle state){
        if(!isVia(activity))return;
        activity.getWindow().getDecorView().getViewTreeObserver().addOnWindowFocusChangeListener(focused->{if(focused)hideSystemBars(activity);});
        activity.getWindow().getDecorView().getViewTreeObserver().addOnGlobalLayoutListener(()->applyFont(activity.getWindow().getDecorView()));
    }
    public void onActivityResumed(Activity activity){
        if(!isVia(activity))return;
        BrowserAgent.resumed(activity);
        hideSystemBars(activity);
        FrameLayout content=activity.findViewById(android.R.id.content);
        if(content==null||content.findViewWithTag("cloudlet-return")!=null)return;
        float density=activity.getResources().getDisplayMetrics().density;
        int top=0;
        FrameLayout body=new FrameLayout(activity);
        while(content.getChildCount()>0){View child=content.getChildAt(0);content.removeViewAt(0);body.addView(child);}
        FrameLayout.LayoutParams bodyParams=new FrameLayout.LayoutParams(-1,-1);bodyParams.topMargin=top+(int)(60*density);content.addView(body,bodyParams);
        content.setBackgroundColor(0xfff3f8fb);
        TextView back=new TextView(activity);back.setTag("cloudlet-return");back.setText("‹ 回到云笺听雨");back.setContentDescription("回到云笺听雨");back.setTypeface(font);back.setTextSize(14);back.setTextColor(0xff294659);back.setGravity(Gravity.CENTER);
        GradientDrawable surface=new GradientDrawable();surface.setColor(0xfff3f8fb);surface.setCornerRadius(24*density);surface.setStroke((int)density,0xffb7cbd8);back.setBackground(surface);back.setElevation(4*density);back.setPadding((int)(16*density),0,(int)(16*density),0);
        FrameLayout.LayoutParams params=new FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT,(int)(44*density),Gravity.TOP|Gravity.END);params.topMargin=top+(int)(8*density);params.rightMargin=(int)(8*density);content.addView(back,params);
        back.setOnClickListener(v->{Intent home=new Intent(activity,MainActivity.class);home.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);home.putExtra("browser-return",true);activity.startActivity(home);});
    }
    static void hideSystemBars(Activity activity){
        activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        if(android.os.Build.VERSION.SDK_INT>=30){WindowInsetsController controller=activity.getWindow().getInsetsController();if(controller!=null){controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);controller.hide(WindowInsets.Type.statusBars()|WindowInsets.Type.navigationBars());}}
        else activity.getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }
    public void onActivityStarted(Activity activity){}
    public void onActivityPaused(Activity activity){}
    public void onActivityStopped(Activity activity){}
    public void onActivitySaveInstanceState(Activity activity,Bundle state){}
    public void onActivityDestroyed(Activity activity){BrowserAgent.destroyed(activity);}
}
