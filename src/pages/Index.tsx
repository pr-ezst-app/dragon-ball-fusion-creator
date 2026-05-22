import { useState, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import func2url from "../../backend/func2url.json";

const HERO_IMAGE = "https://cdn.ezst.app/projects/d941eb2a-4f8b-480a-b54f-9e11fc9fb54d/files/3ab7290c-b0fb-44de-91a7-801f0c881922.jpg";
const FUSE_URL = func2url.fuse;

type Page = "home" | "generator";

interface CharSlot {
  name: string;
  previewUrl: string | null;
  b64: string | null;
}

function EnergyParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            background: i % 3 === 0 ? "#f5a623" : i % 3 === 1 ? "#ff6b1a" : "#00d4ff",
            animation: `particle-float ${1.5 + (i * 0.3)}s ease-out ${i * 0.15}s infinite`,
            "--drift": `${(i % 2 === 0 ? 1 : -1) * (10 + i * 3)}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

function UploadSlot({
  slot,
  label,
  color,
  onChange,
}: {
  slot: CharSlot;
  label: string;
  color: string;
  onChange: (data: CharSlot) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onChange({ ...slot, previewUrl: result, b64: result });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col gap-3 flex-1">
      <label className="font-bangers text-lg tracking-wider" style={{ color }}>
        {label}
      </label>

      {/* Image drop zone */}
      <div
        className="char-slot rounded-2xl relative overflow-hidden cursor-pointer"
        style={{
          aspectRatio: "1",
          minHeight: 200,
          borderColor: slot.previewUrl ? color : undefined,
          boxShadow: slot.previewUrl ? `0 0 25px ${color}40` : undefined,
          borderStyle: slot.previewUrl ? "solid" : undefined,
        }}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {slot.previewUrl ? (
          <>
            <img
              src={slot.previewUrl}
              alt={slot.name || label}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              style={{ background: "rgba(0,0,0,0.7)" }}
            >
              <Icon name="RefreshCw" size={24} style={{ color }} />
              <span className="font-bangers text-sm mt-2 tracking-wider" style={{ color }}>
                CHANGE
              </span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: `${color}15`, border: `2px dashed ${color}50` }}
            >
              <Icon name="Upload" size={28} style={{ color: `${color}80` }} />
            </div>
            <div className="text-center">
              <div className="font-bangers text-base tracking-wider" style={{ color: `${color}80` }}>
                DROP IMAGE
              </div>
              <div className="text-xs text-muted-foreground font-rajdhani mt-1">
                or click to browse
              </div>
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {/* Name input */}
      <input
        type="text"
        placeholder="Character name..."
        value={slot.name}
        onChange={(e) => onChange({ ...slot, name: e.target.value })}
        className="w-full px-4 py-3 rounded-xl font-rajdhani font-semibold text-base outline-none transition-all"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${slot.name ? color + "60" : "rgba(255,255,255,0.1)"}`,
          color: slot.name ? color : "rgba(255,255,255,0.5)",
        }}
      />
    </div>
  );
}

export default function Index() {
  const [page, setPage] = useState<Page>("home");

  const [slot1, setSlot1] = useState<CharSlot>({ name: "", previewUrl: null, b64: null });
  const [slot2, setSlot2] = useState<CharSlot>({ name: "", previewUrl: null, b64: null });

  const [fusing, setFusing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [result, setResult] = useState<{
    imageB64: string;
    fusionName: string;
    powerLevel: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canFuse = slot1.name.trim() && slot2.name.trim();

  const reset = () => {
    setSlot1({ name: "", previewUrl: null, b64: null });
    setSlot2({ name: "", previewUrl: null, b64: null });
    setResult(null);
    setError(null);
    setProgress(0);
    setProgressMsg("");
  };

  const handleFuse = async () => {
    if (!canFuse || fusing) return;
    setFusing(true);
    setResult(null);
    setError(null);
    setProgress(0);

    const msgs = [
      "Analyzing battle power...",
      "Merging ki signatures...",
      "Synchronizing auras...",
      "Fusing DNA sequences...",
      "Generating fusion form...",
      "Applying final touches...",
    ];
    let msgIdx = 0;
    setProgressMsg(msgs[0]);

    const progInterval = setInterval(() => {
      setProgress((p) => {
        const next = p + (Math.random() * 8 + 2);
        if (next >= 90) { clearInterval(progInterval); return 90; }
        return next;
      });
      msgIdx = Math.min(msgIdx + 1, msgs.length - 1);
      setProgressMsg(msgs[msgIdx]);
    }, 1500);

    try {
      const res = await fetch(FUSE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name1: slot1.name.trim(),
          name2: slot2.name.trim(),
          image1: slot1.b64 || "",
          image2: slot2.b64 || "",
        }),
      });

      clearInterval(progInterval);
      setProgress(100);

      if (!res.ok) throw new Error("Fusion failed — try again!");
      const data = await res.json();

      setTimeout(() => {
        setResult({
          imageB64: data.fusionImageB64,
          fusionName: data.fusionName,
          powerLevel: data.powerLevel,
        });
        setFusing(false);
      }, 400);
    } catch (err: unknown) {
      clearInterval(progInterval);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setFusing(false);
      setProgress(0);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.imageB64;
    a.download = `fusion_${result.fusionName.toLowerCase().replace(/\s/g, "_")}.jpg`;
    a.click();
  };

  const goGenerator = () => { reset(); setPage("generator"); };

  return (
    <div className="min-h-screen energy-bg noise font-rajdhani">
      {/* NAV */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/5"
        style={{ background: "rgba(6,8,16,0.9)", backdropFilter: "blur(20px)" }}
      >
        <div
          className="font-bangers text-2xl tracking-widest cursor-pointer"
          style={{ color: "#f5a623", textShadow: "0 0 20px rgba(245,166,35,0.5)" }}
          onClick={() => setPage("home")}
        >
          ⚡ FUSIONZ
        </div>
        <div className="flex items-center gap-2">
          {(["home", "generator"] as Page[]).map((p) => (
            <button
              key={p}
              onClick={() => p === "generator" ? goGenerator() : setPage(p)}
              className={`px-5 py-2 rounded-lg font-bangers tracking-wider text-sm transition-all duration-200 ${page === p ? "ki-btn" : "ki-btn-outline"}`}
            >
              {p === "home" ? "⚡ Home" : "🔥 Generator"}
            </button>
          ))}
        </div>
      </nav>

      {/* ─── HOME ─── */}
      {page === "home" && (
        <div>
          <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${HERO_IMAGE})`, opacity: 0.15, backgroundPosition: "center 30%" }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
              <div
                className="inline-block font-bangers text-xs tracking-[0.4em] mb-6 px-4 py-1.5 rounded-full border"
                style={{ borderColor: "rgba(245,166,35,0.4)", color: "#f5a623", background: "rgba(245,166,35,0.07)" }}
              >
                ⚡ AI-POWERED CHARACTER FUSION
              </div>

              <h1
                className="font-bangers leading-none mb-6 animate-slide-up"
                style={{
                  fontSize: "clamp(4rem,13vw,9rem)",
                  color: "#f5a623",
                  letterSpacing: "0.04em",
                  textShadow: "0 0 40px rgba(245,166,35,0.7), 0 0 80px rgba(245,166,35,0.3)",
                }}
              >
                UPLOAD.
                <br />
                <span style={{ color: "#ff6b1a", textShadow: "0 0 40px rgba(255,107,26,0.7)" }}>
                  FUSE.
                </span>
                <br />
                DOWNLOAD.
              </h1>

              <p
                className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto font-rajdhani font-medium animate-slide-up"
                style={{ animationDelay: "0.1s" }}
              >
                Upload photos of any two characters — our AI will fuse them into one epic warrior.
                No API key. No sign-up. Pure power.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
                <button className="ki-btn px-10 py-4 rounded-xl text-xl font-bangers tracking-wider" onClick={goGenerator}>
                  🔥 FUSE NOW
                </button>
              </div>
            </div>

            <div className="absolute animate-ki-float pointer-events-none" style={{ bottom: "15%", left: "8%", opacity: 0.35 }}>
              <div className="w-24 h-24 rounded-full" style={{ background: "radial-gradient(circle, #f5a623, transparent)", filter: "blur(15px)" }} />
            </div>
            <div className="absolute animate-ki-float pointer-events-none" style={{ top: "20%", right: "8%", opacity: 0.25, animationDelay: "1.2s" }}>
              <div className="w-20 h-20 rounded-full" style={{ background: "radial-gradient(circle, #8b5cf6, transparent)", filter: "blur(12px)" }} />
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section className="py-24 px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="font-bangers text-5xl text-center mb-3 tracking-wider" style={{ color: "#f5a623" }}>HOW IT WORKS</h2>
              <p className="text-center text-muted-foreground mb-14 font-rajdhani text-lg">Three steps to the ultimate fusion</p>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { step: "01", title: "Upload 2 Photos", desc: "Upload any photos of characters you want to fuse — real people, anime, games, anything.", icon: "Upload", color: "#f5a623" },
                  { step: "02", title: "Name Them", desc: "Type in each character's name so the AI understands who it's fusing.", icon: "Zap", color: "#ff6b1a" },
                  { step: "03", title: "Download Result", desc: "Get a unique AI-generated fusion character image — download it instantly as a JPEG.", icon: "Download", color: "#8b5cf6" },
                ].map(({ step, title, desc, icon, color }) => (
                  <div key={step} className="ki-card rounded-2xl p-8 text-center relative overflow-hidden group">
                    <div className="font-bangers text-8xl absolute -top-4 -right-2 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity" style={{ color }}>{step}</div>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: `${color}18`, border: `1px solid ${color}40` }}>
                      <Icon name={icon as "Upload"} size={24} style={{ color }} />
                    </div>
                    <h3 className="font-bangers text-2xl tracking-wider mb-3" style={{ color }}>{title}</h3>
                    <p className="text-muted-foreground font-rajdhani leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
              <div className="text-center mt-14">
                <button className="ki-btn px-12 py-4 rounded-xl text-2xl font-bangers tracking-wider" onClick={goGenerator}>
                  ⚡ START FUSING
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ─── GENERATOR ─── */}
      {page === "generator" && (
        <div className="pt-24 pb-20 px-4">
          <div className="max-w-3xl mx-auto">
            <h1
              className="font-bangers text-5xl md:text-6xl text-center mb-2 tracking-wider animate-slide-up"
              style={{ color: "#f5a623", textShadow: "0 0 30px rgba(245,166,35,0.5)" }}
            >
              FUSION GENERATOR
            </h1>
            <p className="text-center text-muted-foreground mb-10 font-rajdhani text-lg">
              Upload two character photos and name them — AI does the rest
            </p>

            {/* RESULT */}
            {result && (
              <div className="result-card rounded-2xl p-6 mb-10 animate-fade-in-scale relative overflow-hidden">
                <EnergyParticles />
                <div className="relative z-10 flex flex-col items-center gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl" style={{ background: "radial-gradient(circle, rgba(245,166,35,0.2), transparent)", filter: "blur(20px)" }} />
                    <img
                      src={result.imageB64}
                      alt={result.fusionName}
                      className="w-full max-w-sm rounded-2xl relative z-10 mx-auto block"
                      style={{ boxShadow: "0 0 60px rgba(245,166,35,0.3), 0 20px 60px rgba(0,0,0,0.5)" }}
                    />
                  </div>

                  <div className="text-center w-full">
                    <div
                      className="font-bangers text-5xl tracking-widest mb-1"
                      style={{ color: "#f5a623", textShadow: "0 0 25px rgba(245,166,35,0.7)" }}
                    >
                      {result.fusionName.toUpperCase()}
                    </div>
                    <div className="text-muted-foreground font-rajdhani mb-4">
                      Fusion of <span style={{ color: "#f5a623" }}>{slot1.name}</span> & <span style={{ color: "#ff6b1a" }}>{slot2.name}</span>
                    </div>

                    <div className="max-w-xs mx-auto mb-5">
                      <div className="flex justify-between text-sm font-rajdhani mb-1.5">
                        <span style={{ color: "#f5a623" }}>POWER LEVEL</span>
                        <span className="font-bold" style={{ color: "#f5a623" }}>{result.powerLevel.toLocaleString()}</span>
                      </div>
                      <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="power-bar h-full rounded-full"
                          style={{ width: `${Math.min((result.powerLevel / 99999) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 justify-center flex-wrap">
                      <button
                        className="ki-btn px-7 py-3 rounded-xl font-bangers tracking-wider flex items-center gap-2 text-lg"
                        onClick={handleDownload}
                      >
                        <Icon name="Download" size={20} />
                        DOWNLOAD
                      </button>
                      <button
                        className="ki-btn-outline px-7 py-3 rounded-xl font-bangers tracking-wider text-lg"
                        onClick={reset}
                      >
                        🔄 NEW FUSION
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* UPLOAD FORM */}
            {!result && (
              <>
                <div className="flex flex-col sm:flex-row gap-6 mb-8">
                  <UploadSlot slot={slot1} label="CHARACTER 1" color="#f5a623" onChange={setSlot1} />

                  <div className="flex sm:flex-col items-center justify-center gap-2 sm:gap-4 py-2">
                    <div className="vs-divider text-3xl">×</div>
                  </div>

                  <UploadSlot slot={slot2} label="CHARACTER 2" color="#ff6b1a" onChange={setSlot2} />
                </div>

                {/* Error */}
                {error && (
                  <div
                    className="rounded-xl px-5 py-3 mb-6 font-rajdhani text-center"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
                  >
                    ⚠️ {error}
                  </div>
                )}

                {/* Progress */}
                {fusing && (
                  <div className="mb-6 animate-fade-in-scale">
                    <div
                      className="font-bangers text-xl text-center mb-3 tracking-wider animate-aura"
                      style={{ color: "#f5a623" }}
                    >
                      ⚡ {progressMsg}
                    </div>
                    <div className="h-4 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="power-bar h-full rounded-full transition-all duration-700"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-center text-sm text-muted-foreground font-rajdhani mt-2">
                      AI is generating your fusion... this takes ~30 seconds
                    </div>
                  </div>
                )}

                {/* Fuse button */}
                <div className="text-center">
                  <button
                    className={`ki-btn px-14 py-5 rounded-xl text-2xl font-bangers tracking-wider ${!canFuse || fusing ? "opacity-40 cursor-not-allowed" : "animate-aura"}`}
                    onClick={handleFuse}
                    disabled={!canFuse || fusing}
                  >
                    {fusing ? "⚡ FUSING..." : "⚡ FUSE! ⚡"}
                  </button>
                  {!canFuse && !fusing && (
                    <p className="text-muted-foreground text-sm font-rajdhani mt-3">
                      {!slot1.name && !slot2.name ? "Upload photos and name both characters to begin" :
                       !slot1.name ? "Name Character 1 to begin" :
                       "Name Character 2 to begin"}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-8 px-4 text-center mt-auto">
        <div className="font-bangers text-2xl tracking-widest mb-2" style={{ color: "#f5a623" }}>⚡ FUSIONZ</div>
        <p className="text-muted-foreground text-sm font-rajdhani">AI-powered character fusion — free, no sign-up needed</p>
      </footer>
    </div>
  );
}
