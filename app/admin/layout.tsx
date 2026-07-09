import Sidebar from "./sidebar";

export default function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div
            className="h-full flex">
            <Sidebar/>
            {children}
        </div>
    );
}