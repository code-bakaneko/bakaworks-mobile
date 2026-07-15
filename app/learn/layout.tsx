import LearnSidebar from "../components/sidebar";

export default function LearnLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div>
            <LearnSidebar />
            <main>{children}</main>
        </div>
    )
}