"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function Preloader() {
    const [stage, setStage] = useState(0) // 0: init, 1: icon, 2: text, 3: exit
    const pathname = usePathname()

    useEffect(() => {
        document.body.style.overflow = 'hidden'

        // Sequence
        const t1 = setTimeout(() => setStage(1), 100)  // Icon starts
        const t2 = setTimeout(() => setStage(2), 800)  // Text starts
        const t3 = setTimeout(() => setStage(3), 2200) // Exit starts

        const t4 = setTimeout(() => {
            document.body.style.overflow = ''
        }, 3000)

        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
            clearTimeout(t3)
            clearTimeout(t4)
            document.body.style.overflow = ''
        }
    }, [])

    if (stage === 4) return null // Could add a cleanup stage if needed

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${stage === 3 ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
        >
            <div className="relative">
                <svg
                    width="300"
                    height="95"
                    viewBox="0 0 602 189"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-[180px] sm:w-[240px] md:w-[300px] h-auto"
                >
                    {/* ICON PARTS - Pink #FD1278 */}
                    <g className={`transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${stage >= 1 ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 translate-y-10'
                        }`}>
                        <path
                            d="M12.4133 137.364L118.037 137.364C119.403 137.364 120.714 137.907 121.68 138.873L162.889 180.082C166.134 183.327 163.836 188.876 159.246 188.876L53.6225 188.876C52.2563 188.876 50.9461 188.333 49.9801 187.367L8.77085 146.158C5.52579 142.913 7.82407 137.364 12.4133 137.364Z"
                            fill="#FD1278"
                        />
                        <path
                            d="M1.39684e-05 66.5189L0 124.798C2.006e-07 129.387 5.54854 131.685 8.79359 128.44L128.44 8.79357C131.685 5.54852 129.387 -2.006e-07 124.797 0L66.5189 2.54744e-06C65.1527 2.60716e-06 63.8425 0.542714 62.8764 1.50874L1.50875 62.8764C0.542725 63.8425 1.39087e-05 65.1527 1.39684e-05 66.5189Z"
                            fill="#FD1278"
                        />
                    </g>

                    {/* TEXT PARTS - Dark #222222 */}
                    <g className={`transition-all duration-1000 delay-200 ease-[cubic-bezier(0.25,1,0.5,1)] ${stage >= 2 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                        }`}>
                        {/* L, a, b, b, o paths */}
                        <path
                            d="M240.133 47.586V129.41H280.978V145.161H223.047V47.586H240.133ZM312.09 146.896C298.075 146.896 289.532 138.754 289.532 126.34C289.532 114.193 298.342 106.585 313.959 105.383L333.714 103.915V102.447C333.714 93.5036 328.375 89.8996 320.099 89.8996C310.489 89.8996 305.149 93.904 305.149 100.845H291.267C291.267 86.5625 303.014 77.2189 320.9 77.2189C338.653 77.2189 349.599 86.8295 349.599 105.116V145.161H335.316L334.115 135.417C331.312 142.224 322.369 146.896 312.09 146.896ZM317.43 134.616C327.441 134.616 333.848 128.609 333.848 118.465V114.994L320.099 116.062C309.955 116.996 306.084 120.333 306.084 125.673C306.084 131.679 310.088 134.616 317.43 134.616ZM380.68 145.161H365.597V45.8508H381.881V88.8317C386.153 81.4902 394.962 77.0854 404.974 77.0854C423.794 77.0854 435.274 91.7683 435.274 112.591C435.274 132.881 422.86 146.896 403.906 146.896C394.028 146.896 385.619 142.491 381.748 134.883L380.68 145.161ZM382.015 111.924C382.015 123.804 389.356 131.946 400.569 131.946C412.048 131.946 418.856 123.67 418.856 111.924C418.856 100.178 412.048 91.7683 400.569 91.7683C389.356 91.7683 382.015 100.044 382.015 111.924ZM463.324 145.161H448.24V45.8508H464.525V88.8317C468.796 81.4902 477.606 77.0854 487.617 77.0854C506.438 77.0854 517.917 91.7683 517.917 112.591C517.917 132.881 505.504 146.896 486.549 146.896C476.672 146.896 468.262 142.491 464.391 134.883L463.324 145.161ZM464.658 111.924C464.658 123.804 472 131.946 483.212 131.946C494.692 131.946 501.499 123.67 501.499 111.924C501.499 100.178 494.692 91.7683 483.212 91.7683C472 91.7683 464.658 100.044 464.658 111.924ZM527.013 112.057C527.013 91.5013 541.829 77.3523 562.252 77.3523C582.675 77.3523 597.491 91.5013 597.491 112.057C597.491 132.614 582.675 146.763 562.252 146.763C541.829 146.763 527.013 132.614 527.013 112.057ZM543.298 112.057C543.298 124.071 551.039 132.213 562.252 132.213C573.464 132.213 581.206 124.071 581.206 112.057C581.206 100.044 573.464 91.9018 562.252 91.9018C551.039 91.9018 543.298 100.044 543.298 112.057Z"
                            fill="#222222"
                        />
                    </g>
                </svg>

                {/* Loading Indicator - Subtle line at bottom */}
                <div className={`absolute -bottom-12 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-100 rounded-full overflow-hidden transition-opacity duration-300 ${stage === 2 ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="h-full bg-[#FD1278] animate-[loading_1.5s_ease-in-out_infinite] w-1/2 rounded-full" />
                </div>
            </div>
        </div>
    )
}
