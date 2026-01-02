import Image from "next/image";

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function Logo({
  size = 48,
  showText = true,
  className = "",
}: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <Image
          src="/logo.png"
          alt="كنيسة السيدة العذراء للأقباط الكاثوليك"
          width={size}
          height={size}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="text-sm sm:text-base font-bold text-primary leading-tight">
            كنيسة السيدة العذراء
          </span>
          <span className="text-xs text-muted-foreground leading-tight">
            للأقباط الكاثوليك بجزيرة الخزندارية
          </span>
        </div>
      )}
    </div>
  );
}
