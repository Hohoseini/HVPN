import * as React from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QrCode({ value, size = 180, className }: QrCodeProps) {
  const [dataUrl, setDataUrl] = React.useState<string>("");

  React.useEffect(() => {
    let active = true;
    const render = async () => {
      try {
        const canvas = document.createElement("canvas");
        const scale = 2;
        await QRCode.toCanvas(canvas, value, {
          width: size * scale,
          margin: 1,
          color: { dark: "#000000", light: "#ffffff" },
          errorCorrectionLevel: "H",
        });
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const c = canvas.width / 2;
          const box = canvas.width * 0.26;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(c - box / 2, c - box / 2, box, box);
          ctx.fillStyle = "#a3e635";
          const r = box * 0.2;
          const x = c - box / 2 + box * 0.08;
          const y = c - box / 2 + box * 0.08;
          const w = box * 0.84;
          ctx.beginPath();
          ctx.roundRect(x, y, w, w, r);
          ctx.fill();

          // official SideRail logo (viewBox 67 15 144 144)
          ctx.save();
          const logoSize = box * 0.6;
          ctx.translate(c - logoSize / 2, c - logoSize / 2);
          const sc = logoSize / 144;
          ctx.scale(sc, sc);
          ctx.translate(-67, -15);
          ctx.fillStyle = "#0b0b0f";
          const paths = [
            "M204.443 116.854C193.075 141.7 168.049 158.997 138.924 158.997C90.2988 158.262 73.4029 117.029 73.3311 116.854H204.443Z",
            "M138.924 15C178.732 15.0003 211.001 47.2522 211 87.0293C210.993 94.7072 209.756 102.334 207.332 109.62H70.835C69.9423 106.835 69.3467 104.312 69.3467 104.312H169.343C175.731 104.311 181.006 101.043 183.458 95.5635C186.122 89.6007 184.994 83.3758 181.076 77.9619C176.838 72.1086 169.728 63.8922 164.805 60.1699C155.733 53.3073 144.205 52.3 134.825 51.9873L132.133 51.8877C127.784 51.7062 126.956 51.6064 104.693 51.6064V51.6152C104.693 51.6152 85.856 51.6272 76.1846 51.6475C88.5599 29.7872 111.994 15 138.924 15Z",
            "M177.241 91.1748C176.416 94.3667 173.877 96.9404 169.343 96.9404H67.6152C67.3529 95.0449 67.171 93.1222 67.0557 91.1748H177.241Z",
            "M104.673 58.8369C123.768 58.8369 127.022 58.915 131.819 59.1123C146.208 59.726 156.269 57.6306 174.968 81.7881C175.485 82.4465 175.998 83.122 176.38 83.8682H67C67.1026 81.4421 67.325 79.0211 67.668 76.6172H125.163V69.3164H69.1123C69.77 66.3355 71.1219 62.6702 72.5225 58.8896C83.342 58.8608 94.4528 58.8369 104.673 58.8369Z",
          ];
          for (const d of paths) ctx.fill(new Path2D(d));
          ctx.restore();
        }
        if (active) setDataUrl(canvas.toDataURL("image/png"));
      } catch {
        if (active) setDataUrl("");
      }
    };
    void render();
    return () => {
      active = false;
    };
  }, [value, size]);

  return (
    <div
      className={cn(
        "grid place-items-center rounded-base border-2 border-border bg-white p-2 neo-shadow",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {dataUrl ? (
        <img src={dataUrl} alt="QR code" className="h-full w-full" />
      ) : (
        <div className="h-full w-full animate-pulse bg-zinc-200" />
      )}
    </div>
  );
}
