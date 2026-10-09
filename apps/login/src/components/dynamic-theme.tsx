"use client";

import { Logo } from "@/components/logo";
import { useResponsiveLayout } from "@/lib/theme-hooks";
import { BrandingSettings } from "@zitadel/proto/zitadel/settings/v2/branding_settings_pb";
import React, { Children, ReactNode } from "react";
import { Card } from "./card";
import { ThemeWrapper } from "./theme-wrapper";

type Props = {
  branding?: BrandingSettings;
  children: ReactNode;
};

/**
 * DynamicTheme component handles layout switching between traditional top-to-bottom
 * and modern side-by-side layouts based on NEXT_PUBLIC_THEME_LAYOUT.
 *
 * For side-by-side layout:
 * - First child: Goes to left side (title, description, etc.)
 * - Second child: Goes to right side (forms, buttons, etc.)
 * - Single child: Falls back to right side for backward compatibility
 *
 * For top-to-bottom layout:
 * - All children rendered in traditional centered layout
 */
export function DynamicTheme({ branding, children }: Props) {
    return (
      <ThemeWrapper branding={branding}>
        <div className="fixed inset-0 z-50 flex">
          {/* Left side: brand panel — single truck image with built-in logo */}
          <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-[#F0F0F0]">
            <img
              src="/ui/v2/login/eim-truck.png"
              alt="EIM"
              className="absolute inset-0 w-full h-full object-cover object-left"
            />
          </div>

          {/* Right side: login form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8 overflow-y-auto"
            style={{ color: '#111827' }}>
            <div className={`w-full max-w-md eim-form-overrides`}>
              {children}
            </div>
          </div>
        </div>
      </ThemeWrapper>
    );
  }

