import "./index.css";
import "@rainbow-me/rainbowkit/styles.css";

import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { config } from "./config/wagmi";
import App from "./App.tsx";
import { NetworkProvider } from "./contexts/NetworkContext";
import { SessionWalletProvider } from "./contexts/SessionWalletContext";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<RainbowKitProvider theme={darkTheme()} modalSize="compact">
					<SessionWalletProvider>
						<NetworkProvider>
							<App />
						</NetworkProvider>
					</SessionWalletProvider>
				</RainbowKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	</StrictMode>,
);
