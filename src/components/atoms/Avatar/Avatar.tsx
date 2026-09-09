import React, { useEffect, useState } from "react";
import { Avatar as MuiAvatar, type AvatarProps as MuiAvatarProps } from "@mui/material";
import { getInitials } from "../../../utils/helper";

// A drop-in replacement for MUI's <Avatar> that gives every person in the app (caretakers,
// family members, review authors, testimonial subjects, the signed-in account menu) a
// good-looking, *consistent* face instead of a bare initial on a random MUI grey circle.
//
// Resolution order, each falling back gracefully if the previous one 404s:
//   1. `src` — a real uploaded profile photo, if one exists.
//   2. A generated illustrated avatar from DiceBear's free HTTP API, seeded from a stable
//      identifier (id preferred over name, so a renamed user keeps the same look). We use
//      the "personas" style — flat, warm, adult character illustrations that read as
//      professional/trustworthy rather than cartoonish, which fits a healthcare context.
//      The generated background is constrained to the app's own brand hues so avatars feel
//      native to the palette instead of clashing with it.
//   3. If even the network call fails (offline, DiceBear down), a deterministic solid-color
//      initials avatar — the color is hashed from the same seed, so it's stable across
//      renders/sessions without ever hitting the network.
//
// This staged fallback means the component never shows a broken-image icon and never
// requires the caller to know whether a photo exists.
export interface AvatarProps extends Omit<MuiAvatarProps, "children"> {
  /** Display name, used for initials fallback and as a seed fallback. */
  name?: string | null;
  /** Stable identifier (user/caretaker/review id) — preferred seed for the generated avatar. */
  seed?: string | number | null;
}

const DICEBEAR_STYLE = "personas";
// Brand hues (no leading '#', as DiceBear's backgroundColor param expects) the generator
// is allowed to pick from, so illustrated avatars always feel like part of this palette.
const DICEBEAR_BACKGROUND_HUES = ["2F6F5E", "E0875A", "5C9C89", "C36B41", "7A716A", "3178C6"];

// Solid fallback colors for the last-resort initials avatar — same brand family, kept
// distinct enough from each other to differentiate people in a list.
const INITIALS_COLORS = ["#2F6F5E", "#E0875A", "#3178C6", "#8B6F47", "#5C9C89", "#C36B41", "#4A7A9C", "#9C5C7A"];

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

type Stage = "photo" | "generated" | "initials";

const Avatar: React.FC<AvatarProps> = ({ name, seed, src, sx, ...rest }) => {
  const key = String(seed ?? name ?? "eldersphere-user").trim() || "eldersphere-user";
  const initials = getInitials(name);
  const [stage, setStage] = useState<Stage>(src ? "photo" : "generated");

  // Re-evaluate the starting stage if the identity this avatar represents changes (e.g. a
  // card recycled for a different row), rather than getting stuck on a prior fallback.
  useEffect(() => {
    setStage(src ? "photo" : "generated");
  }, [src, key]);

  if (stage === "photo") {
    return (
      <MuiAvatar
        src={src}
        imgProps={{ onError: () => setStage("generated") }}
        sx={sx}
        {...rest}
      >
        {initials}
      </MuiAvatar>
    );
  }

  if (stage === "generated") {
    const generatedUrl = `https://api.dicebear.com/9.x/${DICEBEAR_STYLE}/svg?seed=${encodeURIComponent(
      key
    )}&backgroundColor=${DICEBEAR_BACKGROUND_HUES.join(",")}&radius=50`;
    return (
      <MuiAvatar
        src={generatedUrl}
        imgProps={{ onError: () => setStage("initials") }}
        sx={sx}
        {...rest}
      >
        {initials}
      </MuiAvatar>
    );
  }

  const color = INITIALS_COLORS[hashSeed(key) % INITIALS_COLORS.length];
  return (
    <MuiAvatar sx={{ bgcolor: color, color: "#fff", ...sx }} {...rest}>
      {initials}
    </MuiAvatar>
  );
};

export default Avatar;
