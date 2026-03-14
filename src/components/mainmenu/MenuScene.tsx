import { useEffect } from "react";

export function MenuScene() {

    useEffect(() => {
    }, []);

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
                    absolute bottom-[-1px] left-1/2 -translate-x-1/2
                    w-[650px] h-[320px]
                    opacity-100
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
                    absolute bottom-[465px] left-[-5px]
                    w-[190px] h-[190px]
                    opacity-85
                    rotate-[-5deg]
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
                    absolute bottom-[400px] right-0
                    w-[190px] h-[190px]
                    opacity-100
                    rotate-[5deg]
                "

                style={{
                    backgroundImage: `url(${import.meta.env.BASE_URL}chips/chipstack-right.png)`,
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat"
                }}
            />

            {/* Vignette */}
            <div className="absolute inset-0"
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