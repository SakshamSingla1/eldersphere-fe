import React, { useCallback, useEffect, useState } from "react";
import { Box, Card, CardContent, IconButton, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import RatingDisplay from "../../atoms/RatingDisplay/RatingDisplay";
import Avatar from "../../atoms/Avatar/Avatar";

export interface TestimonialCarouselItem {
  id: number;
  authorName: string;
  authorRole?: string | null;
  content: string;
  avatarUrl?: string | null;
  rating?: number | null;
}

export interface TestimonialsCarouselProps {
  testimonials: TestimonialCarouselItem[];
  /** Auto-advance interval in ms. 0 disables the timer entirely. */
  intervalMs?: number;
}

const SWIPE_THRESHOLD = 60;

// One testimonial at a time, auto-advancing and swipeable — replaces the old static 3-up
// grid so the section reads well whether the CMS has 1 testimonial or 20, instead of
// looking sparse or overflowing. Auto-advance pauses on hover/focus and is skipped
// entirely under prefers-reduced-motion (arrows/dots still work — only the unattended
// timer and slide transform are affected).
const TestimonialsCarousel: React.FC<TestimonialsCarouselProps> = ({ testimonials, intervalMs = 6000 }) => {
  const theme = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);

  const count = testimonials.length;

  const goTo = useCallback(
    (next: number) => {
      setDirection(next > index || (index === count - 1 && next === 0) ? 1 : -1);
      setIndex(((next % count) + count) % count);
    },
    [index, count]
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (!intervalMs || paused || prefersReducedMotion || count <= 1) return;
    const id = setInterval(next, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, paused, prefersReducedMotion, count, next]);

  const current = testimonials[index];
  if (!current) return null;

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: prefersReducedMotion ? 0 : dir * 60 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: prefersReducedMotion ? 0 : dir * -60 }),
  };

  return (
    <Box
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      sx={{ maxWidth: 640, mx: "auto" }}
    >
      <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 2 }}>
        <IconButton
          onClick={prev}
          aria-label="Previous testimonial"
          disabled={count <= 1}
          sx={{ display: { xs: "none", sm: "inline-flex" } }}
        >
          <ChevronLeftIcon />
        </IconButton>
        <Box sx={{ flex: 1, overflow: "hidden" }}>
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={current.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeOut" }}
              drag={count > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.35}
              onDragEnd={(_e, info) => {
                if (info.offset.x < -SWIPE_THRESHOLD) next();
                else if (info.offset.x > SWIPE_THRESHOLD) prev();
              }}
            >
              <Card sx={{ p: 2, cursor: count > 1 ? "grab" : "default" }}>
                <CardContent>
                  {current.rating != null && <RatingDisplay value={current.rating} />}
                  <Typography variant="body1" sx={{ my: 2, fontStyle: "italic", minHeight: 72 }}>
                    "{current.content}"
                  </Typography>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar src={current.avatarUrl ?? undefined} name={current.authorName} seed={current.id} />
                    <Box>
                      <Typography fontWeight={700}>{current.authorName}</Typography>
                      {current.authorRole && (
                        <Typography variant="body2" color="text.secondary">
                          {current.authorRole}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </Box>
        <IconButton
          onClick={next}
          aria-label="Next testimonial"
          disabled={count <= 1}
          sx={{ display: { xs: "none", sm: "inline-flex" } }}
        >
          <ChevronRightIcon />
        </IconButton>
      </Stack>
      {count > 1 && (
        <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 3 }}>
          {testimonials.map((t, idx) => (
            <Box
              key={t.id}
              component="button"
              type="button"
              aria-label={`Go to testimonial ${idx + 1}`}
              onClick={() => goTo(idx)}
              sx={{
                width: idx === index ? 22 : 8,
                height: 8,
                borderRadius: 4,
                border: "none",
                p: 0,
                cursor: "pointer",
                bgcolor: idx === index ? "primary.main" : alpha(theme.palette.text.primary, 0.2),
                transition: "width 0.25s ease, background-color 0.25s ease",
              }}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default TestimonialsCarousel;
