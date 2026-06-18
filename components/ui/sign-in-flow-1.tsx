import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { login, register } from "@/lib/auth";

/* ─── Types ─────────────────────────────────────────────── */
type Uniforms = {
  [key: string]: { value: number[] | number[][] | number; type: string };
};

interface ShaderProps {
  source: string;
  uniforms: { [key: string]: { value: number[] | number[][] | number; type: string } };
  maxFps?: number;
}

export interface SignInPageProps {
  className?: string;
  onLogin?: () => void;
}

/* ─── Canvas Reveal Effect ──────────────────────────────── */
export const CanvasRevealEffect = ({
  animationSpeed = 10,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[0, 255, 255]],
  containerClassName,
  dotSize,
  showGradient = true,
  reverse = false,
}: {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
  reverse?: boolean;
}) => (
  <div className={cn("h-full relative w-full", containerClassName)}>
    <div className="h-full w-full">
      <DotMatrix
        colors={colors ?? [[0, 255, 255]]}
        dotSize={dotSize ?? 3}
        opacities={opacities ?? [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1]}
        shader={`${reverse ? "u_reverse_active" : "false"}_;animation_speed_factor_${animationSpeed.toFixed(1)}_;`}
        center={["x", "y"]}
      />
    </div>
    {showGradient && (
      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
    )}
  </div>
);

/* ─── Dot Matrix ────────────────────────────────────────── */
interface DotMatrixProps {
  colors?: number[][];
  opacities?: number[];
  totalSize?: number;
  dotSize?: number;
  shader?: string;
  center?: ("x" | "y")[];
}

const DotMatrix: React.FC<DotMatrixProps> = ({
  colors = [[0, 0, 0]],
  opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
  totalSize = 20,
  dotSize = 2,
  shader = "",
  center = ["x", "y"],
}) => {
  const uniforms = useMemo(() => {
    let colorsArray = [colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]];
    if (colors.length === 2) colorsArray = [colors[0], colors[0], colors[0], colors[1], colors[1], colors[1]];
    else if (colors.length === 3) colorsArray = [colors[0], colors[0], colors[1], colors[1], colors[2], colors[2]];
    return {
      u_colors: { value: colorsArray.map((c) => [c[0] / 255, c[1] / 255, c[2] / 255]), type: "uniform3fv" },
      u_opacities: { value: opacities, type: "uniform1fv" },
      u_total_size: { value: totalSize, type: "uniform1f" },
      u_dot_size: { value: dotSize, type: "uniform1f" },
      u_reverse: { value: shader.includes("u_reverse_active") ? 1 : 0, type: "uniform1i" },
    };
  }, [colors, opacities, totalSize, dotSize, shader]);

  return (
    <Shader
      source={`
        precision mediump float;
        in vec2 fragCoord;
        uniform float u_time;
        uniform float u_opacities[10];
        uniform vec3 u_colors[6];
        uniform float u_total_size;
        uniform float u_dot_size;
        uniform vec2 u_resolution;
        uniform int u_reverse;
        out vec4 fragColor;
        float PHI = 1.61803398874989484820459;
        float random(vec2 xy) { return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x); }
        void main() {
          vec2 st = fragCoord.xy;
          ${center.includes("x") ? "st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));" : ""}
          ${center.includes("y") ? "st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));" : ""}
          float opacity = step(0.0, st.x) * step(0.0, st.y);
          vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));
          float frequency = 5.0;
          float show_offset = random(st2);
          float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
          opacity *= u_opacities[int(rand * 10.0)];
          opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
          opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));
          vec3 color = u_colors[int(show_offset * 6.0)];
          float animation_speed_factor = 0.5;
          vec2 center_grid = u_resolution / 2.0 / u_total_size;
          float dist_from_center = distance(center_grid, st2);
          float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);
          float max_grid_dist = distance(center_grid, vec2(0.0, 0.0));
          float timing_offset_outro = (max_grid_dist - dist_from_center) * 0.02 + (random(st2 + 42.0) * 0.2);
          float current_timing_offset;
          if (u_reverse == 1) {
            current_timing_offset = timing_offset_outro;
            opacity *= 1.0 - step(current_timing_offset, u_time * animation_speed_factor);
            opacity *= clamp((step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
          } else {
            current_timing_offset = timing_offset_intro;
            opacity *= step(current_timing_offset, u_time * animation_speed_factor);
            opacity *= clamp((1.0 - step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
          }
          fragColor = vec4(color, opacity);
          fragColor.rgb *= fragColor.a;
        }`}
      uniforms={uniforms}
      maxFps={60}
    />
  );
};

/* ─── Shader / Three.js plumbing ────────────────────────── */
const ShaderMaterial = ({
  source,
  uniforms,
  maxFps = 60,
}: {
  source: string;
  uniforms: Uniforms;
  maxFps?: number;
}) => {
  const { size } = useThree();
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const mat: any = ref.current.material;
    if (mat.uniforms?.u_time) mat.uniforms.u_time.value = clock.getElapsedTime();
  });

  const getUniforms = () => {
    const out: any = {};
    for (const name in uniforms) {
      const u: any = uniforms[name];
      switch (u.type) {
        case "uniform1f":  out[name] = { value: u.value }; break;
        case "uniform1i":  out[name] = { value: u.value }; break;
        case "uniform3f":  out[name] = { value: new THREE.Vector3().fromArray(u.value as number[]) }; break;
        case "uniform1fv": out[name] = { value: u.value }; break;
        case "uniform3fv": out[name] = { value: (u.value as number[][]).map((v) => new THREE.Vector3().fromArray(v)) }; break;
        case "uniform2f":  out[name] = { value: new THREE.Vector2().fromArray(u.value as number[]) }; break;
        default: console.error(`Unknown uniform type '${name}'`);
      }
    }
    out["u_time"] = { value: 0 };
    out["u_resolution"] = { value: new THREE.Vector2(size.width * 2, size.height * 2) };
    return out;
  };

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: `
          precision mediump float;
          uniform vec2 u_resolution;
          out vec2 fragCoord;
          void main(){
            gl_Position = vec4(position.x, position.y, 0.0, 1.0);
            fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
            fragCoord.y = u_resolution.y - fragCoord.y;
          }`,
        fragmentShader: source,
        uniforms: getUniforms(),
        glslVersion: THREE.GLSL3,
        blending: THREE.CustomBlending,
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.OneFactor,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size.width, size.height, source],
  );

  return (
    <mesh ref={ref as any}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const Shader: React.FC<ShaderProps> = ({ source, uniforms, maxFps = 60 }) => (
  <Canvas className="absolute inset-0 h-full w-full">
    <ShaderMaterial source={source} uniforms={uniforms} maxFps={maxFps} />
  </Canvas>
);

/* ─── Navbar ────────────────────────────────────────────── */
const AnimatedNavLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a href={href} className="group relative inline-flex overflow-hidden h-5 items-center text-sm">
    <div className="flex flex-col transition-transform duration-300 ease-out group-hover:-translate-y-1/2">
      <span className="text-gray-300">{children}</span>
      <span className="text-white">{children}</span>
    </div>
  </a>
);

function MiniNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [shape, setShape] = useState("rounded-full");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isOpen) {
      setShape("rounded-xl");
    } else {
      timerRef.current = setTimeout(() => setShape("rounded-full"), 300);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isOpen]);

  const logo = (
    <div className="relative w-5 h-5 flex items-center justify-center">
      {["top-0 left-1/2 -translate-x-1/2", "left-0 top-1/2 -translate-y-1/2", "right-0 top-1/2 -translate-y-1/2", "bottom-0 left-1/2 -translate-x-1/2"].map((pos, i) => (
        <span key={i} className={`absolute w-1.5 h-1.5 rounded-full bg-gray-200 opacity-80 transform ${pos}`} />
      ))}
    </div>
  );

  const navLinks = [
    { label: "Manifesto", href: "#1" },
    { label: "Careers",   href: "#2" },
    { label: "Discover",  href: "#3" },
  ];

  return (
    <header className={cn(
      "fixed top-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center px-6 py-3 backdrop-blur-sm border border-[#333] bg-[#1f1f1f57] w-[calc(100%-2rem)] sm:w-auto transition-[border-radius] duration-300",
      shape,
    )}>
      <div className="flex items-center justify-between w-full gap-x-6 sm:gap-x-8">
        <div className="flex items-center">{logo}</div>
        <nav className="hidden sm:flex items-center space-x-6 text-sm">
          {navLinks.map((l) => <AnimatedNavLink key={l.href} href={l.href}>{l.label}</AnimatedNavLink>)}
        </nav>
        <div className="hidden sm:flex items-center gap-3">
          <button className="px-3 py-2 text-xs border border-[#333] bg-[rgba(31,31,31,0.62)] text-gray-300 rounded-full hover:border-white/50 hover:text-white transition-colors duration-200">
            LogIn
          </button>
          <button className="px-3 py-2 text-xs font-semibold text-black bg-gradient-to-br from-gray-100 to-gray-300 rounded-full hover:from-gray-200 hover:to-gray-400 transition-all duration-200">
            Signup
          </button>
        </div>
        <button className="sm:hidden text-gray-300 w-8 h-8 flex items-center justify-center" onClick={() => setIsOpen(!isOpen)}>
          {isOpen
            ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>}
        </button>
      </div>

      <div className={cn(
        "sm:hidden flex flex-col items-center w-full transition-all ease-in-out duration-300 overflow-hidden",
        isOpen ? "max-h-[400px] opacity-100 pt-4" : "max-h-0 opacity-0 pt-0 pointer-events-none",
      )}>
        <nav className="flex flex-col items-center space-y-4 w-full">
          {navLinks.map((l) => <a key={l.href} href={l.href} className="text-gray-300 hover:text-white transition-colors w-full text-center">{l.label}</a>)}
        </nav>
      </div>
    </header>
  );
}

/* ─── Eye icon (show / hide password) ──────────────────── */
const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
) : (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.293-3.95M6.7 6.7A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.956 9.956 0 01-1.357 2.575M6.7 6.7L3 3m3.7 3.7l10.6 10.6M17.3 17.3L21 21" />
  </svg>
);

/* ─── Main SignInPage ────────────────────────────────────── */
export const SignInPage = ({ className, onLogin }: SignInPageProps) => {
  const [step, setStep] = useState<"credentials" | "success">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");

  const [initialCanvasVisible, setInitialCanvasVisible] = useState(true);
  const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      if (mode === "register") {
        await register(email, password);
      } else {
        await login(email, password);
      }
      setReverseCanvasVisible(true);
      setTimeout(() => setInitialCanvasVisible(false), 50);
      setTimeout(() => setStep("success"), 1800);
    } catch (err: any) {
      setError(err.message || `${mode === "register" ? "Registration" : "Login"} failed. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => onLogin?.();

  return (
    <div className={cn("flex w-full flex-col min-h-screen bg-black relative", className)}>
      {/* Background canvas */}
      <div className="absolute inset-0 z-0">
        {initialCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={3}
              containerClassName="bg-black"
              colors={[[255, 255, 255], [255, 255, 255]]}
              dotSize={6}
              reverse={false}
            />
          </div>
        )}
        {reverseCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={4}
              containerClassName="bg-black"
              colors={[[255, 255, 255], [255, 255, 255]]}
              dotSize={6}
              reverse={true}
            />
          </div>
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.85)_0%,_transparent_100%)]" />
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1">

        <div className="flex flex-1 flex-col justify-center items-center px-4">
          <div className="w-full mt-[100px] max-w-sm">
            <AnimatePresence mode="wait">

              {/* ── Credentials step ── */}
              {step === "credentials" && (
                <motion.div
                  key="credentials"
                  initial={{ opacity: 0, x: -60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-6 text-center"
                >
                  <div className="space-y-1">
                    <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">
                      {mode === "register" ? "Create your account" : "Welcome back"}
                    </h1>
                    <p className="text-[1.1rem] text-white/60 font-light">
                      {mode === "register"
                        ? "Create a SocialHub account to manage your social profiles."
                        : "Sign in to continue to your SocialHub dashboard."}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Email */}
                    <input
                      type="email"
                      placeholder="admin@socialhub.com"
                      value={email}
                      autoComplete="email"
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 backdrop-blur-[1px] text-white border border-white/10 rounded-full py-3 px-5 focus:outline-none focus:border-white/30 text-center placeholder:text-white/30 transition-colors"
                      required
                    />

                    {/* Password */}
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        autoComplete="current-password"
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 backdrop-blur-[1px] text-white border border-white/10 rounded-full py-3 px-5 pr-12 focus:outline-none focus:border-white/30 text-center placeholder:text-white/30 transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        <EyeIcon open={showPassword} />
                      </button>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-red-400 text-sm py-2 px-4 bg-red-500/10 border border-red-500/20 rounded-full"
                        >
                          <div>{error}</div>
                          {error.toLowerCase().includes("backend") && (
                            <div className="text-xs text-red-100/75 mt-2">
                              Check that the backend server is running on <strong>http://localhost:5174</strong>.
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      disabled={loading || !email || !password}
                      whileHover={!loading ? { scale: 1.02 } : {}}
                      whileTap={!loading ? { scale: 0.98 } : {}}
                      className={cn(
                        "w-full rounded-full font-semibold py-3 transition-all duration-300",
                        email && password && !loading
                          ? "bg-white text-black hover:bg-white/90 cursor-pointer"
                          : "bg-white/10 text-white/40 cursor-not-allowed",
                      )}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          {mode === "register" ? "Creating account…" : "Signing in…"}
                        </span>
                      ) : mode === "register" ? "Register" : "Sign in"}
                    </motion.button>
                  </form>

                  <p className="text-xs text-white/30 pt-4">
                    {mode === "register"
                      ? "Create your free SocialHub user account to manage social accounts."
                      : "Sign in to continue to your SocialHub dashboard."}
                  </p>
                  <p className="text-xs text-white/30 pt-2">
                    {mode === "register" ? "Already have an account?" : "Need an account?"}
                    <button
                      type="button"
                      onClick={() => setMode(mode === "register" ? "login" : "register")}
                      className="ml-2 text-white font-semibold underline"
                    >
                      {mode === "register" ? "Sign in" : "Register now"}
                    </button>
                  </p>
                </motion.div>
              )}

              {/* ── Success step ── */}
              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="space-y-6 text-center"
                >
                  <div className="space-y-1">
                    <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">
                      You're in!
                    </h1>
                    <p className="text-[1.1rem] text-white/50 font-light">
                      Welcome, Admin
                    </p>
                  </div>

                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3, type: "spring" }}
                    className="py-8"
                  >
                    <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-white to-white/70 flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.25)]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-black" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </motion.div>

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleContinue}
                    className="w-full rounded-full bg-white text-black font-semibold py-3 hover:bg-white/90 transition-colors"
                  >
                    Continue to Dashboard →
                  </motion.button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
