import React from "react";
import { useGameStore } from "../../stores/gameStore";

export function CpuSelector() {
    const cpuCount = useGameStore((s) => s.cpuCount);
    const setCpuCount = useGameStore((s) => s.setCpuCount);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCount = Number(e.target.value);
        setCpuCount(newCount);
    };

    return (
        <div className="flex items-center gap-2 mb-4">
            <label className="font-medium text-white">CPU Opponents:</label>

            <select
                value={cpuCount}
                onChange={handleChange}
                className="px-2 py-1 text-white bg-gray-800 border border-gray-600 rounded"
            >
                <option value={1}>1 CPU</option>
                <option value={2}>2 CPUs</option>
                <option value={3}>3 CPUs</option>
            </select>
        </div>
    );
}