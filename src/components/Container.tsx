import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import React from "react";

type ContainerProps = {
    children: React.ReactNode; // Accepts any valid React element(s)
};

export default function Container({ children }: ContainerProps) {
    return (
        <div className="min-h-[100dvh] flex flex-col items-center pb-16 pt-6 justify-between px-2 bg-gray-100 overflow-hidden">
            <div className="pt-4 text-center">
                <h1 className="text-6xl md:text-8xl font-extrabold text-yellow-400 drop-shadow-[4px_4px_0px_rgba(255,0,0,1)] md:drop-shadow-[8px_8px_0px_rgba(255,0,0,1)] uppercase tracking-wider transform rotate-[-2deg]">
                    2048
                </h1>
                <h3 className="text-2xl md:text-4xl font-extrabold text-white drop-shadow-[1px_1px_0px_rgba(255,0,0,1)] md:drop-shadow-[2px_2px_0px_rgba(255,0,0,1)] tracking-wider transform rotate-[-2deg]">
                    on LitVM
                </h3>
            </div>

            <div className="max-w-md w-full px-4 mt-4 mb-2">
                <Alert className="bg-white text-gray-900 border-gray-200 rounded-xl shadow-[0_8px_0_rgb(200,200,200)]">
                    <InfoIcon className="text-gray-900" />
                    <AlertTitle>
                        2048 Faucet
                    </AlertTitle>
                    <AlertDescription className="mt-1">
                        <p className="!leading-[1.4]">
                            <span>
                                Claim testnet tokens at{" "}
                            </span>
                            <a
                                href="https://testnet.litvm.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-yellow-300"
                                >
                                testnet.litvm.com
                            </a>{" "}
                            <span>
                                and deposit to your player address here. LitVM testnet uses zkLTC for gas.
                            </span>
                        </p>
                    </AlertDescription>
                </Alert>
            </div>

            {/* Main content area */}
            <div className="flex-1 w-full max-w-md flex flex-col justify-between overflow-hidden">
                {children}
            </div>
        </div>
    );
}
