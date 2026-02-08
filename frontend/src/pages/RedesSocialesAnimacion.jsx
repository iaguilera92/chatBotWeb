import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";



export default function RedesSocialesAnimacion({ showHint, setShowHint, chat }) {
    const [phase, setPhase] = useState(0);
    const [speed, setSpeed] = useState(1);
    const iconos = [
        { src: "/instagram-logo.png", alt: "Instagram" },
        { src: "/facebook-logo.png", alt: "Facebook" },
        { src: "/whatsapp-logo.webp", alt: "WhatsApp" },
        { src: "/tiktok-logo.png", alt: "TikTok" },
    ];


    //TIEMPOS REDES
    useEffect(() => {
        const timer1 = setTimeout(() => setPhase(1), 1200 / speed);
        const timer2 = setTimeout(() => setPhase(2), 1350 / speed);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [speed]);

    return (

        <AnimatePresence>
            {showHint && !chat && (
                <>
                    {/* 🔹 FONDO NEGRO BLOQUEANTE */}
                    <Box
                        component={motion.div}
                        onClick={() => {
                            if (speed === 1) {
                                // Primer click → acelera
                                setSpeed(5);
                            } else {
                                // Segundo click → cerrar todo
                                setShowHint(false);
                            }
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.9 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 / speed }}
                        sx={{
                            position: "fixed",
                            inset: 0,
                            backgroundColor: "#000000",
                            zIndex: 4,
                            cursor: "pointer", // 👈 UX clara
                        }}
                    />

                    {/* 🔹 ICONOS */}
                    <Box
                        component={motion.div}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        sx={{
                            position: "absolute",
                            top: "30%",
                            left: 0,
                            right: 0,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            zIndex: 5,
                            pointerEvents: "none",
                            height: 200,
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                position: "relative",
                                gap: 0,
                            }}
                        >
                            {iconos.map((icon, i) => {
                                const isActive = icon.alt === "WhatsApp";
                                const whatsappShift = -40;
                                let disappearShift = 0;

                                if (phase === 2 && !isActive) {
                                    if (icon.alt === "Instagram" || icon.alt === "Facebook") disappearShift = 70;
                                    if (icon.alt === "TikTok") disappearShift = -70;
                                }

                                let filter = "brightness(1)";
                                let opacity = 1;

                                // 🔹 Mantener gris para los iconos no activos en fase 1 y fase 2
                                if (!isActive && (phase === 1 || phase === 2)) {
                                    filter = icon.alt === "TikTok" ? "grayscale(100%) brightness(60%)" : "grayscale(100%)";
                                    opacity = 0.4;
                                }


                                let zIndex = phase === 2 ? (isActive ? 20 : 10 - i) : 10 - i;

                                let xShift = 0;
                                let yShift = 0;
                                if (phase === 1 && !isActive) {
                                    xShift = -15 * i;
                                    yShift = -10 * i;
                                }

                                // 🔹 Fase 3: WhatsApp crece continuamente
                                const scaleAnim = isActive && phase === 3
                                    ? [2.3, 1.5, 3.7] // ciclo de crecimiento
                                    : phase === 2 && isActive
                                        ? 3
                                        : 1;

                                return (
                                    <motion.img
                                        key={icon.alt}
                                        src={icon.src}
                                        alt={icon.alt}
                                        style={{
                                            width: 80,
                                            height: 80,
                                            objectFit: "contain",
                                            position: "relative",
                                            zIndex,
                                        }}
                                        initial={{ x: 100, y: 0, opacity: 0 }}
                                        animate={{
                                            x: phase === 2
                                                ? isActive
                                                    ? whatsappShift
                                                    : disappearShift
                                                : xShift,
                                            y: phase === 2 ? 0 : yShift,
                                            opacity: opacity,   // usa la variable calculada
                                            filter: filter,     // usa la variable calculada
                                            scale: scaleAnim,
                                        }}
                                        transition={{
                                            x: {
                                                type: "spring",
                                                stiffness: 120 * speed,
                                                damping: 20,
                                                delay: phase < 2 ? (i * 0.15) / speed : 0,
                                            },
                                            y: {
                                                type: "spring",
                                                stiffness: 120 * speed,
                                                damping: 20,
                                                delay: phase < 2 ? (i * 0.15) / speed : 0,
                                            },
                                            opacity: {
                                                type: "spring",
                                                stiffness: 120 * speed,
                                                damping: 20,
                                                delay: phase < 2 ? (i * 0.15) / speed : 0,
                                            },
                                            scale: {
                                                type: "spring",
                                                stiffness: 120 * speed,
                                                damping: 20,
                                                repeat: isActive && phase === 3 ? Infinity : 0,
                                            },
                                            filter: { duration: 1 / speed, ease: "easeInOut" },
                                        }}

                                    />
                                );
                            })}
                        </Box>
                    </Box>
                </>
            )}
        </AnimatePresence>
    );
}
