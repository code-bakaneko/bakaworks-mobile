import LearnSidebar from "../components/Sidebar";

export default function LearnLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex">
            <LearnSidebar />
            <main className="flex-1">{children}</main>
        </div>
    )
}