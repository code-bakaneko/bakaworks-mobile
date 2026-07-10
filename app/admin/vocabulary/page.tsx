import FlashCard from "../../components/flashcard"

export default function AdminFlashCardPage() {

    async function addVocabularyWord(formData: FormData) {
        "use server"

    }
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
            <form action={addVocabularyWord}>
                <input name="english-word" placeholder="english word"/>
                <input name="japanese-word" placeholder="Japanese word"/>
                <button type="submit">Add Word</button>
            </form>
            <FlashCard/>
            <div>
                <button>Incorrect</button>
                <button>Correct</button>
            </div>
        </div>
    )
}