"use client";

import { ReactNode } from "react";
import { PageTransition } from "./page-transition";

interface PublicPageWrapperProps {
  children: ReactNode;
}

export function PublicPageWrapper({ children }: PublicPageWrapperProps) {
  return <PageTransition>{children}</PageTransition>;
}
