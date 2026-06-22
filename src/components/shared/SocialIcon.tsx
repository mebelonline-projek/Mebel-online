"use client";

interface SocialIconProps {
  platform: string;
  className?: string;
}

const platformColors: Record<string, string> = {
  whatsapp: "text-green-500 hover:text-green-600",
  facebook: "text-blue-600 hover:text-blue-700",
  instagram: "text-pink-500 hover:text-pink-600",
  twitter: "text-sky-500 hover:text-sky-600",
  youtube: "text-red-500 hover:text-red-600",
  tiktok: "text-gray-900 hover:text-gray-600",
  telegram: "text-blue-400 hover:text-blue-500",
  linkedin: "text-blue-700 hover:text-blue-800",
};

const knownPlatforms = [
  "whatsapp",
  "facebook",
  "instagram",
  "twitter",
  "youtube",
  "tiktok",
  "telegram",
  "linkedin",
];

export default function SocialIcon({
  platform,
  className = "",
}: SocialIconProps) {
  const p = platform.toLowerCase();
  const colorClass =
    platformColors[p] ?? "text-gray-500 hover:text-gray-700";
  const show = knownPlatforms.includes(p);

  return (
    <span
      className={
        "inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 transition-colors duration-200 " +
        colorClass +
        " " +
        className
      }
    >
      <svg
        className="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        {show && <use href={"/sprite-social.svg#icon-" + p} />}
        {!show && (
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9V9h2v8zm-1-9.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zM17 17h-2v-4c0-1.1-.9-2-2-2s-2 .9-2 2v4H9V9h2v1.25c.5-.75 1.3-1.25 2.3-1.25 1.5 0 2.7 1.2 2.7 2.7V17z" />
        )}
      </svg>
    </span>
  );
}