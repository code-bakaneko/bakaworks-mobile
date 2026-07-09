import AdminSidebar from "./sidebar";

export default function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div
            className="min-h-screen flex">
            <AdminSidebar/>
            <main className="flex-1">{children}</main>
        </div>
    );
}