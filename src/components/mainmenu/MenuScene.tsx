import { useEffect } from "react";

export function MenuScene() {

    useEffect(() => { }, []);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">

            {/* Spotlight behind title */}
            <div
                className="absolute inset-0"
                style={{
                    background: ` 
                        radial-gradient( 
                            circle at 50% 20%, 
                            rgba(255,255,255,0.12) 0%, 
                            rgba(0,0,0,0.75) 60%
                        )
                    `
                }}
            />

            {/* Felt texture */}
            <div className="absolute inset-0 opacity-20 bg-[url('/felt.png')] bg-cover" />

            {/* 5-card fan */}
            <div
                className="
                    absolute left-1/2 -translate-x-1/2
                    bottom-[-10px]
                    w-[420px] h-[200px] opacity-100

                    sm:w-[650px] sm:h-[320px] sm:bottom-[-1px]
                "
                style={{
                    backgroundImage: `url(${import.meta.env.BASE_URL}cards/5cardfan.png)`,
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center"
                }}
            />

            {/* Left chip stack */}
            <div
                className="
                    absolute
                    bottom-[260px] left-[-10px]
                    w-[120px] h-[120px] opacity-85 rotate-[-5deg]

                    sm:bottom-[465px] sm:left-[-5px]
                    sm:w-[190px] sm:h-[190px]
                "
                style={{
                    backgroundImage: `url(${import.meta.env.BASE_URL}chips/chipstack-left.png)`,
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat"
                }}
            />

            {/* Right chip stack */}
            <div
                className="
                    absolute
                    bottom-[220px] right-[-10px]
                    w-[120px] h-[120px] opacity-100 rotate-[5deg]

                    sm:bottom-[400px] sm:right-0
                    sm:w-[190px] sm:h-[190px]
                "
                style={{
                    backgroundImage: `url(${import.meta.env.BASE_URL}chips/chipstack-right.png)`,
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat"
                }}
            />

            {/* Vignette */}
            <div
                className="absolute inset-0"
                style={{
                    background: ` 
                        radial-gradient( 
                            circle at center, 
                            rgba(0,0,0,0) 55%, 
                            rgba(0,0,0,0.35) 100%
                        )
                    `
                }}
            />
        </div>
    );
}