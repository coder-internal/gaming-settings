"use client";

import type { SelectHTMLAttributes } from "react";

/**
 * A <select> that resubmits its enclosing form on every change, so the
 * server can recompute which options are actually valid for the next field
 * (e.g. picking a game/computer narrows which target resolutions have a
 * curated profile, which in turn narrows which FPS values do). Falls back
 * to a plain select with no JS: the user just has to press the submit
 * button instead of seeing it happen automatically.
 */
export function AutoSubmitSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      onChange={(e) => {
        props.onChange?.(e);
        e.currentTarget.form?.requestSubmit();
      }}
    />
  );
}
