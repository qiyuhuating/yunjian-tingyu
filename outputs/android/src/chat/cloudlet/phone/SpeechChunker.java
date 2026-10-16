package chat.cloudlet.phone;

import java.util.ArrayList;
import java.util.List;

/** Splits long text for Android TTS, whose per-call input limit is about 4000 characters. */
final class SpeechChunker {
    private SpeechChunker() {}

    static List<String> split(String text, int max) {
        List<String> parts = new ArrayList<>();
        if (max < 16) max = 16;
        String rest = text == null ? "" : text.trim();
        while (rest.length() > max) {
            int cut = -1;
            for (int i = max; i > max / 2; i--) {
                char c = rest.charAt(i - 1);
                if ("。！？!?；;\n.".indexOf(c) >= 0) { cut = i; break; }
            }
            if (cut < 0) {
                for (int i = max; i > max / 2; i--) {
                    char c = rest.charAt(i - 1);
                    if ("，,、 ".indexOf(c) >= 0) { cut = i; break; }
                }
            }
            if (cut < 0) {
                cut = max;
                // never split a surrogate pair
                if (Character.isHighSurrogate(rest.charAt(cut - 1))) cut--;
            }
            String part = rest.substring(0, cut).trim();
            if (!part.isEmpty()) parts.add(part);
            rest = rest.substring(cut).trim();
        }
        if (!rest.isEmpty()) parts.add(rest);
        return parts;
    }
}
