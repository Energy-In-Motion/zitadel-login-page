"use client";

  import { BrandingSettings } from "@zitadel/proto/zitadel/settings/v2/branding_settings_pb";
  import React, { ReactNode } from "react";
  import { ThemeWrapper } from "./theme-wrapper";

  type Props = {
    branding?: BrandingSettings;
    children: ReactNode;
  };

  export function DynamicTheme({ branding, children }: Props) {
    return (
      <ThemeWrapper branding={branding}>
        <div className="fixed inset-0 z-50 flex">
          {/* Left side: brand panel */}
          <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-[#F0F0F0]">
            <img
              src="/ui/v2/login/eim-truck.png"
              alt="EIM"
              className="absolute inset-0 w-full h-full object-cover object-left"
            />
          </div>

          {/* Right side: login form — force light mode */}
          <div
            className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto"
            data-theme="light"
            style={{
              colorScheme: 'light',
              backgroundColor: '#ffffff',
              color: '#01363F',
            }}
          >
            <div className="w-full max-w-md eim-form-overrides light">
              {children}
            </div>
          </div>
        </div>
      </ThemeWrapper>
    );
  }
