"use client";

import { io, type Socket } from "socket.io-client";

export type RealtimeClientType = "pos" | "admin" | "customer" | "order";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const getRealtimeApiBaseUrl = () =>
  typeof window !== "undefined" && window.location.port === "3002"
    ? `${window.location.protocol}//${window.location.hostname}:8080`
    : API_BASE_URL;

export const createRealtimeSocket = (
  token: string | null | undefined,
  storeId: string,
  clientType: RealtimeClientType = "pos",
  orderId?: string,
): Socket =>
  io(getRealtimeApiBaseUrl(), {
    autoConnect: true,
    withCredentials: true,
    transports: ["websocket", "polling"],
    auth: { ...(token ? { token } : {}), storeId, clientType, orderId },
  });

export const realtimeClientTypeForPath = (
  pathname: string,
): RealtimeClientType => {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/pos")) return "pos";
  return "customer";
};

export const realtimeEventsForClient = (
  clientType: RealtimeClientType,
): string[] => {
  if (clientType === "admin")
    return [
      "catalog.item.updated",
      "catalog.store-item.price.updated",
      "catalog.store-item.availability.updated",
      "catalog.store-addon.updated",
      "catalog.store-addon.availability.updated",
      "catalog.promotion.updated",
      "catalog.changed",
      "inventory.item.updated",
      "inventory.unit.updated",
      "order.created",
      "order.updated",
      "order.cancelled",
      "order.payment.updated",
      "closing.created",
      "closing.voided",
    ];
  if (clientType === "customer")
    return [
      "catalog.item.updated",
      "catalog.store-item.price.updated",
      "catalog.store-item.availability.updated",
      "catalog.store-addon.updated",
      "catalog.store-addon.availability.updated",
      "catalog.promotion.updated",
      "catalog.changed",
      "inventory.item.updated",
      "inventory.unit.updated",
    ];
  if (clientType === "order")
    return [
      "catalog.item.updated",
      "catalog.store-item.price.updated",
      "catalog.store-item.availability.updated",
      "catalog.store-addon.updated",
      "catalog.store-addon.availability.updated",
      "catalog.promotion.updated",
      "order.updated",
      "order.cancelled",
      "order.payment.updated",
    ];
  return [
    "catalog.item.updated",
    "catalog.store-item.price.updated",
    "catalog.store-item.availability.updated",
    "catalog.store-addon.updated",
    "catalog.store-addon.availability.updated",
    "catalog.promotion.updated",
    "catalog.changed",
    "inventory.item.updated",
    "inventory.unit.updated",
    "order.created",
    "order.updated",
    "order.cancelled",
    "order.payment.updated",
  ];
};
