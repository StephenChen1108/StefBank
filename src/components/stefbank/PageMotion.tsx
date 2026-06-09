"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { TabId } from "@/data/mock-bank";

type PageMotionProps = {
  activeTab: TabId;
};

export function PageMotion({ activeTab }: PageMotionProps) {
  const previousTab = useRef(activeTab);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      previousTab.current = activeTab;
      return;
    }

    const ctx = gsap.context(() => {
      const visiblePanel = document.querySelector<HTMLElement>("[data-active-panel='true']");
      const animatedItems = visiblePanel?.querySelectorAll<HTMLElement>("[data-animate-item]");
      const activeNav = document.querySelector<HTMLElement>("[data-active-nav='true']");

      if (visiblePanel) {
        gsap.fromTo(
          visiblePanel,
          { autoAlpha: 0.86, y: previousTab.current === activeTab ? 0 : 10 },
          { autoAlpha: 1, y: 0, duration: 0.32, ease: "power2.out", clearProps: "all" },
        );
      }

      if (animatedItems?.length) {
        gsap.fromTo(
          animatedItems,
          { autoAlpha: 0, y: 14, scale: 0.985 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.42,
            ease: "power2.out",
            stagger: { each: 0.045 },
            clearProps: "all",
          },
        );
      }

      if (activeNav) {
        gsap.fromTo(
          activeNav,
          { scale: 0.92 },
          { scale: 1, duration: 0.34, ease: "back.out(2.2)", clearProps: "transform" },
        );
      }
    });

    previousTab.current = activeTab;

    return () => ctx.revert();
  }, [activeTab]);

  return null;
}
