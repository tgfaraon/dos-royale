import type { Combo } from "../../game-engine/types";
import { renderCard } from "../../game-engine/state/render";

export function PlayedCombo({ combo }: { combo: Combo | null }) {
    if (!combo) {
        return <div>No combo played yet</div>;
    }

    return (
        <div style={{ marginTop: "1rem" }}>
            <div>
                <strong>Last Combo:</strong> {combo.type} ({combo.cards.length})
            </div>

            <div style={{ display: "flex", gap: "0.5rem,", marginTop: "0.5rem" }}>
                {combo.cards.map((card, i) => (
                    <div
                        key={i}
                        style={{
                            padding: "6px 10px",
                            border: "1px solid #ccc",
                            borderRadius: "6px",
                            background: "white",
                        }}
                    >
                        {renderCard(card)}
                    </div>
                ))}
            </div>
        </div >
    );
}