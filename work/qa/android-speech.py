"""Exercise the actual Java TTS splitter; pass --java-dir pointing at a full JDK."""
import argparse
from pathlib import Path
import subprocess
import tempfile

parser=argparse.ArgumentParser()
parser.add_argument('--java-dir',required=True)
args=parser.parse_args()
repo=Path(__file__).resolve().parents[2]
suffix='.exe' if __import__('os').name=='nt' else ''
with tempfile.TemporaryDirectory(prefix='speech-qa-') as directory:
    root=Path(directory)
    source=root/'SpeechTest.java'
    source.write_text('''package chat.cloudlet.phone;
import java.util.*;
public class SpeechTest {
 static void check(String text,int max){
  List<String> parts=SpeechChunker.split(text,max);
  StringBuilder joined=new StringBuilder();
  for(String part:parts){
   if(part.length()>Math.max(max,16)||part.isEmpty())throw new AssertionError("chunk bound");
   if(Character.isLowSurrogate(part.charAt(0))||Character.isHighSurrogate(part.charAt(part.length()-1)))throw new AssertionError("split surrogate");
   joined.append(part);
  }
  if(!joined.toString().replaceAll("\\\\s+", "").equals(text.trim().replaceAll("\\\\s+", "")))throw new AssertionError("lost content");
 }
 public static void main(String[] args){
  check("",3900);check(" short ",3900);
  for(int length:new int[]{3899,3900,3901,8000,16000}){StringBuilder text=new StringBuilder();for(int i=0;i<length;i++)text.append('a');check(text.toString(),3900);}
  StringBuilder chinese=new StringBuilder();for(int i=0;i<3000;i++)chinese.append("这是句子。下一句，继续！");check(chinese.toString(),3900);
  StringBuilder emoji=new StringBuilder();for(int i=0;i<8000;i++)emoji.append("a\\uD83D\\uDE00");check(emoji.toString(),3900);check(emoji.toString(),17);
  if(!SpeechChunker.split(null,3900).isEmpty())throw new AssertionError("null");
  System.out.println("11 speech cases passed");
 }
}''',encoding='utf-8')
    subprocess.run([str(Path(args.java_dir)/'bin'/('javac'+suffix)),'-encoding','UTF-8','--release','8','-d',str(root),str(repo/'outputs/android/src/chat/cloudlet/phone/SpeechChunker.java'),str(source)],check=True)
    subprocess.run([str(Path(args.java_dir)/'bin'/('java'+suffix)),'-cp',str(root),'chat.cloudlet.phone.SpeechTest'],check=True)
