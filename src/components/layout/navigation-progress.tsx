"use client";

import { AppProgressBar as ProgressBar } from "next-nprogress-bar";

export function NavigationProgress() {
  return (
    <ProgressBar
      height="4px"
      color="#3b82f6"
      options={{ showSpinner: false, minimum: 0.08, trickleSpeed: 200 }}
      shallowRouting={false}
    />
  );
}
