import * as signalR from "@microsoft/signalr";
import { getAccessToken } from "./tokenStorage";

/**
 * Hub URL cung origin voi API (dev: Vite proxy /orderHub -> backend).
 */
export function createOrderHubConnection(onUpdate) {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl("/orderHub", {
      accessTokenFactory: () => getAccessToken(),
      transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
    })
    .withAutomaticReconnect([0, 2000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  connection.on("UpdateStatus", (orderId, status) => {
    onUpdate(orderId, status);
  });

  return connection;
}
