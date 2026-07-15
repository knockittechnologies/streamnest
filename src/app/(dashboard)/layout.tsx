import Header from '@/components/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-[70vh]">{children}</main>
      <footer className="px-9 py-10 mt-10 text-center border-t border-hair font-mono text-[11.5px] tracking-wide text-text-faint">
        STREAMNEST — A PERSONAL DASHBOARD FOR YOUR OWN AUTHORIZED STREAMING SOURCES
      </footer>
    </>
  );
}
