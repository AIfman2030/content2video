/**
 * VoiceCloneDialog.tsx
 * 声音复刻对话框：左侧录音/上传，右侧内容参考朗读文案
 */
import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mic, Square, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from '@supabase/supabase-js';
import { toast } from "sonner";
import { addStoredClonedVoice } from "@/services/minimax-tts";

const UPLOAD_SUPABASE_URL = 'https://backend.appmiaoda.com/projects/supabase320737353209528320';
const UPLOAD_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoyMDk1ODk2OTQ0LCJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwic3ViIjoiYW5vbiJ9.5w8tDI6LD3u_Yb5xAyg9Xl_LhE7hBdpBbQjF4krC234';
const uploadSupabase = createClient(UPLOAD_SUPABASE_URL, UPLOAD_SUPABASE_ANON_KEY);

export interface ClonedVoice {
  id: string;      // MiniMax voice_id
  name: string;
  createdAt: number;
}

interface VoiceCloneDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (voice: ClonedVoice) => void;
}

type Step = "input" | "cloning" | "done" | "error";

const MAX_FILE_MB = 10;
const RECORD_LIMIT_SEC = 25;

/** 参考朗读文案，按场景分类 */
const REFERENCE_SCRIPTS = [
  {
    category: "直播带货",
    text: "欢迎大家来到直播间，今天我们给大家带来超值好物，满300减100优惠券发不停，拼手速哦！",
  },
  {
    category: "教育培训",
    text: "《母鸡萝丝去散步》是一本非常有趣的绘本故事，它讲述了一只名叫萝丝的母鸡和一只狐狸之间的故事。",
  },
  {
    category: "小说朗读",
    text: "满纸荒唐言，一把辛酸泪。都云作者痴，谁解其中味？上穷碧落下黄泉，两处茫茫皆不见。",
  },
  {
    category: "音视频配音",
    text: "这是2024年最值得观看的美剧之一，Netflix最新出品，它讲述了主人公小美，意外发现能够穿越时空的技术，却也因此触发了现实与未来的连锁危机的科幻故事。",
  },
];

export default function VoiceCloneDialog({ open, onClose, onSuccess }: VoiceCloneDialogProps) {
  const [step, setStep] = useState<Step>("input");
  const [voiceName, setVoiceName] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioObjectUrl, setAudioObjectUrl] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetAll = () => {
    setStep("input");
    setVoiceName("");
    setAudioBlob(null);
    setAudioObjectUrl("");
    setIsRecording(false);
    setRecordSec(0);
    setErrorMsg("");
    chunksRef.current = [];
  };

  const stopRecording = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 优先 webm，降级 ogg，否则用默认
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/ogg") ? "audio/ogg" : "";
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        setAudioBlob(blob);
        setAudioObjectUrl(URL.createObjectURL(blob));
      };
      mr.start(100);
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordSec(0);
      timerRef.current = setInterval(() => {
        setRecordSec((s) => {
          if (s + 1 >= RECORD_LIMIT_SEC) { stopRecording(); return s + 1; }
          return s + 1;
        });
      }, 1000);
    } catch {
      toast.error("无法访问麦克风，请在浏览器权限中允许");
    }
  }, [stopRecording]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`文件不能超过 ${MAX_FILE_MB}MB`);
      return;
    }
    setAudioBlob(file);
    setAudioObjectUrl(URL.createObjectURL(file));
  };

  const handleClone = async () => {
    if (!audioBlob) { toast.error("请先录制或上传音频"); return; }
    if (!voiceName.trim()) { toast.error("请输入音色名称"); return; }
    setStep("cloning");
    setErrorMsg("");

    try {
      // 上传音频到 Supabase Storage
      const ext = audioBlob.type.includes("webm") ? "webm"
        : audioBlob.type.includes("ogg") ? "ogg"
        : audioBlob.type.includes("mp3") ? "mp3"
        : audioBlob.type.includes("wav") ? "wav"
        : "mp3";
      const filePath = `voice-clone-raw/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await uploadSupabase.storage
        .from("generated-media")
        .upload(filePath, audioBlob, { contentType: audioBlob.type || "audio/webm", upsert: false });
      if (upErr) throw new Error(`音频上传失败：${upErr.message}`);

      const { data: urlData } = uploadSupabase.storage.from("generated-media").getPublicUrl(filePath);
      const audioUrl = urlData.publicUrl;

      // Call MiniMax voice clone via edge function
      const { cloneVoice } = await import("@/services/minimax-tts");
      const cloned = await cloneVoice({ audioUrl, voiceName: voiceName.trim() });
      onSuccess(cloned);
      setStep("done");
      toast.success(`音色「${voiceName.trim()}」复刻成功！`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMsg(msg);
      setStep("error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetAll(); onClose(); } }}>
      <DialogContent
        className="max-w-[calc(100%-2rem)] md:max-w-3xl bg-card border-border p-0 overflow-hidden"
        aria-describedby="voice-clone-desc"
      >
        <div className="flex flex-col md:flex-row h-full">
          {/* ── 左侧：录音主区 ── */}
          <div className="flex-1 min-w-0 p-5 flex flex-col gap-4 md:border-r border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2 text-balance">
                <Mic className="w-4 h-4 text-primary shrink-0" />声音复刻
              </DialogTitle>
              <p id="voice-clone-desc" className="text-xs text-muted-foreground mt-0.5">
                录制或上传 15–25 秒清晰语音，AI 将学习您的专属音色
              </p>
            </DialogHeader>

            {step === "input" && (
              <div className="flex flex-col gap-4 flex-1">
                {/* 音色名称 */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">音色名称（最多16字符）</Label>
                  <Input
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value.slice(0, 16))}
                    placeholder="例：我的声音"
                    className="bg-background border-border h-8 text-sm"
                  />
                  <p className="text-right text-xs text-muted-foreground">{voiceName.length} / 16</p>
                </div>

                {/* 麦克风 + 录音圆形 */}
                <div className="flex flex-col items-center gap-3 py-3">
                  <div
                    className="relative w-24 h-24 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: isRecording
                        ? "radial-gradient(circle, hsl(var(--destructive)/0.18) 0%, hsl(var(--destructive)/0.06) 70%)"
                        : "hsl(var(--muted))",
                      boxShadow: isRecording
                        ? "0 0 0 8px hsl(var(--destructive)/0.08), 0 0 0 18px hsl(var(--destructive)/0.04)"
                        : "none",
                    }}
                  >
                    <Mic
                      className="w-9 h-9 transition-colors"
                      style={{ color: isRecording ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))" }}
                    />
                  </div>
                  {isRecording ? (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                      <span className="text-sm text-destructive font-mono font-semibold">
                        {recordSec}s / {RECORD_LIMIT_SEC}s
                      </span>
                    </div>
                  ) : audioObjectUrl ? (
                    <p className="text-xs text-primary font-medium">✓ 音频已就绪，可试听或重录</p>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center">
                      建议在安静环境下朗读右侧参考文案 15-25 秒
                    </p>
                  )}

                  <div className="flex gap-2 w-full">
                    {/* 录音按钮 */}
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      className="flex-1 h-9 font-medium"
                      style={{
                        background: isRecording ? "hsl(var(--destructive))" : "hsl(var(--primary))",
                        color: "hsl(var(--primary-foreground))",
                      }}
                    >
                      {isRecording
                        ? <><Square className="w-3.5 h-3.5 mr-1.5 fill-current" />停止录音</>
                        : <><Mic className="w-3.5 h-3.5 mr-1.5" />开始录音</>
                      }
                    </Button>
                    {/* 上传按钮 */}
                    <Button
                      variant="ghost"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-9 px-3 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                      title="上传音频文件"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="ml-1.5 text-xs hidden sm:inline">上传</span>
                    </Button>
                    <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />
                  </div>
                  <p className="text-xs text-muted-foreground/60 text-center">支持 wav / mp3 / m4a，小于 {MAX_FILE_MB}MB</p>
                </div>

                {/* 已有音频预览 */}
                {audioObjectUrl && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">已选音频（可试听）</Label>
                    <audio src={audioObjectUrl} controls className="w-full h-8" />
                  </div>
                )}

                <Button
                  onClick={handleClone}
                  disabled={!audioBlob || !voiceName.trim()}
                  className="w-full h-9 bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-40 mt-auto"
                >
                  <Mic className="w-4 h-4 mr-2" />开始复刻
                </Button>
                <p className="text-center text-xs text-muted-foreground/50">
                  服务生成内容由 AI 合成，不代表本平台立场
                </p>
              </div>
            )}

            {step === "cloning" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm text-foreground font-medium">正在复刻声音，请稍候…</p>
                <p className="text-xs text-muted-foreground">AI 正在学习您的音色特征</p>
              </div>
            )}

            {step === "done" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8">
                <CheckCircle2 className="w-10 h-10 text-primary" />
                <p className="text-sm text-foreground font-medium">音色复刻成功！</p>
                <p className="text-xs text-muted-foreground">「{voiceName}」已添加到音色列表，可直接选用</p>
                <Button onClick={() => { resetAll(); onClose(); }} className="h-8 px-6 bg-primary text-primary-foreground">
                  完成
                </Button>
              </div>
            )}

            {step === "error" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-6">
                <AlertCircle className="w-10 h-10 text-destructive" />
                <p className="text-sm text-foreground font-medium">复刻失败</p>
                <p className="text-xs text-destructive text-center break-words max-w-xs">{errorMsg}</p>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={resetAll} className="h-8 border border-border text-xs">重新尝试</Button>
                  <Button onClick={() => { resetAll(); onClose(); }} className="h-8 px-4 bg-primary text-primary-foreground text-xs">关闭</Button>
                </div>
              </div>
            )}
          </div>

          {/* ── 右侧：内容参考（录音文案） ── */}
          <div className="w-full md:w-[280px] shrink-0 bg-background/50 flex flex-col overflow-hidden border-t md:border-t-0 border-border">
            <div className="shrink-0 px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground">内容参考</p>
              <p className="text-xs text-muted-foreground mt-0.5">朗读以下任意一段文案</p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {REFERENCE_SCRIPTS.map((s) => (
                <div key={s.category} className="space-y-1.5">
                  <span className="inline-block text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded font-medium">
                    {s.category}
                  </span>
                  <p className="text-sm text-foreground leading-relaxed text-pretty">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
