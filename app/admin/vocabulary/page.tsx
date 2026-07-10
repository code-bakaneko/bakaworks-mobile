import FlashCard from "../../../public/components/flashcard"

export default function AdminFlashCardPage() {
    const dummyFlashCards = [
        {
            id: 0,
            front: "Neko",
            back: "Cat"
        },
        {
            id: 0,
            front: "Inu",
            back: "Dog"
        },
        {
            id: 0,
            front: "Kodomo",
            back: "Child"
        },
        {
            id: 0,
            front: "Chichi",
            back: "Father"
        },
    ]

    return(
        <div>
            <FlashCard/>
            <div>
                <button>Incorrect</button>
                <button>Correct</button>
            </div>
        </div>
    )
}