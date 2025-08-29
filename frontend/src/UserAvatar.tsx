import React from "react";

type Props = {
  name?: string | null;
  email?: string | null;
  pictureUrl?: string | null;
  size?: number;
};

function stringToColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 45%)`;
}

function getInitials(name?: string | null, email?: string | null): string {
  const safe = (s?: string | null) => (typeof s === "string" ? s.trim() : "");
  const n = safe(name);
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1) {
      const one = parts[0];
      const second = one.replace(/^./, "")[0] || "";
      return (one[0] + second).toUpperCase();
    }
  }
  const e = safe(email);
  if (e) {
    const local = e.split("@")[0] || e;
    const cleaned = local.replace(/[^a-zA-Z]/g, " ").trim();
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1) {
      const one = parts[0];
      const second = one.replace(/^./, "")[0] || "";
      return (one[0] + second).toUpperCase();
    }
  }
  return "?";
}

export default function UserAvatar({ name, email, pictureUrl, size = 28 }: Props) {
  const initials = getInitials(name, email);
  const color = stringToColor(name || email || initials);
  const dimension = `${size}px`;

  if (pictureUrl) {
    return (
      <img
        src={pictureUrl}
        alt={name || email || "user"}
        style={{
          width: dimension,
          height: dimension,
          borderRadius: "50%",
          objectFit: "cover",
          display: "block",
        }}
      />
    );
  }

  return (
    <div
      aria-label="avatar"
      style={{
        width: dimension,
        height: dimension,
        minWidth: dimension,
        minHeight: dimension,
        borderRadius: "50%",
        background: color,
        color: "#fff",
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        fontSize: size * 0.42,
        lineHeight: 1,
      }}
      title={name || email || undefined}
    >
      {initials}
    </div>
  );
}

