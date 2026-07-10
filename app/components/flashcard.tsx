"use client"
import { useState } from "react";

export default function FlashCard() {

    const [flipped, setFlipped] = useState(false);
    return(
            <div className="scene w-48 h-64">
                <div className={`${flipped? "flip":""} card-inner w-full h-full bg-slate-500`}
                    onClick={() => setFlipped(flip => !flip)}>
                    <div className="front-face inset-0">Front</div>
                    <div className="back-face inset-0">Back</div>
                </div>
            </div>       
    )
}