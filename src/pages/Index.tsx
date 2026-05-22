import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const HERO_IMAGE = "https://cdn.ezst.app/projects/d941eb2a-4f8b-480a-b54f-9e11fc9fb54d/files/3ab7290c-b0fb-44de-91a7-801f0c881922.jpg";

const CHARACTERS = [
  { id: 1, name: "Goku", power: 9000, type: "Saiyan", color: "#f5a623", emoji: "🔥", traits: ["Super Strength", "Kamehameha", "Ki Mastery"] },
  { id: 2, name: "Vegeta", power: 8800, type: "Saiyan Prince", color: "#ff6b1a", emoji: "⚡", traits: ["Royal Pride", "Galick Gun", "Elite Combat"] },
  { id: 3, name: "Naruto", power: 7500, type: "Jinchūriki", color: "#ff9500", emoji: "🌀", traits: ["Nine-Tails", "Shadow Clones", "Rasengan"] },
  { id: 4, name: "Ichigo", power: 7800, type: "Soul Reaper", color: "#8b5cf6", emoji: "🌙", traits: ["Bankai", "Hollow Power", "Getsuga Tenshō"] },
  { id: 5, name: "Saitama", power: 99999, type: "Hero", color: "#00d4ff", emoji: "👊", traits: ["One Punch", "Limitless Power", "Unbreakable"] },
  { id: 6, name: "Gojo", power: 9500, type: "Sorcerer", color: "#a855f7", emoji: "♾️", traits: ["Infinity", "Six Eyes", "Blue & Red"] },
  { id: 7, name: "Zoro", power: 7200, type: "Swordsman", color: "#22c55e", emoji: "⚔️", traits: ["Three Sword Style", "Haki", "Demon Ashura"] },
  { id: 8, name: "Luffy", power: 8200, type: "Pirate King", color: "#ef4444", emoji: "🌊", traits: ["Gear 5", "Devil Fruit", "Conqueror's Haki"] },
];

const FUSION_NAMES: [string, string, string][] = [
  ["Goku", "Vegeta", "Vegito"],
  ["Goku", "Naruto", "Naroku"],
  ["Goku", "Ichigo", "Ichiku"],
  ["Goku", "Saitama", "Saitaku"],
  ["Vegeta", "Naruto", "Narveta"],
  ["Vegeta", "Ichigo", "Vegigo"],
  ["Naruto", "Ichigo", "Narugo"],
  ["Saitama", "Gojo", "Saitojo"],
  ["Zoro", "Luffy", "Zoffy"],
];

function getFusionName(a: string, b: string): string {
  const pair = FUSION_NAMES.find(
    ([x, y]) => (x === a && y === b) || (x === b && y === a)
  );
  if (pair) return pair[2];
  const half1 = a.slice(0, Math.ceil(a.length / 2));
  const half2 = b.slice(Math.floor(b.length / 2));
  return half1 + half2;
}

function EnergyParticles({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 3 === 0 ? "#f5a623" : i % 3 === 1 ? "#ff6b1a" : "#00d4ff",
            animation: `particle-float ${1.5 + Math.random() * 2}s ease-out ${Math.random() * 2}s infinite`,
            "--drift": `${(Math.random() - 0.5) * 60}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

function AuraRing({ color, size, delay }: { color: string; size: number; delay: number }) {
  return (
    <div
      className="absolute rounded-full border pointer-events-none"
      style={{
        width: size,
        height: size,
        borderColor: color,
        borderWidth: 1,
        opacity: 0.3,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        animation: `aura-pulse ${2 + delay}s ease-in-out ${delay}s infinite`,
      }}
    />
  );
}

type Character = (typeof CHARACTERS)[0];

function CharacterCard({ char, selected, onSelect }: { char: Character; selected: boolean; onSelect: () => void }) {
  return (
    <div
      className={`char-slot rounded-xl p-4 cursor-pointer relative ${selected ? "selected" : ""}`}
      onClick={onSelect}
      style={selected ? { borderColor: char.color, boxShadow: `0 0 25px ${char.color}40` } : {}}
    >
      {selected && (
        <div
          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: char.color, color: "#0a0e1a" }}
        >
          ✓
        </div>
      )}
      <div className="text-3xl mb-2 text-center">{char.emoji}</div>
      <div className="font-bangers text-lg text-center tracking-wider mb-1" style={{ color: char.color }}>
        {char.name}
      </div>
      <div className="text-xs text-center text-muted-foreground font-rajdhani mb-2">{char.type}</div>
      <div className="h-1 rounded w-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded transition-all duration-1000"
          style={{
            width: `${Math.min((char.power / 99999) * 100, 100)}%`,
            background: `linear-gradient(90deg, ${char.color}, ${char.color}aa)`,
            boxShadow: `0 0 8px ${char.color}80`,
          }}
        />
      </div>
      <div className="text-xs text-center mt-1 font-rajdhani" style={{ color: char.color }}>
        PL: {char.power.toLocaleString()}
      </div>
    </div>
  );
}

function FusionCanvas({ char1, char2, onReady }: { char1: Character; char2: Character; onReady: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 600;

    const bg = ctx.createRadialGradient(300, 300, 0, 300, 300, 300);
    bg.addColorStop(0, "#1a1230");
    bg.addColorStop(0.5, "#0f1020");
    bg.addColorStop(1, "#060810");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 600, 600);

    const drawAura = (cx: number, cy: number, color: string, rings: number) => {
      for (let r = rings; r > 0; r--) {
        const grad = ctx.createRadialGradient(cx, cy, r * 20, cx, cy, r * 40);
        grad.addColorStop(0, color + "30");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 40, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawAura(200, 300, char1.color, 3);
    drawAura(400, 300, char2.color, 3);

    const fusionGrad = ctx.createRadialGradient(300, 250, 0, 300, 250, 200);
    fusionGrad.addColorStop(0, "rgba(245,166,35,0.3)");
    fusionGrad.addColorStop(0.4, "rgba(255,107,26,0.15)");
    fusionGrad.addColorStop(1, "transparent");
    ctx.fillStyle = fusionGrad;
    ctx.fillRect(0, 0, 600, 600);

    const drawLightning = (x1: number, y1: number, x2: number, y2: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      const segments = 8;
      for (let i = 1; i <= segments; i++) {
        const px = x1 + ((x2 - x1) * i) / segments + (Math.random() - 0.5) * 30;
        const py = y1 + ((y2 - y1) * i) / segments + (Math.random() - 0.5) * 30;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    for (let i = 0; i < 6; i++) {
      drawLightning(
        100 + Math.random() * 100, 100 + Math.random() * 400,
        400 + Math.random() * 100, 100 + Math.random() * 400,
        i % 2 === 0 ? char1.color : char2.color
      );
    }

    ctx.font = "bold 120px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = char1.color + "cc";
    ctx.shadowBlur = 20;
    ctx.shadowColor = char1.color;
    ctx.fillText(char1.emoji, 160, 280);

    ctx.fillStyle = char2.color + "cc";
    ctx.shadowColor = char2.color;
    ctx.fillText(char2.emoji, 440, 280);
    ctx.shadowBlur = 0;

    ctx.font = "bold 72px Arial";
    ctx.fillStyle = "rgba(245,166,35,0.9)";
    ctx.shadowBlur = 30;
    ctx.shadowColor = "#f5a623";
    ctx.fillText("⚡", 300, 270);
    ctx.shadowBlur = 0;

    const fusionName = getFusionName(char1.name, char2.name);
    const fusedPower = Math.floor((char1.power + char2.power) * 1.5);

    ctx.font = "bold 52px Impact, Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#f5a623";
    ctx.shadowBlur = 25;
    ctx.shadowColor = "#f5a623";
    ctx.fillText(fusionName.toUpperCase(), 300, 420);
    ctx.shadowBlur = 0;

    ctx.font = "bold 22px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText(`POWER LEVEL: ${fusedPower.toLocaleString()}`, 300, 470);

    ctx.font = "16px Arial";
    ctx.fillStyle = "rgba(245,166,35,0.5)";
    ctx.fillText(`${char1.name} × ${char2.name}`, 300, 510);

    const border = ctx.createLinearGradient(0, 0, 600, 600);
    border.addColorStop(0, char1.color);
    border.addColorStop(0.5, "#f5a623");
    border.addColorStop(1, char2.color);
    ctx.strokeStyle = border;
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, 584, 584);

    onReady(canvas.toDataURL("image/png"));
  }, [char1, char2, onReady]);

  return <canvas ref={canvasRef} style={{ display: "none" }} />;
}

type Page = "home" | "generator";

export default function Index() {
  const [page, setPage] = useState<Page>("home");
  const [char1, setChar1] = useState<Character | null>(null);
  const [char2, setChar2] = useState<Character | null>(null);
  const [fusionResult, setFusionResult] = useState<{ name: string; power: number; traits: string[] } | null>(null);
  const [fusing, setFusing] = useState(false);
  const [fusionImageUrl, setFusionImageUrl] = useState<string | null>(null);
  const [powerProgress, setPowerProgress] = useState(0);

  const handleCharSelect = (char: Character) => {
    if (char1?.id === char.id) { setChar1(null); return; }
    if (char2?.id === char.id) { setChar2(null); return; }
    if (!char1) { setChar1(char); return; }
    if (!char2) { setChar2(char); return; }
    setChar2(char);
  };

  const isSelected = (id: number) => char1?.id === id || char2?.id === id;

  const handleFuse = () => {
    if (!char1 || !char2) return;
    setFusing(true);
    setFusionResult(null);
    setFusionImageUrl(null);
    setPowerProgress(0);

    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 15;
      if (prog >= 100) { prog = 100; clearInterval(interval); }
      setPowerProgress(Math.min(prog, 100));
    }, 80);

    setTimeout(() => {
      const name = getFusionName(char1.name, char2.name);
      const power = Math.floor((char1.power + char2.power) * 1.5);
      const traits = [...char1.traits.slice(0, 2), ...char2.traits.slice(0, 2)];
      setFusionResult({ name, power, traits });
      setFusing(false);
    }, 2000);
  };

  const handleCanvasReady = useCallback((dataUrl: string) => {
    setFusionImageUrl(dataUrl);
  }, []);

  const handleDownload = () => {
    if (!fusionImageUrl || !fusionResult) return;
    const a = document.createElement("a");
    a.href = fusionImageUrl;
    a.download = `fusion_${fusionResult.name.toLowerCase()}.png`;
    a.click();
  };

  const reset = () => {
    setChar1(null);
    setChar2(null);
    setFusionResult(null);
    setFusionImageUrl(null);
    setPowerProgress(0);
  };

  const goGenerator = () => { reset(); setPage("generator"); };

  return (
    <div className="min-h-screen energy-bg noise font-rajdhani">
      {char1 && char2 && fusionResult && (
        <FusionCanvas char1={char1} char2={char2} onReady={handleCanvasReady} />
      )}

      {/* NAV */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/5"
        style={{ background: "rgba(6,8,16,0.85)", backdropFilter: "blur(20px)" }}
      >
        <div
          className="font-bangers text-2xl tracking-widest cursor-pointer text-ki-glow"
          style={{ color: "#f5a623" }}
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

      {/* ──────────── HOME ──────────── */}
      {page === "home" && (
        <div>
          <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${HERO_IMAGE})`, opacity: 0.18, backgroundPosition: "center 30%" }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
              <div
                className="inline-block font-bangers text-sm tracking-[0.3em] mb-6 px-4 py-1 rounded-full border"
                style={{ borderColor: "rgba(245,166,35,0.4)", color: "#f5a623", background: "rgba(245,166,35,0.08)" }}
              >
                ⚡ THE ULTIMATE FUSION EXPERIENCE
              </div>
              <h1
                className="font-bangers leading-none mb-6 animate-slide-up"
                style={{ fontSize: "clamp(4rem,12vw,8rem)", color: "#f5a623", letterSpacing: "0.05em", textShadow: "0 0 30px rgba(245,166,35,0.8), 0 0 60px rgba(245,166,35,0.3)" }}
              >
                FUSE ANY<br />
                <span style={{ color: "#ff6b1a", textShadow: "0 0 30px rgba(255,107,26,0.8)" }}>CHARACTER</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto font-rajdhani font-medium animate-slide-up" style={{ animationDelay: "0.1s" }}>
                Combine your favorite anime warriors into one unstoppable fusion fighter. Download your creation and share the power.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
                <button className="ki-btn px-10 py-4 rounded-xl text-xl font-bangers tracking-wider" onClick={goGenerator}>
                  🔥 START FUSING
                </button>
                <button
                  className="ki-btn-outline px-8 py-4 rounded-xl text-lg font-bangers tracking-wider"
                  onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
                >
                  How It Works
                </button>
              </div>
            </div>
            <div className="absolute animate-ki-float pointer-events-none" style={{ bottom: "15%", left: "8%", opacity: 0.4 }}>
              <div className="w-20 h-20 rounded-full" style={{ background: "radial-gradient(circle, #f5a623, transparent)", filter: "blur(10px)" }} />
            </div>
            <div className="absolute animate-ki-float pointer-events-none" style={{ top: "20%", right: "8%", opacity: 0.3, animationDelay: "1s" }}>
              <div className="w-16 h-16 rounded-full" style={{ background: "radial-gradient(circle, #8b5cf6, transparent)", filter: "blur(10px)" }} />
            </div>
          </section>

          <section id="how" className="py-24 px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="font-bangers text-5xl text-center mb-4 tracking-wider" style={{ color: "#f5a623" }}>HOW IT WORKS</h2>
              <p className="text-center text-muted-foreground mb-16 font-rajdhani text-lg">Three steps to unleash the ultimate power</p>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { step: "01", title: "Choose Fighters", desc: "Select two characters from our roster of legendary anime warriors.", icon: "Users", color: "#f5a623" },
                  { step: "02", title: "Fuse Their Power", desc: "Watch as their ki merges in an explosive fusion sequence.", icon: "Zap", color: "#ff6b1a" },
                  { step: "03", title: "Download & Share", desc: "Get your unique fusion character card as a downloadable PNG.", icon: "Download", color: "#8b5cf6" },
                ].map(({ step, title, desc, icon, color }) => (
                  <div key={step} className="ki-card rounded-2xl p-8 text-center relative overflow-hidden">
                    <div className="font-bangers text-7xl absolute -top-2 -right-2 opacity-10" style={{ color }}>{step}</div>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: `${color}20`, border: `1px solid ${color}50` }}>
                      <Icon name={icon as "Users"} size={24} style={{ color }} />
                    </div>
                    <h3 className="font-bangers text-2xl tracking-wider mb-3" style={{ color }}>{title}</h3>
                    <p className="text-muted-foreground font-rajdhani">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-16 px-4 border-t border-white/5">
            <div className="max-w-5xl mx-auto">
              <h2 className="font-bangers text-4xl text-center mb-2 tracking-wider" style={{ color: "#f5a623" }}>THE ROSTER</h2>
              <p className="text-center text-muted-foreground mb-10 font-rajdhani">8 legendary warriors await fusion</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {CHARACTERS.map((c) => (
                  <div key={c.id} className="ki-card rounded-xl p-4 text-center">
                    <div className="text-4xl mb-2">{c.emoji}</div>
                    <div className="font-bangers text-lg tracking-wider" style={{ color: c.color }}>{c.name}</div>
                    <div className="text-xs text-muted-foreground font-rajdhani">{c.type}</div>
                    <div className="mt-2 h-1 rounded bg-white/10 overflow-hidden">
                      <div className="h-full rounded" style={{ width: `${Math.min((c.power / 99999) * 100, 100)}%`, background: c.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-12">
                <button className="ki-btn px-12 py-4 rounded-xl text-2xl font-bangers tracking-wider" onClick={goGenerator}>
                  ⚡ FUSE NOW
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ──────────── GENERATOR ──────────── */}
      {page === "generator" && (
        <div className="pt-24 pb-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="font-bangers text-5xl md:text-6xl text-center mb-2 tracking-wider animate-slide-up" style={{ color: "#f5a623" }}>
              FUSION GENERATOR
            </h1>
            <p className="text-center text-muted-foreground mb-10 font-rajdhani text-lg">
              {!char1 && !char2 && "Select your first fighter"}
              {char1 && !char2 && `${char1.name} selected — pick the second fighter`}
              {char1 && char2 && !fusionResult && `${char1.name} × ${char2.name} — ready to fuse!`}
              {fusionResult && `Fusion complete: ${fusionResult.name}!`}
            </p>

            {/* Selected preview */}
            {(char1 || char2) && (
              <div className="flex items-center justify-center gap-6 mb-8 animate-fade-in-scale">
                <div
                  className="flex items-center gap-3 px-5 py-3 rounded-xl border"
                  style={{ borderColor: char1 ? `${char1.color}50` : "rgba(255,255,255,0.1)", background: char1 ? `${char1.color}10` : "rgba(255,255,255,0.03)" }}
                >
                  <span className="text-2xl">{char1 ? char1.emoji : "❓"}</span>
                  <span className="font-bangers text-xl tracking-wider" style={{ color: char1?.color || "#555" }}>
                    {char1?.name || "—"}
                  </span>
                </div>
                <div className="vs-divider">×</div>
                <div
                  className="flex items-center gap-3 px-5 py-3 rounded-xl border"
                  style={{ borderColor: char2 ? `${char2.color}50` : "rgba(255,255,255,0.1)", background: char2 ? `${char2.color}10` : "rgba(255,255,255,0.03)" }}
                >
                  <span className="text-2xl">{char2 ? char2.emoji : "❓"}</span>
                  <span className="font-bangers text-xl tracking-wider" style={{ color: char2?.color || "#555" }}>
                    {char2?.name || "—"}
                  </span>
                </div>
              </div>
            )}

            {/* Result card */}
            {fusionResult && (
              <div className="result-card rounded-2xl p-8 mb-10 animate-fade-in-scale relative overflow-hidden">
                <EnergyParticles active={true} />
                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                  <div className="relative flex-shrink-0 w-48 h-48 flex items-center justify-center">
                    <AuraRing color={char1!.color} size={240} delay={0} />
                    <AuraRing color={char2!.color} size={200} delay={0.5} />
                    <AuraRing color="#f5a623" size={160} delay={1} />
                    {fusionImageUrl ? (
                      <img
                        src={fusionImageUrl}
                        alt={fusionResult.name}
                        className="w-40 h-40 rounded-xl object-cover relative z-10"
                        style={{ boxShadow: `0 0 40px ${char1!.color}40, 0 0 80px ${char2!.color}20` }}
                      />
                    ) : (
                      <div className="w-40 h-40 rounded-xl flex items-center justify-center relative z-10 text-6xl animate-aura"
                        style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(245,166,35,0.3)" }}>
                        ⚡
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-bangers text-5xl md:text-6xl tracking-widest mb-1" style={{ color: "#f5a623", textShadow: "0 0 20px rgba(245,166,35,0.6)" }}>
                      {fusionResult.name.toUpperCase()}
                    </div>
                    <div className="text-muted-foreground font-rajdhani mb-4">Fusion of {char1!.name} & {char2!.name}</div>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm font-rajdhani mb-1">
                        <span style={{ color: "#f5a623" }}>POWER LEVEL</span>
                        <span className="font-bold" style={{ color: "#f5a623" }}>{fusionResult.power.toLocaleString()}</span>
                      </div>
                      <div className="h-3 rounded bg-white/10 overflow-hidden">
                        <div className="power-bar h-full rounded" style={{ width: `${Math.min((fusionResult.power / 150000) * 100, 100)}%` }} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {fusionResult.traits.map((t) => (
                        <span key={t} className="px-3 py-1 rounded-full text-xs font-rajdhani font-semibold"
                          style={{ background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)", color: "#f5a623" }}>
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      <button className="ki-btn px-6 py-3 rounded-xl font-bangers tracking-wider flex items-center gap-2" onClick={handleDownload} disabled={!fusionImageUrl}>
                        <Icon name="Download" size={18} />
                        DOWNLOAD
                      </button>
                      <button className="ki-btn-outline px-6 py-3 rounded-xl font-bangers tracking-wider" onClick={reset}>
                        🔄 NEW FUSION
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fuse button / progress */}
            {char1 && char2 && !fusionResult && (
              <div className="text-center mb-10">
                {fusing ? (
                  <div className="animate-fade-in-scale">
                    <div className="font-bangers text-2xl mb-4 tracking-wider animate-aura" style={{ color: "#f5a623" }}>
                      ⚡ FUSION IN PROGRESS...
                    </div>
                    <div className="max-w-sm mx-auto">
                      <div className="h-4 rounded-full bg-white/10 overflow-hidden mb-2">
                        <div className="power-bar h-full rounded-full transition-all duration-300" style={{ width: `${powerProgress}%` }} />
                      </div>
                      <div className="text-sm text-muted-foreground font-rajdhani">
                        Merging ki energy... {Math.round(powerProgress)}%
                      </div>
                    </div>
                  </div>
                ) : (
                  <button className="ki-btn px-14 py-5 rounded-xl text-2xl font-bangers tracking-wider animate-aura" onClick={handleFuse}>
                    ⚡ FUSE! ⚡
                  </button>
                )}
              </div>
            )}

            {/* Character grid */}
            {!fusionResult && (
              <div>
                <h3 className="font-bangers text-2xl tracking-wider mb-4" style={{ color: "rgba(245,166,35,0.7)" }}>SELECT FIGHTERS</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {CHARACTERS.map((char) => (
                    <CharacterCard key={char.id} char={char} selected={isSelected(char.id)} onSelect={() => handleCharSelect(char)} />
                  ))}
                </div>
                {(char1 || char2) && (
                  <div className="text-center mt-4">
                    <button className="ki-btn-outline px-6 py-2 rounded-lg font-bangers text-sm" onClick={reset}>Clear Selection</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="border-t border-white/5 py-8 px-4 text-center">
        <div className="font-bangers text-2xl tracking-widest mb-2" style={{ color: "#f5a623" }}>⚡ FUSIONZ</div>
        <p className="text-muted-foreground text-sm font-rajdhani">The ultimate anime character fusion generator</p>
      </footer>
    </div>
  );
}
