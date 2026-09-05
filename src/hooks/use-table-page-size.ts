import { useEffect, useRef, useState } from "react";

/** Calculates rows from the actual list-card height, not the viewport height. */
export function useTablePageSize(
  rowHeight = 38,
  reservedHeight = 100,
  headerHeightOverride?: number,
  forceViewportHeight = true,
  minimumPageSize = 5,
  accountForTableHeader = false,
  allowContentScroll = false,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageSize, setPageSize] = useState(() =>
    typeof window === "undefined"
      ? 5
      : Math.max(
          minimumPageSize,
          Math.floor((window.innerHeight - 300) / rowHeight),
        ),
  );

  useEffect(() => {
    const updateFromViewport = () => {
      setPageSize(
        Math.max(
          minimumPageSize,
          Math.floor((window.innerHeight - 300) / rowHeight),
        ),
      );
    };
    updateFromViewport();
    window.addEventListener("resize", updateFromViewport);
    let cancelled = false;
    let resizeObserver: ResizeObserver | undefined;
    const attach = () => {
      if (cancelled) return;
      const element =
        containerRef.current ??
        Array.from(document.querySelectorAll<HTMLElement>("div")).find(
          (candidate) =>
            candidate.className.includes("h-[calc(100svh-180px)]") ||
            candidate.className.includes("h-[calc(100svh-80px)]"),
        );
      if (!element) {
        window.requestAnimationFrame(attach);
        return;
      }
      const update = () => {
        // Keep all admin tables on the same viewport-based height budget.
        if (forceViewportHeight)
          element.style.height = `${Math.max(240, window.innerHeight - 80)}px`;
        element.style.overflow = "hidden";
        element.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
          image.style.width = "60px";
          image.style.height = "60px";
          image.style.objectFit = "contain";
          image.style.flexShrink = "0";
        });
        const headerContent = element.querySelector<HTMLElement>(
          '[data-slot="card-header"] > div',
        );
        if (headerContent && element.dataset.tableHeaderAlign !== "left")
          headerContent.style.justifyContent = "flex-end";
        const listTitle = element.querySelector<HTMLElement>(
          '[data-slot="card-header"] [data-slot="card-title"]',
        );
        if (listTitle) listTitle.style.display = "none";
        element.querySelectorAll<HTMLElement>("*").forEach((child) => {
          if (child.dataset.slot === "card-content") {
            child.style.flex = "1 1 0%";
            child.style.minHeight = "0";
            child.style.overflow = allowContentScroll ? "auto" : "visible";
          } else if (
            !allowContentScroll &&
            child.className.toString().includes("overflow-auto")
          )
            child.style.overflow = "visible";
        });
        const measuredRowHeight =
          rowHeight >= 50
            ? rowHeight
            : Math.max(
                rowHeight,
                ...Array.from(
                  element.querySelectorAll<HTMLElement>("tbody tr"),
                ).map((row) => row.getBoundingClientRect().height),
              );
        // Measure from the card itself. CardContent can report a stale/zero
        // clientHeight while its scroll wrapper is being laid out, which
        // incorrectly limits Product to only a couple of rows.
        const cardHeight = element.getBoundingClientRect().height;
        // A card can briefly report a collapsed height while its parent is
        // mounting. Use the viewport in that case instead of producing a
        // misleading two-row page.
        const content = element.querySelector<HTMLElement>(
          '[data-slot="card-content"]',
        );
        const contentHeight = content?.clientHeight || 0;
        const contentStyle = content ? window.getComputedStyle(content) : null;
        const contentPadding = contentStyle
          ? (parseFloat(contentStyle.paddingTop) || 0) +
            (parseFloat(contentStyle.paddingBottom) || 0)
          : 0;
        const cardStyle = window.getComputedStyle(element);
        const cardPadding =
          (parseFloat(cardStyle.paddingTop) || 0) +
          (parseFloat(cardStyle.paddingBottom) || 0);
        const cardGap =
          parseFloat(cardStyle.rowGap || cardStyle.gap || "0") || 0;
        const headerElement = element.querySelector<HTMLElement>(
          '[data-slot="card-header"]',
        );
        const measuredCardContentHeight =
          contentHeight > 0 ? contentHeight - contentPadding : 0;
        const headerHeight =
          headerHeightOverride ??
          headerElement?.getBoundingClientRect().height ??
          0;
        const estimatedCardContentHeight =
          cardHeight - cardPadding - cardGap - headerHeight;
        const rawAvailableHeight =
          cardHeight >= 400
            ? Math.max(measuredCardContentHeight, estimatedCardContentHeight)
            : window.innerHeight - 300;
        const tableHeader = element.querySelector<HTMLElement>("thead");
        const tableHeaderHeight = accountForTableHeader
          ? (tableHeader?.getBoundingClientRect().height ?? 0)
          : 0;
        const availableHeight = Math.max(
          0,
          rawAvailableHeight - tableHeaderHeight,
        );
        const nextPageSize = Math.max(
          minimumPageSize,
          Math.floor(availableHeight / measuredRowHeight),
        );
        setPageSize(nextPageSize);
      };
      update();
      resizeObserver = new ResizeObserver(update);
      if (element.parentElement) resizeObserver.observe(element.parentElement);
      if (element.closest('[class*="h-full"]'))
        resizeObserver.observe(
          element.closest('[class*="h-full"]') as HTMLElement,
        );
      resizeObserver.observe(element);
      const table = element.querySelector<HTMLElement>("table");
      if (table) resizeObserver.observe(table);
    };
    attach();
    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateFromViewport);
    };
  }, [
    accountForTableHeader,
    forceViewportHeight,
    headerHeightOverride,
    minimumPageSize,
    reservedHeight,
    rowHeight,
    allowContentScroll,
  ]);

  return { containerRef, pageSize };
}
