import LearnSidebar from "../components/Sidebar";
import LearnTopBar from "../components/LearnTopBar";

export default function LearnLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex">
            <LearnSidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <LearnTopBar />
                <main className="flex-1">{children}</main>
            </div>
        </div>
    )
}
