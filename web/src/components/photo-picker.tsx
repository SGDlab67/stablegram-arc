"use client";

import { Camera, ImageIcon, Trash2 } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { PrimaryButton, Sheet } from "./ui";
import { haptic } from "./feel";
import { AVATAR_PRESETS, presetUrl } from "@/lib/data";

const VIEW = 280; // crop circle size on screen, in px
const OUT = 320; // saved picture size, in px

/** Full-screen editor: drag to move, slider to zoom, then save a small square JPEG as a data URL. */
function CropEditor({ src, onDone, onCancel }: { src: string; onDone: (dataUrl: string) => void; onCancel: () => void }) {
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [error, setError] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const cover = nat ? VIEW / Math.min(nat.w, nat.h) : 1;
  const dw = nat ? nat.w * cover * zoom : VIEW;
  const dh = nat ? nat.h * cover * zoom : VIEW;
  const clamp = (o: { x: number; y: number }, w = dw, h = dh) => ({
    x: Math.max(-(w - VIEW) / 2, Math.min((w - VIEW) / 2, o.x)),
    y: Math.max(-(h - VIEW) / 2, Math.min((h - VIEW) / 2, o.y)),
  });
  const left = VIEW / 2 - dw / 2 + off.x;
  const top = VIEW / 2 - dh / 2 + off.y;

  const save = () => {
    const img = imgRef.current;
    if (!img || !nat) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return setError("This browser can't edit photos. Try another one.");
    const k = OUT / VIEW;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, left * k, top * k, dw * k, dh * k);
    onDone(canvas.toDataURL("image/jpeg", 0.86));
  };

  return (
    <div className="fixed inset-0 z-[60] mx-auto flex max-w-[430px] flex-col bg-ink text-white">
      <div className="flex h-14 items-center justify-between px-4">
        <button type="button" onClick={onCancel} className="text-[16px] font-semibold text-white/80">
          Cancel
        </button>
        <span className="text-[17px] font-semibold">Move and zoom</span>
        <button type="button" onClick={save} disabled={!nat} className="text-[16px] font-semibold text-[#9CC3EC] disabled:opacity-40">
          Done
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div
          className="relative touch-none select-none overflow-hidden rounded-full ring-2 ring-white/70"
          style={{ width: VIEW, height: VIEW, cursor: "grab" }}
          onPointerDown={(e) => {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) return;
            setOff(clamp({ x: d.ox + e.clientX - d.x, y: d.oy + e.clientY - d.y }));
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          {
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={src}
              alt=""
              draggable={false}
              onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              onError={() => setError("That file couldn't be opened as a photo. Try another.")}
              className="pointer-events-none absolute max-w-none"
              style={{ left, top, width: dw, height: dh }}
            />
          }
        </div>
        {error ? (
          <p className="mt-6 px-8 text-center text-[15px] text-[#FFB4AE]">{error}</p>
        ) : (
          <p className="mt-6 text-[14px] text-white/60">Drag to move. Use the slider to zoom.</p>
        )}
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          aria-label="Zoom"
          onChange={(e) => {
            const z = Number(e.target.value);
            setZoom(z);
            if (nat) setOff((o) => clamp(o, nat.w * cover * z, nat.h * cover * z));
          }}
          className="mt-5 w-[240px] accent-white"
        />
      </div>

      <div className="px-4 pb-[max(env(safe-area-inset-bottom),24px)]">
        <PrimaryButton onClick={save} disabled={!nat}>
          Use this photo
        </PrimaryButton>
      </div>
    </div>
  );
}

/**
 * "Change photo": choose from the photo library or take one with the camera, then crop it.
 * On iPhone the library input also offers Take Photo and Files; the camera input opens the front camera directly.
 */
export function PhotoPicker({
  hasPhoto,
  onChange,
  current,
  children,
}: {
  hasPhoto: boolean;
  onChange: (photo: string | undefined) => void;
  /** The picture in use now, so the chosen character can be ticked. */
  current?: string;
  /** Renders the trigger; call `open()` to show the choices. */
  children: (open: () => void) => ReactNode;
}) {
  const [menu, setMenu] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const library = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);

  const picked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    setMenu(false);
    if (f) setSrc(URL.createObjectURL(f));
  };

  return (
    <>
      {children(() => setMenu(true))}
      <input ref={library} type="file" accept="image/*" className="hidden" onChange={picked} />
      <input ref={camera} type="file" accept="image/*" capture="user" className="hidden" onChange={picked} />

      <Sheet open={menu} onClose={() => setMenu(false)} title="Profile picture">
        <p className="mb-2 text-[14px] font-semibold text-muted">Pick a character</p>
        <div className="mb-5 grid grid-cols-4 gap-3">
          {AVATAR_PRESETS.map((a) => {
            const url = presetUrl(a.id);
            const on = current === url;
            return (
              <button
                key={a.id}
                type="button"
                aria-label={a.label}
                aria-pressed={on}
                onClick={() => {
                  haptic();
                  onChange(url);
                  setMenu(false);
                }}
                className={`aspect-square rounded-full bg-chip bg-cover bg-center transition-transform active:scale-90 ${on ? "ring-[3px] ring-brand ring-offset-2" : ""}`}
                style={{ backgroundImage: `url(${url})` }}
              />
            );
          })}
        </div>
        <p className="mb-2 text-[14px] font-semibold text-muted">Or use a photo</p>
        <div className="space-y-2">
          <button type="button" onClick={() => library.current?.click()} className="flex h-14 w-full items-center gap-3 rounded-2xl bg-chip px-4 text-[17px] font-semibold">
            <ImageIcon size={20} /> Choose from your photos
          </button>
          <button type="button" onClick={() => camera.current?.click()} className="flex h-14 w-full items-center gap-3 rounded-2xl bg-chip px-4 text-[17px] font-semibold">
            <Camera size={20} /> Take a photo
          </button>
          {hasPhoto && (
            <button
              type="button"
              onClick={() => {
                onChange(undefined);
                setMenu(false);
              }}
              className="flex h-14 w-full items-center gap-3 rounded-2xl bg-chip px-4 text-[17px] font-semibold text-down"
            >
              <Trash2 size={20} /> Remove photo
            </button>
          )}
        </div>
      </Sheet>

      {src && (
        <CropEditor
          src={src}
          onCancel={() => {
            URL.revokeObjectURL(src);
            setSrc(null);
          }}
          onDone={(url) => {
            onChange(url);
            URL.revokeObjectURL(src);
            setSrc(null);
          }}
        />
      )}
    </>
  );
}
